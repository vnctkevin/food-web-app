import { streamText, generateText, convertToCoreMessages, StreamData, CoreMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { searchAndGetNutrition } from '@/lib/usda'
import { buildFirstTurnSystemPrompt, buildConversationSystemPrompt, IDENTIFY_FOOD_PROMPT } from '@/lib/gemini'
import { NutritionData } from '@/types/nutrition'

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { messages, conversationId: incomingId } = await req.json()
  const coreMessages: CoreMessage[] = convertToCoreMessages(messages)
  const lastMessage = coreMessages[coreMessages.length - 1]

  const hasImage =
    Array.isArray(lastMessage.content) &&
    lastMessage.content.some((p: any) => p.type === 'image')

  let systemPrompt: string
  let nutritionData: NutritionData | null = null
  let resolvedId: string = incomingId ?? ''
  let foodName = 'this food'

  if (hasImage) {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      messages: [{ role: 'user', content: [...(Array.isArray(lastMessage.content) ? lastMessage.content : []), { type: 'text', text: IDENTIFY_FOOD_PROMPT }] as any }],
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

  const userContent =
    typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content)

  if (!resolvedId) {
    const imageUrl = hasImage && Array.isArray(lastMessage.content)
      ? (lastMessage.content as any[]).find((p) => p.type === 'image')?.image
      : undefined
    const convo = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: hasImage && foodName !== 'this food' ? foodName : 'New chat',
        foodName: hasImage ? foodName : undefined,
        imageUrl,
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
      const saved = await prisma.message.create({
        data: { conversationId: resolvedId, role: 'assistant', content: text, nutritionData: nutritionData ?? undefined },
      })
      if (nutritionData) streamData.appendMessageAnnotation({ nutritionData, messageId: saved.id } as any)
      if (hasImage) await prisma.conversation.update({ where: { id: resolvedId }, data: { foodName, title: foodName, updatedAt: new Date() } })
      streamData.close()
    },
  })

  return result.toDataStreamResponse({ data: streamData, headers: { 'X-Conversation-Id': resolvedId } })
}
