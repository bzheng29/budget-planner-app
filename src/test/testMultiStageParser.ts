import { MultiStageExpenseParser } from '../services/multiStageExpenseParser';
import type { ParsedExpense, ExpenseMetadata } from '../services/expenseParserService';

interface TestCase {
  name: string;
  description: string;
  csvContent: string;
  expectedResults: {
    stage1: {
      transactionCount: number;
      sampleTransaction?: any;
    };
    stage2: {
      categories: string[];
      totalAmount?: number;
    };
    stage3: {
      recurringCount: number;
      topMerchant?: string;
    };
    stage4: {
      diningFrequency?: string;
      hasKids?: boolean;
      lifestyle?: string;
    };
    stage5: {
      incomeRange?: [number, number];
      savingsRateRange?: [number, number];
    };
  };
}

export class MultiStageParserTester {
  private parser: MultiStageExpenseParser;
  private testResults: any[] = [];
  
  constructor(apiKey: string) {
    this.parser = new MultiStageExpenseParser(apiKey);
  }

  /**
   * Run all test cases
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Multi-Stage Parser Testing Suite\n');
    console.log('=' .repeat(60));
    
    const testCases = this.getTestCases();
    
    for (const testCase of testCases) {
      console.log(`\n📋 Test Case: ${testCase.name}`);
      console.log(`   ${testCase.description}`);
      console.log('-'.repeat(60));
      
      await this.runSingleTest(testCase);
      
      // Add delay between tests to avoid rate limiting
      await this.delay(2000);
    }
    
    this.printTestSummary();
  }

  /**
   * Run a single test case with stage-by-stage verification
   */
  private async runSingleTest(testCase: TestCase): Promise<void> {
    const file = this.createMockFile(testCase.csvContent, `${testCase.name}.csv`);
    const startTime = Date.now();
    
    try {
      // We'll need to modify the parser to expose intermediate results
      // For now, we'll run the full pipeline and verify the final output
      const result = await this.parser.parseExpenseFile(file);
      const duration = Date.now() - startTime;
      
      // Verify results
      const verification = this.verifyResults(testCase, result);
      
      // Store test results
      this.testResults.push({
        testCase: testCase.name,
        duration,
        success: verification.allPassed,
        verification,
        result
      });
      
      // Print verification results
      this.printVerification(verification);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Test failed with error: ${errorMessage}`);
      this.testResults.push({
        testCase: testCase.name,
        duration: Date.now() - startTime,
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * Verify results against expected outcomes
   */
  private verifyResults(
    testCase: TestCase, 
    result: { expenses: ParsedExpense[], metadata: ExpenseMetadata }
  ): any {
    const verifications: any = {
      allPassed: true,
      stages: {}
    };
    
    // Stage 1 & 2 combined verification (transaction count and categories)
    const transactionCount = result.expenses.length;
    const expectedCount = testCase.expectedResults.stage1.transactionCount;
    const countMatch = Math.abs(transactionCount - expectedCount) <= 2; // Allow ±2 variance
    
    verifications.stages.transactions = {
      passed: countMatch,
      expected: expectedCount,
      actual: transactionCount,
      message: countMatch ? '✅ Transaction count matches' : `❌ Expected ~${expectedCount}, got ${transactionCount}`
    };
    
    // Verify categories
    const actualCategories = [...new Set(result.expenses.map(e => e.category))];
    const expectedCategories = testCase.expectedResults.stage2.categories;
    const categoryMatch = expectedCategories.every(cat => actualCategories.includes(cat));
    
    verifications.stages.categories = {
      passed: categoryMatch,
      expected: expectedCategories,
      actual: actualCategories,
      message: categoryMatch ? '✅ Categories correctly identified' : '❌ Missing expected categories'
    };
    
    // Verify recurring expenses
    const recurringCount = result.metadata.recurringExpenses.length;
    const expectedRecurring = testCase.expectedResults.stage3.recurringCount;
    const recurringMatch = Math.abs(recurringCount - expectedRecurring) <= 2;
    
    verifications.stages.recurring = {
      passed: recurringMatch,
      expected: expectedRecurring,
      actual: recurringCount,
      message: recurringMatch ? '✅ Recurring expenses detected' : `❌ Expected ~${expectedRecurring} recurring, got ${recurringCount}`
    };
    
    // Verify lifestyle insights
    if (testCase.expectedResults.stage4.diningFrequency) {
      const diningMatch = result.metadata.insights.diningOutFrequency === testCase.expectedResults.stage4.diningFrequency;
      verifications.stages.dining = {
        passed: diningMatch,
        expected: testCase.expectedResults.stage4.diningFrequency,
        actual: result.metadata.insights.diningOutFrequency,
        message: diningMatch ? '✅ Dining frequency correct' : '❌ Dining frequency mismatch'
      };
    }
    
    // Verify financial assessment
    if (testCase.expectedResults.stage5.incomeRange) {
      const [minIncome, maxIncome] = testCase.expectedResults.stage5.incomeRange;
      const actualIncome = result.metadata.insights.estimatedIncome;
      const incomeInRange = actualIncome >= minIncome && actualIncome <= maxIncome;
      
      verifications.stages.income = {
        passed: incomeInRange,
        expected: `¥${minIncome}-${maxIncome}`,
        actual: `¥${actualIncome}`,
        message: incomeInRange ? '✅ Income estimation in range' : '❌ Income outside expected range'
      };
    }
    
    // Check if all passed
    verifications.allPassed = Object.values(verifications.stages).every((v: any) => v.passed);
    
    return verifications;
  }

  /**
   * Print verification results
   */
  private printVerification(verification: any): void {
    console.log('\n   📊 Verification Results:');
    
    for (const [, result] of Object.entries(verification.stages)) {
      const v = result as any;
      console.log(`      ${v.message}`);
      if (!v.passed && v.expected && v.actual) {
        console.log(`         Expected: ${JSON.stringify(v.expected)}`);
        console.log(`         Actual: ${JSON.stringify(v.actual)}`);
      }
    }
    
    if (verification.allPassed) {
      console.log('\n   ✅ All verifications passed!');
    } else {
      console.log('\n   ⚠️ Some verifications failed');
    }
  }

  /**
   * Print final test summary
   */
  private printTestSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📈 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Average Duration: ${avgDuration.toFixed(0)}ms`);
    
    if (passedTests < totalTests) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.testCase}: ${r.error || 'Verification failed'}`);
      });
    }
  }

  /**
   * Get all test cases
   */
  private getTestCases(): TestCase[] {
    return [
      // Test Case 1: Simple monthly expenses
      {
        name: 'Simple Monthly Expenses',
        description: 'Basic monthly expenses with clear categories',
        csvContent: `Date,Description,Amount
2024-01-01,房租,8000
2024-01-05,地铁充值,100
2024-01-10,美团外卖,45
2024-01-15,超市购物,350
2024-01-20,电费,150
2024-01-25,健身房,299
2024-02-01,房租,8000
2024-02-05,地铁充值,100
2024-02-10,美团外卖,50
2024-02-15,超市购物,380`,
        expectedResults: {
          stage1: { transactionCount: 10 },
          stage2: { 
            categories: ['Housing', 'Transportation', 'Food & Dining', 'Shopping', 'Bills & Utilities'],
            totalAmount: 17474
          },
          stage3: { 
            recurringCount: 3, // 房租, 地铁充值, maybe 美团
            topMerchant: '房租'
          },
          stage4: { 
            diningFrequency: 'rarely',
            hasKids: false,
            lifestyle: 'moderate'
          },
          stage5: { 
            incomeRange: [12000, 18000],
            savingsRateRange: [15, 30]
          }
        }
      },
      
      // Test Case 2: Family with kids
      {
        name: 'Family Expenses',
        description: 'Family with children and education expenses',
        csvContent: `Date,Description,Amount
2024-01-01,房租,12000
2024-01-02,幼儿园学费,3500
2024-01-05,儿童乐园,200
2024-01-08,早教中心,800
2024-01-10,家乐福-购物,680
2024-01-12,儿童医院-检查,300
2024-01-15,美团-家庭餐,220
2024-01-18,滴滴-送孩子上学,35
2024-01-20,儿童服装,450
2024-01-25,奶粉尿不湿,800
2024-02-01,房租,12000
2024-02-02,幼儿园学费,3500`,
        expectedResults: {
          stage1: { transactionCount: 12 },
          stage2: { 
            categories: ['Housing', 'Education', 'Entertainment', 'Healthcare', 'Shopping', 'Food & Dining'],
          },
          stage3: { 
            recurringCount: 2, // 房租, 幼儿园
            topMerchant: '房租'
          },
          stage4: { 
            diningFrequency: 'rarely',
            hasKids: true,
            lifestyle: 'comfortable'
          },
          stage5: { 
            incomeRange: [30000, 45000],
            savingsRateRange: [10, 25]
          }
        }
      },
      
      // Test Case 3: Young professional with debt
      {
        name: 'Young Professional with Debt',
        description: 'High dining/entertainment, has loans',
        csvContent: `Date,Description,Amount
2024-01-01,房租,6500
2024-01-02,星巴克,42
2024-01-03,美团外卖-午餐,38
2024-01-04,美团外卖-晚餐,45
2024-01-05,酒吧,350
2024-01-06,淘宝购物,899
2024-01-07,信用卡还款,5000
2024-01-08,花呗还款,2000
2024-01-09,海底捞,420
2024-01-10,滴滴打车,85
2024-01-11,美团外卖,52
2024-01-12,KTV,580
2024-01-13,健身房,399
2024-01-14,美团外卖,48
2024-01-15,咖啡,38
2024-02-01,房租,6500
2024-02-07,信用卡还款,5000
2024-02-08,花呗还款,2000`,
        expectedResults: {
          stage1: { transactionCount: 18 },
          stage2: { 
            categories: ['Housing', 'Food & Dining', 'Entertainment', 'Shopping', 'Transportation'],
          },
          stage3: { 
            recurringCount: 4, // 房租, 信用卡, 花呗, 健身房
            topMerchant: '房租'
          },
          stage4: { 
            diningFrequency: 'frequently',
            hasKids: false,
            lifestyle: 'comfortable'
          },
          stage5: { 
            incomeRange: [20000, 30000],
            savingsRateRange: [5, 15] // Low due to debt
          }
        }
      },
      
      // Test Case 4: Frugal lifestyle
      {
        name: 'Frugal Lifestyle',
        description: 'Minimal spending, high savings potential',
        csvContent: `Date,Description,Amount
2024-01-01,房租-合租,2500
2024-01-05,地铁月卡,150
2024-01-10,菜市场,180
2024-01-15,水电费,80
2024-01-20,手机话费,39
2024-01-25,理发,30
2024-02-01,房租-合租,2500
2024-02-05,地铁月卡,150
2024-02-10,菜市场,200
2024-02-15,水电费,85`,
        expectedResults: {
          stage1: { transactionCount: 10 },
          stage2: { 
            categories: ['Housing', 'Transportation', 'Food & Dining', 'Bills & Utilities'],
          },
          stage3: { 
            recurringCount: 4, // Most are recurring
            topMerchant: '房租'
          },
          stage4: { 
            diningFrequency: 'rarely',
            hasKids: false,
            lifestyle: 'frugal'
          },
          stage5: { 
            incomeRange: [6000, 10000],
            savingsRateRange: [30, 50] // High savings rate
          }
        }
      },
      
      // Test Case 5: Complex mixed language
      {
        name: 'Mixed Language Complex',
        description: 'English and Chinese mixed, various payment methods',
        csvContent: `Date,Description,Amount,Payment
2024-01-01,Monthly Rent - 朝阳区,9500,Bank Transfer
2024-01-02,Starbucks Coffee,45,支付宝
2024-01-03,Uber to 三里屯,58,微信支付
2024-01-04,Walmart 购物,425.50,信用卡
2024-01-05,Netflix订阅,98,自动扣款
2024-01-06,京东-iPhone,8999,花呗分期
2024-01-07,Gym Membership,399,现金
2024-01-08,团建dinner,650,公司报销
2024-02-01,Monthly Rent - 朝阳区,9500,Bank Transfer
2024-02-05,Netflix订阅,98,自动扣款`,
        expectedResults: {
          stage1: { transactionCount: 10 },
          stage2: { 
            categories: ['Housing', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment'],
          },
          stage3: { 
            recurringCount: 3, // Rent, Netflix, Gym
            topMerchant: 'Monthly Rent'
          },
          stage4: { 
            diningFrequency: 'occasionally',
            hasKids: false,
            lifestyle: 'comfortable'
          },
          stage5: { 
            incomeRange: [25000, 35000],
            savingsRateRange: [15, 25]
          }
        }
      }
    ];
  }

  /**
   * Helper: Create mock File object from CSV string
   */
  private createMockFile(content: string, filename: string): File {
    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], filename, { type: 'text/csv' });
  }

  /**
   * Helper: Delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export function to run tests
export async function runMultiStageParserTests(apiKey: string): Promise<void> {
  const tester = new MultiStageParserTester(apiKey);
  await tester.runAllTests();
}