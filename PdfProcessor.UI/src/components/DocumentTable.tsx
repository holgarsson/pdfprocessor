import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProcessedDocument } from '../types/document';
import { SearchIcon, SortAsc, SortDesc, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { formatCurrency } from '../utils';
import { format } from 'date-fns';
import { toast } from "sonner";
import { getConfig } from '../config';

interface DocumentTableProps {
  onSelectDocument: (document: ProcessedDocument | null) => void;
  selectedDocument: ProcessedDocument | null;
  documents: ProcessedDocument[];
  isLoading?: boolean;
  onDocumentsCleared?: () => void;
}

type SortField = 'companyId' | 'companyName' | 'annualResult' | 'totalAssets' | 'equityAndLiabilities';
type SortDirection = 'asc' | 'desc';

const DocumentTable: React.FC<DocumentTableProps> = ({ 
  onSelectDocument,
  selectedDocument,
  documents,
  isLoading = false,
  onDocumentsCleared
}) => {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('companyId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter documents by search term
  const filteredDocuments = documents.filter(doc => 
    doc.financialData.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.financialData.companyId.toString().includes(searchTerm)
  );

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortField) {
      case 'companyId':
        valueA = a.financialData.companyId;
        valueB = b.financialData.companyId;
        break;
      case 'companyName':
        valueA = a.financialData.companyName;
        valueB = b.financialData.companyName;
        break;
      case 'annualResult':
        valueA = a.financialData.annualResult ?? 0;
        valueB = b.financialData.annualResult ?? 0;
        break;
      case 'totalAssets':
        valueA = a.financialData.totalAssets ?? 0;
        valueB = b.financialData.totalAssets ?? 0;
        break;
      case 'equityAndLiabilities':
        valueA = a.financialData.equityAndLiabilities || a.financialData.totalLiabilities || 0;
        valueB = b.financialData.equityAndLiabilities || b.financialData.totalLiabilities || 0;
        break;
      default:
        valueA = 0;
        valueB = 0;
    }

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    return sortDirection === 'asc'
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDocuments.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleClearAll = async () => {
    try {
      setIsClearing(true);
      const response = await fetch(`${getConfig().apiUrl}/api/pdf/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to clear documents');
      
      // Clear local state
      if (onDocumentsCleared) {
        onDocumentsCleared();
      }
      setSearchTerm('');
      setCurrentPage(1);
      onSelectDocument(null);
      toast.success(t('toast.documentsCleared'));
    } catch (err) {
      toast.error(t('toast.clearFailed'));
      setError(t('toast.clearFailed'));
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`${getConfig().apiUrl}/api/pdf/processed`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch export data');
      }

      const data = await response.json();
      const exportData = data.map(d => ({
        ...d.financialData,
        equityAndLiabilities: d.financialData.equityAndLiabilities || d.financialData.totalLiabilities
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('toast.exportSuccess'));
    } catch (err) {
      toast.error(t('toast.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            disabled
            className="pl-9 bg-muted/50"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>{t('table.columns.registrationNumber')}</TableHead>
                <TableHead>{t('table.columns.company')}</TableHead>
                <TableHead>{t('table.columns.uploaded')}</TableHead>
                <TableHead>{t('table.columns.annualResult')}</TableHead>
                <TableHead>{t('table.columns.totalAssets')}</TableHead>
                <TableHead>{t('table.columns.equityAndLiabilities')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="pr-0 pl-4">
                    <div className="h-4 w-4 animate-pulse bg-muted-foreground/10 rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 animate-pulse bg-muted-foreground/10 rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 animate-pulse bg-muted-foreground/10 rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse bg-muted-foreground/10 rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse bg-muted-foreground/10 rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse bg-muted-foreground/10 rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse bg-muted-foreground/10 rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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

  if (!documents.length) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t('common.noResults')}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-72">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={t('table.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={handleExportJSON}
            disabled={isExporting || documents.length === 0}
          >
            {isExporting ? (
              t('common.exporting')
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t('common.exportJSON')}
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="default"
            onClick={handleClearAll}
            disabled={isClearing || documents.length === 0}
          >
            {isClearing ? t('common.clearing') : t('common.clearAll')}
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-center">{t('table.columns.registrationNumber')}</TableHead>
                <TableHead className="text-center">{t('table.columns.company')}</TableHead>
                <TableHead className="text-center">{t('table.columns.annualResult')}</TableHead>
                <TableHead className="text-center">{t('table.columns.totalAssets')}</TableHead>
                <TableHead className="text-center">{t('table.columns.equityAndLiabilities')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow key="empty-row">
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('common.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((doc) => (
                  <TableRow 
                    key={doc.id}
                    className={`cursor-pointer ${
                      selectedDocument?.id === doc.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelectDocument(doc)}
                  >
                    <TableCell className="pr-0 pl-4">
                      {selectedDocument?.id === doc.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">{doc.financialData.companyId}</TableCell>
                    <TableCell className="text-center">{doc.financialData.companyName}</TableCell>
                    <TableCell className="text-center">{formatCurrency(doc.financialData.annualResult)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(doc.financialData.totalAssets)}</TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(doc.financialData.equityAndLiabilities || doc.financialData.totalLiabilities)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              title={t('table.pagination.first')}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              title={t('table.pagination.previous')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('table.pagination.page', { current: currentPage, total: totalPages })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              title={t('table.pagination.next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              title={t('table.pagination.last')}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;
