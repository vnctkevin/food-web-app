'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface Conversation { id: string; title: string; foodName: string | null; updatedAt: string }

export function MobileSidebarToggle({ conversations }: { conversations: Conversation[] }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          'inline-flex items-center justify-center rounded-lg h-9 w-9',
          'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors'
        )}
      >
        <Menu className="w-5 h-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 bg-zinc-900 border-zinc-800" showCloseButton={false}>
        <Sidebar conversations={conversations} currentId={null} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
