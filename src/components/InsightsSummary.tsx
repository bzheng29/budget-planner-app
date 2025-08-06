import React, { useState } from 'react';
import type { ExpenseMetadata } from '../services/expenseParserService';
import './InsightsSummary.css';

interface InsightsSummaryProps {
  metadata: ExpenseMetadata;
  onConfirm: (verifiedData: any) => void;
  onBack?: () => void;
}

export const InsightsSummary: React.FC<InsightsSummaryProps> = ({ metadata, onConfirm, onBack }) => {
  const [verifiedInsights, setVerifiedInsights] = useState({
    hasKids: metadata.insights.hasKids,
    hasDebt: metadata.insights.hasDebt,
    transportMode: metadata.insights.transportMode,
    diningFrequency: metadata.insights.diningOutFrequency,
    subscriptionCount: metadata.insights.subscriptionCount,
    lifestyle: metadata.insights.lifestyle,
    location: metadata.insights.location || ''
  });


  const handleInsightChange = (key: string, value: any) => {
    setVerifiedInsights(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    onConfirm(verifiedInsights);
  };


  const getLifestyleLabel = (lifestyle: string) => {
    const labels: { [key: string]: string } = {
      'frugal': 'Frugal - Essential spending only',
      'moderate': 'Moderate - Balanced approach',
      'comfortable': 'Comfortable - Some luxuries',
      'luxury': 'Luxury - Premium choices'
    };
    return labels[lifestyle] || lifestyle;
  };

  const topCategories = Object.entries(metadata.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topMerchants = metadata.topMerchants.slice(0, 5);

  return (
    <div className="insights-summary">
      <div className="insights-header">
        <h2>🎯 We've Analyzed Your Spending!</h2>
        <p>Here's what we discovered about your financial lifestyle</p>
      </div>

      <div className="insights-wow-section">
        <div className="wow-stat">
          <div className="wow-number">${Math.round(metadata.totalExpenses).toLocaleString()}</div>
          <div className="wow-label">Total analyzed</div>
          <div className="wow-detail">
            {metadata.periodStart} to {metadata.periodEnd}
          </div>
        </div>

        <div className="wow-stat">
          <div className="wow-number">${Math.round(metadata.averageMonthlySpend).toLocaleString()}</div>
          <div className="wow-label">Monthly average</div>
          <div className="wow-detail">across all categories</div>
        </div>

        <div className="wow-stat">
          <div className="wow-number">{metadata.recurringExpenses.length}</div>
          <div className="wow-label">Recurring expenses</div>
          <div className="wow-detail">subscriptions & bills</div>
        </div>
      </div>

      <div className="spending-breakdown">
        <h3>💰 Your Top Spending Categories</h3>
        <div className="category-bars">
          {topCategories.map(([category, amount]) => {
            const percentage = (amount / metadata.totalExpenses) * 100;
            return (
              <div key={category} className="category-bar-item">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">${Math.round(amount).toLocaleString()}</span>
                </div>
                <div className="category-bar-container">
                  <div 
                    className="category-bar-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                  <span className="category-percentage">{percentage.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="merchant-insights">
        <h3>🛍️ Your Favorite Places</h3>
        <div className="merchant-list">
          {topMerchants.map((merchant, index) => (
            <div key={index} className="merchant-item">
              <div className="merchant-rank">#{index + 1}</div>
              <div className="merchant-details">
                <div className="merchant-name">{merchant.name}</div>
                <div className="merchant-stats">
                  {merchant.count} visits • ${Math.round(merchant.amount).toLocaleString()} total
                </div>
              </div>
              <div className="merchant-avg">
                ${Math.round(merchant.amount / merchant.count)}/visit
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lifestyle-verification">
        <h3>✨ Let's Verify What We Found</h3>
        <p className="verification-intro">
          We've made some educated guesses based on your spending. Please confirm or adjust:
        </p>

        <div className="verification-grid">
          <div className="verification-item">
            <label>🏠 Living Situation</label>
            <div className="verification-options">
              <button
                className={`verify-option ${verifiedInsights.hasKids ? 'selected' : ''}`}
                onClick={() => handleInsightChange('hasKids', true)}
              >
                Have Kids
              </button>
              <button
                className={`verify-option ${!verifiedInsights.hasKids ? 'selected' : ''}`}
                onClick={() => handleInsightChange('hasKids', false)}
              >
                No Kids
              </button>
            </div>
            {metadata.insights.hasKids && (
              <p className="detection-note">
                We detected possible family expenses (school, childcare, family restaurants)
              </p>
            )}
          </div>

          <div className="verification-item">
            <label>💳 Debt Payments</label>
            <div className="verification-options">
              <button
                className={`verify-option ${verifiedInsights.hasDebt ? 'selected' : ''}`}
                onClick={() => handleInsightChange('hasDebt', true)}
              >
                Have Debt
              </button>
              <button
                className={`verify-option ${!verifiedInsights.hasDebt ? 'selected' : ''}`}
                onClick={() => handleInsightChange('hasDebt', false)}
              >
                No Debt
              </button>
            </div>
            {metadata.insights.hasDebt && (
              <p className="detection-note">
                We found possible loan or credit card payments
              </p>
            )}
          </div>

          <div className="verification-item">
            <label>🚗 Transportation</label>
            <select 
              value={verifiedInsights.transportMode}
              onChange={(e) => handleInsightChange('transportMode', e.target.value)}
              className="verify-select"
            >
              <option value="public">Public Transit</option>
              <option value="car">Own a Car</option>
              <option value="mixed">Both</option>
            </select>
            <p className="detection-note">
              Based on your gas, parking, and transit expenses
            </p>
          </div>

          <div className="verification-item">
            <label>🍽️ Dining Out</label>
            <select 
              value={verifiedInsights.diningFrequency}
              onChange={(e) => handleInsightChange('diningFrequency', e.target.value)}
              className="verify-select"
            >
              <option value="rarely">Rarely (cook at home)</option>
              <option value="occasionally">Occasionally</option>
              <option value="frequently">Frequently</option>
              <option value="very_frequently">Very Frequently</option>
            </select>
            <p className="detection-note">
              We counted {metadata.topMerchants.filter(m => 
                m.name.toLowerCase().includes('restaurant') || 
                m.name.toLowerCase().includes('cafe')
              ).length} restaurants/cafes
            </p>
          </div>

          <div className="verification-item">
            <label>📺 Subscriptions</label>
            <input
              type="number"
              value={verifiedInsights.subscriptionCount}
              onChange={(e) => handleInsightChange('subscriptionCount', parseInt(e.target.value))}
              className="verify-input"
              min="0"
            />
            <p className="detection-note">
              We found {metadata.recurringExpenses.length} recurring charges
            </p>
          </div>

          <div className="verification-item">
            <label>📍 Location</label>
            <input
              type="text"
              value={verifiedInsights.location}
              onChange={(e) => handleInsightChange('location', e.target.value)}
              placeholder="Your city"
              className="verify-input"
            />
            {metadata.insights.location && (
              <p className="detection-note">
                Detected: {metadata.insights.location}
              </p>
            )}
          </div>
        </div>

        <div className="lifestyle-assessment">
          <h4>Your Spending Style: {getLifestyleLabel(verifiedInsights.lifestyle)}</h4>
          <div className="lifestyle-slider">
            <input
              type="range"
              min="0"
              max="3"
              value={['frugal', 'moderate', 'comfortable', 'luxury'].indexOf(verifiedInsights.lifestyle)}
              onChange={(e) => {
                const styles = ['frugal', 'moderate', 'comfortable', 'luxury'];
                handleInsightChange('lifestyle', styles[parseInt(e.target.value)]);
              }}
              className="lifestyle-range"
            />
            <div className="lifestyle-labels">
              <span>Frugal</span>
              <span>Moderate</span>
              <span>Comfortable</span>
              <span>Luxury</span>
            </div>
          </div>
        </div>
      </div>

      <div className="missing-data-notice">
        {metadata.missingData.length > 0 && (
          <>
            <h4>📝 We'll Ask About:</h4>
            <ul>
              {metadata.missingData.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>Back</button>}
        <button className="next-button primary" onClick={handleConfirm}>
          Looks Good! Continue →
        </button>
      </div>
    </div>
  );
};