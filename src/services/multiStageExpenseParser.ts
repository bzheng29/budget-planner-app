import { GeminiService } from './geminiService';
import type { ParsedExpense, ExpenseMetadata } from './expenseParserService';

interface StageResult<T> {
  data: T;
  confidence: number;
  warnings?: string[];
}

/**
 * Multi-stage expense parser that makes multiple focused LLM calls
 * for better accuracy and reliability
 */
export class MultiStageExpenseParser {
  private geminiService: GeminiService;
  private onStageUpdate?: (stage: number, result: any) => void;
  
  constructor(apiKey: string, onStageUpdate?: (stage: number, result: any) => void) {
    this.geminiService = new GeminiService(apiKey);
    this.onStageUpdate = onStageUpdate;
  }

  /**
   * Main entry point - orchestrates all stages
   */
  async parseExpenseFile(file: File): Promise<{ expenses: ParsedExpense[], metadata: ExpenseMetadata }> {
    const fileContent = await this.readFileContent(file);
    
    console.log('🎯 Starting multi-stage expense analysis...');
    
    // Stage 1: Basic transaction extraction
    this.onStageUpdate?.(1, { status: 'processing' });
    const stage1Result = await this.stage1_ExtractTransactions(fileContent);
    console.log(`✅ Stage 1 complete: ${stage1Result.data.length} transactions found`);
    this.onStageUpdate?.(1, { 
      status: 'completed', 
      summary: `发现 ${stage1Result.data.length} 条交易`,
      confidence: stage1Result.confidence * 100
    });
    
    // Stage 2: Categorization and merchant cleaning
    this.onStageUpdate?.(2, { status: 'processing' });
    const stage2Result = await this.stage2_CategorizeAndClean(stage1Result.data);
    console.log(`✅ Stage 2 complete: Transactions categorized`);
    const categories = [...new Set(stage2Result.data.map(e => e.category))];
    this.onStageUpdate?.(2, { 
      status: 'completed',
      summary: `识别 ${categories.length} 个类别`,
      confidence: stage2Result.confidence * 100
    });
    
    // Stage 3: Pattern detection (recurring, merchants)
    this.onStageUpdate?.(3, { status: 'processing' });
    const stage3Result = await this.stage3_DetectPatterns(stage2Result.data);
    console.log(`✅ Stage 3 complete: ${stage3Result.data.recurringCount} recurring expenses found`);
    this.onStageUpdate?.(3, { 
      status: 'completed',
      summary: `${stage3Result.data.recurringCount} 项定期支出`,
      confidence: stage3Result.confidence * 100
    });
    
    // Stage 4: Lifestyle insights
    this.onStageUpdate?.(4, { status: 'processing' });
    const stage4Result = await this.stage4_ExtractLifestyleInsights(
      stage2Result.data, 
      stage3Result.data
    );
    console.log(`✅ Stage 4 complete: Lifestyle insights extracted`);
    this.onStageUpdate?.(4, { 
      status: 'completed',
      summary: `${stage4Result.data.lifestyle}生活方式`,
      confidence: stage4Result.confidence * 100
    });
    
    // Stage 5: Financial health assessment
    this.onStageUpdate?.(5, { status: 'processing' });
    const stage5Result = await this.stage5_AssessFinancialHealth(
      stage2Result.data,
      stage3Result.data,
      stage4Result.data
    );
    console.log(`✅ Stage 5 complete: Financial health assessed`);
    this.onStageUpdate?.(5, { 
      status: 'completed',
      summary: `预估月收入 ¥${Math.round(stage5Result.data.estimatedIncome)}`,
      confidence: stage5Result.confidence * 100
    });
    
    // Combine all results
    return this.combineResults(
      stage2Result.data,
      stage3Result.data,
      stage4Result.data,
      stage5Result.data
    );
  }

