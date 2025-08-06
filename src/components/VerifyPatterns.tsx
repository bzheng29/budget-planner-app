import React, { useState } from 'react';
import type { ExpenseMetadata } from '../services/expenseParserService';
import './VerifyPatterns.css';

interface VerifyPatternsProps {
  metadata: ExpenseMetadata;
  onNext: (data: any) => void;
  onBack?: () => void;
  currentData: any;
}

export const VerifyPatterns: React.FC<VerifyPatternsProps> = ({ metadata, onNext, onBack, currentData }) => {
  const [verifiedData, setVerifiedData] = useState({
    hasKids: metadata.insights.hasKids,
    hasDebt: metadata.insights.hasDebt,
    transportMode: metadata.insights.transportMode,
    diningFrequency: metadata.insights.diningOutFrequency,
    location: currentData.location || metadata.insights.location || ''
  });

  const handleChange = (key: string, value: any) => {
    setVerifiedData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onNext(verifiedData);
  };

  return (
    <div className="verify-patterns">
      <div className="verify-header">
        <h2>让我们确认一下发现的信息</h2>
        <p>我们根据您的消费做了一些智能推测，请确认：</p>
      </div>

      <div className="verification-cards">
        <div className="verify-card">
          <div className="verify-question">
            <span className="question-icon">👨‍👩‍👧‍👦</span>
            <span className="question-text">您有孩子吗？</span>
          </div>
          {metadata.insights.hasKids && (
            <p className="detection-hint">
              我们注意到可能的家庭相关支出
            </p>
          )}
          <div className="verify-options">
            <button
              className={`option-btn ${verifiedData.hasKids ? 'selected' : ''}`}
              onClick={() => handleChange('hasKids', true)}
            >
              有
            </button>
            <button
              className={`option-btn ${!verifiedData.hasKids ? 'selected' : ''}`}
              onClick={() => handleChange('hasKids', false)}
            >
              没有
            </button>
          </div>
        </div>

        <div className="verify-card">
          <div className="verify-question">
            <span className="question-icon">💳</span>
            <span className="question-text">您有贷款或债务吗？</span>
          </div>
          {metadata.insights.hasDebt && metadata.recurringExpenses.length > 0 && (
            <div className="ai-detected-debt">
              <p className="detection-hint">
                🤖 我发现了这些可能的还款：
              </p>
              <div className="detected-debt-list">
                {metadata.recurringExpenses
                  .filter(exp => 
                    exp.description?.toLowerCase().includes('loan') ||
                    exp.description?.toLowerCase().includes('贷款') ||
                    exp.description?.toLowerCase().includes('信用') ||
                    exp.description?.toLowerCase().includes('还款') ||
                    exp.amount > 1000
                  )
                  .slice(0, 3)
                  .map((debt, index) => (
                    <div key={index} className="detected-debt-item">
                      <span className="debt-desc">{debt.description || '固定还款'}</span>
                      <span className="debt-amount">¥{Math.round(debt.amount)}/月</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          <div className="verify-options">
            <button
              className={`option-btn ${verifiedData.hasDebt ? 'selected' : ''}`}
              onClick={() => handleChange('hasDebt', true)}
            >
              有
            </button>
            <button
              className={`option-btn ${!verifiedData.hasDebt ? 'selected' : ''}`}
              onClick={() => handleChange('hasDebt', false)}
            >
              没有
            </button>
          </div>
        </div>

        <div className="verify-card">
          <div className="verify-question">
            <span className="question-icon">🚗</span>
            <span className="question-text">您的主要出行方式？</span>
          </div>
          <div className="verify-options triple">
            <button
              className={`option-btn ${verifiedData.transportMode === 'public' ? 'selected' : ''}`}
              onClick={() => handleChange('transportMode', 'public')}
            >
              公共交通
            </button>
            <button
              className={`option-btn ${verifiedData.transportMode === 'car' ? 'selected' : ''}`}
              onClick={() => handleChange('transportMode', 'car')}
            >
              私家车
            </button>
            <button
              className={`option-btn ${verifiedData.transportMode === 'mixed' ? 'selected' : ''}`}
              onClick={() => handleChange('transportMode', 'mixed')}
            >
              两者都有
            </button>
          </div>
        </div>

        <div className="verify-card">
          <div className="verify-question">
            <span className="question-icon">🍽️</span>
            <span className="question-text">您外出就餐的频率？</span>
          </div>
          <select 
            value={verifiedData.diningFrequency}
            onChange={(e) => handleChange('diningFrequency', e.target.value)}
            className="verify-select"
          >
            <option value="rarely">很少（主要在家做饭）</option>
            <option value="occasionally">偶尔（每周1-2次）</option>
            <option value="frequently">经常（每周3-5次）</option>
            <option value="very_frequently">非常频繁（几乎每天）</option>
          </select>
        </div>

        <div className="verify-card">
          <div className="verify-question">
            <span className="question-icon">📍</span>
            <span className="question-text">您居住在哪里？</span>
          </div>
          <input
            type="text"
            value={verifiedData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="城市或地区"
            className="verify-input"
          />
          {metadata.insights.location && (
            <p className="detection-hint">
              根据商户信息，可能是：{metadata.insights.location}
            </p>
          )}
        </div>
      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>返回</button>}
        <button 
          className="next-button"
          onClick={handleSubmit}
        >
          继续
        </button>
      </div>
    </div>
  );
};