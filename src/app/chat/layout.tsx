import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import { MobileSidebarToggle } from '@/components/mobile-sidebar-toggle'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const convos = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, foodName: true, updatedAt: true },
  })
  const serialized = convos.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))

  return (
    <div className="flex h-dvh bg-zinc-950 overflow-hidden">
      <div className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0 border-r border-zinc-800">
        <Sidebar conversations={serialized} currentId={null} />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-zinc-800 flex-shrink-0">
          <MobileSidebarToggle conversations={serialized} />
          <span className="text-zinc-300 font-semibold text-sm">FoodChat</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </main>
    </div>
  )
}
