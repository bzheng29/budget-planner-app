import React, { useState, useEffect } from 'react';
import type { UserMemoryProfile } from '../types/memory';
import { MemoryService } from '../services/memoryService';
import './MemoryDebugger.css';

interface MemoryDebuggerProps {
  memory?: UserMemoryProfile;
  onGenerateTestData?: () => void;
}

export const MemoryDebugger: React.FC<MemoryDebuggerProps> = ({ memory: propMemory, onGenerateTestData }) => {
  const [memory, setMemory] = useState<UserMemoryProfile | undefined>(propMemory);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'financial' | 'spending' | 'behavior' | 'goals' | 'raw'>('overview');
  const [testScenarios, setTestScenarios] = useState<UserMemoryProfile[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<number>(-1);
  
  const memoryService = React.useMemo(() => new MemoryService(), []);

  useEffect(() => {
    if (propMemory) {
      setMemory(propMemory);
    } else {
      // Load from local storage if available
      const stored = memoryService.getMemory('default');
      if (stored) {
        setMemory(stored);
      }
    }
  }, [propMemory]);

  const handleGenerateTestScenarios = () => {
    const scenarios = memoryService.generateTestScenarios();
    setTestScenarios(scenarios);
  };

  const handleSelectScenario = (index: number) => {
    setSelectedScenario(index);
    setMemory(testScenarios[index]);
  };

  if (!memory) {
    return (
      <div className="memory-debugger">
        <div className="no-memory">
          <h3>No Memory Profile Loaded</h3>
          <p>Upload expense data or generate test scenarios to see memory insights</p>
          <button onClick={handleGenerateTestScenarios} className="generate-btn">
            Generate Test Scenarios
          </button>
          {testScenarios.length > 0 && (
            <div className="test-scenarios">
              <h4>Select a Test Scenario:</h4>
              {testScenarios.map((scenario, index) => (
                <button 
                  key={index} 
                  onClick={() => handleSelectScenario(index)}
                  className="scenario-btn"
                >
                  {scenario.identity.lifeStage} - ${scenario.financial.monthlyIncome}/mo
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="memory-section">
      <h3>User Profile Overview</h3>
      <div className="overview-grid">
        <div className="overview-card">
          <h4>Identity</h4>
          <p><strong>User ID:</strong> {memory.identity.userId}</p>
          <p><strong>Name:</strong> {memory.identity.name || 'Unknown'}</p>
          <p><strong>Location:</strong> {memory.identity.location || 'Unknown'}</p>
          <p><strong>Life Stage:</strong> {memory.identity.lifeStage}</p>
          <p><strong>Family Size:</strong> {memory.identity.familySize}</p>
        </div>
        
        <div className="overview-card">
          <h4>Financial Snapshot</h4>
          <p><strong>Monthly Income:</strong> ${memory.financial.monthlyIncome.toLocaleString()}</p>
          <p><strong>Avg Monthly Spend:</strong> ${memory.spending.averageMonthlySpend.toLocaleString()}</p>
          <p><strong>Savings Rate:</strong> {Math.round((1 - memory.spending.averageMonthlySpend / memory.financial.monthlyIncome) * 100)}%</p>
          <p><strong>Emergency Fund:</strong> {memory.financial.emergencyFundMonths} months</p>
        </div>
        
        <div className="overview-card">
          <h4>Lifestyle</h4>
          <p><strong>Has Kids:</strong> {memory.lifestyle.hasKids ? 'Yes' : 'No'}</p>
          <p><strong>Has Vehicle:</strong> {memory.lifestyle.hasVehicle ? 'Yes' : 'No'}</p>
          <p><strong>Home:</strong> {memory.lifestyle.homeOwnership}</p>
          <p><strong>Transport:</strong> {memory.lifestyle.transportMode}</p>
        </div>
        
        <div className="overview-card">
          <h4>Data Quality</h4>
          <p><strong>Completeness:</strong> {memory.dataQuality.completenessScore}%</p>
          <p><strong>Confidence:</strong> {memory.dataQuality.confidenceLevel}</p>
          <p><strong>Data Span:</strong> {memory.dataQuality.dataTimeSpan.toFixed(1)} months</p>
          <p><strong>Anomalies:</strong> {memory.dataQuality.anomalies.length}</p>
        </div>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="memory-section">
      <h3>Financial Details</h3>
      <div className="financial-details">
        <div className="detail-row">
          <span>Monthly Income:</span>
          <span>${memory.financial.monthlyIncome.toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>Income Source:</span>
          <span>{memory.financial.incomeSource}</span>
        </div>
        <div className="detail-row">
          <span>Income Stability:</span>
          <span>{memory.financial.incomeStability}</span>
        </div>
        {memory.financial.totalAssets && (
          <div className="detail-row">
            <span>Total Assets:</span>
            <span>${memory.financial.totalAssets.toLocaleString()}</span>
          </div>
        )}
        {memory.financial.totalDebt !== undefined && (
          <div className="detail-row">
            <span>Total Debt:</span>
            <span>${memory.financial.totalDebt.toLocaleString()}</span>
          </div>
        )}
        <div className="detail-row">
          <span>Emergency Fund:</span>
          <span>{memory.financial.emergencyFundMonths} months</span>
        </div>
        {memory.financial.netWorth !== undefined && (
          <div className="detail-row">
            <span>Net Worth:</span>
            <span className={memory.financial.netWorth >= 0 ? 'positive' : 'negative'}>
              ${memory.financial.netWorth.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderSpending = () => (
    <div className="memory-section">
      <h3>Spending Analysis</h3>
      <div className="spending-analysis">
        <h4>Monthly Category Breakdown</h4>
        <div className="category-breakdown">
          {Object.entries(memory.spending.categoryBreakdown).map(([category, amount]) => {
            if (amount === undefined) return null;
            const percentage = (amount / memory.spending.averageMonthlySpend * 100).toFixed(1);
            return (
              <div key={category} className="category-row">
                <span className="category-name">{category}:</span>
                <div className="category-bar">
                  <div 
                    className="category-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="category-amount">${amount.toFixed(0)} ({percentage}%)</span>
              </div>
            );
          })}
        </div>
        
        <h4>Spending Metrics</h4>
        <div className="metrics-grid">
          <div className="metric">
            <span>Trend:</span>
            <span className={`trend-${memory.spending.spendingTrend}`}>
              {memory.spending.spendingTrend}
            </span>
          </div>
          <div className="metric">
            <span>Top Merchants:</span>
            <span>{memory.spending.topMerchants.length}</span>
          </div>
          <div className="metric">
            <span>Recurring:</span>
            <span>{memory.spending.recurringExpenses.length} expenses</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBehavior = () => (
    <div className="memory-section">
      <h3>Behavioral Insights</h3>
      <div className="behavior-insights">
        <div className="insight-grid">
          <div className="insight">
            <h4>Spending Personality</h4>
            <span className={`personality-${memory.behavior.spendingPersonality}`}>
              {memory.behavior.spendingPersonality}
            </span>
          </div>
          <div className="insight">
            <h4>Dining Out</h4>
            <span>{memory.behavior.diningOutFrequency}</span>
          </div>
          <div className="insight">
            <h4>Shopping Behavior</h4>
            <span>{memory.behavior.shoppingBehavior}</span>
          </div>
          <div className="insight">
            <h4>Subscriptions</h4>
            <span>{memory.behavior.subscriptionCount} active</span>
          </div>
          <div className="insight">
            <h4>Impulse Score</h4>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${memory.behavior.impulseSpendingScore}%` }}
              />
            </div>
            <span>{memory.behavior.impulseSpendingScore}/100</span>
          </div>
          <div className="insight">
            <h4>Budget Adherence</h4>
            <div className="score-bar">
              <div 
                className="score-fill success" 
                style={{ width: `${memory.behavior.budgetAdherence}%` }}
              />
            </div>
            <span>{memory.behavior.budgetAdherence}/100</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="memory-section">
      <h3>Financial Goals</h3>
      <div className="goals-section">
        <div className="goal-targets">
          <h4>Savings Targets</h4>
          <p><strong>Monthly Target:</strong> ${memory.goals.savingsTargetMonthly.toLocaleString()}</p>
          <p><strong>Target Percentage:</strong> {memory.goals.savingsTargetPercentage}%</p>
          <p><strong>Risk Tolerance:</strong> {memory.goals.riskTolerance}</p>
        </div>
        
        {memory.goals.primaryGoals.length > 0 && (
          <div className="primary-goals">
            <h4>Primary Goals</h4>
            {memory.goals.primaryGoals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <span className={`goal-type ${goal.type}`}>{goal.type}</span>
                  <span className={`priority-${goal.priority}`}>{goal.priority}</span>
                </div>
                <p>{goal.description}</p>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(goal.currentProgress / goal.targetAmount * 100)}%` }}
                    />
                  </div>
                  <span>${goal.currentProgress.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRaw = () => (
    <div className="memory-section">
      <h3>Raw Memory Data (JSON)</h3>
      <pre className="raw-json">
        {JSON.stringify(memory, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="memory-debugger">
      <div className="debugger-header">
        <h2>AI Memory System Debugger</h2>
        <div className="header-actions">
          <button onClick={handleGenerateTestScenarios} className="generate-btn">
            Generate Test Scenarios
          </button>
          {onGenerateTestData && (
            <button onClick={onGenerateTestData} className="generate-btn">
              Generate Test Data
            </button>
          )}
        </div>
      </div>
      
      <div className="debugger-tabs">
        <button 
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button 
          className={selectedTab === 'financial' ? 'active' : ''}
          onClick={() => setSelectedTab('financial')}
        >
          Financial
        </button>
        <button 
          className={selectedTab === 'spending' ? 'active' : ''}
          onClick={() => setSelectedTab('spending')}
        >
          Spending
        </button>
        <button 
          className={selectedTab === 'behavior' ? 'active' : ''}
          onClick={() => setSelectedTab('behavior')}
        >
          Behavior
        </button>
        <button 
          className={selectedTab === 'goals' ? 'active' : ''}
          onClick={() => setSelectedTab('goals')}
        >
          Goals
        </button>
        <button 
          className={selectedTab === 'raw' ? 'active' : ''}
          onClick={() => setSelectedTab('raw')}
        >
          Raw Data
        </button>
      </div>
      
      <div className="debugger-content">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'financial' && renderFinancial()}
        {selectedTab === 'spending' && renderSpending()}
        {selectedTab === 'behavior' && renderBehavior()}
        {selectedTab === 'goals' && renderGoals()}
        {selectedTab === 'raw' && renderRaw()}
      </div>
      
      {testScenarios.length > 0 && (
        <div className="test-scenarios-panel">
          <h3>Test Scenarios</h3>
          <div className="scenarios-list">
            {testScenarios.map((scenario, index) => (
              <button 
                key={index} 
                onClick={() => handleSelectScenario(index)}
                className={`scenario-btn ${selectedScenario === index ? 'active' : ''}`}
              >
                <strong>{scenario.identity.lifeStage}</strong>
                <span>${scenario.financial.monthlyIncome}/mo</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};