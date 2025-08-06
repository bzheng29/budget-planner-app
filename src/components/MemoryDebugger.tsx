import React, { useState, useEffect } from 'react';
import type { UserMemoryProfile } from '../types/memory';
import { MemoryService } from '../services/memoryService';
import './MemoryDebugger.css';

interface MemoryDebuggerProps {
  memory?: UserMemoryProfile;
  onGenerateTestData?: () => void;
}

// Helper function to format currency to CNY
const formatCNY = (amount: number) => {
  return `¥${(amount * 7).toLocaleString('zh-CN')}`;
};

// Life stage translations
const lifeStageMap: { [key: string]: string } = {
  'student': '学生',
  'early-career': '职业早期',
  'mid-career': '职业中期',
  'family': '家庭阶段',
  'pre-retirement': '退休前',
  'retired': '已退休'
};

// Home ownership translations
const homeOwnershipMap: { [key: string]: string } = {
  'rent': '租房',
  'own': '自有',
  'family': '家庭住房',
  'other': '其他'
};

// Transport mode translations
const transportMap: { [key: string]: string } = {
  'public': '公共交通',
  'car': '私家车',
  'mixed': '混合',
  'bike': '自行车',
  'walk': '步行'
};

// Income source translations
const incomeSourceMap: { [key: string]: string } = {
  'salary': '工资',
  'business': '生意',
  'mixed': '混合',
  'retirement': '退休金',
  'other': '其他'
};

// Income stability translations
const stabilityMap: { [key: string]: string } = {
  'stable': '稳定',
  'variable': '浮动',
  'seasonal': '季节性'
};

// Confidence level translations
const confidenceMap: { [key: string]: string } = {
  'low': '低',
  'medium': '中',
  'high': '高'
};

// Spending personality translations
const personalityMap: { [key: string]: string } = {
  'frugal': '节俭型',
  'balanced': '平衡型',
  'generous': '慷慨型',
  'impulsive': '冲动型'
};

// Dining frequency translations
const diningMap: { [key: string]: string } = {
  'rarely': '很少',
  'occasionally': '偶尔',
  'frequently': '经常',
  'very_frequently': '非常频繁'
};

// Shopping behavior translations
const shoppingMap: { [key: string]: string } = {
  'necessity': '必需品',
  'occasional': '偶尔购物',
  'frequent': '频繁购物',
  'luxury': '奢侈品'
};

