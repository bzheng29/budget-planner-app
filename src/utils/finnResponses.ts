import type { UserProfile } from '../types'
import { analyzeBudgetHealth } from './budgetCalculator'

export function generateFinnResponse(
  input: string,
  userProfile: UserProfile,
  context?: any
): { text: string; suggestions?: string[] } {
  const lowerInput = input.toLowerCase()
  
  if (!userProfile.name) {
    return {
      text: "Hi there! I'm Finn, your personal budget planning assistant. What's your name?",
      suggestions: []
    }
  }
  
  if (!userProfile.income) {
    return {
      text: `Nice to meet you, ${userProfile.name}! To help you create a personalized budget, I'll need to know your monthly income. What's your approximate monthly income after taxes?`,
      suggestions: ["$3,000", "$5,000", "$7,000", "Other amount"]
    }
  }
  
  if (!userProfile.savingsGoal) {
    return {
      text: "Great! Now, do you have a specific savings goal in mind? I typically recommend saving 20% of your income, but this can vary based on your personal goals.",
      suggestions: ["20% (Recommended)", "10%", "30%", "Custom amount"]
    }
  }
  
  if (!userProfile.preferences?.riskTolerance) {
    return {
      text: "Let me understand your financial style better. How would you describe your approach to money management?",
      suggestions: [
        "Conservative - I prefer stability",
        "Moderate - Balance is key",
        "Aggressive - I'm growth-focused"
      ]
    }
  }
  
  if (!userProfile.location) {
    return {
      text: "To create a more accurate budget, could you tell me which city or area you live in? This helps me account for local cost of living.",
      suggestions: ["San Francisco", "New York", "Chicago", "Austin", "Other"]
    }
  }
  
  if (!userProfile.familySize) {
    return {
      text: "How many people are in your household? This helps me tailor your budget for your family's needs.",
      suggestions: ["Just me", "2 people", "3-4 people", "5+ people"]
    }
  }
  
  if (!userProfile.lifeStage) {
    return {
      text: "What stage of life are you in? This helps me prioritize your financial goals appropriately.",
      suggestions: ["Student", "Early career", "Mid-career", "Growing family", "Pre-retirement"]
    }
  }
  
  if (!userProfile.debtObligations) {
    return {
      text: "Do you have any monthly debt payments (student loans, credit cards, etc.)? If yes, what's the total monthly amount?",
      suggestions: ["No debt", "$200-500", "$500-1000", "Over $1000"]
    }
  }
  
  if (lowerInput.includes('budget') || lowerInput.includes('plan') || lowerInput.includes('show')) {
    const budgetHealth = context ? analyzeBudgetHealth(context) : null
    return {
      text: `Based on your income and preferences, I've created a personalized budget plan for you. ${budgetHealth && budgetHealth.score >= 80 ? "Your budget looks healthy!" : "There are some areas we can optimize."} Would you like specific recommendations?`,
      suggestions: ["Give me recommendations", "How can I save more?", "Adjust my budget"]
    }
  }
  
  if (lowerInput.includes('save') || lowerInput.includes('saving')) {
    return {
      text: `With your current budget, you're saving $${Math.round(userProfile.income! * 0.2).toLocaleString()} per month. That's a ${Math.round((userProfile.savingsGoal || 20))}% savings rate! Would you like tips on how to increase your savings?`,
      suggestions: ["Yes, give me tips", "Show me where to cut expenses", "I'm happy with current savings"]
    }
  }
  
  if (lowerInput.includes('expense') || lowerInput.includes('spend')) {
    return {
      text: "I can help you analyze your expenses. Your biggest expense categories are typically housing (28%), transportation (15%), and food (12%). Would you like to dive deeper into any specific category?",
      suggestions: ["Housing costs", "Food & dining", "Transportation", "All categories"]
    }
  }
  
  if (lowerInput.includes('help') || lowerInput.includes('what can')) {
    return {
      text: "I can help you with:\n• Creating and optimizing your budget\n• Setting savings goals\n• Analyzing spending patterns\n• Providing personalized financial advice\n• Tracking progress toward your goals\n\nWhat would you like to explore?",
      suggestions: ["Show my budget", "How can I save more?", "Analyze my spending", "Set new goals"]
    }
  }
  
  if (lowerInput.includes('recommendation') || lowerInput.includes('advice') || lowerInput.includes('tip')) {
    const budgetHealth = context ? analyzeBudgetHealth(context) : null
    if (budgetHealth) {
      return {
        text: `Here are my personalized recommendations:\n\n${budgetHealth.recommendations.join('\n\n')}`,
        suggestions: ["Show my budget", "How can I implement these?", "What else can I do?"]
      }
    }
  }
  
  if (lowerInput.includes('housing') || lowerInput.includes('rent')) {
    return {
      text: "Housing typically should be 25-30% of your income. If you're spending more, consider:\n• Finding a roommate\n• Moving to a more affordable area\n• Negotiating rent\n• Reducing utility costs\n\nWould you like me to help you create a plan to reduce housing costs?",
      suggestions: ["Yes, help me plan", "Show other categories", "Back to budget"]
    }
  }
  
  return {
    text: "I'm here to help you manage your budget better. You can ask me about your spending, savings goals, or get personalized recommendations. What would you like to know?",
    suggestions: ["Show my budget", "How can I save more?", "Analyze my spending", "Set new goals"]
  }
}

export function getInitialGreeting(): string {
  return "👋 Hi! I'm Finn, your AI budget planning assistant. I'm here to help you create a personalized budget that works for your lifestyle and goals. Let's start by getting to know you better!"
}