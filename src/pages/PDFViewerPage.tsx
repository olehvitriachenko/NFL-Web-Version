import { useState, useEffect } from 'react';
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { PDFViewer } from '../components/PDFViewer';
import { navigateBack } from '../utils/navigation';

export const PDFViewerPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ from: '/pdf-viewer' });
  const [pdfFile, setPdfFile] = useState<string | File | ArrayBuffer | Uint8Array | Blob | { data: Uint8Array } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const filePath = search.file;
    
    if (!filePath) {
      setError('No PDF file specified');
      return;
    }

    loadPDFFile(filePath);
  }, [search.file]);

  const loadPDFFile = async (filePath: string) => {
    try {
      setError(null);
      console.log('[PDFViewerPage] Loading PDF file:', filePath);
      
      // Decode the file path if it's URL encoded
      const decodedPath = decodeURIComponent(filePath);
      console.log('[PDFViewerPage] Decoded file path:', decodedPath);
      
      // Check if file exists (in Electron)
      const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
      if (isElectron && window.electron?.pdf) {
        const existsResult = await window.electron.pdf.fileExists(decodedPath);
        if (!existsResult.success || !existsResult.data) {
          setError(`PDF file not found: ${decodedPath}`);
          return;
        }
      }
      
      // Use the decoded file path
      setPdfFile(decodedPath);
    } catch (err) {
      console.error('[PDFViewerPage] Error loading PDF file:', err);
      setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  return (
    <div className="bg-[#f5f5f7] flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      <PageHeader title="PDF Viewer" onBack={handleBack} onHome={handleHome} />
      
      <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 80px)', minHeight: 0 }}>
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <p className="text-red-600 font-medium mb-2">Error</p>
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : pdfFile ? (
          <PDFViewer file={pdfFile} filePath={typeof pdfFile === 'string' ? pdfFile : undefined} onClose={handleBack} className="h-full" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

