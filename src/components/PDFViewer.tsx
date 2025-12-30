import { useState, useCallback, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';

interface PDFViewerProps {
  file: string | File | ArrayBuffer | Uint8Array | Blob | { data: Uint8Array };
  filePath?: string; // Шлях до файлу для iframe
  onClose?: () => void;
  className?: string;
}

export const PDFViewer = ({ file, filePath, onClose, className = '' }: PDFViewerProps) => {
  const [scale, setScale] = useState<number>(1.0);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  // Створюємо URL для iframe
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
    
    if (filePath) {
      // Якщо є шлях до файлу, використовуємо його
      if (isElectron) {
        // В Electron конвертуємо шлях в file:// URL
        let url: string;
        if (filePath.startsWith('file://')) {
          url = filePath;
        } else {
          // Конвертуємо абсолютний шлях в file:// URL
          // Для Windows: C:\path\to\file.pdf -> file:///C:/path/to/file.pdf
          // Для macOS/Linux: /path/to/file.pdf -> file:///path/to/file.pdf
          let normalizedPath = filePath.replace(/\\/g, '/');
          
          // Якщо це Windows шлях (починається з букви та :), додаємо /
          if (normalizedPath.match(/^[A-Za-z]:/)) {
            url = `file:///${normalizedPath}`;
          } else {
            // Для macOS/Linux просто додаємо file:///
            url = `file://${normalizedPath}`;
          }
        }
        console.log('[PDFViewer] Using file path for iframe:', url);
        setIframeUrl(url);
      } else {
        // Для веб-версії
        setIframeUrl(filePath);
      }
    } else if (file instanceof Blob) {
      // Якщо є Blob, створюємо object URL
      const url = URL.createObjectURL(file);
      console.log('[PDFViewer] Created object URL for Blob:', url);
      setIframeUrl(url);
      // Очищаємо URL при unmount
      return () => URL.revokeObjectURL(url);
    } else if (typeof file === 'string') {
      // Якщо це рядок (URL)
      setIframeUrl(file);
    }
  }, [filePath, file]);


  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(3.0, prev + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  return (
    <div className={`flex flex-col bg-gray-100 ${className}`} style={{ height: '100%', minHeight: '100vh' }}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-end shadow-sm flex-shrink-0">

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <FiZoomOut size={20} />
          </button>
          
          <span className="text-sm font-medium px-2 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <FiZoomIn size={20} />
          </button>

          <button
            onClick={resetZoom}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors ml-2"
          >
            Close
          </button>
        )}
      </div>

      {/* PDF Content */}
      <div className="flex-1 bg-gray-200" style={{ height: 'calc(100% - 60px)', overflow: 'hidden' }}>
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%'
            }}
          />
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

