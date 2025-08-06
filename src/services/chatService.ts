import type { UserProfile, Budget } from '../types'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'mock-api-key'
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro'

interface ChatContext {
  userProfile: UserProfile
  currentBudget: Budget | null
  conversationStage: 'greeting' | 'collecting_info' | 'budget_ready' | 'discussing'
  lastUserInput: string
}

export async function generateAIChatResponse(
  context: ChatContext
): Promise<{ text: string; suggestions: string[]; interactive?: any }> {
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'mock-api-key') {
    // Fallback to simple responses if no API key
    return generateFallbackResponse(context)
  }

  try {
    const prompt = buildChatPrompt(context)
    const response = await callGeminiAPI(prompt)
    return parseChatResponse(response)
  } catch (error) {
    console.error('Gemini chat API error:', error)
    return generateFallbackResponse(context)
  }
}

function buildChatPrompt(context: ChatContext): string {
  const { userProfile, currentBudget, conversationStage, lastUserInput } = context

  return `You are Finn, a friendly and professional AI budget assistant. Your role is to help users create personalized budgets through natural conversation.

Current conversation context:
- Stage: ${conversationStage}
- User has provided: ${JSON.stringify({
    name: userProfile.name,
    income: userProfile.income,
    savingsGoal: userProfile.savingsGoal,
    location: userProfile.location,
    familySize: userProfile.familySize,
    lifeStage: userProfile.lifeStage,
    debtObligations: userProfile.debtObligations,
    riskTolerance: userProfile.preferences?.riskTolerance,
    monthlySpending: userProfile.monthlySpending,
    expenseCategories: userProfile.expenseCategories
  }, null, 2)}
- Budget created: ${currentBudget ? 'Yes' : 'No'}
- User's last message: "${lastUserInput}"

Guidelines:
1. Be conversational and friendly but professional
2. If collecting information, ask for the next missing piece naturally
3. Always provide 2-4 relevant suggestion buttons that make sense for the context
4. Keep responses concise (2-3 sentences max)
5. If user says "other" or "custom" for amounts, acknowledge it but don't ask for the specific amount (the UI will handle that)
6. When all info is collected, express excitement about creating their budget

Required information order:
1. Name
2. Monthly income (after tax)
3. Savings goal percentage
4. Risk tolerance
5. Location
6. Family/household size
7. Life stage
8. Monthly debt obligations

Respond with JSON:
{
  "text": "Your response message",
  "suggestions": ["Button 1", "Button 2", "Button 3"],
  "interactive": null or {
    "type": "slider|calculator|chart|comparison|quiz",
    "data": {}
  }
}

You can suggest interactive tools when appropriate:
- "slider": When user wants to adjust budget categories
- "calculator": For savings goals or debt payoff calculations
- "chart": To visualize spending or budget breakdown
- "comparison": To compare different budget scenarios
- "quiz": To assess financial knowledge or preferences

Examples:
- If user asks "Can I adjust my budget?", include: {"type": "slider"}
- If user asks "How long to save $10000?", include: {"type": "calculator", "data": {"goal": 10000}}
- If user asks "Show me a breakdown", include: {"type": "chart"}`
}

async function callGeminiAPI(prompt: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  
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
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  return response.json()
}

function parseChatResponse(response: any): { text: string; suggestions: string[]; interactive?: any } {
  try {
    const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!generatedText) {
      throw new Error('No response from Gemini')
    }

    const parsed = JSON.parse(generatedText)
    return {
      text: parsed.text || "I'm here to help with your budget!",
      suggestions: parsed.suggestions || [],
      interactive: parsed.interactive || undefined
    }
  } catch (error) {
    console.error('Failed to parse Gemini response:', error)
    return {
      text: "I'm here to help you create a personalized budget. What would you like to know?",
      suggestions: ["Get started", "How does this work?"]
    }
  }
}

function generateFallbackResponse(context: ChatContext): { text: string; suggestions: string[]; interactive?: any } {
  const { userProfile } = context
  
  // Simple fallback logic
  if (!userProfile.name) {
    return {
      text: "Hi! I'm Finn, your budget assistant. What's your name?",
      suggestions: []
    }
  }
  
  if (!userProfile.income) {
    return {
      text: `Nice to meet you, ${userProfile.name}! What's your monthly income after taxes?`,
      suggestions: ["$3,000", "$5,000", "$7,000", "Other amount"]
    }
  }
  
  return {
    text: "Let me help you with your budget. What would you like to know?",
    suggestions: ["Show my budget", "How can I save more?", "Explain categories"]
  }
}