import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { api } from '../services/api';
import { ProcessingFile } from '../types/document';
import { v4 as uuidv4 } from 'uuid';

interface DropZoneProps {
  onFileUpload: (files: ProcessingFile[]) => void;
  onUploadComplete: (document: any) => void;
  onUploadError: (error: string) => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFileUpload,
  onUploadComplete,
  onUploadError
}) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Create processing files state for all files at once
    const processingFiles = acceptedFiles.map(file => ({
      id: uuidv4(),
      file,
      progress: 0,
      status: 'queued' as const
    })) as ProcessingFile[];

    // Notify parent about all files at once
    onFileUpload(processingFiles);

    // Process files sequentially
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      try {
        // Update status to processing for current file
        processingFiles[i].status = 'processing' as const;
        
        const document = await api.uploadDocument(file);
        processingFiles[i].status = 'completed';
        onUploadComplete(document);
      } catch (error) {
        console.error('Upload error:', error);
        processingFiles[i].status = 'error';
        processingFiles[i].error = `Failed to upload ${file.name}. Please try again.`;
        onUploadError(`Failed to upload ${file.name}. Please try again.`);
        // Continue with next file even if one fails
      }
    }
  }, [onFileUpload, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true // Enable multiple file selection
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
            {isDragActive ? 'Drop the PDF files here' : 'Drag & drop PDF files here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select files
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
