import { ProcessedDocument, FinancialStatement } from '../types/document';
import { config } from '../config';

const API_BASE_URL = `${config.apiUrl}/api`;

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Common headers for authenticated requests
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const api = {
  // Get all processed documents
  async getDocuments(): Promise<ProcessedDocument[]> {
    const response = await fetch(`${API_BASE_URL}/pdf/processed`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch documents');
    }
    const data = await response.json();
    
    // Transform the backend ProcessedFile model to our frontend ProcessedDocument model
    return data.map((file: any) => {
      // Extract just the filename without the path
      const fileName = file.filePath.split('\\').pop()?.split('/').pop() || '';
      
      // Transform financial data from camelCase to PascalCase
      const transformedData = {
        GrossProfit: file.financialData?.grossProfit || 0,
        StaffCosts: file.financialData?.staffCosts || 0,
        OtherOperatingExpenses: file.financialData?.otherOperatingExpenses || 0,
        Depreciation: file.financialData?.depreciation || 0,
        ProfitBeforeInterest: file.financialData?.profitBeforeInterest || 0,
        FinancialIncome: file.financialData?.financialIncome || 0,
        FinancialExpenses: file.financialData?.financialExpenses || 0,
        ProfitBeforeExtraordinaryItems: file.financialData?.profitBeforeExtraordinaryItems || 0,
        ExtraordinaryItems: file.financialData?.extraordinaryItems || 0,
        ProfitBeforeTax: file.financialData?.profitBeforeTax || 0,
        Tax: file.financialData?.tax || 0,
        ProfitAfterTax: file.financialData?.profitAfterTax || 0,
        AnnualResult: file.financialData?.annualResult || 0,
        FixedAssets: file.financialData?.fixedAssets || 0,
        CurrentAssets: file.financialData?.currentAssets || 0,
        TotalAssets: file.financialData?.totalAssets || 0,
        Equity: file.financialData?.equity || 0,
        Provisions: file.financialData?.provisions || 0,
        LongTermLiabilities: file.financialData?.longTermLiabilities || 0,
        ShortTermLiabilities: file.financialData?.shortTermLiabilities || 0,
        TotalLiabilities: file.financialData?.totalLiabilities || 0,
        EquityAndLiabilities: file.financialData?.equityAndLiabilities || 0
      };

      return {
        id: fileName,
        companyId: file.financialData?.companyId?.toString() || '',
        companyName: file.financialData?.companyName || 'Unknown Company',
        fileName: fileName,
        uploadDate: new Date(file.processedTime),
        processedDate: new Date(file.processedTime),
        data: transformedData
      };
    });
  },

  // Get a single document by ID
  async getDocument(id: string): Promise<ProcessedDocument> {
    const response = await fetch(`${API_BASE_URL}/pdf/processed/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch document');
    }
    const file = await response.json();
    
    // Extract just the filename without the path
    const fileName = file.filePath.split('\\').pop()?.split('/').pop() || '';
    
    // Transform financial data from camelCase to PascalCase
    const transformedData = {
      GrossProfit: file.financialData?.grossProfit || 0,
      StaffCosts: file.financialData?.staffCosts || 0,
      OtherOperatingExpenses: file.financialData?.otherOperatingExpenses || 0,
      Depreciation: file.financialData?.depreciation || 0,
      ProfitBeforeInterest: file.financialData?.profitBeforeInterest || 0,
      FinancialIncome: file.financialData?.financialIncome || 0,
      FinancialExpenses: file.financialData?.financialExpenses || 0,
      ProfitBeforeExtraordinaryItems: file.financialData?.profitBeforeExtraordinaryItems || 0,
      ExtraordinaryItems: file.financialData?.extraordinaryItems || 0,
      ProfitBeforeTax: file.financialData?.profitBeforeTax || 0,
      Tax: file.financialData?.tax || 0,
      ProfitAfterTax: file.financialData?.profitAfterTax || 0,
      AnnualResult: file.financialData?.annualResult || 0,
      FixedAssets: file.financialData?.fixedAssets || 0,
      CurrentAssets: file.financialData?.currentAssets || 0,
      TotalAssets: file.financialData?.totalAssets || 0,
      Equity: file.financialData?.equity || 0,
      Provisions: file.financialData?.provisions || 0,
      LongTermLiabilities: file.financialData?.longTermLiabilities || 0,
      ShortTermLiabilities: file.financialData?.shortTermLiabilities || 0,
      TotalLiabilities: file.financialData?.totalLiabilities || 0,
      EquityAndLiabilities: file.financialData?.equityAndLiabilities || 0
    };
    
    return {
      id: fileName,
      companyId: file.financialData?.companyId?.toString() || '',
      companyName: file.financialData?.companyName || 'Unknown Company',
      fileName: fileName,
      uploadDate: new Date(file.processedTime),
      processedDate: new Date(file.processedTime),
      data: transformedData
    };
  },

  // Upload a new document
  async uploadDocument(file: File): Promise<ProcessedDocument> {
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(`${API_BASE_URL}/pdf/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to upload document');
    }
    const result = await response.json();
    
    if (!result.results?.[0]?.processedFile?.financialData) {
      throw new Error('Invalid response format from server');
    }

    const processedFile = result.results[0].processedFile;
    const fileName = processedFile.filePath.split('\\').pop()?.split('/').pop() || '';

    // Transform financial data from camelCase to PascalCase
    const transformedData = {
      GrossProfit: processedFile.financialData?.grossProfit || 0,
      StaffCosts: processedFile.financialData?.staffCosts || 0,
      OtherOperatingExpenses: processedFile.financialData?.otherOperatingExpenses || 0,
      Depreciation: processedFile.financialData?.depreciation || 0,
      ProfitBeforeInterest: processedFile.financialData?.profitBeforeInterest || 0,
      FinancialIncome: processedFile.financialData?.financialIncome || 0,
      FinancialExpenses: processedFile.financialData?.financialExpenses || 0,
      ProfitBeforeExtraordinaryItems: processedFile.financialData?.profitBeforeExtraordinaryItems || 0,
      ExtraordinaryItems: processedFile.financialData?.extraordinaryItems || 0,
      ProfitBeforeTax: processedFile.financialData?.profitBeforeTax || 0,
      Tax: processedFile.financialData?.tax || 0,
      ProfitAfterTax: processedFile.financialData?.profitAfterTax || 0,
      AnnualResult: processedFile.financialData?.annualResult || 0,
      FixedAssets: processedFile.financialData?.fixedAssets || 0,
      CurrentAssets: processedFile.financialData?.currentAssets || 0,
      TotalAssets: processedFile.financialData?.totalAssets || 0,
      Equity: processedFile.financialData?.equity || 0,
      Provisions: processedFile.financialData?.provisions || 0,
      LongTermLiabilities: processedFile.financialData?.longTermLiabilities || 0,
      ShortTermLiabilities: processedFile.financialData?.shortTermLiabilities || 0,
      TotalLiabilities: processedFile.financialData?.totalLiabilities || 0,
      EquityAndLiabilities: processedFile.financialData?.equityAndLiabilities || 0
    };

    return {
      id: fileName,
      companyId: processedFile.financialData?.companyId?.toString() || '',
      companyName: processedFile.financialData?.companyName || 'Unknown Company',
      fileName: fileName,
      uploadDate: new Date(),
      processedDate: new Date(processedFile.processedTime),
      data: transformedData
    };
  },

  // Get document processing status
  async getProcessingStatus(id: string): Promise<{ status: string; progress: number }> {
    const response = await fetch(`${API_BASE_URL}/pdf/status/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch processing status');
    }
    return response.json();
  },

  // Format currency values
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
}; 