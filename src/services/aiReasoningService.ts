import type { UserProfile, Budget, BudgetCategory, SpendingData } from '../types'

interface BudgetContext {
  userProfile: UserProfile
  spendingHistory?: SpendingData[]
  location?: string
  familySize?: number
  lifeStage?: string
  financialGoals?: string[]
  debtObligations?: number
  emergencyFund?: number
}

interface AIBudgetResponse {
  budget: Budget
  reasoning: string
  confidenceScore: number
  alternatives?: Budget[]
}

export class AIBudgetReasoningService {
  private apiKey: string
  private model: string
  private apiEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(apiKey: string, model: string = 'gemini-2.5-pro') {
    this.apiKey = apiKey
    this.model = model
  }

  async generatePersonalizedBudget(context: BudgetContext): Promise<AIBudgetResponse> {
    const prompt = this.buildReasoningPrompt(context)
    
    try {
      if (this.apiKey && this.apiKey !== 'mock-api-key') {
        const response = await this.callGeminiAPI(prompt)
        return this.parseGeminiResponse(response, context)
      }
    } catch (error) {
      console.error('Gemini API call failed:', error)
    }
    
    // Fallback to enhanced mock
    return this.mockAIResponse(context)
  }

  private buildReasoningPrompt(context: BudgetContext): string {
    return `You are an expert financial planner specializing in Chinese personal finance. Create a personalized monthly budget for someone with the following profile:

CONTEXT:
- Monthly after-tax income: ¥${(context.userProfile.income || 0) * 7} CNY (approximately)
- Location: ${context.location || 'Chinese tier-1 city'}
- Household size: ${context.familySize || 1} people
- Life stage: ${context.lifeStage || 'working adult'}
- Monthly debt payments: ¥${(context.debtObligations || 0) * 7} CNY
- Savings goal: ${context.userProfile.savingsGoal || 20}% of income
- Risk tolerance: ${context.userProfile.preferences?.riskTolerance || 'moderate'}
- Current emergency fund: ¥${(context.emergencyFund || 0) * 7} CNY

${context.userProfile.monthlySpending ? `ACTUAL SPENDING DATA:
- Average monthly spending: ¥${Math.round((context.userProfile.monthlySpending || 0) * 7)} CNY
- Category breakdown: ${Object.entries(context.userProfile.expenseCategories || {})
  .map(([cat, amount]) => `${cat}: ¥${Math.round((amount as number) * 7)}`)
  .join(', ')}` : ''}

${context.spendingHistory ? `RECENT SPENDING HISTORY:
${context.spendingHistory.slice(-3).map(month => 
  `${month.month}: ¥${month.total * 7} total (${Object.entries(month.categories).map(([cat, amt]) => `${cat}: ¥${(amt as number) * 7}`).join(', ')})`
).join('\n')}` : ''}

CHINESE CONTEXT CONSIDERATIONS:
- Housing costs vary greatly between tier-1/2/3 cities
- Food costs include both groceries and frequent dining out (外卖 culture)
- Transportation may include subway, bus, taxi/DiDi, or private car
- Healthcare should include both insurance and out-of-pocket expenses
- Education expenses for children are typically high priority
- Consider traditional Chinese savings habits (higher savings rate)
- Account for annual expenses like Spring Festival, gifts, travel

Create a detailed monthly budget with the following requirements:
1. Allocate spending across essential categories (housing, food, transportation, healthcare, debt) and discretionary categories
2. Ensure the budget achieves their ${context.userProfile.savingsGoal || 20}% savings goal
3. Account for Chinese cost of living patterns
4. Consider family/household needs (especially education if children)
5. Include debt payments if applicable
6. Provide amounts in CNY (Chinese Yuan) and percentages for each category

Format your response as JSON with this structure:
{
  "categories": [
    {
      "name": "Category Name",
      "amount": 1234,
      "percentage": 25,
      "isEssential": true,
      "description": "Brief description of what this covers and why this amount"
    }
  ],
  "totalExpenses": 4567,
  "savings": 890,
  "savingsRate": 20,
  "reasoning": "Detailed explanation of the overall budget strategy and key decisions",
  "insights": ["Key insight 1", "Key insight 2"],
  "confidenceScore": 0.85
}`
  }

