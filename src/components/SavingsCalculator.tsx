import React, { useState } from 'react'
import './SavingsCalculator.css'

interface SavingsCalculatorProps {
  currentSavings: number
  monthlyIncome: number
}

const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({ currentSavings, monthlyIncome }) => {
  const [goal, setGoal] = useState(50000)
  const [timeframe, setTimeframe] = useState(24)
  const [extraSavings, setExtraSavings] = useState(0)

  const monthlySavingsNeeded = goal / timeframe
  const requiredSavingsRate = ((monthlySavingsNeeded + extraSavings) / monthlyIncome) * 100
  const totalWithExtra = currentSavings + extraSavings

  return (
    <div className="savings-calculator">
      <h3>💰 Savings Goal Calculator</h3>
      
      <div className="calculator-inputs">
        <div className="input-group">
          <label>Savings Goal</label>
          <div className="input-with-prefix">
            <span>¥</span>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
        
        <div className="input-group">
          <label>Timeframe (months)</label>
          <input
            type="number"
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value) || 1)}
            min="1"
          />
        </div>
        
        <div className="input-group">
          <label>Extra Monthly Savings</label>
          <div className="input-with-prefix">
            <span>¥</span>
            <input
              type="number"
              value={extraSavings}
              onChange={(e) => setExtraSavings(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
      </div>
      
      <div className="calculator-results">
        <div className="result-card">
          <span className="result-label">Monthly Needed</span>
          <span className="result-value">¥{Math.round(monthlySavingsNeeded).toLocaleString()}</span>
        </div>
        
        <div className="result-card">
          <span className="result-label">Required Rate</span>
          <span className="result-value">{requiredSavingsRate.toFixed(1)}%</span>
        </div>
        
        <div className="result-card">
          <span className="result-label">Time to Goal</span>
          <span className="result-value">{timeframe} months</span>
        </div>
      </div>
      
      <div className="savings-tips">
        {requiredSavingsRate > 30 && (
          <p className="tip warning">
            ⚠️ This requires saving {requiredSavingsRate.toFixed(1)}% of income. Consider extending timeframe or reducing goal.
          </p>
        )}
        {totalWithExtra > currentSavings && (
          <p className="tip info">
            💡 每月额外储蓄 ¥{extraSavings} 可以让您更接近目标 ¥{(extraSavings * timeframe).toLocaleString()}！
          </p>
        )}
      </div>
    </div>
  )
}

export default SavingsCalculator