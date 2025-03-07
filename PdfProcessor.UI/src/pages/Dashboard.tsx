import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DropZone from '../components/DropZone';
import ProcessingIndicator from '../components/ProcessingIndicator';
import DocumentTable from '../components/DocumentTable';
import DocumentDetails from '../components/DocumentDetails';
import PDFViewer from '../components/PDFViewer';
import { ProcessedDocument, ProcessingFile } from '../types/document';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLocale } from '../context/LocaleContext';
import { getConfig } from '../config';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingDetails, setViewingDetails] = useState(false);

  // Load documents from API
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${getConfig().apiUrl}/api/pdf/processed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      } else {
        toast.error(t('toast.invalidResponse'));
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error(t('toast.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = (files: ProcessingFile[], count: number) => {
    setProcessingFiles(files);
    setCompletedCount(count);
  };

  const handleUploadComplete = (document: ProcessedDocument) => {
    console.log('Upload complete, adding document:', document);
    setDocuments(prev => [document, ...prev]);
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const handleAllFilesComplete = async () => {
    console.log('All files complete, refreshing documents');
    // Clear processing state
    setProcessingFiles([]);
    setCompletedCount(0);
    // Refresh documents
    await fetchDocuments();
  };

  const handleSelectDocument = async (document: ProcessedDocument) => {
    try {
      setSelectedDocument(document);
      setViewingDetails(true);
    } catch (error) {
      console.error('Error loading PDF file:', error);
      toast.error(t('toast.failedToLoadPdf'));
    }
  };

  const handleBackToList = () => {
    setViewingDetails(false);
    setSelectedDocument(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{t('header.title')}</h1>
          <div className="flex flex-col items-end gap-2">
            <LanguageSwitcher />
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {t('common.loggedInAs')} <span className="font-medium text-foreground">{user?.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={logout}
              >
                <LogOut size={16} />
                <span>{t('common.logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col">
        {isLoading && !processingFiles.length ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-lg font-medium">{t('common.loading')}</span>
            </div>
          </div>
        ) : viewingDetails && selectedDocument ? (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2" 
              onClick={handleBackToList}
            >
              <ArrowLeft size={16} />
              <span>{t('toast.backToList')}</span>
            </Button>
            
            <section className="space-y-3">
              <h2 className="text-lg font-medium">{t('document.title')}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocumentDetails document={selectedDocument} />
                <PDFViewer 
                  filePath={selectedDocument.filePath} 
                  documentId={selectedDocument.id}
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <section>
              <h2 className="text-lg font-medium mb-3">{t('header.uploadDocuments')}</h2>
              <DropZone 
                onFileUpload={handleFileUpload}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                onAllFilesComplete={handleAllFilesComplete}
              />
            </section>
            
            {processingFiles.length > 0 && (
              <section>
                <ProcessingIndicator 
                  files={processingFiles}
                  completedCount={completedCount}
                  onComplete={handleAllFilesComplete}
                />
              </section>
            )}
            
            <section className="space-y-3">
              <h2 className="text-lg font-medium">{t('header.documents')}</h2>
              <DocumentTable 
                onSelectDocument={handleSelectDocument}
                selectedDocument={selectedDocument}
                documents={documents}
                isLoading={isLoading && !processingFiles.length}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
