import React, { useState, useEffect } from 'react';
import type { QuickParseResult } from '../services/quickCsvParser';
import './EnhancedProcessingLoader.css';

interface EnhancedProcessingLoaderProps {
  fileName?: string;
  fileSize?: number;
  quickResults?: QuickParseResult | null;
  onQuickParse?: () => void;
}

export const EnhancedProcessingLoader: React.FC<EnhancedProcessingLoaderProps> = ({ 
  quickResults
}) => {
  const [phase, setPhase] = useState<'parsing' | 'analyzing'>('parsing');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    "💡 提示：支出数据越详细，预算建议越精准",
    "💡 提示：我们会自动检测您的订阅服务",
    "💡 提示：AI 会识别您的消费习惯和模式",
    "💡 提示：基于您的实际支出创建预算更有效",
    "💡 提示：我们会保护您的财务隐私"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    // Switch to analyzing phase after quick parse
    if (quickResults) {
      setTimeout(() => setPhase('analyzing'), 500);
    }
  }, [quickResults]);


  return (
    <div className="enhanced-processing-loader">
      {/* Quick Results Display */}
      {quickResults && (
        <div className="quick-results-card">
          <div className="quick-results-header">
            <span className="success-icon">✅</span>
            <h3>快速扫描完成！</h3>
          </div>
          
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="stat-value">{quickResults.transactionCount}</span>
              <span className="stat-label">笔交易</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">¥{Math.round(quickResults.totalAmount).toLocaleString()}</span>
              <span className="stat-label">总金额</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">¥{Math.round(quickResults.averageTransaction)}</span>
              <span className="stat-label">平均每笔</span>
            </div>
          </div>

          {quickResults.preview.length > 0 && (
            <div className="transaction-preview">
              <h4>交易预览</h4>
              <div className="preview-list">
                {quickResults.preview.map((tx, index) => (
                  <div key={index} className="preview-item">
                    <span className="preview-desc">{tx.description}</span>
                    <span className="preview-amount">¥{tx.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Phase */}
      <div className={`ai-analysis-section ${phase === 'analyzing' ? 'active' : ''}`}>
        <div className="ai-header">
          <div className="ai-badge">
            <span className="ai-icon">🤖</span>
            <span className="ai-text">Gemini AI</span>
          </div>
          <h3>深度分析中...</h3>
        </div>

        <div className="analysis-progress">
          <div className="progress-item active">
            <span className="progress-icon">🔄</span>
            <span className="progress-text">智能分类支出</span>
          </div>
          <div className="progress-item">
            <span className="progress-icon">⏳</span>
            <span className="progress-text">识别消费模式</span>
          </div>
          <div className="progress-item">
            <span className="progress-icon">⏳</span>
            <span className="progress-text">检测订阅服务</span>
          </div>
          <div className="progress-item">
            <span className="progress-icon">⏳</span>
            <span className="progress-text">生成个性化洞察</span>
          </div>
        </div>

        <div className="ai-thinking">
          <div className="thinking-animation">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p className="thinking-text">
            正在分析您的 {quickResults?.transactionCount || '...'} 笔交易
          </p>
        </div>

        <div className="time-estimate">
          <span className="time-icon">⏱️</span>
          <span className="time-text">
            预计还需 {Math.max(0, 20 - elapsedTime)} 秒
          </span>
        </div>
      </div>

      {/* Tips Carousel */}
      <div className="tips-section">
        <p className="tip-text">{tips[currentTip]}</p>
      </div>

      {/* Why AI Section */}
      {phase === 'analyzing' && (
        <div className="why-ai-section">
          <h4>为什么使用 AI 分析？</h4>
          <div className="ai-benefits">
            <div className="benefit">
              <span className="benefit-icon">🎯</span>
              <span className="benefit-text">精准分类每笔支出</span>
            </div>
            <div className="benefit">
              <span className="benefit-icon">🔍</span>
              <span className="benefit-text">发现隐藏的消费模式</span>
            </div>
            <div className="benefit">
              <span className="benefit-icon">💡</span>
              <span className="benefit-text">提供个性化建议</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};