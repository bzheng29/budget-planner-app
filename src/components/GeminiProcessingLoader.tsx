import React, { useState, useEffect } from 'react';
import './GeminiProcessingLoader.css';

interface GeminiProcessingLoaderProps {
  fileName?: string;
  fileSize?: number;
}

export const GeminiProcessingLoader: React.FC<GeminiProcessingLoaderProps> = ({ fileName, fileSize }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const stages = [
    { icon: '📂', text: '读取您的文件', duration: 3000 },
    { icon: '🚀', text: '发送至 Gemini AI', duration: 4000 },
    { icon: '🧠', text: 'AI 深度分析中', duration: 12000 },
    { icon: '📊', text: '智能分类每笔交易', duration: 8000 },
    { icon: '🎯', text: '识别消费模式', duration: 6000 },
    { icon: '✨', text: '生成个性化洞察', duration: 5000 }
  ];

  const loadingMessages = [
    "AI 需要时间来理解您的每一笔交易...",
    "正在分析您的消费习惯和模式...",
    "识别定期支出和订阅服务...",
    "检测您的生活方式特征...",
    "计算个性化的财务指标...",
    "快好了！正在生成专属于您的预算建议..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stageTimer = setTimeout(() => {
      if (currentStage < stages.length - 1) {
        setCurrentStage(prev => prev + 1);
      }
    }, stages[currentStage].duration);

    return () => clearTimeout(stageTimer);
  }, [currentStage]);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
    }, 5000);

    return () => clearInterval(messageTimer);
  }, []);

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const estimatedTime = fileSize && fileSize > 50000 ? '30-40' : '20-30';

  return (
    <div className="gemini-processing-loader">
      <div className="gemini-header">
        <div className="gemini-logo">
          <span className="gemini-icon">✨</span>
          <span className="gemini-text">Gemini AI</span>
        </div>
        <div className="processing-title">使用先进 AI 处理中</div>
      </div>

      <div className="file-info-card">
        <div className="file-icon">📄</div>
        <div className="file-details">
          <div className="file-name">{fileName || 'expense-file.csv'}</div>
          {fileSize && (
            <div className="file-meta">
              {formatFileSize(fileSize)} • 预计 {estimatedTime} 秒
            </div>
          )}
        </div>
      </div>

      <div className="processing-stages">
        {stages.map((stage, index) => (
          <div 
            key={index} 
            className={`stage-item ${
              index < currentStage ? 'completed' : 
              index === currentStage ? 'active' : 
              'pending'
            }`}
          >
            <div className="stage-icon-wrapper">
              <span className="stage-icon">{stage.icon}</span>
              {index < currentStage && (
                <span className="stage-check">✓</span>
              )}
            </div>
            <div className="stage-text">{stage.text}</div>
            {index === currentStage && (
              <div className="stage-progress">
                <div className="stage-progress-bar"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ai-thinking-animation">
        <div className="thinking-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      <div className="loading-message">
        <p className="message-text">{loadingMessages[currentMessage]}</p>
      </div>

      <div className="timer-display">
        <span className="timer-icon">⏱️</span>
        <span className="timer-text">已用时：{elapsedTime}秒</span>
      </div>

      <div className="why-slow-notice">
        <details>
          <summary>为什么需要这么长时间？</summary>
          <p>
            我们正在使用 Gemini AI 智能分析您文件中的每笔交易。
            与简单的 CSV 读取器不同，我们正在：
          </p>
          <ul>
            <li>自动分类支出</li>
            <li>检测定期订阅</li>
            <li>识别消费模式</li>
            <li>计算财务洞察</li>
            <li>估算您的生活方式和收入</li>
          </ul>
          <p>这种深度分析帮助我们为您创建真正个性化的预算！</p>
        </details>
      </div>
    </div>
  );
};