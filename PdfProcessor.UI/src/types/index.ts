export interface ProcessedDocument {
    id: string;
    companyId: string;
    companyName: string;
    fileName: string;
    uploadDate: Date;
    processedDate: Date;
    file: File | null;
    data: {
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
    };
} 