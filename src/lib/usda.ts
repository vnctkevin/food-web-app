import { NutritionData } from '@/types/nutrition'

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'

const NUTRIENT_MAP: Record<string, keyof NutritionData> = {
  '1008': 'calories',
  '1004': 'totalFat',
  '1258': 'saturatedFat',
  '1257': 'transFat',
  '1253': 'cholesterol',
  '1093': 'sodium',
  '1005': 'totalCarbs',
  '1079': 'dietaryFiber',
  '2000': 'totalSugars',
  '1235': 'addedSugars',
  '1003': 'protein',
  '1114': 'vitaminD',
  '1087': 'calcium',
  '1089': 'iron',
  '1092': 'potassium',
  '1162': 'vitaminC',
  '1106': 'vitaminA',
}

interface USDAFood {
  description: string
  foodNutrients: Array<{ nutrientId: number; value: number }>
  servingSize?: number
  servingSizeUnit?: string
}

export async function searchAndGetNutrition(foodName: string): Promise<NutritionData | null> {
  try {
    const url = new URL(`${USDA_BASE}/foods/search`)
    url.searchParams.set('query', foodName)
    url.searchParams.set('api_key', process.env.USDA_API_KEY!)
    url.searchParams.set('pageSize', '3')
    url.searchParams.set('dataType', 'Foundation,SR Legacy')

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data = await res.json()
    if (!data.foods?.length) return null

    const food: USDAFood = data.foods[0]
    const nutrients = Object.fromEntries(food.foodNutrients.map((n) => [String(n.nutrientId), n.value]))
    const serving = food.servingSize ? `${food.servingSize}${food.servingSizeUnit ?? 'g'}` : '100g'

    const result: NutritionData = {
      foodName: food.description,
      servingSize: serving,
      calories: Math.round(nutrients['1008'] ?? 0),
    }

    for (const [id, field] of Object.entries(NUTRIENT_MAP)) {
      if (id === '1008') continue
      const val = nutrients[id]
      if (val !== undefined && val > 0) result[field] = Math.round(val * 10) / 10
    }

    return result
  } catch {
    return null
  }
}
