import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { ProcessingFile } from '../types/document';
import { v4 as uuidv4 } from 'uuid';
import { useLocale } from '../context/LocaleContext';
import { getConfig } from '../config';

interface DropZoneProps {
  onFileUpload: (files: ProcessingFile[], completedCount: number) => void;
  onUploadComplete: (document: any) => void;
  onUploadError: (error: string) => void;
  onAllFilesComplete?: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFileUpload,
  onUploadComplete,
  onUploadError,
  onAllFilesComplete
}) => {
  const { t } = useLocale();
  
  const processFile = async (file: File, processingFiles: ProcessingFile[], index: number, totalFiles: number) => {
    try {
      // Start processing
      processingFiles[index].status = 'processing';
      processingFiles[index].progress = 0;
      onFileUpload([...processingFiles], index);

      // Upload and process the file
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch(`${getConfig().apiUrl}/api/pdf/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.results?.[0]?.processedFile?.financialData) {
        throw new Error('Invalid response format from server');
      }

      // Mark as complete
      processingFiles[index].status = 'completed';
      processingFiles[index].progress = 100;
      const newCompletedCount = index + 1;
      console.log(`File ${index + 1}/${totalFiles} completed. New count: ${newCompletedCount}`);
      onFileUpload([...processingFiles], newCompletedCount);
      onUploadComplete(result.results[0].processedFile);

      // Check if this was the last file
      if (newCompletedCount === totalFiles) {
        console.log('All files completed, triggering completion callback');
        onAllFilesComplete?.();
      }

    } catch (error) {
      console.error('Processing error:', error);
      processingFiles[index].status = 'error';
      processingFiles[index].error = t('pdf.uploadError', { fileName: file.name });
      onUploadError(t('pdf.uploadError', { fileName: file.name }));
      
      // Still increment completedCount even on error
      const newCompletedCount = index + 1;
      onFileUpload([...processingFiles], newCompletedCount);
      
      // Check if this was the last file, even if it errored
      if (newCompletedCount === totalFiles) {
        console.log('All files completed (with errors), triggering completion callback');
        onAllFilesComplete?.();
      }
    }
  };
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    console.log(`Starting to process ${acceptedFiles.length} files`);

    // Create processing files state for all files
    const processingFiles = acceptedFiles.map(file => ({
      id: uuidv4(),
      file,
      progress: 0,
      status: 'queued' as const
    })) as ProcessingFile[];

    // Initial state
    onFileUpload([...processingFiles], 0);

    // Process files sequentially
    for (let i = 0; i < acceptedFiles.length; i++) {
      await processFile(acceptedFiles[i], processingFiles, i, acceptedFiles.length);
    }
  }, [onFileUpload, onUploadComplete, onUploadError, onAllFilesComplete, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
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
            {isDragActive ? t('pdf.dropHere') : t('pdf.dropzone')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('pdf.clickToSelect')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{t('pdf.onlyPdf')}</span>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
