export interface UserProfile {
  name?: string
  income?: number
  savingsGoal?: number
  essentialExpenses?: number
  location?: string
  familySize?: number
  lifeStage?: 'student' | 'early-career' | 'mid-career' | 'family' | 'pre-retirement' | 'retired'
  financialGoals?: string[]
  debtObligations?: number
  emergencyFund?: number
  preferences?: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
    priorityAreas: string[]
  }
  monthlySpending?: number
  expenseCategories?: { [category: string]: number }
}

export interface BudgetCategory {
  name: string
  amount: number
  percentage: number
  isEssential: boolean
  description?: string
}

export interface Budget {
  income: number
  categories: BudgetCategory[]
  totalExpenses: number
  savings: number
  savingsRate: number
}

export interface Message {
  id: string
  text: string
  sender: 'user' | 'finn'
  timestamp: Date
  suggestions?: string[]
  interactive?: {
    type: 'slider' | 'calculator' | 'chart' | 'comparison' | 'quiz' | 'form'
    data?: any
  }
}

export interface SpendingData {
  month: string
  categories: {
    [key: string]: number
  }
  total: number
}