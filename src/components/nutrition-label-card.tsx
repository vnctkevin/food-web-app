'use client'

import { NutritionData, FDA_DAILY_VALUES } from '@/types/nutrition'

interface Props { data: NutritionData }

function pct(value: number | undefined, daily: number): number | null {
  if (value === undefined) return null
  return Math.round((value / daily) * 100)
}

function DvBar({ percent }: { percent: number }) {
  const color = percent >= 20 ? 'bg-red-500' : percent >= 10 ? 'bg-yellow-500' : 'bg-green-500'
  const textColor = percent >= 20 ? 'text-red-400' : percent >= 10 ? 'text-yellow-400' : 'text-green-400'
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span className={`text-xs font-medium w-8 text-right ${textColor}`}>{percent}%</span>
    </div>
  )
}

function NutrientRow({ label, value, unit, dvPercent, bold, indent }: {
  label: string; value: number; unit: string; dvPercent?: number | null; bold?: boolean; indent?: boolean
}) {
  return (
    <div className={`py-1.5 border-b border-zinc-700/60 ${indent ? 'pl-4' : ''}`}>
      <div className="flex justify-between items-baseline">
        <span className={`text-sm text-zinc-200 ${bold ? 'font-bold' : ''}`}>
          {label} <span className="font-normal text-zinc-400">{value}{unit}</span>
        </span>
        {dvPercent !== null && dvPercent !== undefined && (
          <span className="text-sm text-zinc-300 font-medium ml-2">{dvPercent}%</span>
        )}
      </div>
      {dvPercent !== null && dvPercent !== undefined && dvPercent > 0 && <DvBar percent={dvPercent} />}
    </div>
  )
}

export function NutritionLabelCard({ data }: Props) {
  const micros = [
    { label: 'Vitamin D', value: data.vitaminD, unit: 'mcg', dv: FDA_DAILY_VALUES.vitaminD },
    { label: 'Calcium', value: data.calcium, unit: 'mg', dv: FDA_DAILY_VALUES.calcium },
    { label: 'Iron', value: data.iron, unit: 'mg', dv: FDA_DAILY_VALUES.iron },
    { label: 'Potassium', value: data.potassium, unit: 'mg', dv: FDA_DAILY_VALUES.potassium },
  ].filter((m) => m.value !== undefined && m.value > 0)

  return (
    <div className="bg-zinc-900 border-2 border-zinc-300/80 rounded-xl overflow-hidden max-w-xs w-full shadow-lg my-1">
      <div className="bg-zinc-100 px-4 pt-3 pb-2.5">
        <div className="text-zinc-900 font-black text-2xl leading-tight tracking-tight">Nutrition Facts</div>
        <div className="text-zinc-600 text-sm mt-0.5">{data.servingSize} serving</div>
        <div className="text-zinc-500 text-xs mt-0.5 italic truncate">{data.foodName}</div>
      </div>
      <div className="h-2 bg-zinc-800" />
      <div className="bg-zinc-900 px-4 py-2.5 border-b-4 border-zinc-600">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-zinc-500 text-xs">Amount Per Serving</div>
            <div className="text-zinc-100 font-bold">Calories</div>
          </div>
          <div className="text-zinc-100 font-black text-5xl leading-none">{data.calories}</div>
        </div>
      </div>
      <div className="px-4 py-1 flex justify-end border-b border-zinc-600">
        <span className="text-zinc-400 text-xs">% Daily Value*</span>
      </div>
      <div className="px-4">
        {data.totalFat !== undefined && <NutrientRow label="Total Fat" value={data.totalFat} unit="g" dvPercent={pct(data.totalFat, FDA_DAILY_VALUES.totalFat)} bold />}
        {data.saturatedFat !== undefined && <NutrientRow label="Saturated Fat" value={data.saturatedFat} unit="g" dvPercent={pct(data.saturatedFat, FDA_DAILY_VALUES.saturatedFat)} indent />}
        {data.transFat !== undefined && <NutrientRow label="Trans Fat" value={data.transFat} unit="g" indent />}
        {data.cholesterol !== undefined && <NutrientRow label="Cholesterol" value={data.cholesterol} unit="mg" dvPercent={pct(data.cholesterol, FDA_DAILY_VALUES.cholesterol)} bold />}
        {data.sodium !== undefined && <NutrientRow label="Sodium" value={data.sodium} unit="mg" dvPercent={pct(data.sodium, FDA_DAILY_VALUES.sodium)} bold />}
        {data.totalCarbs !== undefined && <NutrientRow label="Total Carbohydrate" value={data.totalCarbs} unit="g" dvPercent={pct(data.totalCarbs, FDA_DAILY_VALUES.totalCarbs)} bold />}
        {data.dietaryFiber !== undefined && <NutrientRow label="Dietary Fiber" value={data.dietaryFiber} unit="g" dvPercent={pct(data.dietaryFiber, FDA_DAILY_VALUES.dietaryFiber)} indent />}
        {data.totalSugars !== undefined && <NutrientRow label="Total Sugars" value={data.totalSugars} unit="g" indent />}
        {data.protein !== undefined && <NutrientRow label="Protein" value={data.protein} unit="g" dvPercent={pct(data.protein, FDA_DAILY_VALUES.protein)} bold />}
      </div>
      <div className="h-1.5 bg-zinc-700 mx-4 my-1 rounded-full" />
      {micros.length > 0 && (
        <div className="px-4 pb-2 space-y-0.5">
          {micros.map((m) => (
            <div key={m.label} className="flex justify-between items-center text-sm border-b border-zinc-700/40 py-1">
              <span className="text-zinc-300">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">{m.value}{m.unit}</span>
                <span className="text-zinc-200 font-medium w-8 text-right">{pct(m.value, m.dv)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-2 bg-zinc-800/50">
        <p className="text-zinc-500 text-xs">*% Daily Values based on a 2,000 calorie diet. Data from USDA FoodData Central.</p>
      </div>
    </div>
  )
}
