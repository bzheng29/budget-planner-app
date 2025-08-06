export interface UserMemoryProfile {
  // User Identity & Demographics
  identity: {
    userId: string;
    name?: string;
    age?: number;
    location?: string;
    occupation?: string;
    familySize: number;
    dependents: number;
    lifeStage: 'student' | 'early-career' | 'mid-career' | 'family' | 'pre-retirement' | 'retired';
  };

  // Financial Snapshot
  financial: {
    monthlyIncome: number;
    incomeSource: 'salary' | 'business' | 'mixed' | 'retirement' | 'other';
    incomeStability: 'stable' | 'variable' | 'seasonal';
    totalAssets?: number;
    totalDebt?: number;
    creditScore?: number;
    emergencyFundMonths: number;
    netWorth?: number;
  };

  // Spending Patterns
  spending: {
    averageMonthlySpend: number;
    spendingTrend: 'increasing' | 'stable' | 'decreasing';
    categoryBreakdown: {
      housing: number;
      food: number;
      transportation: number;
      entertainment: number;
      healthcare: number;
      insurance: number;
      utilities: number;
      shopping: number;
      education: number;
      childcare?: number;
      debtPayments?: number;
      other: number;
    };
    topMerchants: MerchantPattern[];
    recurringExpenses: RecurringExpense[];
    seasonalPatterns: SeasonalPattern[];
  };

  // Behavioral Insights
  behavior: {
    spendingPersonality: 'frugal' | 'balanced' | 'generous' | 'impulsive';
    diningOutFrequency: 'rarely' | 'occasionally' | 'frequently' | 'very_frequently';
    shoppingBehavior: 'necessity' | 'occasional' | 'frequent' | 'luxury';
    subscriptionCount: number;
    impulseSpendingScore: number; // 0-100
    budgetAdherence: number; // 0-100
    savingsConsistency: 'none' | 'irregular' | 'consistent' | 'aggressive';
  };

  // Lifestyle Indicators
  lifestyle: {
    hasKids: boolean;
    hasPets: boolean;
    hasVehicle: boolean;
    vehicleType?: 'economy' | 'standard' | 'luxury' | 'multiple';
    homeOwnership: 'rent' | 'own' | 'family' | 'other';
    transportMode: 'public' | 'car' | 'mixed' | 'bike' | 'walk';
    travelFrequency: 'never' | 'rarely' | 'occasionally' | 'frequently';
    healthSpending: 'minimal' | 'regular' | 'high';
    fitnessSpending: number;
  };

  // Financial Goals & Preferences
  goals: {
    primaryGoals: FinancialGoal[];
    savingsTargetMonthly: number;
    savingsTargetPercentage: number;
    retirementAge?: number;
    majorPurchases: PlannedPurchase[];
    debtFreeTarget?: Date;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };

  // AI Learning & Interactions
  aiContext: {
    firstInteractionDate: Date;
    lastUpdateDate: Date;
    totalInteractions: number;
    preferredAdviceStyle: 'detailed' | 'concise' | 'visual' | 'conversational';
    trustedCategories: string[]; // Categories where user follows AI advice
    ignoredSuggestions: string[]; // Types of suggestions user typically ignores
    customPreferences: { [key: string]: any };
    feedbackHistory: UserFeedback[];
  };

  // Data Quality & Completeness
  dataQuality: {
    completenessScore: number; // 0-100
    lastDataUpload: Date;
    dataTimeSpan: number; // months of data available
    missingDataPoints: string[];
    confidenceLevel: 'low' | 'medium' | 'high';
    anomalies: DataAnomaly[];
  };
}

export interface MerchantPattern {
  name: string;
  category: string;
  averageAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  totalSpent: number;
  transactionCount: number;
  lastVisit: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface RecurringExpense {
  name: string;
  category: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  nextDueDate: Date;
  isEssential: boolean;
  canOptimize: boolean;
  optimizationSuggestion?: string;
}

export interface SeasonalPattern {
  period: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 
          'july' | 'august' | 'september' | 'october' | 'november' | 'december' |
          'summer' | 'winter' | 'spring' | 'fall' | 'holiday' | 'back-to-school';
  averageSpend: number;
  variance: number;
  categories: string[];
  notes?: string;
}

export interface FinancialGoal {
  id: string;
  type: 'savings' | 'debt' | 'investment' | 'purchase' | 'retirement' | 'emergency' | 'education';
  description: string;
  targetAmount: number;
  targetDate: Date;
  currentProgress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isAchievable: boolean;
  requiredMonthlySaving: number;
}

export interface PlannedPurchase {
  item: string;
  estimatedCost: number;
  targetDate: Date;
  priority: 'want' | 'need' | 'dream';
  savingStarted: boolean;
  currentSaved: number;
}

export interface UserFeedback {
  date: Date;
  suggestionId: string;
  accepted: boolean;
  effectiveness?: 'helpful' | 'neutral' | 'not-helpful';
  category: string;
  notes?: string;
}

export interface DataAnomaly {
  date: Date;
  type: 'unusual-spending' | 'missing-data' | 'duplicate' | 'category-shift' | 'income-change';
  description: string;
  amount?: number;
  resolved: boolean;
}

// Memory Operations
export interface MemoryUpdate {
  userId: string;
  updateType: 'full' | 'partial' | 'append';
  timestamp: Date;
  source: 'expense-upload' | 'user-input' | 'ai-inference' | 'chat-interaction';
  changes: Partial<UserMemoryProfile>;
  confidence: number;
}

// Test Data Generator Types
export interface TestScenario {
  name: string;
  description: string;
  profile: UserMemoryProfile;
  expectedBudget: {
    savingsRate: number;
    essentialSpending: number;
    discretionarySpending: number;
  };
  challenges: string[];
  opportunities: string[];
}