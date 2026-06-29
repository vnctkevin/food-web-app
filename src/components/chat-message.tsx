'use client'

import { Message } from 'ai'
import { NutritionLabelCard } from './nutrition-label-card'
import { NutritionData } from '@/types/nutrition'

type ExtendedMessage = Message & {
  nutritionData?: NutritionData
  annotations?: Array<{ nutritionData?: NutritionData }>
}

function getNutritionData(msg: ExtendedMessage): NutritionData | undefined {
  const annotations = msg.annotations as Array<{ nutritionData?: NutritionData }> | undefined
  return annotations?.find((a) => a?.nutritionData)?.nutritionData ?? msg.nutritionData
}

function getImageUrl(msg: ExtendedMessage): string | undefined {
  if (!Array.isArray(msg.content)) return undefined
  return (msg.content as any[]).find((p) => p.type === 'image')?.image
}

function getTextContent(msg: ExtendedMessage): string {
  if (typeof msg.content === 'string') return msg.content
  if (Array.isArray(msg.content)) return (msg.content as any[]).find((p) => p.type === 'text')?.text ?? ''
  return ''
}

export function ChatMessage({ message }: { message: ExtendedMessage }) {
  const isUser = message.role === 'user'
  const nutritionData = getNutritionData(message)
  const imageUrl = getImageUrl(message)
  const text = getTextContent(message)

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 px-4 py-2">
        <div className="max-w-[75%] space-y-2 flex flex-col items-end">
          {imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-zinc-700 max-w-[200px]">
              <img src={imageUrl} alt="Uploaded food" className="w-full h-auto object-cover max-h-48" />
            </div>
          )}
          {text && <div className="bg-zinc-700 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">{text}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white mt-0.5">N</div>
      <div className="flex-1 space-y-2 min-w-0">
        {nutritionData && <NutritionLabelCard data={nutritionData} />}
        {text && <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{text}</div>}
      </div>
    </div>
  )
}
