import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { NutritionData } from '@/types/nutrition'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  const { id } = await params
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!conversation) notFound()
  const initialMessages = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    nutritionData: msg.nutritionData ? (msg.nutritionData as NutritionData) : undefined,
  }))
  return <ChatInterface conversationId={id} initialMessages={initialMessages as any} />
}
