import { streamText, generateText, StreamData, CoreMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { searchAndGetNutrition } from '@/lib/usda'
import { buildFirstTurnSystemPrompt, buildConversationSystemPrompt, IDENTIFY_FOOD_PROMPT } from '@/lib/gemini'
import { NutritionData } from '@/types/nutrition'

export const maxDuration = 60

/**
 * Convert UI messages (from useChat) to CoreMessages for the AI SDK.
 * We do NOT use convertToCoreMessages because it expects content: string and
 * wraps any non-string value as { type: 'text', text: <array> }, which fails
 * Zod validation in streamText/generateText.
 * Our client sends content as an array of parts when an image is attached.
 */
function toCoreMessages(messages: any[]): CoreMessage[] {
  return messages.map((msg): CoreMessage => {
    const { role, content } = msg
    if (role === 'user') {
      if (Array.isArray(content)) {
        const parts = content.map((p: any) => {
          if (p.type === 'image') {
            return { type: 'image' as const, image: p.image as string }
          }
          return { type: 'text' as const, text: String(p.text ?? '') }
        })
        return { role: 'user', content: parts }
      }
      return { role: 'user', content: String(content) }
    }
    // assistant / system messages always have string content from our DB
    return { role: role as 'assistant' | 'system', content: String(content) }
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { messages, conversationId: incomingId } = await req.json()

  // Detect image in the raw last message BEFORE conversion (safe check on raw JSON)
  const lastRaw = messages[messages.length - 1]
  const hasImage =
    Array.isArray(lastRaw.content) &&
    lastRaw.content.some((p: any) => p.type === 'image')

  const coreMessages = toCoreMessages(messages)
  const lastMessage = coreMessages[coreMessages.length - 1]

  let systemPrompt: string
  let nutritionData: NutritionData | null = null
  let resolvedId: string = incomingId ?? ''
  let foodName = 'this food'

  if (hasImage) {
    // Build a one-shot message for Gemini: image parts + identification prompt
    const imageParts = Array.isArray(lastMessage.content) ? lastMessage.content : []
    const identifyContent: any[] = [
      ...imageParts,
      { type: 'text', text: IDENTIFY_FOOD_PROMPT },
    ]
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      messages: [{ role: 'user', content: identifyContent }],
    })
    foodName = text.trim()
    nutritionData = await searchAndGetNutrition(foodName)
    if (!nutritionData) nutritionData = { foodName, servingSize: '1 serving', calories: 0 }
    systemPrompt = buildFirstTurnSystemPrompt(nutritionData)
  } else {
    const existing = resolvedId
      ? await prisma.conversation.findFirst({ where: { id: resolvedId, userId: session.user.id } })
      : null
    if (existing?.foodName) {
      const firstMsg = await prisma.message.findFirst({
        where: { conversationId: resolvedId, role: 'assistant' },
        orderBy: { createdAt: 'asc' },
      })
      systemPrompt = buildConversationSystemPrompt(
        existing.foodName,
        (firstMsg?.nutritionData as NutritionData) ?? { foodName: existing.foodName, servingSize: '', calories: 0 }
      )
    } else {
      systemPrompt = 'You are a helpful nutritionist. Answer questions about food and nutrition conversationally.'
    }
  }

  // Store a compact user content — never persist raw base64 in the DB
  const userContent = hasImage
    ? `[Photo: ${foodName}]${Array.isArray(lastRaw.content) ? (' ' + (lastRaw.content.find((p: any) => p.type === 'text')?.text ?? '')).trimEnd() : ''}`
    : (typeof lastRaw.content === 'string' ? lastRaw.content : JSON.stringify(lastRaw.content))

  if (!resolvedId) {
    const convo = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: hasImage && foodName !== 'this food' ? foodName : 'New chat',
        foodName: hasImage ? foodName : undefined,
        messages: { create: { role: 'user', content: userContent } },
      },
    })
    resolvedId = convo.id
  } else {
    await prisma.message.create({ data: { conversationId: resolvedId, role: 'user', content: userContent } })
  }

  const streamData = new StreamData()

  const result = streamText({
    model: google('gemini-1.5-flash'),
    system: systemPrompt,
    messages: coreMessages,
    onFinish: async ({ text }) => {
      try {
        const saved = await prisma.message.create({
          data: {
            conversationId: resolvedId,
            role: 'assistant',
            content: text,
            nutritionData: nutritionData ?? undefined,
          },
        })
        if (nutritionData) {
          streamData.appendMessageAnnotation({ nutritionData, messageId: saved.id } as any)
        }
        if (hasImage) {
          await prisma.conversation.update({
            where: { id: resolvedId },
            data: { foodName, title: foodName, updatedAt: new Date() },
          })
        }
      } finally {
        // Always close — prevents the "stream is hanging" warning
        streamData.close()
      }
    },
  })

  return result.toDataStreamResponse({ data: streamData, headers: { 'X-Conversation-Id': resolvedId } })
}
