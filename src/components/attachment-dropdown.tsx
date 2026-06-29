'use client'

import { useRef } from 'react'
import { Paperclip, ImageIcon, Camera } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props { onFile: (file: File) => void; disabled?: boolean }

export function AttachmentDropdown({ onFile, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
      <Popover>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center rounded-lg h-9 w-9 flex-shrink-0',
            'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <Paperclip className="w-4 h-4" />
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1 bg-zinc-800 border-zinc-700" side="top" align="start">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 rounded-md transition-colors">
            <ImageIcon className="w-4 h-4 text-zinc-400" />
            Select Image
          </button>
          <button type="button" onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 rounded-md transition-colors">
            <Camera className="w-4 h-4 text-zinc-400" />
            Capture Image
          </button>
        </PopoverContent>
      </Popover>
    </>
  )
}
