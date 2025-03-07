export interface FinancialData {
  companyId: number;
  companyName: string;
  grossProfit: number | null;
  staffCosts: number | null;
  otherOperatingExpenses: number | null;
  depreciation: number | null;
  profitBeforeInterest: number | null;
  financialIncome: number | null;
  financialExpenses: number | null;
  profitBeforeExtraordinaryItems: number | null;
  extraordinaryItems: number | null;
  profitBeforeTax: number | null;
  tax: number | null;
  profitAfterTax: number | null;
  annualResult: number | null;
  fixedAssets: number | null;
  currentAssets: number | null;
  totalAssets: number | null;
  equity: number | null;
  provisions: number | null;
  longTermLiabilities: number | null;
  shortTermLiabilities: number | null;
  totalLiabilities: number | null;
  equityAndLiabilities: number | null;
}

export interface ProcessedDocument {
  id: string;
  filePath: string;
  processedTime: string;
  financialData: FinancialData;
}

export interface ProcessingFile {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
}

export type User = {
  id: string;
  username: string;
};
