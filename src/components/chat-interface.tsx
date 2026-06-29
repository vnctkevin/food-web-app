'use client'

import { useChat, Message } from 'ai/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from './chat-message'
import { AttachmentDropdown } from './attachment-dropdown'
import { NutritionData } from '@/types/nutrition'

type ExtendedMessage = Message & { nutritionData?: NutritionData; annotations?: Array<{ nutritionData?: NutritionData }> }

interface Props { conversationId: string | null; initialMessages?: ExtendedMessage[] }

export function ChatInterface({ conversationId, initialMessages = [] }: Props) {
  const router = useRouter()
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, append, isLoading, setInput } = useChat({
    api: '/api/chat',
    initialMessages: initialMessages as Message[],
    body: { conversationId },
    onResponse: (res) => {
      const newId = res.headers.get('X-Conversation-Id')
      if (newId && !conversationId) router.replace(`/chat/${newId}`)
    },
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isLoading])

  const handleFile = useCallback((file: File) => {
    setPendingImage({ file, preview: URL.createObjectURL(file) })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !pendingImage) return
    if (pendingImage) {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string
        const parts: any[] = [{ type: 'image', image: base64 }]
        if (input.trim()) parts.push({ type: 'text', text: input.trim() })
        await append({ role: 'user', content: parts as unknown as string })
        setPendingImage(null)
        setInput('')
      }
      reader.readAsDataURL(pendingImage.file)
    } else {
      await append({ role: 'user', content: input.trim() })
      setInput('')
    }
  }, [input, pendingImage, append, setInput])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 pb-24">
            <div className="text-5xl mb-4">📸</div>
            <h2 className="text-zinc-200 text-xl font-semibold mb-2">Upload a food photo to start</h2>
            <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">Take a picture or select an image of your meal to get a full nutrition breakdown and chat about it.</p>
          </div>
        )}
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg as ExtendedMessage} />)}
        {isLoading && (
          <div className="flex gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">N</div>
            <div className="flex items-center gap-1 py-3">
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
      <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-3">
        {pendingImage && (
          <div className="mb-2 relative inline-block">
            <img src={pendingImage.preview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-zinc-700" />
            <button type="button" onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-600 hover:bg-zinc-500 rounded-full flex items-center justify-center text-white text-xs">×</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <AttachmentDropdown onFile={handleFile} disabled={isLoading} />
          <textarea value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder={pendingImage ? 'Add a message (optional)...' : 'Ask about the food...'}
            rows={1} className="flex-1 resize-none bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 max-h-32 overflow-y-auto leading-relaxed"
            style={{ minHeight: '42px' }} />
          <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !pendingImage)}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex-shrink-0 rounded-xl h-10 w-10">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
