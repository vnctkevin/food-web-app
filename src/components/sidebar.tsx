'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { Plus, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface Conversation { id: string; title: string; foodName: string | null; updatedAt: string }
interface Props { conversations: Conversation[]; currentId: string | null; onNavigate?: () => void }

function foodEmoji(name: string | null): string {
  if (!name) return '🍽️'
  const n = name.toLowerCase()
  if (n.includes('salmon') || n.includes('fish') || n.includes('tuna')) return '🐟'
  if (n.includes('pizza')) return '🍕'
  if (n.includes('burger') || n.includes('hamburger')) return '🍔'
  if (n.includes('salad')) return '🥗'
  if (n.includes('chicken')) return '🍗'
  if (n.includes('avocado')) return '🥑'
  if (n.includes('rice')) return '🍚'
  if (n.includes('egg')) return '🥚'
  if (n.includes('steak') || n.includes('beef')) return '🥩'
  if (n.includes('pasta') || n.includes('spaghetti')) return '🍝'
  if (n.includes('sushi')) return '🍣'
  if (n.includes('taco')) return '🌮'
  return '🍽️'
}

export function Sidebar({ conversations, currentId, onNavigate }: Props) {
  const { data: session } = useSession()
  return (
    <div className="flex flex-col h-full w-full bg-zinc-900">
      <div className="p-3 border-b border-zinc-800">
        <Button
          render={<Link href="/chat" onClick={onNavigate} />}
          nativeButton={false}
          variant="ghost"
          className="w-full justify-start gap-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 h-9"
        >
          <Plus className="w-4 h-4" />New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm px-4">No conversations yet. Upload a food photo to start!</div>
        ) : conversations.map((conv) => (
          <Link key={conv.id} href={`/chat/${conv.id}`} onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentId === conv.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}>
            <span className="text-base flex-shrink-0">{foodEmoji(conv.foodName)}</span>
            <span className="truncate flex-1 capitalize">{conv.title}</span>
          </Link>
        ))}
      </div>
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="text-xs bg-zinc-700 text-zinc-300">{session?.user?.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-zinc-500 text-xs truncate flex-1">{session?.user?.email}</span>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 flex-shrink-0" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
