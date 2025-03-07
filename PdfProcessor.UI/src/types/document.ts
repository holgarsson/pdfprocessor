export interface FinancialStatement {
  GrossProfit: number;
  StaffCosts: number;
  OtherOperatingExpenses: number;
  Depreciation: number;
  ProfitBeforeInterest: number;
  FinancialIncome: number;
  FinancialExpenses: number;
  ProfitBeforeExtraordinaryItems: number;
  ExtraordinaryItems: number;
  ProfitBeforeTax: number;
  Tax: number;
  ProfitAfterTax: number;
  AnnualResult: number;
  FixedAssets: number;
  CurrentAssets: number;
  TotalAssets: number;
  Equity: number;
  Provisions: number;
  LongTermLiabilities: number;
  ShortTermLiabilities: number;
  TotalLiabilities: number;
  EquityAndLiabilities: number;
}

export interface ProcessedDocument {
  id: string;
  companyId: string;
  companyName: string;
  fileName: string;
  uploadDate: Date;
  processedDate: Date;
  data: FinancialStatement;
  file: File;
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
