
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface PDFViewerProps {
  fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileName }) => {
  // In a real app, this would use a PDF viewing library like react-pdf or pdfjs
  // This is just a placeholder for visual representation
  return (
    <Card className="h-full flex flex-col animate-fade-in shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Document Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center bg-muted/30 rounded-md text-muted-foreground">
        <FileText size={64} className="mb-4" />
        <p className="text-center max-w-xs">
          {fileName}
          <br />
          <span className="text-sm">
            PDF preview would appear here in a real application.
          </span>
        </p>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
