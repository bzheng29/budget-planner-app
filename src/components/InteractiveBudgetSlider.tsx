import React, { useState } from 'react'
import type { Budget, BudgetCategory } from '../types'
import './InteractiveBudgetSlider.css'

interface BudgetSliderProps {
  budget: Budget
  onUpdate: (categories: BudgetCategory[]) => void
}

const InteractiveBudgetSlider: React.FC<BudgetSliderProps> = ({ budget, onUpdate }) => {
  const [categories, setCategories] = useState(budget.categories)
  const [editMode, setEditMode] = useState(false)

  const handleSliderChange = (index: number, newPercentage: number) => {
    const newCategories = [...categories]
    const oldPercentage = newCategories[index].percentage
    const diff = newPercentage - oldPercentage
    
    // Update the changed category
    newCategories[index] = {
      ...newCategories[index],
      percentage: newPercentage,
      amount: (budget.income * newPercentage) / 100
    }
    
    // Distribute the difference among other non-essential categories
    const otherCategories = newCategories
      .map((cat, idx) => ({ cat, idx }))
      .filter(({ cat, idx }) => !cat.isEssential && idx !== index)
    
    if (otherCategories.length > 0) {
      const diffPerCategory = diff / otherCategories.length
      otherCategories.forEach(({ idx }) => {
        const newPct = Math.max(0, newCategories[idx].percentage - diffPerCategory)
        newCategories[idx] = {
          ...newCategories[idx],
          percentage: newPct,
          amount: (budget.income * newPct) / 100
        }
      })
    }
    
    setCategories(newCategories)
  }

  const handleSave = () => {
    onUpdate(categories)
    setEditMode(false)
  }

  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0)
  const savingsPercentage = 100 - totalPercentage

  return (
    <div className="budget-slider-container">
      <div className="slider-header">
        <h3>🎯 Adjust Your Budget</h3>
        <button 
          className="edit-toggle"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit'}
        </button>
      </div>
      
      <div className="categories-sliders">
        {categories.map((category, index) => (
          <div key={index} className="category-slider">
            <div className="slider-info">
              <span className="category-label">
                {category.name}
                {category.isEssential && <span className="essential-badge">Essential</span>}
              </span>
              <span className="category-value">
                ${Math.round(category.amount).toLocaleString()} ({category.percentage}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={category.isEssential ? 50 : 30}
              value={category.percentage}
              onChange={(e) => handleSliderChange(index, parseInt(e.target.value))}
              disabled={!editMode}
              className={`slider ${category.isEssential ? 'essential' : 'discretionary'}`}
            />
          </div>
        ))}
      </div>
      
      <div className="budget-summary-slider">
        <div className="summary-row">
          <span>Total Expenses</span>
          <span>{totalPercentage}%</span>
        </div>
        <div className="summary-row savings">
          <span>Savings</span>
          <span className={savingsPercentage < 10 ? 'warning' : 'good'}>
            {savingsPercentage}%
          </span>
        </div>
      </div>
      
      {editMode && (
        <div className="slider-actions">
          <button onClick={handleSave} className="save-button">
            Save Changes
          </button>
          <button onClick={() => setEditMode(false)} className="cancel-button">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default InteractiveBudgetSlider