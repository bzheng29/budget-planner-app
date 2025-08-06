import React from 'react';
import type { Budget, UserProfile } from '../types';
import BudgetVisualization from './BudgetVisualization';
import { analyzeBudgetHealth } from '../utils/budgetCalculator';
import './BudgetResults.css';

interface BudgetResultsProps {
  budget: Budget;
  userProfile: UserProfile;
  reasoning: string;
  onEdit?: () => void;
}

const BudgetResults: React.FC<BudgetResultsProps> = ({ budget, userProfile, reasoning, onEdit }) => {
  const { score, recommendations } = analyzeBudgetHealth(budget);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#48bb78';
    if (score >= 60) return '#f6ad55';
    return '#fc8181';
  };

  return (
    <div className="budget-results-container">
      <div className="results-header">
        <div className="results-title">
          <h1>Your Personalized Budget is Ready! 🎉</h1>
          <p>Hi {userProfile.name}, here's your AI-optimized budget based on your unique situation</p>
        </div>
      </div>

      <div className="results-grid">
        <div className="results-main">
          <div className="budget-overview">
            <h2>Monthly Budget Overview</h2>
            <div className="overview-stats">
              <div className="stat-card">
                <span className="stat-label">Monthly Income</span>
                <span className="stat-value">¥{budget.income.toLocaleString()}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Expenses</span>
                <span className="stat-value">¥{Math.round(budget.totalExpenses).toLocaleString()}</span>
              </div>
              <div className="stat-card highlight">
                <span className="stat-label">Monthly Savings</span>
                <span className="stat-value">¥{Math.round(budget.savings).toLocaleString()}</span>
                <span className="stat-percent">{Math.round(budget.savingsRate)}%</span>
              </div>
            </div>
          </div>

          <div className="budget-visualization-section">
            <h2>Spending Breakdown</h2>
            <BudgetVisualization budget={budget} />
          </div>

          <div className="category-details">
            <h2>Category Details</h2>
            <div className="category-list">
              {budget.categories.map((category) => (
                <div key={category.name} className="category-item">
                  <div className="category-header">
                    <span className="category-name">{category.name}</span>
                    <span className="category-amount">¥{Math.round(category.amount).toLocaleString()}</span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-fill"
                      style={{ 
                        width: `${category.percentage}%`,
                        background: category.isEssential ? '#667eea' : '#a78bfa'
                      }}
                    />
                  </div>
                  <div className="category-footer">
                    <span className="category-percentage">{category.percentage}% of income</span>
                    {category.description && (
                      <span className="category-description">{category.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="results-sidebar">
          <div className="budget-health">
            <h3>Budget Health Score</h3>
            <div className="health-score-circle">
              <svg viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={getHealthColor(score)}
                  strokeWidth="20"
                  strokeDasharray={`${(score / 100) * 565.48} 565.48`}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="score-text">
                <span className="score-number">{score}</span>
                <span className="score-label">out of 100</span>
              </div>
            </div>
          </div>

          <div className="ai-insights">
            <h3>AI Insights</h3>
            <div className="insight-content">
              <p>{reasoning}</p>
            </div>
          </div>

          <div className="recommendations">
            <h3>Recommendations</h3>
            <ul className="recommendation-list">
              {recommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">
                  <span className="rec-icon">💡</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="action-buttons">
            <button className="download-button">
              <span>📥</span> Download Budget
            </button>
            <button className="share-button">
              <span>🔗</span> Share Results
            </button>
            {onEdit && (
              <button className="edit-button" onClick={onEdit}>
                <span>✏️</span> Adjust Budget
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="next-steps">
        <h2>Next Steps</h2>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-icon">📱</span>
            <h4>Track Your Spending</h4>
            <p>Connect your bank accounts to automatically track expenses</p>
            <button className="step-action">Get Started</button>
          </div>
          <div className="step-card">
            <span className="step-icon">🎯</span>
            <h4>Set Savings Goals</h4>
            <p>Create specific goals and track your progress</p>
            <button className="step-action">Create Goal</button>
          </div>
          <div className="step-card">
            <span className="step-icon">📊</span>
            <h4>Monthly Reviews</h4>
            <p>Schedule monthly check-ins to adjust your budget</p>
            <button className="step-action">Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetResults;