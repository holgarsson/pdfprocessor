import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DropZone from '../components/DropZone';
import ProcessingIndicator from '../components/ProcessingIndicator';
import DocumentTable from '../components/DocumentTable';
import DocumentDetails from '../components/DocumentDetails';
import PDFViewer from '../components/PDFViewer';
import { ProcessedDocument, ProcessingFile } from '../types/document';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingDetails, setViewingDetails] = useState(false);

  // Load documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching documents...');
        const data = await api.getDocuments();
        console.log('API Response:', data);
        if (Array.isArray(data)) {
          console.log('Setting documents:', data);
          setDocuments(data);
        } else {
          console.error('Invalid response format:', data);
          toast.error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Debug effect to monitor documents state
  useEffect(() => {
    console.log('Documents state updated:', documents);
  }, [documents]);

  const handleFileUpload = (file: ProcessingFile) => {
    setProcessingFiles(prev => [...prev, file]);
    setIsProcessing(true);
  };

  const handleUploadComplete = (document: ProcessedDocument) => {
    console.log('Upload complete, adding document:', document);
    setDocuments(prev => [document, ...prev]);
    setProcessingFiles(prev => prev.filter(f => f.id !== document.id));
    setIsProcessing(false);
    toast.success(`Processed: ${document.fileName}`);
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
    setIsProcessing(false);
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
              <DropZone 
                onFileUpload={handleFileUpload}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </section>
            
            {processingFiles.length > 0 && (
              <section>
                <ProcessingIndicator 
                  files={processingFiles} 
                  onUploadComplete={handleUploadComplete}
                />
              </section>
            )}
            
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Documents</h2>
              <DocumentTable 
                onSelectDocument={handleSelectDocument}
                selectedDocument={selectedDocument}
                documents={documents}
                isLoading={isLoading}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
