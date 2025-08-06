import { 
  UserMemoryProfile, 
  MerchantPattern, 
  RecurringExpense,
  SeasonalPattern,
  FinancialGoal,
  MemoryUpdate,
  DataAnomaly
} from '../types/memory';
import { ParsedExpense, ExpenseMetadata } from './expenseParserService';

export class MemoryService {
  private memories: Map<string, UserMemoryProfile> = new Map();
  
  constructor() {
    this.loadFromLocalStorage();
  }

  // Extract memory profile from uploaded expenses
  extractMemoryFromExpenses(
    expenses: ParsedExpense[], 
    metadata: ExpenseMetadata,
    userId: string = 'default'
  ): UserMemoryProfile {
    const now = new Date();
    const existing = this.memories.get(userId);
    
    // Calculate spending patterns
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const merchantPatterns = this.analyzeMerchantPatterns(expenses);
    const recurringExpenses = this.identifyRecurringExpenses(expenses);
    const seasonalPatterns = this.detectSeasonalPatterns(expenses);
    
    // Infer lifestyle indicators
    const lifestyle = this.inferLifestyle(expenses, metadata);
    
    // Calculate financial metrics
    const avgMonthlySpend = metadata.averageMonthlySpend;
    const estimatedIncome = metadata.insights.estimatedIncome || avgMonthlySpend * 1.4;
    
    const profile: UserMemoryProfile = {
      identity: {
        userId,
        name: existing?.identity.name,
        location: metadata.insights.location || existing?.identity.location,
        familySize: lifestyle.hasKids ? 3 : 1,
        dependents: lifestyle.hasKids ? 1 : 0,
        lifeStage: this.inferLifeStage(avgMonthlySpend, lifestyle.hasKids, metadata.insights.hasDebt)
      },
      
      financial: {
        monthlyIncome: estimatedIncome,
        incomeSource: 'salary',
        incomeStability: 'stable',
        totalDebt: metadata.insights.hasDebt ? estimatedIncome * 3 : 0,
        emergencyFundMonths: metadata.insights.emergencyFundMonths,
        netWorth: existing?.financial.netWorth
      },
      
      spending: {
        averageMonthlySpend: avgMonthlySpend,
        spendingTrend: this.calculateSpendingTrend(expenses),
        categoryBreakdown: {
          housing: categoryTotals['Housing'] || avgMonthlySpend * 0.3,
          food: categoryTotals['Food & Dining'] || avgMonthlySpend * 0.15,
          transportation: categoryTotals['Transportation'] || avgMonthlySpend * 0.15,
          entertainment: categoryTotals['Entertainment'] || avgMonthlySpend * 0.05,
          healthcare: categoryTotals['Healthcare'] || avgMonthlySpend * 0.05,
          insurance: categoryTotals['Insurance'] || avgMonthlySpend * 0.05,
          utilities: categoryTotals['Bills & Utilities'] || avgMonthlySpend * 0.1,
          shopping: categoryTotals['Shopping'] || avgMonthlySpend * 0.1,
          education: categoryTotals['Education'] || 0,
          childcare: lifestyle.hasKids ? avgMonthlySpend * 0.1 : undefined,
          debtPayments: metadata.insights.hasDebt ? avgMonthlySpend * 0.15 : undefined,
          other: categoryTotals['Other'] || avgMonthlySpend * 0.05
        },
        topMerchants: merchantPatterns.slice(0, 10),
        recurringExpenses,
        seasonalPatterns
      },
      
      behavior: {
        spendingPersonality: this.analyzeSpendingPersonality(avgMonthlySpend, estimatedIncome),
        diningOutFrequency: metadata.insights.diningOutFrequency,
        shoppingBehavior: this.analyzeShoppingBehavior(expenses),
        subscriptionCount: metadata.insights.subscriptionCount,
        impulseSpendingScore: this.calculateImpulseScore(expenses),
        budgetAdherence: 70, // Default, will improve with more data
        savingsConsistency: metadata.insights.savingsRate > 20 ? 'consistent' : 
                           metadata.insights.savingsRate > 10 ? 'irregular' : 'none'
      },
      
      lifestyle: {
        hasKids: lifestyle.hasKids,
        hasPets: lifestyle.hasPets,
        hasVehicle: lifestyle.hasVehicle,
        vehicleType: lifestyle.vehicleType,
        homeOwnership: this.inferHomeOwnership(expenses),
        transportMode: metadata.insights.transportMode,
        travelFrequency: lifestyle.travelFrequency,
        healthSpending: lifestyle.healthSpending,
        fitnessSpending: lifestyle.fitnessSpending
      },
      
      goals: {
        primaryGoals: this.suggestGoals(metadata, lifestyle),
        savingsTargetMonthly: estimatedIncome * 0.2,
        savingsTargetPercentage: 20,
        majorPurchases: [],
        riskTolerance: 'moderate'
      },
      
      aiContext: {
        firstInteractionDate: existing?.aiContext.firstInteractionDate || now,
        lastUpdateDate: now,
        totalInteractions: (existing?.aiContext.totalInteractions || 0) + 1,
        preferredAdviceStyle: 'conversational',
        trustedCategories: [],
        ignoredSuggestions: [],
        customPreferences: {},
        feedbackHistory: existing?.aiContext.feedbackHistory || []
      },
      
      dataQuality: {
        completenessScore: this.calculateCompletenessScore(expenses, metadata),
        lastDataUpload: now,
        dataTimeSpan: this.calculateTimeSpan(expenses),
        missingDataPoints: metadata.missingData || [],
        confidenceLevel: expenses.length > 100 ? 'high' : expenses.length > 50 ? 'medium' : 'low',
        anomalies: this.detectAnomalies(expenses)
      }
    };
    
    this.memories.set(userId, profile);
    this.saveToLocalStorage();
    
    return profile;
  }
  
