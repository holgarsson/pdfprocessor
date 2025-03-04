import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedDocument } from '../types/document';
import { Separator } from '@/components/ui/separator';
import { FileText, BarChart2, TrendingUp, Calculator, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface DocumentDetailsProps {
  document: ProcessedDocument | null;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ document }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<ProcessedDocument | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!document) return;

      try {
        setLoading(true);
        setError(null);
        const data = await api.getDocument(document.id);
        setDetails(data);
      } catch (err) {
        console.error('Error fetching document details:', err);
        setError('Failed to load document details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [document]);

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select a document to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  const doc = details || document;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const FinancialRow = ({ 
    label, 
    value, 
    isTotal = false,
    isNegative = false,
    indentLevel = 0
  }: { 
    label: string; 
    value: number;
    isTotal?: boolean;
    isNegative?: boolean;
    indentLevel?: number;
  }) => (
    <div className={`flex justify-between py-2 ${isTotal ? 'font-semibold' : ''}`}>
      <span className={`${indentLevel > 0 ? `pl-${indentLevel * 4}` : ''}`}>
        {label}
      </span>
      <span className={isNegative ? 'text-destructive' : ''}>
        {api.formatCurrency(value)}
      </span>
    </div>
  );

  return (
    <Card className="shadow-md animate-fade-in h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText size={18} />
          <span className="truncate">{doc.fileName}</span>
        </CardTitle>
        <CardDescription>
          Uploaded: {formatDate(new Date(doc.uploadDate))}
          <br />
          Processed: {formatDate(new Date(doc.processedDate))}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pb-0">
        <Tabs defaultValue="income" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="income" className="flex items-center gap-1">
              <BarChart2 size={14} />
              <span>Income Statement</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-1">
              <Calculator size={14} />
              <span>Balance Sheet</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span>Key Metrics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="flex-1 overflow-y-auto pr-1 space-y-1 mt-0">
            <FinancialRow label="Gross Profit" value={doc.data.GrossProfit} />
            <FinancialRow label="Staff Costs" value={doc.data.StaffCosts} isNegative={doc.data.StaffCosts < 0} indentLevel={1} />
            <FinancialRow label="Other Operating Expenses" value={doc.data.OtherOperatingExpenses} isNegative={doc.data.OtherOperatingExpenses < 0} indentLevel={1} />
            <FinancialRow label="Depreciation" value={doc.data.Depreciation} isNegative={doc.data.Depreciation < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Interest" value={doc.data.ProfitBeforeInterest} isTotal />
            <FinancialRow label="Financial Income" value={doc.data.FinancialIncome} indentLevel={1} />
            <FinancialRow label="Financial Expenses" value={doc.data.FinancialExpenses} isNegative={doc.data.FinancialExpenses < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Extraordinary Items" value={doc.data.ProfitBeforeExtraordinaryItems} isTotal />
            <FinancialRow label="Extraordinary Items" value={doc.data.ExtraordinaryItems} isNegative={doc.data.ExtraordinaryItems < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Tax" value={doc.data.ProfitBeforeTax} isTotal />
            <FinancialRow label="Tax" value={doc.data.Tax} isNegative={doc.data.Tax < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit After Tax" value={doc.data.ProfitAfterTax} isTotal />
            <FinancialRow label="Annual Result" value={doc.data.AnnualResult} isTotal />
          </TabsContent>
          
          <TabsContent value="balance" className="flex-1 overflow-y-auto pr-1 space-y-1 mt-0">
            <div className="font-semibold mb-2">Assets</div>
            <FinancialRow label="Fixed Assets" value={doc.data.FixedAssets} indentLevel={1} />
            <FinancialRow label="Current Assets" value={doc.data.CurrentAssets} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Total Assets" value={doc.data.TotalAssets} isTotal />
            
            <div className="font-semibold mb-2 mt-6">Equity and Liabilities</div>
            <FinancialRow label="Equity" value={doc.data.Equity} indentLevel={1} />
            <FinancialRow label="Provisions" value={doc.data.Provisions} indentLevel={1} />
            <FinancialRow label="Long Term Liabilities" value={doc.data.LongTermLiabilities} indentLevel={1} />
            <FinancialRow label="Short Term Liabilities" value={doc.data.ShortTermLiabilities} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Total Liabilities" value={doc.data.TotalLiabilities} isTotal />
            <FinancialRow label="Equity and Liabilities" value={doc.data.EquityAndLiabilities} isTotal />
          </TabsContent>
          
          <TabsContent value="metrics" className="flex-1 overflow-y-auto pr-1 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((doc.data.ProfitAfterTax / doc.data.GrossProfit) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Debt-to-Equity Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(doc.data.TotalLiabilities / doc.data.Equity).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Return on Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((doc.data.ProfitAfterTax / doc.data.TotalAssets) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(doc.data.CurrentAssets / doc.data.ShortTermLiabilities).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Staff Cost Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.abs(doc.data.StaffCosts) / doc.data.GrossProfit * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Operating Expense Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.abs(doc.data.OtherOperatingExpenses) / doc.data.GrossProfit * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DocumentDetails;
