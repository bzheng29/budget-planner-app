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
    
    const prompt = `Analyze this expense data file and extract ALL information needed for budget planning.

File name: ${file.name}
Content:
${fileContent}

Please analyze and return a comprehensive JSON response with:
1. Parse all transactions into structured data
2. Calculate spending patterns and statistics
3. Generate lifestyle insights based on spending

Return ONLY a valid JSON object with this exact structure:
{
  "expenses": [
    {
      "date": "YYYY-MM-DD",
      "description": "transaction description",
      "amount": number (positive),
      "category": "Food & Dining|Transportation|Housing|Shopping|Bills & Utilities|Entertainment|Healthcare|Other",
      "merchantName": "extracted merchant name",
      "isRecurring": boolean
    }
  ],
  "metadata": {
    "totalExpenses": total sum,
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "categoryBreakdown": {
      "category_name": amount
    },
    "topMerchants": [
      {"name": "merchant", "amount": total, "count": occurrences}
    ],
    "recurringExpenses": [array of recurring expense objects],
    "averageMonthlySpend": calculated average,
    "missingData": ["any important missing data"],
    "insights": {
      "diningOutFrequency": "rarely|occasionally|frequently|very_frequently",
      "hasKids": boolean (detect from family restaurants, school expenses, childcare),
      "hasDebt": boolean (detect from loan payments, credit card payments),
      "estimatedIncome": number (estimate 1.3-2x of spending),
      "savingsRate": number (0-100 percentage),
      "lifestyle": "frugal|moderate|comfortable|luxury",
      "transportMode": "public|car|mixed",
      "location": "city name if detectable",
      "subscriptionCount": number of subscriptions,
      "emergencyFundMonths": 0
    }
  }
}

Important:
- Parse dates in any format to YYYY-MM-DD
- Categorize intelligently based on merchant names and descriptions
- Identify recurring expenses (same merchant, regular intervals)
- Calculate realistic income estimates based on spending level
- Detect lifestyle patterns from spending habits`;

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