  /**
   * Stage 1: Extract raw transactions from file
   * Focus: Date, amount, description parsing only
   */
  private async stage1_ExtractTransactions(fileContent: string): Promise<StageResult<any[]>> {
    const prompt = `You are a data extraction specialist. Extract ONLY the transaction data from this file.

File content:
${fileContent}

Your ONLY job is to extract transactions with these fields:
- date (any format)
- amount (any currency)
- description (original text)

Return a JSON array of transactions:
[
  {"date": "...", "amount": "...", "description": "..."},
  ...
]

IMPORTANT:
- Include ALL transactions, even if unclear
- Keep original date format
- Keep original amount format
- Keep full description text
- Do not categorize or interpret yet`;

    try {
      const response = await this.geminiService.generateResponse(prompt, true);
      const transactions = JSON.parse(response);
      
      return {
        data: transactions,
        confidence: 0.9,
        warnings: []
      };
    } catch (error) {
      console.error('Stage 1 error:', error);
      throw new Error('Failed to extract basic transactions');
    }
  }

  /**
   * Stage 2: Categorize and clean transactions
   * Focus: Category assignment, amount normalization, date formatting
   */
  private async stage2_CategorizeAndClean(rawTransactions: any[]): Promise<StageResult<ParsedExpense[]>> {
    const prompt = `You are a financial categorization expert specializing in Chinese and international transactions.

Transactions to categorize:
${JSON.stringify(rawTransactions, null, 2)}

For each transaction:
1. Normalize the date to YYYY-MM-DD format
2. Convert amount to positive number (handle any currency symbols)
3. Assign the BEST category based on description
4. Extract clean merchant name (remove payment method info)

Categories (choose one):
- Food & Dining (restaurants, delivery, groceries, 外卖, 美团, 饿了么, 超市)
- Transportation (taxi, subway, bus, gas, parking, 滴滴, 地铁)
- Housing (rent, mortgage, utilities, 房租, 物业费, 水电费)
- Shopping (clothing, electronics, online shopping, 淘宝, 京东)
- Entertainment (movies, games, sports, 电影, KTV)
- Healthcare (hospital, pharmacy, 医院, 药店)
- Bills & Utilities (phone, internet, electricity, water, 话费, 网费)
- Education (courses, books, training, 培训, 教育)
- Other (anything unclear)

Return JSON array:
[
  {
    "date": "YYYY-MM-DD",
    "amount": number,
    "description": "original text",
    "category": "category name",
    "merchantName": "clean merchant name"
  }
]`;

    try {
      const response = await this.geminiService.generateResponse(prompt, true);
      const categorized = JSON.parse(response);
      
      return {
        data: categorized.map((t: any) => ({
          ...t,
          isRecurring: false // Will be determined in stage 3
        })),
        confidence: 0.85
      };
    } catch (error) {
      console.error('Stage 2 error:', error);
      // Fallback to basic categorization
      return {
        data: rawTransactions.map(t => ({
          date: this.parseDate(t.date),
          amount: this.parseAmount(t.amount),
          description: t.description,
          category: 'Other',
          merchantName: t.description.substring(0, 50),
          isRecurring: false
        })),
        confidence: 0.5
      };
    }
  }

  /**
   * Stage 3: Detect patterns
   * Focus: Recurring expenses, top merchants, spending trends
   */
  private async stage3_DetectPatterns(expenses: ParsedExpense[]): Promise<StageResult<{
    recurringExpenses: ParsedExpense[],
    topMerchants: any[],
    recurringCount: number,
    categoryBreakdown: { [key: string]: number }
  }>> {
    const prompt = `You are a pattern detection specialist. Analyze these categorized transactions for patterns.

Transactions:
${JSON.stringify(expenses.slice(0, 100), null, 2)} 
${expenses.length > 100 ? `... and ${expenses.length - 100} more transactions` : ''}

Identify:
1. RECURRING expenses (same merchant, regular intervals like monthly/weekly)
2. TOP 10 merchants by total spending
3. Category spending totals

For recurring detection:
- Look for same merchant appearing multiple times
- Check if intervals are regular (weekly, biweekly, monthly)
- Common recurring: rent, utilities, subscriptions, insurance

Return JSON:
{
  "recurringTransactionIndices": [array of indices that are recurring],
  "topMerchants": [
    {"name": "merchant", "totalAmount": number, "count": number}
  ],
  "categoryTotals": {
    "Food & Dining": total,
    "Transportation": total,
    ...
  }
}`;

    try {
      const response = await this.geminiService.generateResponse(prompt, true);
      const patterns = JSON.parse(response);
      
      // Mark recurring expenses
      const recurringExpenses = patterns.recurringTransactionIndices.map((idx: number) => ({
        ...expenses[idx],
        isRecurring: true
      }));
      
      // Calculate category breakdown
      const categoryBreakdown: { [key: string]: number } = {};
      expenses.forEach(exp => {
        categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
      });
      
      return {
        data: {
          recurringExpenses,
          topMerchants: patterns.topMerchants || [],
          recurringCount: recurringExpenses.length,
          categoryBreakdown: patterns.categoryTotals || categoryBreakdown
        },
        confidence: 0.8
      };
    } catch (error) {
      console.error('Stage 3 error:', error);
      // Basic fallback
      const categoryBreakdown: { [key: string]: number } = {};
      expenses.forEach(exp => {
        categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
      });
      
      return {
        data: {
          recurringExpenses: [],
          topMerchants: [],
          recurringCount: 0,
          categoryBreakdown
        },
        confidence: 0.4
      };
    }
  }

