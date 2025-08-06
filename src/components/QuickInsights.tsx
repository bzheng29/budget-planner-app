import React from 'react';
import type { ExpenseMetadata } from '../services/expenseParserService';
import './QuickInsights.css';

interface QuickInsightsProps {
  metadata: ExpenseMetadata;
  onNext: () => void;
  onBack?: () => void;
}

export const QuickInsights: React.FC<QuickInsightsProps> = ({ metadata, onNext, onBack }) => {
  const monthlySpend = Math.round(metadata.averageMonthlySpend);

  // Calculate total recurring expenses
  const totalRecurring = metadata.recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get personalized insight based on spending
  const getPersonalizedInsight = () => {
    if (metadata.insights.diningOutFrequency === 'very_frequently') {
      return { icon: '🍜', text: '您似乎是个美食爱好者！' };
    }
    if (metadata.insights.transportMode === 'car' && metadata.categoryBreakdown['Transportation'] > monthlySpend * 0.2) {
      return { icon: '🚗', text: '您的交通开支较高，可能需要优化' };
    }
    if (metadata.insights.subscriptionCount > 5) {
      return { icon: '📱', text: `发现了 ${metadata.insights.subscriptionCount} 个订阅服务` };
    }
    if (metadata.insights.hasDebt) {
      return { icon: '💳', text: '检测到贷款还款，我们会帮您优先处理' };
    }
    return { icon: '✨', text: '您的消费习惯很有规律' };
  };

  const personalizedInsight = getPersonalizedInsight();

  return (
    <div className="quick-insights">
      <div className="insights-intro">
        <h2>🎉 我发现了一些有趣的事情</h2>
      </div>

      {/* Key spending metric */}
      <div className="key-metrics">
        <div className="metric-card primary">
          <div className="metric-value">¥{monthlySpend.toLocaleString()}</div>
          <div className="metric-label">月均支出</div>
        </div>
      </div>

      {/* Detected Patterns - WOW Effect (only show most important) */}
      <div className="detected-patterns">
        {metadata.insights.hasDebt && (
          <div className="pattern-card debt-detected">
            <span className="pattern-icon">💳</span>
            <div className="pattern-content">
              <h4>检测到债务还款</h4>
              <p>稍后会询问详情</p>
            </div>
          </div>
        )}

        {metadata.recurringExpenses.length > 0 && (
          <div className="pattern-card recurring-detected">
            <span className="pattern-icon">🔄</span>
            <div className="pattern-content">
              <h4>{metadata.recurringExpenses.length} 项固定支出</h4>
              <p>¥{Math.round(totalRecurring).toLocaleString()}/月</p>
            </div>
          </div>
        )}
      </div>

      {/* Personalized insight badge */}
      <div className="personalized-insight">
        <span className="insight-icon">{personalizedInsight.icon}</span>
        <span className="insight-text">{personalizedInsight.text}</span>
      </div>

      <div className="what-next">
        <p>🎯 基于这些发现，我会为您定制专属预算方案</p>
      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>返回</button>}
        <button className="next-button primary" onClick={onNext}>
          继续 →
        </button>
      </div>
    </div>
  );
};