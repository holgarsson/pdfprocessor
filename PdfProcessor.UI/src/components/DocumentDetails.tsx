import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedDocument } from '../types/document';
import { Separator } from '@/components/ui/separator';
import { FileText, BarChart2, TrendingUp, Calculator } from 'lucide-react';
import { api } from '../services/api';

interface DocumentDetailsProps {
  document: ProcessedDocument | null;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ document }) => {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Vel eitt skjal fyri meira upplýsingar
      </div>
    );
  }

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
          <span className="truncate">{`${document.companyId} - ${document.companyName}`}</span>
        </CardTitle>
        <CardDescription>
          Innlisið: {formatDate(new Date(document.uploadDate))}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pb-0">
        <Tabs defaultValue="income" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="income" className="flex items-center gap-1">
              <BarChart2 size={14} />
              <span>Rakstur</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-1">
              <Calculator size={14} />
              <span>Ogn og Skyldir</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span>Lyklatøl</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="flex-1 overflow-y-auto pr-1 space-y-1 mt-0">
            <FinancialRow label="Gross Profit" value={document.data.GrossProfit} />
            <FinancialRow label="Staff Costs" value={document.data.StaffCosts} isNegative={document.data.StaffCosts < 0} indentLevel={1} />
            <FinancialRow label="Other Operating Expenses" value={document.data.OtherOperatingExpenses} isNegative={document.data.OtherOperatingExpenses < 0} indentLevel={1} />
            <FinancialRow label="Depreciation" value={document.data.Depreciation} isNegative={document.data.Depreciation < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Interest" value={document.data.ProfitBeforeInterest} isTotal />
            <FinancialRow label="Financial Income" value={document.data.FinancialIncome} indentLevel={1} />
            <FinancialRow label="Financial Expenses" value={document.data.FinancialExpenses} isNegative={document.data.FinancialExpenses < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Extraordinary Items" value={document.data.ProfitBeforeExtraordinaryItems} isTotal />
            <FinancialRow label="Extraordinary Items" value={document.data.ExtraordinaryItems} isNegative={document.data.ExtraordinaryItems < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit Before Tax" value={document.data.ProfitBeforeTax} isTotal />
            <FinancialRow label="Tax" value={document.data.Tax} isNegative={document.data.Tax < 0} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Profit After Tax" value={document.data.ProfitAfterTax} isTotal />
            <FinancialRow label="Annual Result" value={document.data.AnnualResult} isTotal />
          </TabsContent>
          
          <TabsContent value="balance" className="flex-1 overflow-y-auto pr-1 space-y-1 mt-0">
            <div className="font-semibold mb-2">Ogn</div>
            <FinancialRow label="Fixed Assets" value={document.data.FixedAssets} indentLevel={1} />
            <FinancialRow label="Current Assets" value={document.data.CurrentAssets} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Total Assets" value={document.data.TotalAssets} isTotal />
            
            <div className="font-semibold mb-2 mt-6">Equity and Liabilities</div>
            <FinancialRow label="Equity" value={document.data.Equity} indentLevel={1} />
            <FinancialRow label="Provisions" value={document.data.Provisions} indentLevel={1} />
            <FinancialRow label="Long Term Liabilities" value={document.data.LongTermLiabilities} indentLevel={1} />
            <FinancialRow label="Short Term Liabilities" value={document.data.ShortTermLiabilities} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label="Total Liabilities" value={document.data.TotalLiabilities} isTotal />
            <FinancialRow label="Equity and Liabilities" value={document.data.EquityAndLiabilities} isTotal />
          </TabsContent>
          
          <TabsContent value="metrics" className="flex-1 overflow-y-auto pr-1 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((document.data.ProfitAfterTax / document.data.GrossProfit) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Debt-to-Equity Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(document.data.TotalLiabilities / document.data.Equity).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Return on Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((document.data.ProfitAfterTax / document.data.TotalAssets) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(document.data.CurrentAssets / document.data.ShortTermLiabilities).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Staff Cost Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.abs(document.data.StaffCosts) / document.data.GrossProfit * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Operating Expense Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.abs(document.data.OtherOperatingExpenses) / document.data.GrossProfit * 100).toFixed(1)}%
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
