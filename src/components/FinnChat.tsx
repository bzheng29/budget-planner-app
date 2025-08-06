import React, { useState, useEffect, useRef } from 'react'
import type { Message, UserProfile, Budget, BudgetCategory } from '../types'
import { generateFinnResponse } from '../utils/finnResponses'
import { calculateBudget, analyzeBudgetHealth } from '../utils/budgetCalculator'
import { calculateAIBudget } from '../utils/aiBudgetCalculator'
import { generateAIChatResponse } from '../services/chatService'
import { ExpenseParserService, type ExpenseMetadata } from '../services/expenseParserService'
import BudgetVisualization from './BudgetVisualization'
import InteractiveBudgetSlider from './InteractiveBudgetSlider'
import SavingsCalculator from './SavingsCalculator'
import { ExpenseUpload } from './ExpenseUpload'
import './FinnChat.css'

const FinnChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null)
  const [, setBudgetReasoning] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)
  const [isGeneratingBudget, setIsGeneratingBudget] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customInputType, setCustomInputType] = useState<'income' | 'savings' | 'debt' | null>(null)
  const [showExpenseUpload, setShowExpenseUpload] = useState(false)
  const [isProcessingExpenses, setIsProcessingExpenses] = useState(false)
  const [, setExpenseMetadata] = useState<ExpenseMetadata | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const expenseParser = new ExpenseParserService(import.meta.env.VITE_GEMINI_API_KEY || '')

  const handleBudgetUpdate = (newCategories: BudgetCategory[]) => {
    if (!currentBudget) return
    
    const newBudget: Budget = {
      ...currentBudget,
      categories: newCategories,
      totalExpenses: newCategories.reduce((sum, cat) => sum + cat.amount, 0),
      savings: currentBudget.income - newCategories.reduce((sum, cat) => sum + cat.amount, 0),
      savingsRate: ((currentBudget.income - newCategories.reduce((sum, cat) => sum + cat.amount, 0)) / currentBudget.income) * 100
    }
    
    setCurrentBudget(newBudget)
    
    // Add a message about the update
    const updateMessage: Message = {
      id: Date.now().toString(),
      text: "✅ I've updated your budget! Your new savings rate is " + newBudget.savingsRate.toFixed(1) + "%",
      sender: 'finn',
      timestamp: new Date(),
      suggestions: ["Show my new budget", "How can I save more?"]
    }
    setMessages(prev => [...prev, updateMessage])
  }

  const generateAIBudget = async (profile: UserProfile) => {
    setIsGeneratingBudget(true)
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      text: "Perfect! I have all the information I need. Let me create your personalized budget...",
      sender: 'finn',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, aiMessage])
    
    try {
      const { budget, reasoning } = await calculateAIBudget(profile)
      setCurrentBudget(budget)
      setBudgetReasoning(reasoning)
      
      const resultMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `✨ Your personalized budget is ready!\n\n${reasoning}\n\nScroll up to see your budget breakdown, or ask me any questions!`,
        sender: 'finn',
        timestamp: new Date(),
        suggestions: ["How can I save more?", "Explain my budget", "Adjust categories", "Set new goals"]
      }
      setMessages(prev => [...prev, resultMessage])
    } catch (error) {
      console.error('Budget generation failed:', error)
      const budget = calculateBudget(profile)
      setCurrentBudget(budget)
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've created your budget using standard guidelines. Scroll up to see the breakdown!",
        sender: 'finn',
        timestamp: new Date(),
        suggestions: ["How can I save more?", "Explain my budget", "Adjust categories"]
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsGeneratingBudget(false)
    }
  }

  useEffect(() => {
    // Start with expense upload prompt
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: "Hi! I'm Finn, your personal budget assistant 🤖\n\nTo create the most accurate budget for you, I'd love to analyze your actual spending patterns. Do you have expense data from your banking app or expense tracker that you can upload?\n\nI can work with CSV, JSON, or Excel files from most popular apps!",
      sender: 'finn',
      timestamp: new Date(),
      suggestions: ["Upload expense data", "Skip and enter manually"]
    }
    setMessages([initialMessage])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const processUserInput = (input: string) => {
    const lowerInput = input.toLowerCase()
    const updatedProfile = { ...userProfile }

    if (!userProfile.name) {
      updatedProfile.name = input
    } else if (!userProfile.income) {
      const incomeMatch = input.match(/\d+/)
      if (incomeMatch) {
        updatedProfile.income = parseInt(incomeMatch[0])
      }
    } else if (!userProfile.savingsGoal) {
      if (input.includes('%')) {
        const percentMatch = input.match(/\d+/)
        if (percentMatch) {
          updatedProfile.savingsGoal = parseInt(percentMatch[0])
        }
      } else {
        updatedProfile.savingsGoal = 20
      }
    } else if (!userProfile.preferences?.riskTolerance) {
      if (lowerInput.includes('conservative')) {
        updatedProfile.preferences = { ...updatedProfile.preferences, riskTolerance: 'conservative', priorityAreas: [] }
      } else if (lowerInput.includes('aggressive')) {
        updatedProfile.preferences = { ...updatedProfile.preferences, riskTolerance: 'aggressive', priorityAreas: [] }
      } else {
        updatedProfile.preferences = { ...updatedProfile.preferences, riskTolerance: 'moderate', priorityAreas: [] }
      }
    } else if (!userProfile.location) {
      if (lowerInput.includes('san francisco')) {
        updatedProfile.location = 'San Francisco'
      } else if (lowerInput.includes('new york')) {
        updatedProfile.location = 'New York'
      } else if (lowerInput.includes('chicago')) {
        updatedProfile.location = 'Chicago'
      } else if (lowerInput.includes('austin')) {
        updatedProfile.location = 'Austin'
      } else {
        updatedProfile.location = input
      }
    } else if (!userProfile.familySize) {
      if (lowerInput.includes('just me') || lowerInput.includes('1')) {
        updatedProfile.familySize = 1
      } else if (lowerInput.includes('2')) {
        updatedProfile.familySize = 2
      } else if (lowerInput.includes('3') || lowerInput.includes('4')) {
        updatedProfile.familySize = 4
      } else if (lowerInput.includes('5')) {
        updatedProfile.familySize = 5
      }
    } else if (!userProfile.lifeStage) {
      if (lowerInput.includes('student')) {
        updatedProfile.lifeStage = 'student'
      } else if (lowerInput.includes('early')) {
        updatedProfile.lifeStage = 'early-career'
      } else if (lowerInput.includes('mid')) {
        updatedProfile.lifeStage = 'mid-career'
      } else if (lowerInput.includes('family')) {
        updatedProfile.lifeStage = 'family'
      } else if (lowerInput.includes('retirement')) {
        updatedProfile.lifeStage = 'pre-retirement'
      }
    } else if (userProfile.debtObligations === undefined) {
      if (lowerInput.includes('no debt')) {
        updatedProfile.debtObligations = 0
      } else {
        const debtMatch = input.match(/\d+/)
        if (debtMatch) {
          updatedProfile.debtObligations = parseInt(debtMatch[0])
        }
      }
    }

    setUserProfile(updatedProfile)

    // Check if we have enough context to generate AI budget
    if (updatedProfile.income && 
        updatedProfile.savingsGoal && 
        updatedProfile.debtObligations !== undefined &&
        !currentBudget) {
      generateAIBudget(updatedProfile)
    }

    return updatedProfile
  }

  const handleFileUpload = async (file: File) => {
    setIsProcessingExpenses(true)
    
    const processingMessage: Message = {
      id: Date.now().toString(),
      text: `Great! I'm analyzing your ${file.name} file...`,
      sender: 'finn',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, processingMessage])

    try {
      const { metadata } = await expenseParser.parseExpenseFile(file)
      setExpenseMetadata(metadata)
      
      // Update user profile with expense insights
      const updatedProfile = {
        ...userProfile,
        monthlySpending: metadata.averageMonthlySpend,
        expenseCategories: metadata.categoryBreakdown
      }
      setUserProfile(updatedProfile)

      let analysisText = `📊 I've analyzed your expenses from ${metadata.periodStart} to ${metadata.periodEnd}!\n\n`
      analysisText += `💰 平均月支出: ¥${Math.round(metadata.averageMonthlySpend).toLocaleString()}\n\n`
      analysisText += `📂 主要支出类别:\n`
      
      const topCategories = Object.entries(metadata.categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
      
      topCategories.forEach(([category, amount]) => {
        analysisText += `  • ${category}: ¥${Math.round(amount).toLocaleString()}\n`
      })

      if (metadata.recurringExpenses.length > 0) {
        analysisText += `\n🔄 发现 ${metadata.recurringExpenses.length} 项循环支出`
      }

      if (metadata.missingData.length > 0) {
        analysisText += `\n\n⚠️ Note: ${metadata.missingData.join(', ')}`
      }

      analysisText += `\n\nNow let's create your personalized budget! What's your name?`

      const analysisMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: analysisText,
        sender: 'finn',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, analysisMessage])
      setShowExpenseUpload(false)
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I had trouble reading that file. Could you try a different format, or would you prefer to enter your information manually?",
        sender: 'finn',
        timestamp: new Date(),
        suggestions: ["Try another file", "Enter manually"]
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingExpenses(false)
    }
  }

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim()
    if (!messageText) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Handle expense upload request
    if (messageText.toLowerCase().includes('upload expense') || messageText.toLowerCase().includes('upload data')) {
      setShowExpenseUpload(true)
      return
    }

    // Handle skip upload
    if (messageText.toLowerCase().includes('skip') || messageText.toLowerCase().includes('enter manually')) {
      const skipMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "No problem! Let's start with some basic information. What's your name?",
        sender: 'finn',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, skipMessage])
      return
    }

    // Check if user selected "Other amount" or similar
    if (messageText.toLowerCase().includes('other') || messageText.toLowerCase().includes('custom')) {
      if (!userProfile.income && !userProfile.savingsGoal) {
        setShowCustomInput(true)
        setCustomInputType('income')
        return // Stop here, don't generate response
      } else if (userProfile.income && !userProfile.savingsGoal) {
        setShowCustomInput(true)
        setCustomInputType('savings')
        return // Stop here, don't generate response
      } else if (userProfile.income && userProfile.savingsGoal && userProfile.debtObligations === undefined) {
        setShowCustomInput(true)
        setCustomInputType('debt')
        return // Stop here, don't generate response
      }
    }

    setIsTyping(true)
    const updatedProfile = processUserInput(messageText)

    // Determine conversation stage
    const conversationStage = !updatedProfile.name ? 'greeting' :
                           !updatedProfile.debtObligations ? 'collecting_info' :
                           currentBudget ? 'discussing' : 'budget_ready'

    // Use AI for responses
    generateAIChatResponse({
      userProfile: updatedProfile,
      currentBudget,
      conversationStage,
      lastUserInput: messageText
    }).then(response => {
      const finnMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'finn',
        timestamp: new Date(),
        suggestions: response.suggestions
      }

      setMessages(prev => [...prev, finnMessage])
      setIsTyping(false)
    }).catch(() => {
      // Fallback to hardcoded responses if AI fails
      const response = generateFinnResponse(messageText, updatedProfile, currentBudget)
      const finnMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'finn',
        timestamp: new Date(),
        suggestions: response.suggestions
      }

      setMessages(prev => [...prev, finnMessage])
      setIsTyping(false)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const renderBudgetSummary = () => {
    if (!currentBudget) return null

    const { score, recommendations } = analyzeBudgetHealth(currentBudget)

    return (
      <div className="budget-summary">
        <h3>Your Budget Summary</h3>
        <div className="budget-stats">
          <div className="stat">
            <span className="label">Monthly Income</span>
            <span className="value">${currentBudget.income.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Total Expenses</span>
            <span className="value">${Math.round(currentBudget.totalExpenses).toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Monthly Savings</span>
            <span className="value savings">${Math.round(currentBudget.savings).toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Savings Rate</span>
            <span className="value">{Math.round(currentBudget.savingsRate)}%</span>
          </div>
        </div>
        <div className="budget-health">
          <div className="health-score" data-score={score}>
            <span>Budget Health Score: {score}/100</span>
          </div>
          <ul className="recommendations">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="finn-chat-container">
      <div className="chat-header">
        <div className="finn-avatar">🤖</div>
        <div>
          <h2>Finn - Your Budget Assistant</h2>
          <p className="status">Always here to help</p>
        </div>
      </div>

      <div className="chat-content">
        {showExpenseUpload && (
          <div className="expense-upload-section">
            <ExpenseUpload 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessingExpenses}
            />
          </div>
        )}
        
        {currentBudget && (
          <div className="budget-content">
            {renderBudgetSummary()}
            <BudgetVisualization budget={currentBudget} />
          </div>
        )}

        <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              <p>{message.text}</p>
              
              {/* Render interactive components */}
              {message.interactive && currentBudget && (
                <div className="interactive-component">
                  {message.interactive.type === 'slider' && (
                    <InteractiveBudgetSlider 
                      budget={currentBudget} 
                      onUpdate={handleBudgetUpdate} 
                    />
                  )}
                  {message.interactive.type === 'calculator' && (
                    <SavingsCalculator 
                      currentSavings={currentBudget.savings}
                      monthlyIncome={currentBudget.income}
                    />
                  )}
                  {message.interactive.type === 'chart' && (
                    <BudgetVisualization budget={currentBudget} />
                  )}
                </div>
              )}
              
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="suggestions">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="suggestion-button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isTyping && !isGeneratingBudget && (
          <div className="message finn typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        {isGeneratingBudget && (
          <div className="message finn">
            <div className="budget-loading">
              <div className="budget-loading-spinner"></div>
              <span>Creating your personalized budget with AI...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      </div>

      <div className="input-container">
        {showCustomInput && (
          <div className="custom-input-overlay">
            <div className="custom-input-modal">
              <h3>Enter {customInputType === 'income' ? 'Monthly Income' : customInputType === 'savings' ? 'Savings Goal (%)' : 'Monthly Debt'}</h3>
              <input
                type="number"
                placeholder={customInputType === 'income' ? "e.g. 5000" : customInputType === 'savings' ? "e.g. 20" : "e.g. 500"}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setShowCustomInput(false)
                    handleSendMessage()
                  }
                }}
                autoFocus
                className="custom-amount-input"
              />
              <div className="custom-input-buttons">
                <button onClick={() => {
                  setShowCustomInput(false)
                  handleSendMessage()
                }} className="custom-submit">
                  Submit
                </button>
                <button onClick={() => {
                  setShowCustomInput(false)
                  setInputValue('')
                }} className="custom-cancel">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="message-input"
          disabled={showCustomInput}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || showCustomInput}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default FinnChat