import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProcessedDocument } from '../types/document';
import { SearchIcon, SortAsc, SortDesc, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { api } from '../services/api';

interface DocumentTableProps {
  onSelectDocument: (document: ProcessedDocument) => void;
  selectedDocument: ProcessedDocument | null;
  documents: ProcessedDocument[];
  isLoading?: boolean;
}

type SortField = keyof ProcessedDocument | 'data.GrossProfit' | 'data.ProfitAfterTax' | 'data.TotalAssets';
type SortDirection = 'asc' | 'desc';

const DocumentTable: React.FC<DocumentTableProps> = ({ 
  onSelectDocument,
  selectedDocument,
  documents,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('uploadDate');
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
    doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let valueA, valueB;
    
    // Handle nested fields
    if (sortField === 'data.GrossProfit') {
      valueA = a.data?.GrossProfit || 0;
      valueB = b.data?.GrossProfit || 0;
    } else if (sortField === 'data.ProfitAfterTax') {
      valueA = a.data?.ProfitAfterTax || 0;
      valueB = b.data?.ProfitAfterTax || 0;
    } else if (sortField === 'data.TotalAssets') {
      valueA = a.data?.TotalAssets || 0;
      valueB = b.data?.TotalAssets || 0;
    } else {
      valueA = a[sortField as keyof ProcessedDocument];
      valueB = b[sortField as keyof ProcessedDocument];
    }
    
    // Handle dates
    if (valueA instanceof Date && valueB instanceof Date) {
      return sortDirection === 'asc' 
        ? valueA.getTime() - valueB.getTime() 
        : valueB.getTime() - valueA.getTime();
    }
    
    // Handle numbers and strings
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Default string comparison
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

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search documents..."
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
                <TableHead key="companyId">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('companyId')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Skrásetingar nr.
                    {sortField === 'companyId' && (
                      sortDirection === 'asc' ? 
                        <SortAsc key="asc" className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc key="desc" className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead key="companyName">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('companyName')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Felag
                    {sortField === 'companyName' && (
                      sortDirection === 'asc' ? 
                        <SortAsc key="asc" className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc key="desc" className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead key="uploadDate">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('uploadDate')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Innlisið
                    {sortField === 'uploadDate' && (
                      sortDirection === 'asc' ? 
                        <SortAsc key="asc" className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc key="desc" className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead key="grossProfit">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('data.GrossProfit')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Bruttovinningur
                    {sortField === 'data.GrossProfit' && (
                      sortDirection === 'asc' ? 
                        <SortAsc key="asc" className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc key="desc" className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead key="profitAfterTax">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('data.ProfitAfterTax')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Úrslit eftir skatt
                    {sortField === 'data.ProfitAfterTax' && (
                      sortDirection === 'asc' ? 
                        <SortAsc key="asc" className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc key="desc" className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead key="totalAssets">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('data.TotalAssets')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Ogn íalt
                    {sortField === 'data.TotalAssets' && (
                      sortDirection === 'asc' ? 
                        <SortAsc key="asc" className="ml-1 h-3 w-3 inline" /> : 
                        <SortDesc key="desc" className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow key="empty-row">
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Ongi skjøl funnin
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((doc) => (
                  <TableRow 
                    key={doc.id}
                    className={`transition-all-200 cursor-pointer ${
                      selectedDocument?.id === doc.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelectDocument(doc)}
                  >
                    <TableCell className="pr-0 pl-4">
                      {selectedDocument?.id === doc.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </TableCell>
                    <TableCell>{doc.companyId}</TableCell>
                    <TableCell>
                      <div className="font-medium">{doc.companyName}</div>
                    </TableCell>
                    <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                    <TableCell>{api.formatCurrency(doc.data?.GrossProfit || 0)}</TableCell>
                    <TableCell>{api.formatCurrency(doc.data?.ProfitAfterTax || 0)}</TableCell>
                    <TableCell>{api.formatCurrency(doc.data?.TotalAssets || 0)}</TableCell>
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
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
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
