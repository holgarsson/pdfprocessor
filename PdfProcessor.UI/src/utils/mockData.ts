
import { FinancialStatement, ProcessedDocument } from '../types/document';

const companyNames = [
  "Acme Corporation", "Globex Corp", "Soylent Industries", "Initech LLC", 
  "Massive Dynamic", "Stark Industries", "Wayne Enterprises", "Umbrella Corp", 
  "Cyberdyne Systems", "Weyland-Yutani", "Oscorp Industries", "Aperture Science",
  "Tyrell Corporation", "Rekall Inc", "Gringotts Bank", "InGen Technologies",
  "Virtucon Industries", "Xanatos Enterprises", "LexCorp", "Omni Consumer Products"
];

export const generateMockData = (count: number): ProcessedDocument[] => {
  return Array.from({ length: count }).map((_, index) => {
    // Base numbers for this document
    const baseProfit = Math.round(900000 + Math.random() * 700000);
    const staffCostPercent = 0.3 + Math.random() * 0.15;
    const opExPercent = 0.1 + Math.random() * 0.1;
    const depreciationPercent = 0.05 + Math.random() * 0.05;
    
    // Calculate income statement values
    const grossProfit = baseProfit;
    const staffCosts = -Math.round(grossProfit * staffCostPercent);
    const otherOpEx = -Math.round(grossProfit * opExPercent);
    const depreciation = -Math.round(grossProfit * depreciationPercent);
    const profitBeforeInt = grossProfit + staffCosts + otherOpEx + depreciation;
    
    const finIncome = Math.round(grossProfit * 0.01 * Math.random());
    const finExpenses = -Math.round(grossProfit * 0.02 * Math.random());
    const profitBeforeExtra = profitBeforeInt + finIncome + finExpenses;
    
    const extraItems = -Math.round(grossProfit * 0.01 * Math.random());
    const profitBeforeTax = profitBeforeExtra + extraItems;
    
    const tax = Math.round(profitBeforeTax * -0.25);
    const profitAfterTax = profitBeforeTax + tax;
    const annualResult = profitAfterTax;
    
    // Balance sheet values
    const fixedAssets = Math.round(grossProfit * (1.3 + Math.random() * 0.7));
    const currentAssets = Math.round(grossProfit * (0.5 + Math.random() * 0.5));
    const totalAssets = fixedAssets + currentAssets;
    
    const equity = Math.round(totalAssets * (0.4 + Math.random() * 0.2));
    const provisions = Math.round(totalAssets * (0.05 + Math.random() * 0.05));
    const longTermLiab = Math.round(totalAssets * (0.2 + Math.random() * 0.15));
    const shortTermLiab = totalAssets - equity - provisions - longTermLiab;
    const totalLiabilities = provisions + longTermLiab + shortTermLiab;
    
    const data: FinancialStatement = {
      GrossProfit: grossProfit,
      StaffCosts: staffCosts,
      OtherOperatingExpenses: otherOpEx,
      Depreciation: depreciation,
      ProfitBeforeInterest: profitBeforeInt,
      FinancialIncome: finIncome,
      FinancialExpenses: finExpenses,
      ProfitBeforeExtraordinaryItems: profitBeforeExtra,
      ExtraordinaryItems: extraItems,
      ProfitBeforeTax: profitBeforeTax,
      Tax: tax,
      ProfitAfterTax: profitAfterTax,
      AnnualResult: annualResult,
      FixedAssets: fixedAssets,
      CurrentAssets: currentAssets,
      TotalAssets: totalAssets,
      Equity: equity,
      Provisions: provisions,
      LongTermLiabilities: longTermLiab,
      ShortTermLiabilities: shortTermLiab,
      TotalLiabilities: totalLiabilities,
      EquityAndLiabilities: totalAssets
    };
    
    // Generate random dates within the last year
    const now = new Date();
    const uploadDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const processedDate = new Date(uploadDate.getTime() + (10 + Math.random() * 60) * 60 * 1000);
    
    // Generate company information
    const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const companyId = `C${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
    
    return {
      id: `doc-${index + 1}`,
      companyId,
      companyName,
      fileName: `Financial_Statement_${index + 1}.pdf`,
      uploadDate,
      processedDate,
      data
    };
  });
};

// Simulate processing delay
export const processFile = (file: File): Promise<FinancialStatement> => {
  return new Promise((resolve) => {
    // Simulate processing time based on file size
    const processingTime = 2000 + Math.random() * 5000;
    
    setTimeout(() => {
      // Generate a random financial statement
      const baseProfit = Math.round(900000 + Math.random() * 700000);
      const staffCostPercent = 0.3 + Math.random() * 0.15;
      const opExPercent = 0.1 + Math.random() * 0.1;
      const depreciationPercent = 0.05 + Math.random() * 0.05;
      
      const grossProfit = baseProfit;
      const staffCosts = -Math.round(grossProfit * staffCostPercent);
      const otherOpEx = -Math.round(grossProfit * opExPercent);
      const depreciation = -Math.round(grossProfit * depreciationPercent);
      const profitBeforeInt = grossProfit + staffCosts + otherOpEx + depreciation;
      
      const finIncome = Math.round(grossProfit * 0.01 * Math.random());
      const finExpenses = -Math.round(grossProfit * 0.02 * Math.random());
      const profitBeforeExtra = profitBeforeInt + finIncome + finExpenses;
      
      const extraItems = -Math.round(grossProfit * 0.01 * Math.random());
      const profitBeforeTax = profitBeforeExtra + extraItems;
      
      const tax = Math.round(profitBeforeTax * -0.25);
      const profitAfterTax = profitBeforeTax + tax;
      const annualResult = profitAfterTax;
      
      const fixedAssets = Math.round(grossProfit * (1.3 + Math.random() * 0.7));
      const currentAssets = Math.round(grossProfit * (0.5 + Math.random() * 0.5));
      const totalAssets = fixedAssets + currentAssets;
      
      const equity = Math.round(totalAssets * (0.4 + Math.random() * 0.2));
      const provisions = Math.round(totalAssets * (0.05 + Math.random() * 0.05));
      const longTermLiab = Math.round(totalAssets * (0.2 + Math.random() * 0.15));
      const shortTermLiab = totalAssets - equity - provisions - longTermLiab;
      const totalLiabilities = provisions + longTermLiab + shortTermLiab;
      
      resolve({
        GrossProfit: grossProfit,
        StaffCosts: staffCosts,
        OtherOperatingExpenses: otherOpEx,
        Depreciation: depreciation,
        ProfitBeforeInterest: profitBeforeInt,
        FinancialIncome: finIncome,
        FinancialExpenses: finExpenses,
        ProfitBeforeExtraordinaryItems: profitBeforeExtra,
        ExtraordinaryItems: extraItems,
        ProfitBeforeTax: profitBeforeTax,
        Tax: tax,
        ProfitAfterTax: profitAfterTax,
        AnnualResult: annualResult,
        FixedAssets: fixedAssets,
        CurrentAssets: currentAssets,
        TotalAssets: totalAssets,
        Equity: equity,
        Provisions: provisions,
        LongTermLiabilities: longTermLiab,
        ShortTermLiabilities: shortTermLiab,
        TotalLiabilities: totalLiabilities,
        EquityAndLiabilities: totalAssets
      });
    }, processingTime);
  });
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
