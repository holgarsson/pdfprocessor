
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedDocument } from '../types/document';
import { formatCurrency } from '../utils/mockData';
import { Separator } from '@/components/ui/separator';
import { FileText, BarChart2, TrendingUp, Calculator } from 'lucide-react';

interface DocumentDetailsProps {
  document: ProcessedDocument;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ document }) => {
  const { data, fileName, uploadDate, processedDate } = document;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
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
        {formatCurrency(value)}
      </span>
    </div>
  );

  return (
    <Card className="shadow-md animate-fade-in h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText size={18} />
          <span className="truncate">{fileName}</span>
        </CardTitle>
        <CardDescription>
          Uploaded: {formatDate(uploadDate)}
          <br />
          Processed: {formatDate(processedDate)}
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
            <FinancialRow label="Gross Profit" value={data.GrossProfit} />
            <FinancialRow label="Staff Costs" value={data.StaffCosts} isNegative={data.StaffCosts < 0} indentLevel={1} />
            <FinancialRow label="Other Operating Expenses" value={data.OtherOperatingExpenses} isNegative={data.OtherOperatingExpenses < 0} indentLevel={1} />
            <FinancialRow label="Depreciation" value={data.Depreciation} isNegative={data.Depreciation < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Interest" value={data.ProfitBeforeInterest} isTotal />
            <FinancialRow label="Financial Income" value={data.FinancialIncome} indentLevel={1} />
            <FinancialRow label="Financial Expenses" value={data.FinancialExpenses} isNegative={data.FinancialExpenses < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Extraordinary Items" value={data.ProfitBeforeExtraordinaryItems} isTotal />
            <FinancialRow label="Extraordinary Items" value={data.ExtraordinaryItems} isNegative={data.ExtraordinaryItems < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Tax" value={data.ProfitBeforeTax} isTotal />
            <FinancialRow label="Tax" value={data.Tax} isNegative={data.Tax < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit After Tax" value={data.ProfitAfterTax} isTotal />
            <FinancialRow label="Annual Result" value={data.AnnualResult} isTotal />
          </TabsContent>
          
          <TabsContent value="balance" className="flex-1 overflow-y-auto pr-1 space-y-1 mt-0">
            <div className="font-semibold mb-2">Assets</div>
            <FinancialRow label="Fixed Assets" value={data.FixedAssets} indentLevel={1} />
            <FinancialRow label="Current Assets" value={data.CurrentAssets} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Total Assets" value={data.TotalAssets} isTotal />
            
            <div className="font-semibold mb-2 mt-6">Equity and Liabilities</div>
            <FinancialRow label="Equity" value={data.Equity} indentLevel={1} />
            <FinancialRow label="Provisions" value={data.Provisions} indentLevel={1} />
            <FinancialRow label="Long Term Liabilities" value={data.LongTermLiabilities} indentLevel={1} />
            <FinancialRow label="Short Term Liabilities" value={data.ShortTermLiabilities} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Total Liabilities" value={data.TotalLiabilities} isTotal />
            <FinancialRow label="Equity and Liabilities" value={data.EquityAndLiabilities} isTotal />
          </TabsContent>
          
          <TabsContent value="metrics" className="flex-1 overflow-y-auto pr-1 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((data.ProfitAfterTax / data.GrossProfit) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Debt-to-Equity Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(data.TotalLiabilities / data.Equity).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Return on Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((data.ProfitAfterTax / data.TotalAssets) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(data.CurrentAssets / data.ShortTermLiabilities).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Staff Cost Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.abs(data.StaffCosts) / data.GrossProfit * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Operating Expense Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.abs(data.OtherOperatingExpenses) / data.GrossProfit * 100).toFixed(1)}%
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
