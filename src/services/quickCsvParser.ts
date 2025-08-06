export interface QuickParseResult {
  totalAmount: number;
  transactionCount: number;
  dateRange: { start: string; end: string };
  averageTransaction: number;
  preview: Array<{
    date: string;
    description: string;
    amount: number;
  }>;
}

export function quickParseCSV(content: string): QuickParseResult | null {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    // Try to detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('date') || firstLine.includes('amount') || firstLine.includes('description');
    const dataStartIndex = hasHeader ? 1 : 0;

    let totalAmount = 0;
    let transactionCount = 0;
    const dates: string[] = [];
    const preview: QuickParseResult['preview'] = [];

    // Parse each line
    for (let i = dataStartIndex; i < lines.length && i < dataStartIndex + 100; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Split by comma or tab
      const parts = line.split(/[,\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 2) continue;

      // Try to find amount (usually a number with optional $ or ¥)
      let amount = 0;
      let dateStr = '';
      let description = '';

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        
        // Check if it's an amount
        const cleanAmount = part.replace(/[$¥,]/g, '');
        const parsedAmount = parseFloat(cleanAmount);
        if (!isNaN(parsedAmount) && parsedAmount !== 0) {
          amount = Math.abs(parsedAmount);
        }

        // Check if it's a date
        if (part.match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/) || part.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/)) {
          dateStr = part;
          dates.push(dateStr);
        }

        // Use as description if it's not a number or date
        if (isNaN(parseFloat(cleanAmount)) && !dateStr && part.length > 3) {
          description = part;
        }
      }

      if (amount > 0) {
        totalAmount += amount;
        transactionCount++;

        if (preview.length < 5) {
          preview.push({
            date: dateStr || '未知日期',
            description: description || '交易',
            amount
          });
        }
      }
    }

    if (transactionCount === 0) return null;

    // Sort dates to find range
    dates.sort();
    const dateRange = {
      start: dates[0] || '未知',
      end: dates[dates.length - 1] || '未知'
    };

    return {
      totalAmount,
      transactionCount,
      dateRange,
      averageTransaction: totalAmount / transactionCount,
      preview
    };
  } catch (error) {
    console.error('Quick parse error:', error);
    return null;
  }
}