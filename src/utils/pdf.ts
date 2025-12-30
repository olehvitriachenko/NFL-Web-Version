/**
 * Utility functions for PDF generation from HTML
 */

export interface PDFOptions {
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  pageSize?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A3' | 'A5' | 'A6';
  landscape?: boolean;
  printBackground?: boolean;
}

/**
 * Check if running in Electron environment
 */
const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

/**
 * Generate PDF from HTML content
 * @param htmlContent - HTML string to convert to PDF
 * @param options - PDF generation options
 * @returns Promise with PDF buffer or null if not in Electron
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  options?: PDFOptions
): Promise<Buffer | null> {
  if (!isElectron) {
    console.warn('PDF generation is only available in Electron environment');
    return null;
  }

  try {
    const result = await window.electron!.pdf.generateFromHTML(htmlContent, options);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate PDF');
    }

    return result.data || null;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Save PDF buffer to file (auto-saves to pdfs folder)
 * @param pdfBuffer - PDF buffer to save
 * @param defaultFileName - Default file name
 * @returns Promise with file path or null if failed
 */
export async function savePDFFile(
  pdfBuffer: Buffer,
  defaultFileName?: string
): Promise<string | null> {
  if (!isElectron) {
    console.warn('PDF saving is only available in Electron environment');
    return null;
  }

  try {
    // Get PDFs directory path (inside app directory)
    const pdfsPathResult = await window.electron!.app.getPdfsPath();
    if (!pdfsPathResult.success || !pdfsPathResult.data) {
      throw new Error('Could not get PDFs directory path');
    }

    const pdfsDir = pdfsPathResult.data;
    const fileName = defaultFileName || `document_${Date.now()}.pdf`;
    const filePath = `${pdfsDir}/${fileName}`;

    // Save to pdfs folder automatically
    const result = await window.electron!.pdf.saveFileToPath(pdfBuffer, filePath);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save PDF');
    }

    return result.filePath || null;
  } catch (error) {
    console.error('Error saving PDF file:', error);
    throw error;
  }
}

/**
 * Save PDF buffer to a specific path without dialog
 * @param pdfBuffer - PDF buffer to save
 * @param filePath - Full path where to save the file
 * @returns Promise with file path or null if failed
 */
export async function savePDFFileToPath(
  pdfBuffer: Buffer,
  filePath: string
): Promise<string | null> {
  if (!isElectron) {
    console.warn('PDF saving is only available in Electron environment');
    return null;
  }

  try {
    const result = await window.electron!.pdf.saveFileToPath(pdfBuffer, filePath);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save PDF');
    }

    return result.filePath || null;
  } catch (error) {
    console.error('Error saving PDF file to path:', error);
    throw error;
  }
}

/**
 * Generate and save PDF from HTML in one step (auto-saves to pdfs folder)
 * @param htmlContent - HTML string to convert to PDF
 * @param defaultFileName - Default file name
 * @param options - PDF generation options
 * @returns Promise with file path or null if failed
 */
export async function generateAndSavePDF(
  htmlContent: string,
  defaultFileName?: string,
  options?: PDFOptions
): Promise<string | null> {
  const pdfBuffer = await generatePDFFromHTML(htmlContent, options);
  
  if (!pdfBuffer) {
    return null;
  }

  return await savePDFFile(pdfBuffer, defaultFileName);
}

/**
 * Open PDF file in system default application or in-app viewer
 * @param filePath - Path to PDF file
 * @param openInApp - If true, opens in app viewer instead of system app
 * @param router - Optional router instance for navigation
 * @returns Promise with success status
 */
export async function openPDFFile(
  filePath: string, 
  openInApp: boolean = true,
  router?: any
): Promise<boolean> {
  if (!isElectron) {
    console.warn('PDF opening is only available in Electron environment');
    return false;
  }

  try {
    // Якщо openInApp = true, відкриваємо в додатку
    if (openInApp) {
      // Використовуємо router для навігації до PDF viewer
      if (router) {
        router.navigate({ 
          to: '/pdf-viewer', 
          search: { file: filePath } 
        });
      } else {
        // Fallback на window.location якщо router не передано
        const pdfUrl = `/pdf-viewer?file=${encodeURIComponent(filePath)}`;
        window.location.href = pdfUrl;
      }
      return true;
    }

    // Інакше відкриваємо в системному переглядачі
    const result = await window.electron!.pdf.openFile(filePath);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to open PDF');
    }

    return true;
  } catch (error) {
    console.error('Error opening PDF file:', error);
    throw error;
  }
}

/**
 * Generate PDF from a React component or HTML element
 * @param element - HTML element or React ref
 * @param options - PDF generation options
 * @returns Promise with PDF buffer or null
 */
export async function generatePDFFromElement(
  element: HTMLElement | { current: HTMLElement | null },
  options?: PDFOptions
): Promise<Buffer | null> {
  let htmlElement: HTMLElement | null = null;

  if ('current' in element) {
    // React ref
    htmlElement = element.current;
  } else {
    // Direct HTMLElement
    htmlElement = element;
  }

  if (!htmlElement) {
    throw new Error('Element is not available');
  }

  // Get the HTML content of the element
  const htmlContent = htmlElement.outerHTML;

  // Include styles from the document
  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch (e) {
        return '';
      }
    })
    .join('\n');

  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${styles}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  return await generatePDFFromHTML(fullHTML, options);
}