  private calculateCategoryTotals(expenses: ParsedExpense[]): { [key: string]: number } {
    const totals: { [key: string]: number } = {};
    const monthCount = this.calculateTimeSpan(expenses);
    
    expenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });
    
    // Convert to monthly averages
    Object.keys(totals).forEach(key => {
      totals[key] = totals[key] / Math.max(monthCount, 1);
    });
    
    return totals;
  }
  
  private analyzeMerchantPatterns(expenses: ParsedExpense[]): MerchantPattern[] {
    const merchantMap = new Map<string, MerchantPattern>();
    
    expenses.forEach(expense => {
      const merchant = expense.merchantName || expense.description;
      if (!merchant) return;
      
      if (!merchantMap.has(merchant)) {
        merchantMap.set(merchant, {
          name: merchant,
          category: expense.category,
          averageAmount: 0,
          frequency: 'occasional',
          totalSpent: 0,
          transactionCount: 0,
          lastVisit: new Date(expense.date),
          trend: 'stable'
        });
      }
      
      const pattern = merchantMap.get(merchant)!;
      pattern.totalSpent += expense.amount;
      pattern.transactionCount++;
      pattern.averageAmount = pattern.totalSpent / pattern.transactionCount;
      
      const visitDate = new Date(expense.date);
      if (visitDate > pattern.lastVisit) {
        pattern.lastVisit = visitDate;
      }
    });
    
    // Calculate frequency
    merchantMap.forEach(pattern => {
      if (pattern.transactionCount >= 20) pattern.frequency = 'daily';
      else if (pattern.transactionCount >= 4) pattern.frequency = 'weekly';
      else if (pattern.transactionCount >= 1) pattern.frequency = 'monthly';
    });
    
    return Array.from(merchantMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }
  
  private identifyRecurringExpenses(expenses: ParsedExpense[]): RecurringExpense[] {
    const recurring: RecurringExpense[] = [];
    const merchantGroups = new Map<string, ParsedExpense[]>();
    
    // Group by merchant
    expenses.forEach(expense => {
      const key = expense.merchantName || expense.description;
      if (!merchantGroups.has(key)) {
        merchantGroups.set(key, []);
      }
      merchantGroups.get(key)!.push(expense);
    });
    
    // Identify recurring patterns
    merchantGroups.forEach((expenseList, merchant) => {
      if (expenseList.length >= 2) {
        // Check if amounts are similar
        const amounts = expenseList.map(e => e.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = Math.max(...amounts) - Math.min(...amounts);
        
        if (variance < avgAmount * 0.2) { // Less than 20% variance
          const dates = expenseList.map(e => new Date(e.date).getTime()).sort();
          const intervals = [];
          
          for (let i = 1; i < dates.length; i++) {
            intervals.push(dates[i] - dates[i - 1]);
          }
          
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const dayInterval = avgInterval / (1000 * 60 * 60 * 24);
          
          let frequency: RecurringExpense['frequency'] = 'monthly';
          if (dayInterval <= 7) frequency = 'weekly';
          else if (dayInterval <= 14) frequency = 'biweekly';
          else if (dayInterval <= 31) frequency = 'monthly';
          else if (dayInterval <= 92) frequency = 'quarterly';
          else if (dayInterval <= 365) frequency = 'annual';
          
          recurring.push({
            name: merchant,
            category: expenseList[0].category,
            amount: avgAmount,
            frequency,
            nextDueDate: this.calculateNextDueDate(new Date(expenseList[expenseList.length - 1].date), frequency),
            isEssential: this.isEssentialCategory(expenseList[0].category),
            canOptimize: avgAmount > 50 && !this.isEssentialCategory(expenseList[0].category)
          });
        }
      }
    });
    
    return recurring;
  }
  
  private detectSeasonalPatterns(expenses: ParsedExpense[]): SeasonalPattern[] {
    const monthlySpending = new Map<string, number>();
    
    expenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleString('default', { month: 'long' }).toLowerCase();
      monthlySpending.set(month, (monthlySpending.get(month) || 0) + expense.amount);
    });
    
    const patterns: SeasonalPattern[] = [];
    const avgSpending = Array.from(monthlySpending.values()).reduce((a, b) => a + b, 0) / monthlySpending.size;
    
    monthlySpending.forEach((amount, month) => {
      if (amount > avgSpending * 1.2) { // 20% above average
        patterns.push({
          period: month as SeasonalPattern['period'],
          averageSpend: amount,
          variance: amount - avgSpending,
          categories: [] // Would need more analysis to fill this
        });
      }
    });
    
    return patterns;
  }
  
  private inferLifestyle(expenses: ParsedExpense[], metadata: ExpenseMetadata) {
    const hasKids = metadata.insights.hasKids || 
      expenses.some(e => 
        e.description.toLowerCase().includes('school') ||
        e.description.toLowerCase().includes('daycare') ||
        e.description.toLowerCase().includes('kids')
      );
    
    const hasPets = expenses.some(e => 
      e.description.toLowerCase().includes('pet') ||
      e.description.toLowerCase().includes('vet') ||
      e.merchantName?.toLowerCase().includes('petco') ||
      e.merchantName?.toLowerCase().includes('petsmart')
    );
    
    const gasExpenses = expenses.filter(e => 
      e.category === 'Transportation' && 
      (e.description.toLowerCase().includes('gas') || 
       e.description.toLowerCase().includes('fuel'))
    );
    
    const hasVehicle = gasExpenses.length > 2;
    
    const healthExpenses = expenses.filter(e => e.category === 'Healthcare');
    const healthSpending = healthExpenses.length === 0 ? 'minimal' :
                          healthExpenses.length < 5 ? 'regular' : 'high';
    
    const fitnessExpenses = expenses.filter(e => 
      e.description.toLowerCase().includes('gym') ||
      e.description.toLowerCase().includes('fitness') ||
      e.description.toLowerCase().includes('yoga')
    );
    
    const fitnessSpending = fitnessExpenses.reduce((sum, e) => sum + e.amount, 0) / 
                           Math.max(this.calculateTimeSpan(expenses), 1);
    
    const travelExpenses = expenses.filter(e => 
      e.description.toLowerCase().includes('hotel') ||
      e.description.toLowerCase().includes('flight') ||
      e.description.toLowerCase().includes('airbnb')
    );
    
    const travelFrequency = travelExpenses.length === 0 ? 'never' :
                           travelExpenses.length < 2 ? 'rarely' :
                           travelExpenses.length < 5 ? 'occasionally' : 'frequently';
    
    return {
      hasKids,
      hasPets,
      hasVehicle,
      vehicleType: hasVehicle ? 'standard' as const : undefined,
      healthSpending: healthSpending as 'minimal' | 'regular' | 'high',
      fitnessSpending,
      travelFrequency: travelFrequency as 'never' | 'rarely' | 'occasionally' | 'frequently'
    };
  }
  
  private inferLifeStage(monthlySpend: number, hasKids: boolean, hasDebt: boolean) {
    if (monthlySpend < 2000 && hasDebt) return 'student';
    if (monthlySpend < 4000 && !hasKids) return 'early-career';
    if (hasKids) return 'family';
    if (monthlySpend > 6000) return 'mid-career';
    return 'early-career';
  }
  
  private inferHomeOwnership(expenses: ParsedExpense[]) {
    const hasRent = expenses.some(e => 
      e.description.toLowerCase().includes('rent') ||
      e.category === 'Housing' && e.amount > 500 && e.amount < 5000
    );
    
    const hasMortgage = expenses.some(e => 
      e.description.toLowerCase().includes('mortgage') ||
      e.description.toLowerCase().includes('home loan')
    );
    
    if (hasMortgage) return 'own';
    if (hasRent) return 'rent';
    return 'other';
  }
  
  private calculateSpendingTrend(expenses: ParsedExpense[]) {
    if (expenses.length < 30) return 'stable';
    
    const sorted = expenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstThird = sorted.slice(0, Math.floor(sorted.length / 3));
    const lastThird = sorted.slice(-Math.floor(sorted.length / 3));
    
    const firstAvg = firstThird.reduce((sum, e) => sum + e.amount, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, e) => sum + e.amount, 0) / lastThird.length;
    
    if (lastAvg > firstAvg * 1.1) return 'increasing';
    if (lastAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }
  
  private analyzeSpendingPersonality(monthlySpend: number, income: number) {
    const ratio = monthlySpend / income;
    if (ratio < 0.6) return 'frugal';
    if (ratio < 0.8) return 'balanced';
    if (ratio < 0.95) return 'generous';
    return 'impulsive';
  }
  
  private analyzeShoppingBehavior(expenses: ParsedExpense[]) {
    const shoppingExpenses = expenses.filter(e => e.category === 'Shopping');
    const avgAmount = shoppingExpenses.reduce((sum, e) => sum + e.amount, 0) / Math.max(shoppingExpenses.length, 1);
    
    if (shoppingExpenses.length < 5) return 'necessity';
    if (avgAmount < 50) return 'occasional';
    if (avgAmount < 200) return 'frequent';
    return 'luxury';
  }
  
  private calculateImpulseScore(expenses: ParsedExpense[]): number {
    // Look for patterns like multiple small purchases in a day
    const dateGroups = new Map<string, ParsedExpense[]>();
    
    expenses.forEach(expense => {
      const date = expense.date;
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(expense);
    });
    
    let impulseCount = 0;
    dateGroups.forEach(dayExpenses => {
      const nonEssentialCount = dayExpenses.filter(e => 
        !this.isEssentialCategory(e.category) && e.amount < 100
      ).length;
      
      if (nonEssentialCount > 3) impulseCount++;
    });
    
    return Math.min((impulseCount / dateGroups.size) * 100, 100);
  }
  
  private isEssentialCategory(category: string): boolean {
    return ['Housing', 'Bills & Utilities', 'Healthcare', 'Insurance', 'Transportation'].includes(category);
  }
  
  private calculateNextDueDate(lastDate: Date, frequency: RecurringExpense['frequency']): Date {
    const next = new Date(lastDate);
    
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annual':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    
    return next;
  }
  
  private suggestGoals(metadata: ExpenseMetadata, lifestyle: any): FinancialGoal[] {
    const goals: FinancialGoal[] = [];
    const baseId = Date.now().toString();
    
    // Emergency fund goal
    if (metadata.insights.emergencyFundMonths < 3) {
      goals.push({
        id: `${baseId}-1`,
        type: 'emergency',
        description: 'Build 3-month emergency fund',
        targetAmount: metadata.averageMonthlySpend * 3,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        currentProgress: metadata.insights.emergencyFundMonths * metadata.averageMonthlySpend,
        priority: 'critical',
        isAchievable: true,
        requiredMonthlySaving: metadata.averageMonthlySpend * 0.5
      });
    }
    
    // Debt reduction goal
    if (metadata.insights.hasDebt) {
      goals.push({
        id: `${baseId}-2`,
        type: 'debt',
        description: 'Reduce high-interest debt',
        targetAmount: metadata.insights.estimatedIncome * 0.5, // Estimate
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        currentProgress: 0,
        priority: 'high',
        isAchievable: true,
        requiredMonthlySaving: metadata.insights.estimatedIncome * 0.1
      });
    }
    
    // Savings goal
    if (metadata.insights.savingsRate < 20) {
      goals.push({
        id: `${baseId}-3`,
        type: 'savings',
        description: 'Increase savings rate to 20%',
        targetAmount: metadata.insights.estimatedIncome * 0.2 * 12,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        currentProgress: metadata.insights.savingsRate * metadata.insights.estimatedIncome * 0.01 * 12,
        priority: 'medium',
        isAchievable: true,
        requiredMonthlySaving: metadata.insights.estimatedIncome * 0.2
      });
    }
    
    return goals;
  }
  
  private calculateCompletenessScore(expenses: ParsedExpense[], metadata: ExpenseMetadata): number {
    let score = 100;
    
    // Deduct for missing data
    if (!metadata.insights.location) score -= 5;
    if (expenses.length < 50) score -= 20;
    if (expenses.length < 100) score -= 10;
    
    // Check for missing categories
    const categories = new Set(expenses.map(e => e.category));
    if (!categories.has('Housing')) score -= 10;
    if (!categories.has('Food & Dining')) score -= 10;
    
    // Check for missing merchant names
    const missingMerchants = expenses.filter(e => !e.merchantName).length;
    score -= (missingMerchants / expenses.length) * 20;
    
    return Math.max(score, 0);
  }
  
  private calculateTimeSpan(expenses: ParsedExpense[]): number {
    if (expenses.length === 0) return 0;
    
    const dates = expenses.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    return Math.max(daysDiff / 30, 1); // Return months
  }
  
  private detectAnomalies(expenses: ParsedExpense[]): DataAnomaly[] {
    const anomalies: DataAnomaly[] = [];
    
    // Calculate average and standard deviation
    const amounts = expenses.map(e => e.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Find outliers (more than 3 standard deviations)
    expenses.forEach(expense => {
      if (expense.amount > avg + (3 * stdDev)) {
        anomalies.push({
          date: new Date(expense.date),
          type: 'unusual-spending',
          description: `Unusually high expense: ${expense.description}`,
          amount: expense.amount,
          resolved: false
        });
      }
    });
    
    // Check for gaps in data
    const sorted = expenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (let i = 1; i < sorted.length; i++) {
      const daysDiff = (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 14) {
        anomalies.push({
          date: new Date(sorted[i - 1].date),
          type: 'missing-data',
          description: `Data gap of ${Math.floor(daysDiff)} days`,
          resolved: false
        });
      }
    }
    
    return anomalies;
  }
  
  // Get memory for a user
  getMemory(userId: string = 'default'): UserMemoryProfile | undefined {
    return this.memories.get(userId);
  }
  
  // Update memory
  updateMemory(userId: string, updates: Partial<UserMemoryProfile>): void {
    const existing = this.memories.get(userId);
    if (existing) {
      this.memories.set(userId, { ...existing, ...updates });
      this.saveToLocalStorage();
    }
  }
  
  // Clear memory
  clearMemory(userId: string): void {
    this.memories.delete(userId);
    this.saveToLocalStorage();
  }
  
  // Persistence
  private saveToLocalStorage(): void {
    const data = Array.from(this.memories.entries());
    localStorage.setItem('ai-memory-profiles', JSON.stringify(data));
  }
  
  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('ai-memory-profiles');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.memories = new Map(data);
      } catch (error) {
        console.error('Failed to load memory profiles:', error);
      }
    }
  }
  
  // Generate test scenarios
  generateTestScenarios(): UserMemoryProfile[] {
    return [
      this.createYoungProfessionalScenario(),
      this.createFamilyScenario(),
      this.createStudentScenario(),
      this.createHighEarnerScenario(),
      this.createRetireeScenario()
    ];
  }
  
  private createYoungProfessionalScenario(): UserMemoryProfile {
    return {
      identity: {
        userId: 'test-young-professional',
        name: 'Alex Chen',
        age: 28,
        location: 'San Francisco',
        occupation: 'Software Developer',
        familySize: 1,
        dependents: 0,
        lifeStage: 'early-career'
      },
      financial: {
        monthlyIncome: 8500,
        incomeSource: 'salary',
        incomeStability: 'stable',
        totalAssets: 25000,
        totalDebt: 15000,
        creditScore: 720,
        emergencyFundMonths: 2,
        netWorth: 10000
      },
      spending: {
        averageMonthlySpend: 6200,
        spendingTrend: 'stable',
        categoryBreakdown: {
          housing: 2500,
          food: 800,
          transportation: 400,
          entertainment: 600,
          healthcare: 200,
          insurance: 300,
          utilities: 200,
          shopping: 500,
          education: 100,
          other: 600
        },
        topMerchants: [],
        recurringExpenses: [],
        seasonalPatterns: []
      },
      behavior: {
        spendingPersonality: 'balanced',
        diningOutFrequency: 'frequently',
        shoppingBehavior: 'occasional',
        subscriptionCount: 8,
        impulseSpendingScore: 35,
        budgetAdherence: 65,
        savingsConsistency: 'irregular'
      },
      lifestyle: {
        hasKids: false,
        hasPets: false,
        hasVehicle: false,
        homeOwnership: 'rent',
        transportMode: 'public',
        travelFrequency: 'occasionally',
        healthSpending: 'regular',
        fitnessSpending: 150
      },
      goals: {
        primaryGoals: [],
        savingsTargetMonthly: 1700,
        savingsTargetPercentage: 20,
        majorPurchases: [],
        riskTolerance: 'moderate'
      },
      aiContext: {
        firstInteractionDate: new Date(),
        lastUpdateDate: new Date(),
        totalInteractions: 1,
        preferredAdviceStyle: 'conversational',
        trustedCategories: [],
        ignoredSuggestions: [],
        customPreferences: {},
        feedbackHistory: []
      },
      dataQuality: {
        completenessScore: 85,
        lastDataUpload: new Date(),
        dataTimeSpan: 3,
        missingDataPoints: [],
        confidenceLevel: 'high',
        anomalies: []
      }
    };
  }
  
  private createFamilyScenario(): UserMemoryProfile {
    return {
      identity: {
        userId: 'test-family',
        name: 'Sarah Johnson',
        age: 38,
        location: 'Chicago',
        occupation: 'Marketing Manager',
        familySize: 4,
        dependents: 2,
        lifeStage: 'family'
      },
      financial: {
        monthlyIncome: 12000,
        incomeSource: 'salary',
        incomeStability: 'stable',
        totalAssets: 150000,
        totalDebt: 280000,
        creditScore: 760,
        emergencyFundMonths: 4,
        netWorth: -130000
      },
      spending: {
        averageMonthlySpend: 9500,
        spendingTrend: 'increasing',
        categoryBreakdown: {
          housing: 3200,
          food: 1500,
          transportation: 800,
          entertainment: 400,
          healthcare: 600,
          insurance: 800,
          utilities: 400,
          shopping: 700,
          education: 500,
          childcare: 1200,
          debtPayments: 200,
          other: 200
        },
        topMerchants: [],
        recurringExpenses: [],
        seasonalPatterns: []
      },
      behavior: {
        spendingPersonality: 'balanced',
        diningOutFrequency: 'occasionally',
        shoppingBehavior: 'frequent',
        subscriptionCount: 12,
        impulseSpendingScore: 45,
        budgetAdherence: 70,
        savingsConsistency: 'consistent'
      },
      lifestyle: {
        hasKids: true,
        hasPets: true,
        hasVehicle: true,
        vehicleType: 'standard',
        homeOwnership: 'own',
        transportMode: 'car',
        travelFrequency: 'rarely',
        healthSpending: 'high',
        fitnessSpending: 80
      },
      goals: {
        primaryGoals: [],
        savingsTargetMonthly: 2400,
        savingsTargetPercentage: 20,
        majorPurchases: [],
        riskTolerance: 'conservative'
      },
      aiContext: {
        firstInteractionDate: new Date(),
        lastUpdateDate: new Date(),
        totalInteractions: 1,
        preferredAdviceStyle: 'concise',
        trustedCategories: [],
        ignoredSuggestions: [],
        customPreferences: {},
        feedbackHistory: []
      },
      dataQuality: {
        completenessScore: 90,
        lastDataUpload: new Date(),
        dataTimeSpan: 6,
        missingDataPoints: [],
        confidenceLevel: 'high',
        anomalies: []
      }
    };
  }
  
  private createStudentScenario(): UserMemoryProfile {
    return {
      identity: {
        userId: 'test-student',
        name: 'Mike Wilson',
        age: 21,
        location: 'Boston',
        occupation: 'Student',
        familySize: 1,
        dependents: 0,
        lifeStage: 'student'
      },
      financial: {
        monthlyIncome: 1500,
        incomeSource: 'mixed',
        incomeStability: 'variable',
        totalAssets: 2000,
        totalDebt: 25000,
        creditScore: 650,
        emergencyFundMonths: 0.5,
        netWorth: -23000
      },
      spending: {
        averageMonthlySpend: 1400,
        spendingTrend: 'stable',
        categoryBreakdown: {
          housing: 600,
          food: 350,
          transportation: 80,
          entertainment: 100,
          healthcare: 50,
          insurance: 0,
          utilities: 50,
          shopping: 70,
          education: 50,
          other: 50
        },
        topMerchants: [],
        recurringExpenses: [],
        seasonalPatterns: []
      },
      behavior: {
        spendingPersonality: 'frugal',
        diningOutFrequency: 'occasionally',
        shoppingBehavior: 'necessity',
        subscriptionCount: 3,
        impulseSpendingScore: 20,
        budgetAdherence: 80,
        savingsConsistency: 'none'
      },
      lifestyle: {
        hasKids: false,
        hasPets: false,
        hasVehicle: false,
        homeOwnership: 'rent',
        transportMode: 'public',
        travelFrequency: 'never',
        healthSpending: 'minimal',
        fitnessSpending: 0
      },
      goals: {
        primaryGoals: [],
        savingsTargetMonthly: 100,
        savingsTargetPercentage: 7,
        majorPurchases: [],
        riskTolerance: 'conservative'
      },
      aiContext: {
        firstInteractionDate: new Date(),
        lastUpdateDate: new Date(),
        totalInteractions: 1,
        preferredAdviceStyle: 'detailed',
        trustedCategories: [],
        ignoredSuggestions: [],
        customPreferences: {},
        feedbackHistory: []
      },
      dataQuality: {
        completenessScore: 75,
        lastDataUpload: new Date(),
        dataTimeSpan: 2,
        missingDataPoints: ['insurance'],
        confidenceLevel: 'medium',
        anomalies: []
      }
    };
  }
  
  private createHighEarnerScenario(): UserMemoryProfile {
    return {
      identity: {
        userId: 'test-high-earner',
        name: 'David Lee',
        age: 45,
        location: 'New York',
        occupation: 'Investment Banker',
        familySize: 3,
        dependents: 1,
        lifeStage: 'mid-career'
      },
      financial: {
        monthlyIncome: 35000,
        incomeSource: 'mixed',
        incomeStability: 'stable',
        totalAssets: 1200000,
        totalDebt: 500000,
        creditScore: 820,
        emergencyFundMonths: 12,
        netWorth: 700000
      },
      spending: {
        averageMonthlySpend: 18000,
        spendingTrend: 'stable',
        categoryBreakdown: {
          housing: 6000,
          food: 2500,
          transportation: 1500,
          entertainment: 2000,
          healthcare: 800,
          insurance: 1500,
          utilities: 500,
          shopping: 2000,
          education: 1000,
          childcare: 0,
          debtPayments: 0,
          other: 200
        },
        topMerchants: [],
        recurringExpenses: [],
        seasonalPatterns: []
      },
      behavior: {
        spendingPersonality: 'generous',
        diningOutFrequency: 'very_frequently',
        shoppingBehavior: 'luxury',
        subscriptionCount: 20,
        impulseSpendingScore: 60,
        budgetAdherence: 50,
        savingsConsistency: 'aggressive'
      },
      lifestyle: {
        hasKids: true,
        hasPets: false,
        hasVehicle: true,
        vehicleType: 'luxury',
        homeOwnership: 'own',
        transportMode: 'car',
        travelFrequency: 'frequently',
        healthSpending: 'high',
        fitnessSpending: 500
      },
      goals: {
        primaryGoals: [],
        savingsTargetMonthly: 17000,
        savingsTargetPercentage: 48,
        majorPurchases: [],
        riskTolerance: 'aggressive'
      },
      aiContext: {
        firstInteractionDate: new Date(),
        lastUpdateDate: new Date(),
        totalInteractions: 1,
        preferredAdviceStyle: 'concise',
        trustedCategories: [],
        ignoredSuggestions: [],
        customPreferences: {},
        feedbackHistory: []
      },
      dataQuality: {
        completenessScore: 95,
        lastDataUpload: new Date(),
        dataTimeSpan: 12,
        missingDataPoints: [],
        confidenceLevel: 'high',
        anomalies: []
      }
    };
  }
  
  private createRetireeScenario(): UserMemoryProfile {
    return {
      identity: {
        userId: 'test-retiree',
        name: 'Margaret Smith',
        age: 68,
        location: 'Phoenix',
        occupation: 'Retired Teacher',
        familySize: 2,
        dependents: 0,
        lifeStage: 'retired'
      },
      financial: {
        monthlyIncome: 5500,
        incomeSource: 'retirement',
        incomeStability: 'stable',
        totalAssets: 650000,
        totalDebt: 0,
        creditScore: 800,
        emergencyFundMonths: 24,
        netWorth: 650000
      },
      spending: {
        averageMonthlySpend: 4200,
        spendingTrend: 'stable',
        categoryBreakdown: {
          housing: 1200,
          food: 600,
          transportation: 300,
          entertainment: 400,
          healthcare: 800,
          insurance: 400,
          utilities: 200,
          shopping: 200,
          education: 0,
          other: 100
        },
        topMerchants: [],
        recurringExpenses: [],
        seasonalPatterns: []
      },
      behavior: {
        spendingPersonality: 'frugal',
        diningOutFrequency: 'occasionally',
        shoppingBehavior: 'necessity',
        subscriptionCount: 5,
        impulseSpendingScore: 15,
        budgetAdherence: 90,
        savingsConsistency: 'consistent'
      },
      lifestyle: {
        hasKids: false,
        hasPets: false,
        hasVehicle: true,
        vehicleType: 'economy',
        homeOwnership: 'own',
        transportMode: 'car',
        travelFrequency: 'occasionally',
        healthSpending: 'high',
        fitnessSpending: 50
      },
      goals: {
        primaryGoals: [],
        savingsTargetMonthly: 1300,
        savingsTargetPercentage: 24,
        majorPurchases: [],
        riskTolerance: 'conservative'
      },
      aiContext: {
        firstInteractionDate: new Date(),
        lastUpdateDate: new Date(),
        totalInteractions: 1,
        preferredAdviceStyle: 'detailed',
        trustedCategories: [],
        ignoredSuggestions: [],
        customPreferences: {},
        feedbackHistory: []
      },
      dataQuality: {
        completenessScore: 88,
        lastDataUpload: new Date(),
        dataTimeSpan: 6,
        missingDataPoints: [],
        confidenceLevel: 'high',
        anomalies: []
      }
    };
  }
}