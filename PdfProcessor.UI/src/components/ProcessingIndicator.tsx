import React, { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { ProcessingFile, ProcessedDocument } from '../types/document';
import { useLocale } from '../context/LocaleContext';

interface ProcessingIndicatorProps {
  files: ProcessingFile[];
  completedCount: number;
  onComplete?: () => void;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ 
  files, 
  completedCount,
  onComplete 
}) => {
  const { t } = useLocale();
  const isComplete = files.length > 0 && completedCount >= files.length;

  useEffect(() => {
    console.log(`ProcessingIndicator state: files=${files.length}, completed=${completedCount}, isComplete=${isComplete}`);
    if (isComplete && onComplete) {
      console.log('Triggering onComplete callback');
      onComplete();
    }
  }, [files.length, completedCount, isComplete, onComplete]);

  // Hide the component if there are no files or all files are complete
  if (files.length === 0 || completedCount >= files.length) {
    console.log('ProcessingIndicator hiding due to completion');
    return null;
  }

  // Calculate overall progress based on current file's progress
  const currentFileIndex = Math.min(completedCount, files.length - 1);
  const currentFileProgress = files[currentFileIndex]?.progress || 0;
  const totalProgress = Math.min(((completedCount * 100) + currentFileProgress) / files.length, 100);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t('pdf.processingFiles')}</h2>
        <div className="text-primary animate-spin">
          <Loader2 size={20} />
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {Math.min(completedCount + 1, files.length)} {t('common.of')} {files.length} {t('pdf.filesProcessed')}
      </div>

      {/* Single progress bar for all files */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm truncate flex-1 mr-4">
            {files[currentFileIndex]?.file.name || ''}
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {Math.round(totalProgress)}%
          </div>
        </div>
        <Progress 
          value={totalProgress} 
          className="h-2 bg-gray-100" 
        />
      </div>
    </div>
  );
};

export default ProcessingIndicator;
