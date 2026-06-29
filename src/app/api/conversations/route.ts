import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })
  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, foodName: true, updatedAt: true },
  })
  return Response.json(conversations.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() })))
}
