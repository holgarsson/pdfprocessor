
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProcessedDocument } from '../types/document';
import { SearchIcon, SortAsc, SortDesc, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { formatCurrency } from '../utils/mockData';

interface DocumentTableProps {
  documents: ProcessedDocument[];
  onSelectDocument: (document: ProcessedDocument) => void;
  selectedDocument: ProcessedDocument | null;
}

type SortField = keyof ProcessedDocument | 'data.GrossProfit' | 'data.ProfitAfterTax' | 'data.TotalAssets';
type SortDirection = 'asc' | 'desc';

const DocumentTable: React.FC<DocumentTableProps> = ({ 
  documents, 
  onSelectDocument,
  selectedDocument 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('uploadDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
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
    doc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.companyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let valueA, valueB;
    
    // Handle nested fields
    if (sortField === 'data.GrossProfit') {
      valueA = a.data.GrossProfit;
      valueB = b.data.GrossProfit;
    } else if (sortField === 'data.ProfitAfterTax') {
      valueA = a.data.ProfitAfterTax;
      valueB = b.data.ProfitAfterTax;
    } else if (sortField === 'data.TotalAssets') {
      valueA = a.data.TotalAssets;
      valueB = b.data.TotalAssets;
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('companyId')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Company ID
                    {sortField === 'companyId' && (
                      sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
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
                    Company Name
                    {sortField === 'companyName' && (
                      sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('fileName')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    File Name
                    {sortField === 'fileName' && (
                      sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('uploadDate')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Upload Date
                    {sortField === 'uploadDate' && (
                      sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('data.GrossProfit')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Gross Profit
                    {sortField === 'data.GrossProfit' && (
                      sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('data.ProfitAfterTax')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Profit After Tax
                    {sortField === 'data.ProfitAfterTax' && (
                      sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('data.TotalAssets')}
                    className="hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Total Assets
                    {sortField === 'data.TotalAssets' && (
                      sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                    )}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No documents found
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
                    <TableCell>{doc.fileName}</TableCell>
                    <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                    <TableCell>{formatCurrency(doc.data.GrossProfit)}</TableCell>
                    <TableCell>{formatCurrency(doc.data.ProfitAfterTax)}</TableCell>
                    <TableCell>{formatCurrency(doc.data.TotalAssets)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, sortedDocuments.length)}</span> of{" "}
            <span className="font-medium">{sortedDocuments.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
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
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around the current page
                let pageToShow = currentPage - 2 + i;
                
                // Adjust if we're at the beginning or end
                if (currentPage < 3) {
                  pageToShow = i + 1;
                } else if (currentPage > totalPages - 2) {
                  pageToShow = totalPages - 4 + i;
                }
                
                // Ensure page is in valid range
                if (pageToShow > 0 && pageToShow <= totalPages) {
                  return (
                    <Button
                      key={pageToShow}
                      variant={currentPage === pageToShow ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageToShow)}
                      className="h-8 w-8 p-0"
                    >
                      {pageToShow}
                    </Button>
                  );
                }
                return null;
              })}
            </div>
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
