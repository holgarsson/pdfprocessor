import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ProcessingFile } from '../types/document';

interface DropZoneProps {
  onFileUpload: (file: ProcessingFile) => void;
  onUploadComplete: (document: any) => void;
  onUploadError: (error: string) => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFileUpload,
  onUploadComplete,
  onUploadError
}) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create initial processing file state
    const processingFile: ProcessingFile = {
      id: `temp-${Date.now()}`,
      file,
      progress: 0,
      status: 'queued'
    };

    onFileUpload(processingFile);

    try {
      // Upload the file
      const document = await api.uploadDocument(file);
      onUploadComplete(document);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError('Failed to upload file. Please try again.');
    }
  }, [onFileUpload, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200 ease-in-out
        ${isDragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/5'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select a file
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>PDF files only</span>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
