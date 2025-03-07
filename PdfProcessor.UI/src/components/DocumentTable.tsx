import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProcessedDocument } from '../types/document';
import { SearchIcon, SortAsc, SortDesc, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { api } from '../services/api';
import { useLocale } from '../context/LocaleContext';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';

interface DocumentTableProps {
  onSelectDocument: (document: ProcessedDocument) => void;
  selectedDocument: ProcessedDocument | null;
  documents: ProcessedDocument[];
  isLoading?: boolean;
}

type SortField = 'companyId' | 'companyName' | 'processedTime' | 'grossProfit' | 'profitAfterTax' | 'totalAssets';
type SortDirection = 'asc' | 'desc';

const DocumentTable: React.FC<DocumentTableProps> = ({ 
  onSelectDocument,
  selectedDocument,
  documents,
  isLoading = false
}) => {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('processedTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [error, setError] = useState<string | null>(null);
  
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
      case 'processedTime':
        valueA = new Date(a.processedTime).getTime();
        valueB = new Date(b.processedTime).getTime();
        break;
      case 'grossProfit':
        valueA = a.financialData.grossProfit ?? 0;
        valueB = b.financialData.grossProfit ?? 0;
        break;
      case 'profitAfterTax':
        valueA = (a.financialData.profitAfterTax ?? a.financialData.annualResult) ?? 0;
        valueB = (b.financialData.profitAfterTax ?? b.financialData.annualResult) ?? 0;
        break;
      case 'totalAssets':
        valueA = a.financialData.totalAssets ?? 0;
        valueB = b.financialData.totalAssets ?? 0;
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
                <TableHead>{t('table.columns.grossProfit')}</TableHead>
                <TableHead>{t('table.columns.profitAfterTax')}</TableHead>
                <TableHead>{t('table.columns.totalAssets')}</TableHead>
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
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={t('table.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('companyId')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    {t('table.columns.registrationNumber')}
                    {sortField === 'companyId' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('companyName')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    {t('table.columns.company')}
                    {sortField === 'companyName' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('processedTime')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    {t('table.columns.uploaded')}
                    {sortField === 'processedTime' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('grossProfit')}
                    className="hover:bg-transparent p-0 h-auto font-medium text-right"
                  >
                    {t('table.columns.grossProfit')}
                    {sortField === 'grossProfit' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('profitAfterTax')}
                    className="hover:bg-transparent p-0 h-auto font-medium text-right"
                  >
                    {t('table.columns.profitAfterTax')}
                    {sortField === 'profitAfterTax' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalAssets')}
                    className="hover:bg-transparent p-0 h-auto font-medium text-right"
                  >
                    {t('table.columns.totalAssets')}
                    {sortField === 'totalAssets' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
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
                    <TableCell>{doc.financialData.companyId}</TableCell>
                    <TableCell>{doc.financialData.companyName}</TableCell>
                    <TableCell>{format(new Date(doc.processedTime), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(doc.financialData.grossProfit)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(doc.financialData.profitAfterTax ?? doc.financialData.annualResult)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(doc.financialData.totalAssets)}</TableCell>
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
