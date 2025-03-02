
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ProcessingFile } from '../types/document';

interface ProcessingIndicatorProps {
  files: ProcessingFile[];
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ files }) => {
  if (!files.length) return null;
  
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;
  const currentProcessing = files.find(f => f.status === 'processing');
  
  const overallProgress = 
    (completedFiles / totalFiles) * 100 + 
    (currentProcessing ? (currentProcessing.progress / totalFiles) : 0);
  
  const isComplete = completedFiles + errorFiles === totalFiles;

  return (
    <Card className="animate-fade-in shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Processing PDF Files</CardTitle>
            <CardDescription>
              {isComplete 
                ? `All files processed (${errorFiles} errors)`
                : `${completedFiles} of ${totalFiles} files processed`
              }
            </CardDescription>
          </div>
          {isComplete ? (
            <div className={`rounded-full p-1 ${errorFiles ? 'text-amber-500' : 'text-green-500'}`}>
              {errorFiles ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            </div>
          ) : (
            <div className="text-primary animate-spin rounded-full p-1">
              <Loader2 size={20} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={overallProgress} className="h-2" />
          
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
              >
                {file.status === 'completed' && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                {file.status === 'error' && <AlertCircle size={16} className="text-destructive shrink-0" />}
                {file.status === 'processing' && <Loader2 size={16} className="text-primary animate-spin shrink-0" />}
                {file.status === 'queued' && <div className="w-4 h-4 rounded-full bg-muted-foreground/20 shrink-0" />}
                
                <div className="truncate flex-1">{file.file.name}</div>
                
                {file.status === 'processing' && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(file.progress)}%
                  </span>
                )}
                {file.status === 'completed' && (
                  <span className="text-xs text-green-500 whitespace-nowrap">Complete</span>
                )}
                {file.status === 'error' && (
                  <span className="text-xs text-destructive whitespace-nowrap">Failed</span>
                )}
                {file.status === 'queued' && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Queued</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingIndicator;