  /**
   * Stage 4: Extract lifestyle insights
   * Focus: Behavioral patterns, lifestyle indicators
   */
  private async stage4_ExtractLifestyleInsights(
    expenses: ParsedExpense[],
    patterns: any
  ): Promise<StageResult<{
    diningOutFrequency: string,
    hasKids: boolean,
    hasDebt: boolean,
    transportMode: string,
    subscriptionCount: number,
    lifestyle: string
  }>> {
    const prompt = `You are a lifestyle analyst. Based on these spending patterns, identify lifestyle characteristics.

Category totals:
${JSON.stringify(patterns.categoryBreakdown, null, 2)}

Sample transactions for context:
${JSON.stringify(expenses.slice(0, 50).map(e => ({
  category: e.category,
  merchant: e.merchantName,
  amount: e.amount
})), null, 2)}

Analyze and determine:
1. Dining out frequency based on restaurant transactions:
   - rarely (< 5 per month)
   - occasionally (5-15 per month)
   - frequently (15-30 per month)
   - very_frequently (> 30 per month)

2. Has kids? Look for:
   - School expenses (学校, 学费)
   - Childcare (托儿所, 幼儿园)
   - Kids items (儿童, 宝宝)
   - Family restaurants

3. Has debt? Look for:
   - Loan payments (贷款, loan)
   - Credit card payments (信用卡还款)
   - Installments (分期)

4. Transport mode based on expenses:
   - public (subway/bus dominant)
   - car (gas/parking expenses)
   - mixed (both present)

5. Count subscription services (recurring monthly charges)

6. Lifestyle level based on spending patterns:
   - frugal (minimal discretionary spending)
   - moderate (balanced)
   - comfortable (regular discretionary)
   - luxury (high-end brands, frequent dining)

Return JSON:
{
  "diningOutFrequency": "rarely|occasionally|frequently|very_frequently",
  "hasKids": boolean,
  "hasDebt": boolean,
  "transportMode": "public|car|mixed",
  "subscriptionCount": number,
  "lifestyle": "frugal|moderate|comfortable|luxury"
}`;

    try {
      const response = await this.geminiService.generateResponse(prompt, true);
      return {
        data: JSON.parse(response),
        confidence: 0.75
      };
    } catch (error) {
      console.error('Stage 4 error:', error);
      // Fallback to basic estimates
      return {
        data: {
          diningOutFrequency: 'occasionally',
          hasKids: false,
          hasDebt: false,
          transportMode: 'mixed',
          subscriptionCount: 3,
          lifestyle: 'moderate'
        },
        confidence: 0.3
      };
    }
  }

