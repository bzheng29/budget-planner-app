import { GeminiService } from './geminiService';

export interface ParsedExpense {
  date: string;
  description: string;
  amount: number;
  category: string;
  merchantName?: string;
  paymentMethod?: string;
  isRecurring?: boolean;
  notes?: string;
}

export interface ExpenseMetadata {
  totalExpenses: number;
  periodStart: string;
  periodEnd: string;
  categoryBreakdown: { [category: string]: number };
  topMerchants: { name: string; amount: number; count: number }[];
  recurringExpenses: ParsedExpense[];
  averageMonthlySpend: number;
  missingData: string[];
  insights: {
    diningOutFrequency: 'rarely' | 'occasionally' | 'frequently' | 'very_frequently';
    hasKids: boolean;
    hasDebt: boolean;
    estimatedIncome: number;
    savingsRate: number;
    lifestyle: 'frugal' | 'moderate' | 'comfortable' | 'luxury';
    transportMode: 'public' | 'car' | 'mixed';
    location?: string;
    subscriptionCount: number;
    emergencyFundMonths: number;
  };
}

export class ExpenseParserService {
  private geminiService: GeminiService;

  constructor(apiKey: string) {
    this.geminiService = new GeminiService(apiKey);
  }

  async parseExpenseFile(file: File): Promise<{ expenses: ParsedExpense[], metadata: ExpenseMetadata }> {
    const fileContent = await this.readFileContent(file);
    
    const prompt = `You are an expert financial data analyst specializing in Chinese and international expense data. 
Analyze this expense data file with high accuracy and extract ALL information needed for budget planning.

File name: ${file.name}
Content:
${fileContent}

CRITICAL INSTRUCTIONS FOR ACCURATE PARSING:
1. Support multiple languages (Chinese, English, mixed)
2. Recognize Chinese payment platforms (支付宝/Alipay, 微信支付/WeChat Pay, 银联/UnionPay)
3. Understand Chinese merchant names and categories
4. Handle multiple date formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, Chinese dates)
5. Process amounts in CNY (¥) or USD ($) - normalize to base currency
6. Be VERY careful with number parsing - look for decimal points and thousands separators

CATEGORIZATION RULES:
- Food & Dining: restaurants, cafes, delivery (外卖/美团/饿了么), groceries (超市/便利店)
- Transportation: taxi (出租车/滴滴), subway (地铁), bus, gas, parking, car maintenance
- Housing: rent (房租), utilities (水电费), property management (物业费), home maintenance
- Shopping: clothing, electronics, online shopping (淘宝/京东/拼多多)
- Entertainment: movies (电影), games, sports, hobbies
- Healthcare: hospitals (医院), pharmacy (药店), insurance (保险)
- Bills & Utilities: phone (话费), internet (网费), electricity (电费), water (水费), gas (燃气费)
- Education: courses, books, training
- Other: anything that doesn't fit above categories

Return ONLY a valid JSON object with this exact structure:
{
  "expenses": [
    {
      "date": "YYYY-MM-DD",
      "description": "original transaction description",
      "amount": number (always positive, in base currency),
      "category": "Food & Dining|Transportation|Housing|Shopping|Bills & Utilities|Entertainment|Healthcare|Education|Other",
      "merchantName": "extracted merchant name (clean, no payment method)",
      "isRecurring": boolean (true if appears regularly)
    }
  ],
  "metadata": {
    "totalExpenses": sum of all expenses,
    "periodStart": "YYYY-MM-DD" (earliest date),
    "periodEnd": "YYYY-MM-DD" (latest date),
    "categoryBreakdown": {
      "Food & Dining": total_amount,
      "Transportation": total_amount,
      "Housing": total_amount,
      "Shopping": total_amount,
      "Bills & Utilities": total_amount,
      "Entertainment": total_amount,
      "Healthcare": total_amount,
      "Education": total_amount,
      "Other": total_amount
    },
    "topMerchants": [
      {"name": "merchant", "amount": total_spent, "count": number_of_transactions}
    ],
    "recurringExpenses": [
      {
        "date": "YYYY-MM-DD",
        "description": "description",
        "amount": amount,
        "category": "category",
        "merchantName": "merchant",
        "isRecurring": true
      }
    ],
    "averageMonthlySpend": total divided by number of months,
    "missingData": ["list any data quality issues"],
    "insights": {
      "diningOutFrequency": "rarely|occasionally|frequently|very_frequently" (based on restaurant frequency),
      "hasKids": boolean (look for: school, childcare, kids items, family restaurants),
      "hasDebt": boolean (look for: loan, credit card payment, installment, 贷款, 信用卡还款),
      "estimatedIncome": number (for China: spending * 1.8, for US: spending * 1.5),
      "savingsRate": number (estimate 20-30 for moderate spenders),
      "lifestyle": "frugal|moderate|comfortable|luxury" (based on spending level and patterns),
      "transportMode": "public|car|mixed" (check for gas, parking, subway, taxi patterns),
      "location": "city name if detectable from merchants",
      "subscriptionCount": count of recurring monthly services,
      "emergencyFundMonths": 0
    }
  }
}

ACCURACY REQUIREMENTS:
- Every transaction MUST be included
- Amounts must be parsed correctly (watch for decimals)
- Dates must be normalized to YYYY-MM-DD
- Categories must be one of the specified values
- Merchant names should be cleaned (remove payment methods, clean up formatting)
- Calculate averageMonthlySpend by dividing total by months in period
- Detect recurring by finding same merchant with regular intervals`;

    try {
      const response = await this.geminiService.generateResponse(prompt, true);
      const result = JSON.parse(response);
      
      // Basic validation
      if (!result.expenses || !Array.isArray(result.expenses)) {
        throw new Error('Invalid response structure');
      }
      
      // Clean up the data
      result.expenses = result.expenses.map((e: any) => ({
        date: this.validateDate(e.date),
        description: e.description || 'Transaction',
        amount: Math.abs(Number(e.amount) || 0),
        category: e.category || 'Other',
        merchantName: e.merchantName,
        isRecurring: Boolean(e.isRecurring)
      }));
      
      // Ensure metadata has all required fields
      if (!result.metadata) {
        result.metadata = this.generateBasicMetadata(result.expenses);
      }
      
      return {
        expenses: result.expenses,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Error parsing expenses:', error);
      
      // Simple fallback for basic CSV
      try {
        const fallbackData = this.parseBasicCSV(fileContent);
        return fallbackData;
      } catch {
        throw new Error('Unable to parse expense file. Please ensure it contains transaction data.');
      }
    }
  }

  private validateDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {}
    return new Date().toISOString().split('T')[0];
  }