// Risk tolerance translations
const riskMap: { [key: string]: string } = {
  'conservative': '保守',
  'moderate': '适中',
  'aggressive': '激进'
};

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
  }, [propMemory, memoryService]);

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
          <h3>未加载内存配置文件</h3>
          <p>上传支出数据或生成测试场景以查看AI记忆洞察</p>
          <button onClick={handleGenerateTestScenarios} className="generate-btn">
            生成测试场景
          </button>
          {testScenarios.length > 0 && (
            <div className="test-scenarios">
              <h4>选择测试场景：</h4>
              {testScenarios.map((scenario, index) => (
                <button 
                  key={index} 
                  onClick={() => handleSelectScenario(index)}
                  className="scenario-btn"
                >
                  {lifeStageMap[scenario.identity.lifeStage] || scenario.identity.lifeStage} - {formatCNY(scenario.financial.monthlyIncome)}/月
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
      <h3>用户画像概览</h3>
      <div className="overview-grid">
        <div className="overview-card">
          <h4>身份信息</h4>
          <p><strong>用户ID：</strong> {memory.identity.userId}</p>
          <p><strong>姓名：</strong> {memory.identity.name || '未知'}</p>
          <p><strong>位置：</strong> {memory.identity.location || '未知'}</p>
          <p><strong>人生阶段：</strong> {lifeStageMap[memory.identity.lifeStage] || memory.identity.lifeStage}</p>
          <p><strong>家庭人数：</strong> {memory.identity.familySize}</p>
        </div>
        
        <div className="overview-card">
          <h4>财务快照</h4>
          <p><strong>月收入：</strong> {formatCNY(memory.financial.monthlyIncome)}</p>
          <p><strong>平均月支出：</strong> {formatCNY(memory.spending.averageMonthlySpend)}</p>
          <p><strong>储蓄率：</strong> {Math.round((1 - memory.spending.averageMonthlySpend / memory.financial.monthlyIncome) * 100)}%</p>
          <p><strong>应急基金：</strong> {memory.financial.emergencyFundMonths} 个月</p>
        </div>
        
        <div className="overview-card">
          <h4>生活方式</h4>
          <p><strong>有孩子：</strong> {memory.lifestyle.hasKids ? '是' : '否'}</p>
          <p><strong>有车：</strong> {memory.lifestyle.hasVehicle ? '是' : '否'}</p>
          <p><strong>住房：</strong> {homeOwnershipMap[memory.lifestyle.homeOwnership] || memory.lifestyle.homeOwnership}</p>
          <p><strong>交通：</strong> {transportMap[memory.lifestyle.transportMode] || memory.lifestyle.transportMode}</p>
        </div>
        
        <div className="overview-card">
          <h4>数据质量</h4>
          <p><strong>完整度：</strong> {memory.dataQuality.completenessScore}%</p>
          <p><strong>置信度：</strong> {confidenceMap[memory.dataQuality.confidenceLevel] || memory.dataQuality.confidenceLevel}</p>
          <p><strong>数据跨度：</strong> {memory.dataQuality.dataTimeSpan.toFixed(1)} 个月</p>
          <p><strong>异常值：</strong> {memory.dataQuality.anomalies.length} 个</p>
        </div>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="memory-section">
      <h3>财务详情</h3>
      <div className="financial-details">
        <div className="detail-row">
          <span>月收入：</span>
          <span>{formatCNY(memory.financial.monthlyIncome)}</span>
        </div>
        <div className="detail-row">
          <span>收入来源：</span>
          <span>{incomeSourceMap[memory.financial.incomeSource] || memory.financial.incomeSource}</span>
        </div>
        <div className="detail-row">
          <span>收入稳定性：</span>
          <span>{stabilityMap[memory.financial.incomeStability] || memory.financial.incomeStability}</span>
        </div>
        {memory.financial.totalAssets && (
          <div className="detail-row">
            <span>总资产：</span>
            <span>{formatCNY(memory.financial.totalAssets)}</span>
          </div>
        )}
        {memory.financial.totalDebt !== undefined && (
          <div className="detail-row">
            <span>总负债：</span>
            <span>{formatCNY(memory.financial.totalDebt)}</span>
          </div>
        )}
        <div className="detail-row">
          <span>应急基金：</span>
          <span>{memory.financial.emergencyFundMonths} 个月</span>
        </div>
        {memory.financial.netWorth !== undefined && (
          <div className="detail-row">
            <span>净资产：</span>
            <span className={memory.financial.netWorth >= 0 ? 'positive' : 'negative'}>
              {formatCNY(memory.financial.netWorth)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const categoryTranslations: { [key: string]: string } = {
    'housing': '住房',
    'food': '餐饮',
    'transportation': '交通',
    'entertainment': '娱乐',
    'healthcare': '医疗',
    'insurance': '保险',
    'utilities': '水电费',
    'shopping': '购物',
    'education': '教育',
    'childcare': '育儿',
    'debtPayments': '债务还款',
    'other': '其他'
  };

  const renderSpending = () => (
    <div className="memory-section">
      <h3>支出分析</h3>
      <div className="spending-analysis">
        <h4>月度类别明细</h4>
        <div className="category-breakdown">
          {Object.entries(memory.spending.categoryBreakdown).map(([category, amount]) => {
            if (amount === undefined) return null;
            const percentage = (amount / memory.spending.averageMonthlySpend * 100).toFixed(1);
            return (
              <div key={category} className="category-row">
                <span className="category-name">{categoryTranslations[category] || category}：</span>
                <div className="category-bar">
                  <div 
                    className="category-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="category-amount">{formatCNY(amount)} ({percentage}%)</span>
              </div>
            );
          })}
        </div>
        
        <h4>支出指标</h4>
        <div className="metrics-grid">
          <div className="metric">
            <span>趋势：</span>
            <span className={`trend-${memory.spending.spendingTrend}`}>
              {memory.spending.spendingTrend === 'increasing' ? '上升' : 
               memory.spending.spendingTrend === 'stable' ? '稳定' : '下降'}
            </span>
          </div>
          <div className="metric">
            <span>主要商家：</span>
            <span>{memory.spending.topMerchants.length} 个</span>
          </div>
          <div className="metric">
            <span>定期支出：</span>
            <span>{memory.spending.recurringExpenses.length} 项</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBehavior = () => (
    <div className="memory-section">
      <h3>行为洞察</h3>
      <div className="behavior-insights">
        <div className="insight-grid">
          <div className="insight">
            <h4>消费性格</h4>
            <span className={`personality-${memory.behavior.spendingPersonality}`}>
              {personalityMap[memory.behavior.spendingPersonality] || memory.behavior.spendingPersonality}
            </span>
          </div>
          <div className="insight">
            <h4>外出就餐</h4>
            <span>{diningMap[memory.behavior.diningOutFrequency] || memory.behavior.diningOutFrequency}</span>
          </div>
          <div className="insight">
            <h4>购物行为</h4>
            <span>{shoppingMap[memory.behavior.shoppingBehavior] || memory.behavior.shoppingBehavior}</span>
          </div>
          <div className="insight">
            <h4>订阅服务</h4>
            <span>{memory.behavior.subscriptionCount} 个</span>
          </div>
          <div className="insight">
            <h4>冲动消费指数</h4>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${memory.behavior.impulseSpendingScore}%` }}
              />
            </div>
            <span>{memory.behavior.impulseSpendingScore}/100</span>
          </div>
          <div className="insight">
            <h4>预算遵守度</h4>
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
      <h3>财务目标</h3>
      <div className="goals-section">
        <div className="goal-targets">
          <h4>储蓄目标</h4>
          <p><strong>月度目标：</strong> {formatCNY(memory.goals.savingsTargetMonthly)}</p>
          <p><strong>目标比例：</strong> {memory.goals.savingsTargetPercentage}%</p>
          <p><strong>风险承受度：</strong> {riskMap[memory.goals.riskTolerance] || memory.goals.riskTolerance}</p>
        </div>
        
        {memory.goals.primaryGoals.length > 0 && (
          <div className="primary-goals">
            <h4>主要目标</h4>
            {memory.goals.primaryGoals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <span className={`goal-type ${goal.type}`}>
                    {goal.type === 'savings' ? '储蓄' :
                     goal.type === 'debt' ? '债务' :
                     goal.type === 'investment' ? '投资' :
                     goal.type === 'purchase' ? '购买' :
                     goal.type === 'retirement' ? '退休' :
                     goal.type === 'emergency' ? '应急' :
                     goal.type === 'education' ? '教育' : goal.type}
                  </span>
                  <span className={`priority-${goal.priority}`}>
                    {goal.priority === 'low' ? '低' :
                     goal.priority === 'medium' ? '中' :
                     goal.priority === 'high' ? '高' : '紧急'}
                  </span>
                </div>
                <p>{goal.description}</p>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(goal.currentProgress / goal.targetAmount * 100)}%` }}
                    />
                  </div>
                  <span>{formatCNY(goal.currentProgress)} / {formatCNY(goal.targetAmount)}</span>
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
      <h3>原始内存数据 (JSON)</h3>
      <pre className="raw-json">
        {JSON.stringify(memory, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="memory-debugger">
      <div className="debugger-header">
        <h2>AI 记忆系统调试器</h2>
        <div className="header-actions">
          <button onClick={handleGenerateTestScenarios} className="generate-btn">
            生成测试场景
          </button>
          {onGenerateTestData && (
            <button onClick={onGenerateTestData} className="generate-btn">
              生成测试数据
            </button>
          )}
        </div>
      </div>
      
      <div className="debugger-tabs">
        <button 
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          概览
        </button>
        <button 
          className={selectedTab === 'financial' ? 'active' : ''}
          onClick={() => setSelectedTab('financial')}
        >
          财务
        </button>
        <button 
          className={selectedTab === 'spending' ? 'active' : ''}
          onClick={() => setSelectedTab('spending')}
        >
          支出
        </button>
        <button 
          className={selectedTab === 'behavior' ? 'active' : ''}
          onClick={() => setSelectedTab('behavior')}
        >
          行为
        </button>
        <button 
          className={selectedTab === 'goals' ? 'active' : ''}
          onClick={() => setSelectedTab('goals')}
        >
          目标
        </button>
        <button 
          className={selectedTab === 'raw' ? 'active' : ''}
          onClick={() => setSelectedTab('raw')}
        >
          原始数据
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
          <h3>测试场景</h3>
          <div className="scenarios-list">
            {testScenarios.map((scenario, index) => (
              <button 
                key={index} 
                onClick={() => handleSelectScenario(index)}
                className={`scenario-btn ${selectedScenario === index ? 'active' : ''}`}
              >
                <strong>{lifeStageMap[scenario.identity.lifeStage] || scenario.identity.lifeStage}</strong>
                <span>{formatCNY(scenario.financial.monthlyIncome)}/月</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};