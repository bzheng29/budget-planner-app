import type { UserProfile, Budget, SpendingData } from '../types'
import AIBudgetReasoningService from '../services/aiReasoningService'

// Get configuration from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'mock-api-key'
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro'

const aiService = new AIBudgetReasoningService(GEMINI_API_KEY, GEMINI_MODEL)

export async function calculateAIBudget(
  profile: UserProfile, 
  spendingData?: SpendingData[]
): Promise<{
  budget: Budget
  reasoning: string
  confidence: number
}> {
  try {
    const response = await aiService.generatePersonalizedBudget({
      userProfile: profile,
      spendingHistory: spendingData,
      location: profile.location,
      familySize: profile.familySize,
      lifeStage: profile.lifeStage,
      financialGoals: profile.financialGoals,
      debtObligations: profile.debtObligations,
      emergencyFund: profile.emergencyFund
    })

    return {
      budget: response.budget,
      reasoning: response.reasoning,
      confidence: response.confidenceScore
    }
  } catch (error) {
    console.error('AI Budget calculation failed:', error)
    // Fallback to basic calculation
    const { calculateBudget } = await import('./budgetCalculator')
    return {
      budget: calculateBudget(profile),
      reasoning: 'Using standard budget allocation due to AI service unavailability.',
      confidence: 0.6
    }
  }
}

export async function getAIBudgetInsights(
  spendingData: SpendingData[],
  currentBudget: Budget
): Promise<string[]> {
  try {
    const { insights } = await aiService.analyzeSpendingPatterns(spendingData, currentBudget)
    return insights
  } catch (error) {
    console.error('AI insights generation failed:', error)
    return ['Unable to generate AI insights at this time.']
  }
}