  /**
   * Stage 5: Assess financial health
   * Focus: Income estimation, savings rate, financial recommendations
   */
  private async stage5_AssessFinancialHealth(
    expenses: ParsedExpense[],
    _patterns: any,
    lifestyle: any
  ): Promise<StageResult<{
    estimatedIncome: number,
    savingsRate: number,
    emergencyFundMonths: number,
    location?: string
  }>> {
    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const monthCount = this.calculateMonthSpan(expenses);
    const avgMonthlySpend = totalSpending / Math.max(monthCount, 1);
    
    const prompt = `You are a financial advisor. Assess the financial health based on spending patterns.

Monthly spending: ¥${avgMonthlySpend.toFixed(2)} CNY
Lifestyle: ${lifestyle.lifestyle}
Has debt: ${lifestyle.hasKids}
Has kids: ${lifestyle.hasKids}

Based on Chinese income and spending patterns:
1. Estimate monthly income (typically 1.5-2x of spending for moderate lifestyle)
2. Estimate savings rate (Chinese average is 20-35%)
3. Detect location if possible from merchant names
4. Assess emergency fund readiness

Consider:
- People with kids typically have lower savings rates
- Debt payments reduce available savings
- Luxury lifestyle suggests higher income multiplier
- Frugal lifestyle suggests higher savings rate

Return JSON:
{
  "estimatedIncome": number (monthly income estimate),
  "savingsRate": number (0-100 percentage),
  "emergencyFundMonths": number (0-6 typically),
  "location": "city name if detectable"
}`;

    try {
      const response = await this.geminiService.generateResponse(prompt, true);
      return {
        data: JSON.parse(response),
        confidence: 0.7
      };
    } catch (error) {
      console.error('Stage 5 error:', error);
      // Fallback calculations
      const incomeMultiplier = lifestyle.lifestyle === 'frugal' ? 2.0 :
                               lifestyle.lifestyle === 'luxury' ? 1.3 : 1.6;
      
      return {
        data: {
          estimatedIncome: avgMonthlySpend * incomeMultiplier,
          savingsRate: lifestyle.lifestyle === 'frugal' ? 35 : 20,
          emergencyFundMonths: 0,
          location: undefined
        },
        confidence: 0.4
      };
    }
  }

  /**
   * Combine all stage results into final output
   */
  private combineResults(
    expenses: ParsedExpense[],
    patterns: any,
    lifestyle: any,
    financial: any
  ): { expenses: ParsedExpense[], metadata: ExpenseMetadata } {
    const dates = expenses.map(e => new Date(e.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const monthCount = this.calculateMonthSpan(expenses);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Mark recurring expenses in the main array
    const recurringIds = new Set(patterns.recurringExpenses.map((e: ParsedExpense) => 
      `${e.merchantName}-${e.amount}`
    ));
    
    const finalExpenses = expenses.map(exp => ({
      ...exp,
      isRecurring: recurringIds.has(`${exp.merchantName}-${exp.amount}`)
    }));
    
    const metadata: ExpenseMetadata = {
      totalExpenses,
      periodStart: minDate.toISOString().split('T')[0],
      periodEnd: maxDate.toISOString().split('T')[0],
      categoryBreakdown: patterns.categoryBreakdown,
      topMerchants: patterns.topMerchants,
      recurringExpenses: patterns.recurringExpenses,
      averageMonthlySpend: totalExpenses / Math.max(monthCount, 1),
      missingData: [],
      insights: {
        diningOutFrequency: lifestyle.diningOutFrequency,
        hasKids: lifestyle.hasKids,
        hasDebt: lifestyle.hasDebt,
        estimatedIncome: financial.estimatedIncome,
        savingsRate: financial.savingsRate,
        lifestyle: lifestyle.lifestyle,
        transportMode: lifestyle.transportMode,
        location: financial.location,
        subscriptionCount: lifestyle.subscriptionCount,
        emergencyFundMonths: financial.emergencyFundMonths
      }
    };
    
    return { expenses: finalExpenses, metadata };
  }

  /**
   * Helper functions
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {}
    return new Date().toISOString().split('T')[0];
  }
  
  private parseAmount(amountStr: string): number {
    const cleaned = amountStr.toString().replace(/[^0-9.-]/g, '');
    return Math.abs(parseFloat(cleaned) || 0);
  }
  
  private calculateMonthSpan(expenses: ParsedExpense[]): number {
    if (expenses.length === 0) return 0;
    
    const dates = expenses.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    return Math.max(daysDiff / 30, 1);
  }
}