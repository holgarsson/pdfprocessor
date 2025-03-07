import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { config } from '../config';
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  fileName: string;
  documentId: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileName, documentId }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg p-4">
        <Document
          file={`${config.apiUrl}/api/pdf/file/${documentId}`}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error('Error loading PDF:', error);
          }}
          loading={
            <div className="flex flex-col items-center justify-center h-full">
              <FileText size={64} className="mb-4 animate-pulse" />
              <p className="text-center">Innlesur PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full">
              <FileText size={64} className="mb-4 text-destructive" />
              <p className="text-center text-destructive">Feilur í innlesing av PDF</p>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            className="shadow-lg"
          />
        </Document>
      </div>
      
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            disabled={scale >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {Math.round(scale * 100)}%
          </span>
        </div>
        
        {numPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
