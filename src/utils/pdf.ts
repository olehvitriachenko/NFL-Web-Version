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
 * Save PDF buffer to file
 * @param pdfBuffer - PDF buffer to save
 * @param defaultFileName - Default file name for save dialog
 * @returns Promise with file path or null if canceled
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
    const result = await window.electron!.pdf.saveFile(pdfBuffer, defaultFileName);
    
    if (!result.success) {
      if (result.error?.includes('canceled')) {
        return null; // User canceled
      }
      throw new Error(result.error || 'Failed to save PDF');
    }

    return result.filePath || null;
  } catch (error) {
    console.error('Error saving PDF file:', error);
    throw error;
  }
}

/**
 * Generate and save PDF from HTML in one step
 * @param htmlContent - HTML string to convert to PDF
 * @param defaultFileName - Default file name for save dialog
 * @param options - PDF generation options
 * @returns Promise with file path or null if canceled
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
 * Open PDF file in system default application
 * @param filePath - Path to PDF file
 * @returns Promise with success status
 */
export async function openPDFFile(filePath: string): Promise<boolean> {
  if (!isElectron) {
    console.warn('PDF opening is only available in Electron environment');
    return false;
  }

  try {
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