  private parseBasicCSV(content: string): { expenses: ParsedExpense[], metadata: ExpenseMetadata } {
    const lines = content.split('\n').filter(line => line.trim());
    const expenses: ParsedExpense[] = [];
    
    // Skip header
    const startIdx = lines[0] && lines[0].toLowerCase().includes('date') ? 1 : 0;
    
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 3) {
        const amount = Math.abs(parseFloat(parts[2].replace(/[$,]/g, '')));
        if (!isNaN(amount)) {
          expenses.push({
            date: this.validateDate(parts[0]),
            description: parts[1] || 'Transaction',
            amount,
            category: 'Other',
            isRecurring: false
          });
        }
      }
    }
    
    if (expenses.length === 0) {
      throw new Error('No valid transactions found');
    }
    
    return {
      expenses,
      metadata: this.generateBasicMetadata(expenses)
    };
  }

  private generateBasicMetadata(expenses: ParsedExpense[]): ExpenseMetadata {
    const categoryBreakdown: { [key: string]: number } = {};
    let total = 0;
    
    expenses.forEach(e => {
      total += e.amount;
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });
    
    const avgMonthly = total / 3; // Assume 3 months of data
    
    return {
      totalExpenses: total,
      periodStart: expenses[0]?.date || new Date().toISOString().split('T')[0],
      periodEnd: expenses[expenses.length - 1]?.date || new Date().toISOString().split('T')[0],
      categoryBreakdown,
      topMerchants: [],
      recurringExpenses: [],
      averageMonthlySpend: avgMonthly,
      missingData: [],
      insights: {
        diningOutFrequency: 'occasionally',
        hasKids: false,
        hasDebt: false,
        estimatedIncome: Math.round(avgMonthly * 1.5),
        savingsRate: 20,
        lifestyle: avgMonthly < 3000 ? 'frugal' : avgMonthly < 6000 ? 'moderate' : 'comfortable',
        transportMode: 'mixed',
        location: undefined,
        subscriptionCount: 0,
        emergencyFundMonths: 0
      }
    };
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }
}