
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DropZone from '../components/DropZone';
import ProcessingIndicator from '../components/ProcessingIndicator';
import DocumentTable from '../components/DocumentTable';
import DocumentDetails from '../components/DocumentDetails';
import PDFViewer from '../components/PDFViewer';
import { ProcessedDocument, ProcessingFile } from '../types/document';
import { generateMockData, processFile } from '../utils/mockData';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// List of company names for generating random data
const companyNames = [
  "Acme Corporation", "Globex Corp", "Soylent Industries", "Initech LLC", 
  "Massive Dynamic", "Stark Industries", "Wayne Enterprises", "Umbrella Corp"
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingDetails, setViewingDetails] = useState(false);

  // Load initial mock data
  useEffect(() => {
    const mockData = generateMockData(20); // Generate more data for pagination testing
    setDocuments(mockData);
  }, []);

  const handleFilesAdded = (files: File[]) => {
    // Create ProcessingFile objects for each file
    const newProcessingFiles = files.map(file => ({
      id: uuidv4(),
      file,
      progress: 0,
      status: 'queued' as const
    }));
    
    setProcessingFiles(prev => [...prev, ...newProcessingFiles]);
    setIsProcessing(true);
    
    // Process files one by one
    processFilesSequentially(newProcessingFiles);
  };

  const processFilesSequentially = async (filesToProcess: ProcessingFile[]) => {
    for (const fileInfo of filesToProcess) {
      try {
        // Update file status to processing
        setProcessingFiles(prev => 
          prev.map(f => f.id === fileInfo.id 
            ? { ...f, status: 'processing' as const } 
            : f
          )
        );
        
        // Process file with simulated progress updates
        const progressInterval = setInterval(() => {
          setProcessingFiles(prev => 
            prev.map(f => f.id === fileInfo.id 
              ? { ...f, progress: Math.min(f.progress + 5, 95) } 
              : f
            )
          );
        }, 200);
        
        // Wait for processing to complete
        const data = await processFile(fileInfo.file);
        
        // Clear progress interval
        clearInterval(progressInterval);
        
        // Update processing file to completed
        setProcessingFiles(prev => 
          prev.map(f => f.id === fileInfo.id 
            ? { ...f, status: 'completed' as const, progress: 100 } 
            : f
          )
        );
        
        // Generate random company information
        const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
        const companyId = `C${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
        
        // Add processed document to documents list
        const newDocument: ProcessedDocument = {
          id: fileInfo.id,
          companyId,
          companyName,
          fileName: fileInfo.file.name,
          uploadDate: new Date(),
          processedDate: new Date(),
          data
        };
        
        setDocuments(prev => [newDocument, ...prev]);
        
        toast.success(`Processed: ${fileInfo.file.name}`);
      } catch (error) {
        console.error(`Error processing file ${fileInfo.file.name}:`, error);
        
        // Update file status to error
        setProcessingFiles(prev => 
          prev.map(f => f.id === fileInfo.id 
            ? { ...f, status: 'error' as const, error: 'Processing failed' } 
            : f
          )
        );
        
        toast.error(`Failed to process: ${fileInfo.file.name}`);
      }
    }
    
    // Once all files are processed, update isProcessing state
    setIsProcessing(false);
    
    // After 5 seconds, clear completed files from the processing list
    setTimeout(() => {
      setProcessingFiles(prev => prev.filter(f => f.status !== 'completed'));
    }, 5000);
  };

  const handleSelectDocument = (document: ProcessedDocument) => {
    setSelectedDocument(document);
    setViewingDetails(true);
  };

  const handleBackToList = () => {
    setViewingDetails(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Financial Document Processor</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Logged in as <span className="font-medium text-foreground">{user?.username}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={logout}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col">
        {viewingDetails && selectedDocument ? (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2" 
              onClick={handleBackToList}
            >
              <ArrowLeft size={16} />
              <span>Back to document list</span>
            </Button>
            
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Document Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocumentDetails document={selectedDocument} />
                <PDFViewer fileName={selectedDocument.fileName} />
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <section>
              <h2 className="text-lg font-medium mb-3">Upload Documents</h2>
              <DropZone onFilesAdded={handleFilesAdded} isProcessing={isProcessing} />
            </section>
            
            {processingFiles.length > 0 && (
              <section>
                <ProcessingIndicator files={processingFiles} />
              </section>
            )}
            
            {documents.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-medium">Documents</h2>
                <DocumentTable 
                  documents={documents} 
                  onSelectDocument={handleSelectDocument}
                  selectedDocument={selectedDocument}
                />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
