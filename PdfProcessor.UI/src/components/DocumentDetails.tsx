import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedDocument } from '../types/document';
import { Separator } from '@/components/ui/separator';
import { FileText, BarChart2, TrendingUp, Calculator } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useLocale } from '../context/LocaleContext';

interface DocumentDetailsProps {
  document: ProcessedDocument | null;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ document }) => {
  const { t } = useLocale();

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {t('document.selectDocument')}
      </div>
    );
  }

  const formatDate = (date: string) => {
    try {
      let parsedDate = typeof date === 'string' 
      ? new Date(date.replace(/\.\d+Z$/, 'Z'))
      : new Date(date);

  let formatted = new Intl.DateTimeFormat('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
  }).format(parsedDate);

  // Replace Danish month names with Faroese
  const monthMap = {
      "januar": "januar", "februar": "februar", "marts": "mars",
      "april": "apríl", "maj": "mai", "juni": "juni", "juli": "juli",
      "august": "august", "september": "september", "oktober": "oktober",
      "november": "november", "december": "desember"
  };

  return formatted.replace(/\b(marts|maj|januar|februar|april|juni|juli|august|september|oktober|november|december)\b/g, match => monthMap[match]);

    } catch (error) {
      // Fallback to a simpler format if Faroese locale fails
      console.error('Error formatting date with fo-FO locale:', error);
      try {
        return new Date(date).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (fallbackError) {
        console.error('Error formatting date with fallback locale:', fallbackError);
        return date;
      }
    }
  };

  const FinancialRow = ({ 
    label, 
    value, 
    isTotal = false,
    isNegative = false,
    indentLevel = 0
  }: { 
    label: string; 
    value: number | null;
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

  const { financialData } = document;

  // Calculate metrics safely
  const calculatePercentage = (value: number | null, total: number | null): string => {
    if (!value || !total || total === 0) return '-';
    return `${(value / total * 100).toFixed(1)}%`;
  };

  const calculateRatio = (numerator: number | null, denominator: number | null): string => {
    if (!numerator || !denominator || denominator === 0) return '-';
    return (numerator / denominator).toFixed(2);
  };

  return (
    <Card className="shadow-md animate-fade-in h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText size={18} />
          <span className="truncate">{`${financialData.companyId} - ${financialData.companyName}`}</span>
        </CardTitle>
        <CardDescription>
          {t('document.uploaded', { 
            date: formatDate(document.processedTime)
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pb-0">
        <Tabs defaultValue="income" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="income" className="flex items-center gap-1">
              <BarChart2 size={14} />
              <span>{t('document.tabs.income')}</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-1">
              <Calculator size={14} />
              <span>{t('document.tabs.balance')}</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span>{t('document.tabs.metrics')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="flex-1 overflow-y-auto pr-1 space-y-1 mt-0">
            <FinancialRow label={t('document.income.grossProfit')} value={financialData.grossProfit} />
            <FinancialRow label={t('document.income.staffCosts')} value={financialData.staffCosts} isNegative={true} indentLevel={1} />
            <FinancialRow label={t('document.income.otherOperatingExpenses')} value={financialData.otherOperatingExpenses} isNegative={true} indentLevel={1} />
            <FinancialRow label={t('document.income.depreciation')} value={financialData.depreciation} isNegative={true} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label={t('document.income.profitBeforeInterest')} value={financialData.profitBeforeInterest} isTotal />
            <FinancialRow label={t('document.income.financialIncome')} value={financialData.financialIncome} indentLevel={1} />
            <FinancialRow label={t('document.income.financialExpenses')} value={financialData.financialExpenses} isNegative={true} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label={t('document.income.profitBeforeExtraordinaryItems')} value={financialData.profitBeforeExtraordinaryItems} isTotal />
            <FinancialRow label={t('document.income.extraordinaryItems')} value={financialData.extraordinaryItems} isNegative={financialData.extraordinaryItems ? financialData.extraordinaryItems < 0 : false} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label={t('document.income.profitBeforeTax')} value={financialData.profitBeforeTax} isTotal />
            <FinancialRow label={t('document.income.tax')} value={financialData.tax} isNegative={true} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label={t('document.income.profitAfterTax')} value={financialData.profitAfterTax} isTotal />
            <FinancialRow label={t('document.income.annualResult')} value={financialData.annualResult} isTotal />
          </TabsContent>
          
          <TabsContent value="balance" className="flex-1 overflow-y-auto pr-1 space-y-1 mt-0">
            <div className="font-semibold mb-2">{t('document.balance.assets')}</div>
            <FinancialRow label={t('document.balance.fixedAssets')} value={financialData.fixedAssets} indentLevel={1} />
            <FinancialRow label={t('document.balance.currentAssets')} value={financialData.currentAssets} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label={t('document.balance.totalAssets')} value={financialData.totalAssets} isTotal />
            
            <div className="font-semibold mb-2 mt-6">{t('document.balance.equityAndLiabilities')}</div>
            <FinancialRow label={t('document.balance.equity')} value={financialData.equity} indentLevel={1} />
            <FinancialRow label={t('document.balance.provisions')} value={financialData.provisions} indentLevel={1} />
            <FinancialRow label={t('document.balance.longTermLiabilities')} value={financialData.longTermLiabilities} indentLevel={1} />
            <FinancialRow label={t('document.balance.shortTermLiabilities')} value={financialData.shortTermLiabilities} indentLevel={1} />
            <Separator className="my-2" />
            <FinancialRow label={t('document.balance.totalLiabilities')} value={financialData.totalLiabilities} isTotal />
            <FinancialRow 
              label={t('document.balance.equityAndLiabilities')} 
              value={financialData.equityAndLiabilities || financialData.totalLiabilities} 
              isTotal 
            />
          </TabsContent>
          
          <TabsContent value="metrics" className="flex-1 overflow-y-auto pr-1 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{t('document.metrics.profitMargin.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {calculatePercentage(financialData.profitAfterTax, financialData.grossProfit)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{t('document.metrics.debtToEquity.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {calculateRatio(financialData.totalLiabilities, financialData.equity)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{t('document.metrics.returnOnAssets.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {calculatePercentage(financialData.profitAfterTax, financialData.totalAssets)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{t('document.metrics.currentRatio.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {calculateRatio(financialData.currentAssets, financialData.shortTermLiabilities)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{t('document.metrics.staffCostRatio.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {calculatePercentage(
                      financialData.staffCosts ? Math.abs(financialData.staffCosts) : null,
                      financialData.grossProfit
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{t('document.metrics.operatingExpenseRatio.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {calculatePercentage(
                      financialData.otherOperatingExpenses ? Math.abs(financialData.otherOperatingExpenses) : null,
                      financialData.grossProfit
                    )}
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