  private async callGeminiAPI(prompt: string): Promise<any> {
    const url = `${this.apiEndpoint}/models/${this.model}:generateContent?key=${this.apiKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private parseGeminiResponse(response: any, context: BudgetContext): AIBudgetResponse {
    try {
      // Extract the generated content from Gemini response
      const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text
      if (!generatedText) {
        throw new Error('No response from Gemini')
      }

      // Parse the JSON response
      const budgetData = JSON.parse(generatedText)
      
      // Calculate income for the budget object
      const income = context.userProfile.income || 0
      
      // Create the budget object
      const budget: Budget = {
        income,
        categories: budgetData.categories.map((cat: any) => ({
          name: cat.name,
          amount: cat.amount,
          percentage: cat.percentage,
          isEssential: cat.isEssential,
          description: cat.description
        })),
        totalExpenses: budgetData.totalExpenses,
        savings: budgetData.savings,
        savingsRate: budgetData.savingsRate
      }

      return {
        budget,
        reasoning: budgetData.reasoning,
        confidenceScore: budgetData.confidenceScore || 0.9
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error)
      throw error
    }
  }

  private mockAIResponse(context: BudgetContext): AIBudgetResponse {
    const income = context.userProfile.income || 0
    const hasKids = (context.familySize || 1) > 2
    const hasDebt = (context.debtObligations || 0) > 0
    const isHighCostArea = context.location?.toLowerCase().includes('san francisco') || 
                          context.location?.toLowerCase().includes('new york')

    // Dynamic allocation based on context
    const housingPercentage = isHighCostArea ? 35 : hasKids ? 30 : 25
    const foodPercentage = hasKids ? 15 : 12
    const transportPercentage = isHighCostArea ? 10 : 15
    const healthcarePercentage = hasKids ? 8 : 5
    const debtPercentage = hasDebt ? Math.min(20, (context.debtObligations! / income) * 100) : 0
    const savingsPercentage = context.userProfile.savingsGoal || 20
    
    // Adjust for remaining budget
    const fixedPercentages = housingPercentage + foodPercentage + transportPercentage + 
                           healthcarePercentage + debtPercentage + savingsPercentage
    const remainingPercentage = Math.max(0, 100 - fixedPercentages)
    
    const personalPercentage = remainingPercentage * 0.4
    const entertainmentPercentage = remainingPercentage * 0.3
    const miscPercentage = remainingPercentage * 0.3

    const categories: BudgetCategory[] = [
      {
        name: 'Housing',
        amount: income * (housingPercentage / 100),
        percentage: housingPercentage,
        isEssential: true,
        description: isHighCostArea ? 
          'Adjusted higher for high-cost area. Consider roommates or suburbs.' :
          'Rent/mortgage, utilities, insurance'
      },
      {
        name: 'Food & Groceries',
        amount: income * (foodPercentage / 100),
        percentage: foodPercentage,
        isEssential: true,
        description: hasKids ? 
          'Increased allocation for family meals and school lunches' :
          'Groceries and essential meals'
      },
      {
        name: 'Transportation',
        amount: income * (transportPercentage / 100),
        percentage: transportPercentage,
        isEssential: true,
        description: isHighCostArea ? 
          'Reduced - assuming public transit usage' :
          'Car payments, gas, public transit'
      },
      {
        name: 'Healthcare',
        amount: income * (healthcarePercentage / 100),
        percentage: healthcarePercentage,
        isEssential: true,
        description: hasKids ? 
          'Family health insurance, pediatric care, medications' :
          'Insurance, medications, checkups'
      }
    ]

    if (hasDebt) {
      categories.push({
        name: 'Debt Payments',
        amount: income * (debtPercentage / 100),
        percentage: debtPercentage,
        isEssential: true,
        description: 'Prioritizing debt reduction for financial freedom'
      })
    }

    categories.push(
      {
        name: 'Personal & Lifestyle',
        amount: income * (personalPercentage / 100),
        percentage: personalPercentage,
        isEssential: false,
        description: 'Clothing, personal care, hobbies'
      },
      {
        name: 'Entertainment',
        amount: income * (entertainmentPercentage / 100),
        percentage: entertainmentPercentage,
        isEssential: false,
        description: hasKids ? 
          'Family activities, streaming services, dining out' :
          'Dining out, movies, subscriptions'
      },
      {
        name: 'Miscellaneous',
        amount: income * (miscPercentage / 100),
        percentage: miscPercentage,
        isEssential: false,
        description: 'Emergency buffer, unexpected expenses'
      }
    )

    const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0)
    const savings = income - totalExpenses
    const actualSavingsRate = income > 0 ? (savings / income) * 100 : 0

    const reasoning = `
Based on your profile, I've created a personalized budget considering:

${isHighCostArea ? '• High cost of living area - increased housing allocation\n' : ''}
${hasKids ? '• Family needs - adjusted food and healthcare budgets\n' : ''}
${hasDebt ? '• Debt obligations - prioritizing payoff while maintaining quality of life\n' : ''}
${context.userProfile.preferences?.riskTolerance === 'conservative' ? 
  '• Conservative approach - higher emergency fund allocation\n' : ''}

Key optimizations:
${isHighCostArea ? '• Consider suburban areas or roommates to reduce housing costs\n' : ''}
${hasKids ? '• Look into meal planning and bulk buying for family savings\n' : ''}
${actualSavingsRate < 20 ? '• Focus on increasing income or reducing discretionary spending\n' : ''}
`.trim()

    return {
      budget: {
        income,
        categories,
        totalExpenses,
        savings,
        savingsRate: actualSavingsRate
      },
      reasoning,
      confidenceScore: 0.85
    }
  }

  async analyzeSpendingPatterns(
    spendingData: SpendingData[], 
    currentBudget: Budget
  ): Promise<{insights: string[], adjustments: BudgetCategory[]}> {
    // Analyze actual vs budgeted spending
    const insights: string[] = []
    const adjustments: BudgetCategory[] = []

    // This would use AI to analyze patterns
    // For now, simple analysis
    const avgSpending = spendingData.reduce((acc, month) => {
      Object.entries(month.categories).forEach(([cat, amount]) => {
        acc[cat] = (acc[cat] || 0) + amount
      })
      return acc
    }, {} as {[key: string]: number})

    Object.entries(avgSpending).forEach(([category, total]) => {
      const avg = total / spendingData.length
      const budgeted = currentBudget.categories.find(c => 
        c.name.toLowerCase().includes(category.toLowerCase())
      )
      
      if (budgeted && avg > budgeted.amount * 1.2) {
        insights.push(`You're consistently overspending on ${category} by ${Math.round(((avg / budgeted.amount) - 1) * 100)}%`)
      }
    })

    return { insights, adjustments }
  }
}

export default AIBudgetReasoningService