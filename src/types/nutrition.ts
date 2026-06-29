export interface NutritionData {
  foodName: string
  servingSize: string
  calories: number
  totalFat?: number
  saturatedFat?: number
  transFat?: number
  cholesterol?: number
  sodium?: number
  totalCarbs?: number
  dietaryFiber?: number
  totalSugars?: number
  addedSugars?: number
  protein?: number
  vitaminD?: number
  calcium?: number
  iron?: number
  potassium?: number
  vitaminC?: number
  vitaminA?: number
  [key: string]: string | number | undefined
}

export const FDA_DAILY_VALUES = {
  totalFat: 78,
  saturatedFat: 20,
  cholesterol: 300,
  sodium: 2300,
  totalCarbs: 275,
  dietaryFiber: 28,
  protein: 50,
  vitaminD: 20,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
  vitaminC: 90,
  vitaminA: 900,
} as const
