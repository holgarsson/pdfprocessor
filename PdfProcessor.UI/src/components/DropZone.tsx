
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUpIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  isProcessing: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, isProcessing }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter(
        file => file.type === 'application/pdf'
      );
      
      if (pdfFiles.length === 0) {
        toast.error('Only PDF files are accepted');
        return;
      }
      
      if (pdfFiles.length !== acceptedFiles.length) {
        toast.warning(`${acceptedFiles.length - pdfFiles.length} non-PDF files were ignored`);
      }

      onFilesAdded(pdfFiles);
      
      if (pdfFiles.length > 0) {
        toast.success(`${pdfFiles.length} PDF${pdfFiles.length === 1 ? '' : 's'} added to queue`);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    disabled: isProcessing,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  return (
    <Card 
      className={`border-2 border-dashed transition-all-300 ${
        isDragActive ? 'border-primary bg-primary/5' : 
        isDragReject ? 'border-destructive bg-destructive/5' : 
        'border-muted-foreground/20'
      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <CardContent
        {...getRootProps()}
        className="flex flex-col items-center justify-center p-10 text-center transition-all-200"
      >
        <input {...getInputProps()} />
        
        <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center bg-primary/10 text-primary transition-all-300 ${isDragActive ? 'scale-110' : ''}`}>
          <FileUpIcon size={32} className={`transition-all-300 ${isDragActive ? 'animate-pulse' : ''}`} />
        </div>
        
        {isDragReject ? (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-lg font-medium text-destructive">Invalid File Type</h3>
            <p className="text-sm text-muted-foreground">Only PDF files are accepted</p>
          </div>
        ) : isProcessing ? (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-lg font-medium">Processing Files</h3>
            <p className="text-sm text-muted-foreground">Please wait until current files are processed</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Drag & Drop PDF Files</h3>
            <p className="text-sm text-muted-foreground">or click to browse your files</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <FileText size={16} />
                <span>Select PDFs</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DropZone;
