import { ProcessedDocument } from '../types';
import { config } from '../config';

const API_BASE_URL = `${config.apiUrl}/api`;

// Cache to store uploaded files
const fileCache = new Map<string, File>();

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
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    const data = await response.json();
    console.log('Raw API response:', data); // Debug log

    return data.map((doc: any) => {
      if (!doc.id) {
        console.warn('Document missing ID:', doc); // Debug log
      }
      
      return {
        id: doc.id || doc.filePath.split('\\').pop()?.split('/').pop() || String(Date.now()), // Ensure id is always set with a fallback
        companyId: doc.financialData?.companyId?.toString() || '',
        companyName: doc.financialData?.companyName || 'Unknown Company',
        fileName: doc.filePath.split('\\').pop(),
        uploadDate: new Date(doc.processedTime),
        processedDate: new Date(doc.processedTime),
        file: null,
        data: {
          GrossProfit: doc.financialData?.grossProfit || 0,
          StaffCosts: doc.financialData?.staffCosts || 0,
          OtherOperatingExpenses: doc.financialData?.otherOperatingExpenses || 0,
          Depreciation: doc.financialData?.depreciation || 0,
          ProfitBeforeInterest: doc.financialData?.profitBeforeInterest || 0,
          FinancialIncome: doc.financialData?.financialIncome || 0,
          FinancialExpenses: doc.financialData?.financialExpenses || 0,
          ProfitBeforeExtraordinaryItems: doc.financialData?.profitBeforeExtraordinaryItems || 0,
          ExtraordinaryItems: doc.financialData?.extraordinaryItems || 0,
          ProfitBeforeTax: doc.financialData?.profitBeforeTax || 0,
          Tax: doc.financialData?.tax || 0,
          ProfitAfterTax: doc.financialData?.profitAfterTax || 0,
          AnnualResult: doc.financialData?.annualResult || 0,
          FixedAssets: doc.financialData?.fixedAssets || 0,
          CurrentAssets: doc.financialData?.currentAssets || 0,
          TotalAssets: doc.financialData?.totalAssets || 0,
          Equity: doc.financialData?.equity || 0,
          Provisions: doc.financialData?.provisions || 0,
          LongTermLiabilities: doc.financialData?.longTermLiabilities || 0,
          ShortTermLiabilities: doc.financialData?.shortTermLiabilities || 0,
          TotalLiabilities: doc.financialData?.totalLiabilities || 0,
          EquityAndLiabilities: doc.financialData?.equityAndLiabilities || 0
        }
      };
    });
  },

  // Get a single document by ID
  async getDocument(id: string): Promise<ProcessedDocument> {
    const response = await fetch(`${API_BASE_URL}/pdf/processed/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    const data = await response.json();
    return {
      id: data.id,
      companyId: data.financialData?.companyId?.toString() || '',
      companyName: data.financialData?.companyName || 'Unknown Company',
      fileName: data.filePath.split('\\').pop(),
      uploadDate: new Date(data.processedTime),
      processedDate: new Date(data.processedTime),
      file: null,
      data: {
        GrossProfit: data.financialData?.grossProfit || 0,
        StaffCosts: data.financialData?.staffCosts || 0,
        OtherOperatingExpenses: data.financialData?.otherOperatingExpenses || 0,
        Depreciation: data.financialData?.depreciation || 0,
        ProfitBeforeInterest: data.financialData?.profitBeforeInterest || 0,
        FinancialIncome: data.financialData?.financialIncome || 0,
        FinancialExpenses: data.financialData?.financialExpenses || 0,
        ProfitBeforeExtraordinaryItems: data.financialData?.profitBeforeExtraordinaryItems || 0,
        ExtraordinaryItems: data.financialData?.extraordinaryItems || 0,
        ProfitBeforeTax: data.financialData?.profitBeforeTax || 0,
        Tax: data.financialData?.tax || 0,
        ProfitAfterTax: data.financialData?.profitAfterTax || 0,
        AnnualResult: data.financialData?.annualResult || 0,
        FixedAssets: data.financialData?.fixedAssets || 0,
        CurrentAssets: data.financialData?.currentAssets || 0,
        TotalAssets: data.financialData?.totalAssets || 0,
        Equity: data.financialData?.equity || 0,
        Provisions: data.financialData?.provisions || 0,
        LongTermLiabilities: data.financialData?.longTermLiabilities || 0,
        ShortTermLiabilities: data.financialData?.shortTermLiabilities || 0,
        TotalLiabilities: data.financialData?.totalLiabilities || 0,
        EquityAndLiabilities: data.financialData?.equityAndLiabilities || 0
      }
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

    // Store the file in memory cache
    fileCache.set(fileName, file);

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
      id: result.results[0].id,
      companyId: processedFile.financialData?.companyId?.toString() || '',
      companyName: processedFile.financialData?.companyName || 'Unknown Company',
      fileName: fileName,
      uploadDate: new Date(),
      processedDate: new Date(processedFile.processedTime),
      data: transformedData,
      file: file
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
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
    }).format(value);
  },

  async getPdfFile(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/pdf/file/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('File not found');
      }
      throw new Error('Failed to fetch PDF file');
    }

    return response.blob();
  }
}; 