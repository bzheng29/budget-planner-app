import type { UserProfile, Budget, BudgetCategory } from '../types'

export function calculateBudget(profile: UserProfile): Budget {
  const income = profile.income || 0
  
  const categories: BudgetCategory[] = [
    {
      name: 'Housing',
      amount: income * 0.28,
      percentage: 28,
      isEssential: true,
      description: 'Rent/mortgage, utilities, insurance'
    },
    {
      name: 'Food & Groceries',
      amount: income * 0.12,
      percentage: 12,
      isEssential: true,
      description: 'Groceries and essential meals'
    },
    {
      name: 'Transportation',
      amount: income * 0.15,
      percentage: 15,
      isEssential: true,
      description: 'Car payments, gas, public transit'
    },
    {
      name: 'Healthcare',
      amount: income * 0.05,
      percentage: 5,
      isEssential: true,
      description: 'Insurance, medications, checkups'
    },
    {
      name: 'Personal & Lifestyle',
      amount: income * 0.10,
      percentage: 10,
      isEssential: false,
      description: 'Clothing, personal care, hobbies'
    },
    {
      name: 'Entertainment',
      amount: income * 0.05,
      percentage: 5,
      isEssential: false,
      description: 'Dining out, movies, subscriptions'
    },
    {
      name: 'Miscellaneous',
      amount: income * 0.05,
      percentage: 5,
      isEssential: false,
      description: 'Unexpected expenses, gifts'
    }
  ]
  
  const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0)
  const savings = income - totalExpenses
  const savingsRate = income > 0 ? (savings / income) * 100 : 0
  
  return {
    income,
    categories,
    totalExpenses,
    savings,
    savingsRate
  }
}

export function analyzeBudgetHealth(budget: Budget): {
  score: number
  recommendations: string[]
} {
  const recommendations: string[] = []
  let score = 100
  
  if (budget.savingsRate < 10) {
    score -= 20
    recommendations.push("您的储蓄率低于10%。建议减少非必要支出。")
  } else if (budget.savingsRate < 20) {
    score -= 10
    recommendations.push("建议将储蓄率提高到20%，以获得更好的财务保障。")
  }
  
  const housingPercentage = (budget.categories.find(c => c.name === 'Housing')?.amount || 0) / budget.income * 100
  if (housingPercentage > 30) {
    score -= 15
    recommendations.push("住房成本超过收入的30%。考虑更经济的选择。")
  }
  
  const essentialTotal = budget.categories
    .filter(c => c.isEssential)
    .reduce((sum, cat) => sum + cat.amount, 0)
  const essentialPercentage = essentialTotal / budget.income * 100
  
  if (essentialPercentage > 70) {
    score -= 15
    recommendations.push("必要支出过高。寻找降低固定成本的方法。")
  }
  
  if (recommendations.length === 0) {
    recommendations.push("太棒了！您的预算非常均衡。")
  }
  
  return { score, recommendations }
}