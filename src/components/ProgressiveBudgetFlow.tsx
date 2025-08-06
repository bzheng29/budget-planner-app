import React, { useState, useEffect } from 'react';
import { ExpenseUpload } from './ExpenseUpload';
import { QuickInsights } from './QuickInsights';
import { VerifyPatterns } from './VerifyPatterns';
import { GeminiProcessingLoader } from './GeminiProcessingLoader';
import { ExpenseParserService, type ExpenseMetadata } from '../services/expenseParserService';
import { calculateAIBudget } from '../utils/aiBudgetCalculator';
import BudgetResults from './BudgetResults';
import type { UserProfile, Budget } from '../types';
import './ProgressiveBudgetFlow.css';

interface Step {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isOptional?: boolean;
  condition?: (data: UserProfile) => boolean;
}

interface StepComponentProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  currentData: UserProfile;
  expenseMetadata?: ExpenseMetadata;
}

const ProgressiveBudgetFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [expenseMetadata, setExpenseMetadata] = useState<ExpenseMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dynamicSteps, setDynamicSteps] = useState<Step[]>([]);
  const [finalBudget, setFinalBudget] = useState<Budget | null>(null);
  const [budgetReasoning, setBudgetReasoning] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [totalExpectedSteps, setTotalExpectedSteps] = useState(5); // Base expected steps
  
  const expenseParser = new ExpenseParserService(import.meta.env.VITE_GEMINI_API_KEY || '');

  // Initial steps - will be dynamically adjusted based on user data
  const baseSteps: Step[] = [
    {
      id: 'expense-upload',
      title: '上传支出',
      description: '导入您的消费数据以获得个性化洞察',
      component: ExpenseUploadStep
    },
    {
      id: 'quick-insights',
      title: '快速概览',
      description: '您的消费快照',
      component: QuickInsightsStep,
      condition: () => !!expenseMetadata
    },
    {
      id: 'verify-patterns',
      title: '验证信息',
      description: '确认我们的发现',
      component: VerifyPatternsStep,
      condition: () => !!expenseMetadata
    },
    {
      id: 'personal-info',
      title: '个人信息',
      description: '告诉我们关于您的信息',
      component: PersonalInfoStep
    },
    {
      id: 'income',
      title: '收入',
      description: '您的月收入',
      component: IncomeStep
    },
    {
      id: 'goals',
      title: '目标',
      description: '您的储蓄目标是什么？',
      component: GoalsStep
    },
    {
      id: 'lifestyle',
      title: '生活方式',
      description: '您的生活状况',
      component: LifestyleStep
    }
  ];

  useEffect(() => {
    // Dynamically adjust steps based on user data
    updateDynamicSteps();
  }, [userProfile, expenseMetadata]);

  const updateDynamicSteps = async () => {
    const steps = [...baseSteps];
    let additionalSteps = 0;
    
    // If user has expense data, we might skip or adjust certain steps
    if (expenseMetadata) {
      // Add debt step only if debt was detected
      if (expenseMetadata.insights.hasDebt || expenseMetadata.missingData.includes('debt information')) {
        steps.splice(4, 0, {
          id: 'debt',
          title: '债务',
          description: '月度债务还款',
          component: DebtStep
        });
        additionalSteps++;
      }
      
      // Add family step if multiple people detected in expenses
      if (expenseMetadata.insights.hasKids || 
          (expenseMetadata.categoryBreakdown['Food & Dining'] && 
           expenseMetadata.categoryBreakdown['Food & Dining'] > expenseMetadata.averageMonthlySpend * 0.3)) {
        steps.splice(3, 0, {
          id: 'family',
          title: '家庭',
          description: '家庭成员信息',
          component: FamilyStep
        });
        additionalSteps++;
      }
    }
    
    setDynamicSteps(steps);
    setTotalExpectedSteps(5 + additionalSteps); // Update total expected steps
  };

  const handleNext = (stepData: any) => {
    const updatedProfile = { ...userProfile, ...stepData };
    setUserProfile(updatedProfile);
    
    // Mark current step as completed
    if (dynamicSteps[currentStep]) {
      setCompletedStepIds(prev => new Set([...prev, dynamicSteps[currentStep].id]));
    }
    
    if (currentStep < dynamicSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - generate budget
      generateBudget(updatedProfile);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const { metadata, expenses } = await expenseParser.parseExpenseFile(file);
      setExpenseMetadata(metadata);
      
      // Update user profile with expense insights
      const updatedProfile = {
        ...userProfile,
        monthlySpending: metadata.averageMonthlySpend,
        expenseCategories: metadata.categoryBreakdown,
        income: metadata.insights.estimatedIncome,
        location: metadata.insights.location,
        expenses: expenses
      };
      setUserProfile(updatedProfile);
      
      // Move to next step
      handleNext({});
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateBudget = async (profile: UserProfile) => {
    setIsProcessing(true);
    try {
      const { budget, reasoning } = await calculateAIBudget(profile);
      setFinalBudget(budget);
      setBudgetReasoning(reasoning);
      setShowResults(true);
    } catch (error) {
      console.error('Error generating budget:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditBudget = () => {
    setShowResults(false);
    setCurrentStep(0);
  };

  // Calculate progress based on completed steps and total expected steps
  const calculateProgress = () => {
    // If we haven't loaded steps yet, show minimal progress
    if (dynamicSteps.length === 0) return 5;
    
    // Calculate based on completed steps + current step progress
    const completedCount = completedStepIds.size;
    const currentStepProgress = 0.5; // Assume current step is half done
    const totalProgress = completedCount + currentStepProgress;
    
    // Use total expected steps for smoother progress
    return Math.min(95, (totalProgress / totalExpectedSteps) * 100);
  };
  
  const progressPercentage = calculateProgress();

  if (dynamicSteps.length === 0) {
    return <div>Loading...</div>;
  }

  if (showResults && finalBudget) {
    return (
      <BudgetResults 
        budget={finalBudget}
        userProfile={userProfile}
        reasoning={budgetReasoning}
        onEdit={handleEditBudget}
      />
    );
  }

  if (isProcessing && currentStep === dynamicSteps.length - 1) {
    return (
      <div className="generating-budget-container">
        <div className="generating-content">
          <div className="generating-icon">🤖</div>
          <h2>Finn 正在创建您的个性化预算...</h2>
          <p>分析您的财务数据并优化分配</p>
          <div className="generating-spinner"></div>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = dynamicSteps[currentStep].component;

  return (
    <div className="progressive-flow-container">
      <div className="progress-header">
        <h1>与 Finn 一起制定您的预算</h1>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="progress-steps">
            {dynamicSteps.map((step, index) => {
              const isCompleted = completedStepIds.has(step.id);
              const isActive = index === currentStep;
              const isPending = index > currentStep;
              
              return (
                <div 
                  key={step.id}
                  className={`progress-step ${
                    isCompleted ? 'completed' : 
                    isActive ? 'active' : 
                    isPending ? 'pending' : ''
                  }`}
                  style={{
                    opacity: isPending ? 0.5 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="step-dot" />
                  <span className="step-label">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="step-content">
        <div className="step-header">
          <h2>{dynamicSteps[currentStep].title}</h2>
          <p>{dynamicSteps[currentStep].description}</p>
        </div>

        <CurrentStepComponent
          onNext={handleNext}
          onBack={currentStep > 0 ? handleBack : undefined}
          currentData={userProfile}
          expenseMetadata={expenseMetadata}
          onFileUpload={dynamicSteps[currentStep].id === 'expense-upload' ? handleFileUpload : undefined}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

// Step Components
const ExpenseUploadStep: React.FC<StepComponentProps & { onFileUpload?: (file: File) => void; isProcessing?: boolean }> = 
  ({ onNext, onFileUpload, isProcessing }) => {
  
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    if (onFileUpload) {
      onFileUpload(file);
    }
  };
  
  if (isProcessing && uploadedFile) {
    return (
      <GeminiProcessingLoader 
        fileName={uploadedFile.name}
        fileSize={uploadedFile.size}
      />
    );
  }
  
  return (
    <div className="step-expense-upload">
      {onFileUpload && (
        <ExpenseUpload 
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing || false}
        />
      )}
      <div className="step-actions">
        <button 
          className="skip-button"
          onClick={() => onNext({})}
        >
          跳过此步
        </button>
      </div>
    </div>
  );
};

const PersonalInfoStep: React.FC<StepComponentProps> = ({ onNext, onBack, currentData }) => {
  const [name, setName] = useState(currentData.name || '');
  const [age, setAge] = useState('');

  const handleSubmit = () => {
    onNext({ name, age });
  };

  return (
    <div className="step-form">
      <div className="form-group">
        <label>您的姓名是？</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入您的姓名"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>您的年龄段？</label>
        <div className="age-options">
          <button
            className={`age-option ${age === '18-25' ? 'selected' : ''}`}
            onClick={() => setAge('18-25')}
          >
            18-25岁
          </button>
          <button
            className={`age-option ${age === '26-35' ? 'selected' : ''}`}
            onClick={() => setAge('26-35')}
          >
            26-35岁
          </button>
          <button
            className={`age-option ${age === '36-45' ? 'selected' : ''}`}
            onClick={() => setAge('36-45')}
          >
            36-45岁
          </button>
          <button
            className={`age-option ${age === '46+' ? 'selected' : ''}`}
            onClick={() => setAge('46+')}
          >
            46岁以上
          </button>
        </div>
      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>返回</button>}
        <button 
          className="next-button"
          onClick={handleSubmit}
          disabled={!name || !age}
        >
          继续
        </button>
      </div>
    </div>
  );
};

const IncomeStep: React.FC<StepComponentProps> = ({ onNext, onBack, currentData, expenseMetadata }) => {
  const suggestedIncome = expenseMetadata?.insights.estimatedIncome || 0;
  const monthlySpend = expenseMetadata?.averageMonthlySpend || 0;
  
  const [income, setIncome] = useState(currentData.income || suggestedIncome || '');

  // Generate smart income suggestions based on spending
  const generateIncomeOptions = () => {
    if (!monthlySpend) return [3000, 5000, 7000, 10000];
    
    const base = Math.round(monthlySpend / 100) * 100;
    return [
      Math.round(base * 1.2),
      Math.round(base * 1.5),
      Math.round(base * 1.8),
      Math.round(base * 2.2)
    ];
  };

  const commonIncomes = generateIncomeOptions();

  const handleSubmit = () => {
    onNext({ income: Number(income) });
  };

  // Calculate current savings rate if income is entered
  const currentSavingsRate = income && monthlySpend 
    ? Math.max(0, Math.round(((Number(income) - monthlySpend) / Number(income)) * 100))
    : null;
  
  // Calculate what this income means
  const calculateIncomeBreakdown = () => {
    if (!income || !monthlySpend) return null;
    
    const incomeNum = Number(income);
    const afterExpenses = incomeNum - monthlySpend;
    const dailyDiscretionary = afterExpenses > 0 ? afterExpenses / 30 : 0;
    const yearlyPotentialSavings = afterExpenses > 0 ? afterExpenses * 12 : 0;
    
    return {
      afterExpenses,
      dailyDiscretionary,
      yearlyPotentialSavings,
      canSave: afterExpenses > 0,
      emergencyFundMonths: afterExpenses > 0 ? Math.floor((afterExpenses * 6) / monthlySpend) : 0
    };
  };
  
  const breakdown = calculateIncomeBreakdown();

  return (
    <div className="step-form">
      <div className="form-group">
        <label>您的月收入是多少？</label>
        
        {expenseMetadata && (
          <div className="expense-context">
            <div className="context-item">
              <span className="context-icon">💸</span>
              <div>
                <span className="context-label">您的平均支出</span>
                <span className="context-value">¥{monthlySpend.toLocaleString()}/月</span>
              </div>
            </div>
            {expenseMetadata.insights.lifestyle && (
              <div className="context-item">
                <span className="context-icon">✨</span>
                <div>
                  <span className="context-label">消费模式</span>
                  <span className="context-value">{
                    expenseMetadata.insights.lifestyle === 'frugal' ? '节俭' :
                    expenseMetadata.insights.lifestyle === 'moderate' ? '适度' :
                    expenseMetadata.insights.lifestyle === 'comfortable' ? '舒适' : '奢华'
                  }</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {suggestedIncome > 0 && (
          <div className="suggestion-box">
            <span className="suggestion-icon">🎯</span>
            <p>根据您的消费模式，我们估计您的收入约为 ¥{suggestedIncome.toLocaleString()}/月</p>
          </div>
        )}

        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="请输入月收入"
          className="form-input large"
        />

        {currentSavingsRate !== null && breakdown && (
          <div className="income-impact-visualization">
            <div className="live-calculation">
              {currentSavingsRate > 0 ? (
                <p className="positive">📈 {currentSavingsRate}% 储蓄率</p>
              ) : (
                <p className="warning">⚠️ 该收入可能无法覆盖所有支出</p>
              )}
            </div>
            
            {breakdown.canSave && (
              <div className="income-breakdown-cards">
                <div className="breakdown-card">
                  <span className="breakdown-icon">💰</span>
                  <div className="breakdown-details">
                    <span className="breakdown-label">每月储蓄潜力</span>
                    <span className="breakdown-value">¥{Math.round(breakdown.afterExpenses).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="breakdown-card">
                  <span className="breakdown-icon">☕</span>
                  <div className="breakdown-details">
                    <span className="breakdown-label">每日可支配</span>
                    <span className="breakdown-value">¥{Math.round(breakdown.dailyDiscretionary)}</span>
                    <span className="breakdown-hint">咖啡、午餐等</span>
                  </div>
                </div>
                
                <div className="breakdown-card">
                  <span className="breakdown-icon">🎯</span>
                  <div className="breakdown-details">
                    <span className="breakdown-label">年储蓄潜力</span>
                    <span className="breakdown-value">¥{Math.round(breakdown.yearlyPotentialSavings).toLocaleString()}</span>
                    <span className="breakdown-hint">如果全部储蓄</span>
                  </div>
                </div>
                
                <div className="breakdown-card">
                  <span className="breakdown-icon">🛡️</span>
                  <div className="breakdown-details">
                    <span className="breakdown-label">紧急储备金</span>
                    <span className="breakdown-value">{breakdown.emergencyFundMonths} 个月</span>
                    <span className="breakdown-hint">建立6个月储备金所需时间</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="quick-select">
          {commonIncomes.map(amount => (
            <button
              key={amount}
              className={`amount-button ${income === amount ? 'selected' : ''}`}
              onClick={() => setIncome(amount.toString())}
            >
              ¥{amount.toLocaleString()}
            </button>
          ))}
        </div>

      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>返回</button>}
        <button 
          className="next-button"
          onClick={handleSubmit}
          disabled={!income || Number(income) <= 0}
        >
          继续
        </button>
      </div>
    </div>
  );
};

const GoalsStep: React.FC<StepComponentProps> = ({ onNext, onBack, currentData, expenseMetadata }) => {
  // Calculate current actual savings rate if we have expense data
  const currentActualSavings = expenseMetadata && currentData.income
    ? Math.max(0, Math.round(((currentData.income - expenseMetadata.averageMonthlySpend) / currentData.income) * 100))
    : null;
  
  const [savingsGoal, setSavingsGoal] = useState(
    currentData.savingsGoal || currentActualSavings || expenseMetadata?.insights.savingsRate || 20
  );
  const [financialGoals, setFinancialGoals] = useState<string[]>(currentData.financialGoals || []);

  // Personalize goal options based on expense insights
  const getPersonalizedGoals = () => {
    const baseGoals = [
      { id: 'emergency', label: 'Build emergency fund', icon: '🛡️', priority: 1 },
      { id: 'house', label: 'Save for a house', icon: '🏠', priority: 2 },
      { id: 'retirement', label: 'Retirement savings', icon: '🏖️', priority: 3 },
      { id: 'debt', label: 'Pay off debt', icon: '💳', priority: expenseMetadata?.insights.hasDebt ? 0 : 4 },
      { id: 'vacation', label: 'Dream vacation', icon: '✈️', priority: 5 },
      { id: 'education', label: 'Education fund', icon: '🎓', priority: expenseMetadata?.insights.hasKids ? 1 : 6 },
      { id: 'car', label: 'New car', icon: '🚗', priority: expenseMetadata?.insights.transportMode === 'car' ? 2 : 7 },
      { id: 'wedding', label: 'Wedding', icon: '💍', priority: 8 }
    ];

    return baseGoals.sort((a, b) => a.priority - b.priority);
  };

  const goalOptions = getPersonalizedGoals();

  const toggleGoal = (goalId: string) => {
    setFinancialGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = () => {
    onNext({ savingsGoal, financialGoals });
  };

  // Calculate emergency fund status
  const monthsOfExpenses = expenseMetadata && currentData.income
    ? Math.round((currentData.income * savingsGoal / 100) / expenseMetadata.averageMonthlySpend * 12)
    : null;

  return (
    <div className="step-form">
      <div className="form-group">
        <label>How much would you like to save each month?</label>
        
        {currentActualSavings !== null && (
          <div className="current-savings-info">
            <span className="info-icon">📊</span>
            <p>You're currently saving about {currentActualSavings}% of your income</p>
          </div>
        )}
        
        <div className="savings-benchmarks">
          <h4>📊 储蓄率参考标准</h4>
          <div className="benchmark-grid">
            <div className={`benchmark-item ${savingsGoal <= 10 ? 'active' : ''}`}>
              <div className="benchmark-range">5-10%</div>
              <div className="benchmark-label">刚起步</div>
              <div className="benchmark-desc">适合刚开始工作或有债务的人</div>
            </div>
            <div className={`benchmark-item ${savingsGoal > 10 && savingsGoal <= 20 ? 'active' : ''}`}>
              <div className="benchmark-range">10-20%</div>
              <div className="benchmark-label">标准建议 ✓</div>
              <div className="benchmark-desc">大多数专家建议的储蓄率</div>
            </div>
            <div className={`benchmark-item ${savingsGoal > 20 && savingsGoal <= 30 ? 'active' : ''}`}>
              <div className="benchmark-range">20-30%</div>
              <div className="benchmark-label">积极储蓄</div>
              <div className="benchmark-desc">加速实现财务目标</div>
            </div>
            <div className={`benchmark-item ${savingsGoal > 30 ? 'active' : ''}`}>
              <div className="benchmark-range">30%+</div>
              <div className="benchmark-label">超级储蓄</div>
              <div className="benchmark-desc">快速积累财富，提前退休</div>
            </div>
          </div>
        </div>
        
        <div className="savings-slider-container">
          <input
            type="range"
            min="5"
            max="50"
            value={savingsGoal}
            onChange={(e) => setSavingsGoal(Number(e.target.value))}
            className="savings-slider"
          />
          <div className="savings-display">
            <span className="savings-percentage">{savingsGoal}%</span>
            <span className="savings-amount">
              ¥{currentData.income ? Math.round(currentData.income * savingsGoal / 100).toLocaleString() : '---'}/月
            </span>
          </div>
        </div>
        
        <div className="savings-context">
          {savingsGoal < 10 && (
            <div className="context-message low">
              <span className="icon">💡</span>
              <p>虽然储蓄率较低，但建立储蓄习惯是很好的开始！随着收入增长，可以逐步提高。</p>
            </div>
          )}
          {savingsGoal >= 10 && savingsGoal <= 20 && (
            <div className="context-message good">
              <span className="icon">✅</span>
              <p>很棒！{savingsGoal}% 是一个健康的储蓄率。这可以帮您建立紧急储备金并实现长期目标。</p>
            </div>
          )}
          {savingsGoal > 20 && savingsGoal <= 30 && (
            <div className="context-message great">
              <span className="icon">🎆</span>
              <p>太好了！{savingsGoal}% 的储蓄率将帮您更快地实现财务自由。记得保持生活平衡哦！</p>
            </div>
          )}
          {savingsGoal > 30 && (
            <div className="context-message excellent">
              <span className="icon">🚀</span>
              <p>令人印象深刻！{savingsGoal}% 的储蓄率非常高。确保这个目标是可持续的，不要牺牲生活质量。</p>
            </div>
          )}
        </div>
        
        {monthsOfExpenses !== null && (
          <div className="savings-insight">
            <p>At this rate, you'll save {monthsOfExpenses} months of expenses per year</p>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>What are your financial goals?</label>
        
        {expenseMetadata?.insights.hasDebt && (
          <div className="goal-suggestion">
            <span className="suggestion-icon">💡</span>
            <p>We noticed you have debt payments. Consider prioritizing debt payoff for financial freedom!</p>
          </div>
        )}
        
        <div className="goals-grid">
          {goalOptions.map(goal => (
            <button
              key={goal.id}
              className={`goal-option ${financialGoals.includes(goal.id) ? 'selected' : ''}`}
              onClick={() => toggleGoal(goal.id)}
            >
              <span className="goal-icon">{goal.icon}</span>
              <span className="goal-label">{goal.label}</span>
              {goal.priority === 0 && <span className="recommended-badge">Recommended</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>Back</button>}
        <button 
          className="next-button"
          onClick={handleSubmit}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const LifestyleStep: React.FC<StepComponentProps> = ({ onNext, onBack, currentData }) => {
  const [lifeStage, setLifeStage] = useState(currentData.lifeStage || '');
  const [riskTolerance, setRiskTolerance] = useState(currentData.preferences?.riskTolerance || 'moderate');

  const lifeStageOptions = [
    { id: 'student', label: '学生', icon: '🎓' },
    { id: 'early-career', label: '职场新人', icon: '💼' },
    { id: 'mid-career', label: '事业发展期', icon: '📈' },
    { id: 'family', label: '养育家庭', icon: '👨‍👩‍👧‍👦' },
    { id: 'pre-retirement', label: '接近退休', icon: '🌅' },
    { id: 'retired', label: '已退休', icon: '🏖️' }
  ];

  const handleSubmit = () => {
    onNext({ 
      lifeStage,
      preferences: { ...currentData.preferences, riskTolerance }
    });
  };

  return (
    <div className="step-form">
      <div className="form-group">
        <label>您处于哪个人生阶段？</label>
        <div className="life-stage-grid">
          {lifeStageOptions.map(stage => (
            <button
              key={stage.id}
              className={`life-stage-option ${lifeStage === stage.id ? 'selected' : ''}`}
              onClick={() => setLifeStage(stage.id)}
            >
              <span className="stage-icon">{stage.icon}</span>
              <span className="stage-label">{stage.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>您的投资风险偏好？</label>
        <div className="risk-options">
          <button
            className={`risk-option ${riskTolerance === 'conservative' ? 'selected' : ''}`}
            onClick={() => setRiskTolerance('conservative')}
          >
            <span className="risk-icon">🛡️</span>
            <span className="risk-label">保守型</span>
            <span className="risk-desc">追求稳定和安全</span>
          </button>
          <button
            className={`risk-option ${riskTolerance === 'moderate' ? 'selected' : ''}`}
            onClick={() => setRiskTolerance('moderate')}
          >
            <span className="risk-icon">⚖️</span>
            <span className="risk-label">平衡型</span>
            <span className="risk-desc">平衡增长与安全</span>
          </button>
          <button
            className={`risk-option ${riskTolerance === 'aggressive' ? 'selected' : ''}`}
            onClick={() => setRiskTolerance('aggressive')}
          >
            <span className="risk-icon">🚀</span>
            <span className="risk-label">进取型</span>
            <span className="risk-desc">专注增长潜力</span>
          </button>
        </div>
      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>返回</button>}
        <button 
          className="next-button"
          onClick={handleSubmit}
          disabled={!lifeStage}
        >
          创建我的预算
        </button>
      </div>
    </div>
  );
};

const FamilyStep: React.FC<StepComponentProps> = ({ onNext, onBack, currentData, expenseMetadata }) => {
  // Smart default based on expense patterns
  const suggestedFamilySize = expenseMetadata?.insights.hasKids ? 3 : 1;
  
  const [familySize, setFamilySize] = useState(currentData.familySize || suggestedFamilySize);
  const [hasKids, setHasKids] = useState(expenseMetadata?.insights.hasKids || false);

  const handleSubmit = () => {
    onNext({ familySize, hasKids });
  };

  return (
    <div className="step-form">
      {expenseMetadata?.insights.hasKids && (
        <div className="ai-prefilled-notice">
          <span className="notice-icon">👨‍👩‍👧</span>
          <p>根据您的消费记录，我猜您可能有孩子</p>
        </div>
      )}

      <div className="form-group">
        <label>您的家庭有几口人？</label>
        <div className="family-size-selector">
          {[1, 2, 3, 4, 5].map(size => (
            <button
              key={size}
              className={`size-option ${familySize === size ? 'selected' : ''}`}
              onClick={() => setFamilySize(size)}
            >
              {size}{size > 4 && '+'}人
            </button>
          ))}
        </div>
      </div>

      {familySize > 1 && (
        <div className="form-group">
          <label>您有孩子吗？</label>
          <div className="yes-no-options">
            <button
              className={`option-button ${hasKids ? 'selected' : ''}`}
              onClick={() => setHasKids(true)}
            >
              有
            </button>
            <button
              className={`option-button ${!hasKids ? 'selected' : ''}`}
              onClick={() => setHasKids(false)}
            >
              没有
            </button>
          </div>
        </div>
      )}

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>返回</button>}
        <button className="next-button" onClick={handleSubmit}>继续</button>
      </div>
    </div>
  );
};

const DebtStep: React.FC<StepComponentProps> = ({ onNext, onBack, currentData, expenseMetadata }) => {
  // Pre-fill debt amount from detected recurring payments
  const detectedDebtAmount = expenseMetadata?.recurringExpenses
    ?.filter(exp => 
      exp.description?.toLowerCase().includes('loan') ||
      exp.description?.toLowerCase().includes('贷款') ||
      exp.description?.toLowerCase().includes('信用') ||
      exp.description?.toLowerCase().includes('还款') ||
      exp.amount > 1000
    )
    .reduce((sum, debt) => sum + debt.amount, 0) || 0;

  const [debtAmount, setDebtAmount] = useState(currentData.debtObligations || Math.round(detectedDebtAmount) || 0);
  const [debtTypes, setDebtTypes] = useState<string[]>([]);

  const debtOptions = [
    { id: 'credit-card', label: '信用卡' },
    { id: 'mortgage', label: '房贷' },
    { id: 'car-loan', label: '车贷' },
    { id: 'student-loan', label: '教育贷款' },
    { id: 'personal', label: '个人贷款' }
  ];

  const toggleDebtType = (debtId: string) => {
    setDebtTypes(prev => 
      prev.includes(debtId) 
        ? prev.filter(d => d !== debtId)
        : [...prev, debtId]
    );
  };

  const handleSubmit = () => {
    onNext({ debtObligations: debtAmount, debtTypes });
  };

  return (
    <div className="step-form">
      {detectedDebtAmount > 0 && (
        <div className="ai-prefilled-notice">
          <span className="notice-icon">🤖</span>
          <p>我已经根据您的交易记录预填了债务金额</p>
        </div>
      )}

      <div className="form-group">
        <label>每月债务还款总额</label>
        <input
          type="number"
          value={debtAmount}
          onChange={(e) => setDebtAmount(Number(e.target.value))}
          placeholder="¥0"
          className="form-input large"
        />
        {detectedDebtAmount > 0 && (
          <p className="form-hint">
            检测到约 ¥{Math.round(detectedDebtAmount).toLocaleString()} 的定期还款
          </p>
        )}
      </div>

      <div className="form-group">
        <label>您有哪些类型的债务？</label>
        <div className="debt-types">
          {debtOptions.map(debt => (
            <button
              key={debt.id}
              className={`debt-option ${debtTypes.includes(debt.id) ? 'selected' : ''}`}
              onClick={() => toggleDebtType(debt.id)}
            >
              {debt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="step-actions">
        {onBack && <button className="back-button" onClick={onBack}>返回</button>}
        <button className="next-button" onClick={handleSubmit}>继续</button>
      </div>
    </div>
  );
};

const QuickInsightsStep: React.FC<StepComponentProps> = ({ onNext, onBack, expenseMetadata }) => {
  if (!expenseMetadata) {
    return <div>No expense data available</div>;
  }

  return (
    <QuickInsights 
      metadata={expenseMetadata}
      onNext={() => onNext({})}
      onBack={onBack}
    />
  );
};

const VerifyPatternsStep: React.FC<StepComponentProps> = ({ onNext, onBack, currentData, expenseMetadata }) => {
  if (!expenseMetadata) {
    return <div>No expense data available</div>;
  }

  return (
    <VerifyPatterns 
      metadata={expenseMetadata}
      currentData={currentData}
      onNext={onNext}
      onBack={onBack}
    />
  );
};

export default ProgressiveBudgetFlow;