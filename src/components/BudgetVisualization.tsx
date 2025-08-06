import React from 'react'
import type { Budget } from '../types'
import './BudgetVisualization.css'

interface BudgetVisualizationProps {
  budget: Budget
}

const BudgetVisualization: React.FC<BudgetVisualizationProps> = ({ budget }) => {
  const maxAmount = Math.max(...budget.categories.map(c => c.amount))

  return (
    <div className="budget-visualization">
      <h3>Budget Breakdown</h3>
      <div className="categories">
        {budget.categories.map((category, index) => (
          <div key={index} className="category-row">
            <div className="category-info">
              <span className="category-name">{category.name}</span>
              <span className="category-amount">${Math.round(category.amount).toLocaleString()}</span>
            </div>
            <div className="category-bar-container">
              <div 
                className="category-bar"
                style={{ 
                  width: `${(category.amount / maxAmount) * 100}%`,
                  backgroundColor: category.isEssential ? '#3498db' : '#95a5a6'
                }}
              >
                <span className="category-percentage">{category.percentage}%</span>
              </div>
            </div>
            {category.description && (
              <p className="category-description">{category.description}</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="budget-summary-visual">
        <div className="summary-item">
          <div className="pie-chart">
            <svg viewBox="0 0 42 42" width="120" height="120">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ecf0f1" strokeWidth="3"/>
              <circle 
                cx="21" 
                cy="21" 
                r="15.915" 
                fill="transparent" 
                stroke="#27ae60" 
                strokeWidth="3"
                strokeDasharray={`${budget.savingsRate} ${100 - budget.savingsRate}`}
                strokeDashoffset="25"
                transform="rotate(-90 21 21)"
              />
              <text x="21" y="21" textAnchor="middle" dy=".3em" fontSize="8" fill="#2c3e50">
                {Math.round(budget.savingsRate)}%
              </text>
            </svg>
            <p>Savings Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BudgetVisualization