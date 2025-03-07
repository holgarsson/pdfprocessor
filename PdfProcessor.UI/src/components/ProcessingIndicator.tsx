import React, { useEffect, useState, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { ProcessingFile, ProcessedDocument } from '../types/document';

interface ProcessingIndicatorProps {
  files: ProcessingFile[];
  completedCount: number;
  onUploadComplete?: (document: ProcessedDocument) => void;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ files, completedCount, onUploadComplete }) => {
  const [progress, setProgress] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let currentProgress = 0;
    const interval = setInterval(() => {
      // Progress speed is inversely proportional to number of files
      const increment = (Math.random() * 2) / files.length;
      currentProgress += increment;
      
      // Simulate processing complete at random point between 80-95%
      if (currentProgress >= 80 + Math.random() * 15) {
        clearInterval(interval);
        currentProgress = 100;
        setProgress(100);
        
        // Remove the progress indicator after a short delay
        setTimeout(() => {
          setProgress(0);
        }, 300);
      } else {
        setProgress(currentProgress);
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [files]);

  if (progress === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Processing PDF Files</h2>
        <div className="text-primary animate-spin">
          <Loader2 size={20} />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {completedCount} of {files.length} files processed
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {files[completedCount]?.file.name}
            {files.length - completedCount > 1 ? ` and ${files.length - completedCount - 1} more` : ''}
          </div>
          <div className="text-sm text-muted-foreground">{Math.round(progress)}%</div>
        </div>
        <Progress 
          value={progress} 
          className="h-1 bg-gray-100" 
        />
      </div>
    </div>
  );
};

export default ProcessingIndicator;
