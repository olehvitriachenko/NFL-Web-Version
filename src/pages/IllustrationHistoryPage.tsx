import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { navigateBack } from '../utils/navigation';
import { openPDFFile, generatePDFFromHTML, savePDFFileToPath } from '../utils/pdf';
import { pdfService, type QuoteDataForPDF, type AgentInfo } from '../services/pdf/pdfService';
import { FiSearch } from 'react-icons/fi';
import { db } from '../utils/database';

interface Illustration {
  id: string;
  name: string;
  email: string;
  policyCode: string;
  date: string;
  deathBenefit: number;
  monthlyPayment: number;
  pdfPath?: string | null;
  // Additional fields for PDF generation
  product?: string;
  company?: string;
  faceAmount?: number;
  paymentMode?: string;
  insured?: {
    age?: number;
    sex?: string;
    smokingHabit?: string;
  };
  agentId?: number;
}

// Mock data
const mockIllustrations: Illustration[] = [
  {
    id: '1',
    name: 'По про про Оророп',
    email: 'email@email.com',
    policyCode: 'PWL - 30 - M - N',
    date: 'December 25, 2025',
    deathBenefit: 10000,
    monthlyPayment: 14.73,
  },
  {
    id: '2',
    name: 'Jhgjhg Hjgjgh',
    email: 'email@email.com',
    policyCode: 'PWL - 25 - M - N',
    date: 'December 25, 2025',
    deathBenefit: 100000,
    monthlyPayment: 84.34,
  },
  {
    id: '3',
    name: 'name name',
    email: 'email@email.com',
    policyCode: 'PWL - 25 - M - N',
    date: 'December 24, 2025',
    deathBenefit: 100000,
    monthlyPayment: 84.34,
  },
  {
    id: '4',
    name: 'Too Foo',
    email: 'toofoo@example.com',
    policyCode: 'PWL - 20 - M - N',
    date: 'December 24, 2025',
    deathBenefit: 50000,
    monthlyPayment: 45.20,
  },
  {
    id: '5',
    name: 'John Doe',
    email: 'john.doe@example.com',
    policyCode: 'PWL - 30 - M - N',
    date: 'December 23, 2025',
    deathBenefit: 150000,
    monthlyPayment: 125.50,
  },
  {
    id: '6',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    policyCode: 'PWL - 25 - M - N',
    date: 'December 23, 2025',
    deathBenefit: 75000,
    monthlyPayment: 62.15,
  },
];

// Storage key for PDF paths
const PDF_PATHS_STORAGE_KEY = 'illustration_pdf_paths';

// Helper functions for storing PDF paths
const getStoredPdfPaths = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(PDF_PATHS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading PDF paths from storage:', error);
    return {};
  }
};

const savePdfPath = (illustrationId: string, pdfPath: string) => {
  try {
    const paths = getStoredPdfPaths();
    paths[illustrationId] = pdfPath;
    localStorage.setItem(PDF_PATHS_STORAGE_KEY, JSON.stringify(paths));
  } catch (error) {
    console.error('Error saving PDF path to storage:', error);
  }
};

const getPdfPath = (illustrationId: string): string | null => {
  const paths = getStoredPdfPaths();
  return paths[illustrationId] || null;
};

// Helper function to check if file exists
const checkFileExists = async (filePath: string): Promise<boolean> => {
  if (!window.electron?.pdf) {
    return false;
  }
  try {
    const result = await window.electron.pdf.fileExists(filePath);
    return result.success && result.data === true;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

export const IllustrationHistoryPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [illustrations, setIllustrations] = useState<Illustration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load illustrations from database on mount
  useEffect(() => {
    const loadIllustrations = async () => {
      setIsLoading(true);
      try {
        await db.init();
        const dbIllustrations = await db.getAllIllustrations();
        console.log('[IllustrationHistoryPage] Loaded illustrations from database:', dbIllustrations);
        
        // Transform database illustrations to match Illustration interface
        const transformedIllustrations: Illustration[] = dbIllustrations.map((ill: any) => ({
          id: ill.id,
          name: ill.name,
          email: ill.email,
          policyCode: ill.policyCode || '',
          date: ill.date,
          deathBenefit: ill.deathBenefit,
          monthlyPayment: ill.monthlyPayment,
          pdfPath: ill.pdfPath,
          product: ill.product,
          company: ill.company,
          faceAmount: ill.faceAmount,
          paymentMode: ill.paymentMode,
          insured: ill.insured,
          agentId: ill.agentId,
        }));
        
        setIllustrations(transformedIllustrations);
      } catch (error) {
        console.error('[IllustrationHistoryPage] Error loading illustrations:', error);
        // Fallback to empty array on error
        setIllustrations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadIllustrations();
  }, []);

  // Load PDF paths from storage and verify files exist (for backward compatibility)
  useEffect(() => {
    if (illustrations.length === 0) return;
    
    const loadPdfPaths = async () => {
      console.log('[IllustrationHistoryPage] Loading PDF paths from storage...');
      const storedPaths = getStoredPdfPaths();
      console.log('[IllustrationHistoryPage] Stored PDF paths:', storedPaths);
      
      const updatedIllustrations = await Promise.all(
        illustrations.map(async (illustration) => {
          // Use pdfPath from database if available, otherwise check localStorage
          if (illustration.pdfPath) {
            // Verify file still exists
            const exists = await checkFileExists(illustration.pdfPath);
            if (exists) {
              return illustration;
            } else {
              // File doesn't exist, remove from database
              try {
                await db.updateIllustrationPdfPath(illustration.id, '');
              } catch (error) {
                console.error('Error updating illustration PDF path:', error);
              }
              return { ...illustration, pdfPath: undefined };
            }
          }
          
          const storedPath = getPdfPath(illustration.id);
          if (storedPath) {
            // Verify file still exists
            const exists = await checkFileExists(storedPath);
            if (exists) {
              // Update database with the path
              try {
                await db.updateIllustrationPdfPath(illustration.id, storedPath);
              } catch (error) {
                console.error('Error updating illustration PDF path:', error);
              }
              return { ...illustration, pdfPath: storedPath };
            } else {
              // Remove invalid path from storage
              const paths = getStoredPdfPaths();
              delete paths[illustration.id];
              localStorage.setItem(PDF_PATHS_STORAGE_KEY, JSON.stringify(paths));
            }
          }
          return illustration;
        })
      );
      
      console.log('[IllustrationHistoryPage] Updated illustrations with PDF paths:', updatedIllustrations);
      setIllustrations(updatedIllustrations);
    };

    loadPdfPaths();
  }, [illustrations.length]); // Only run when illustrations are loaded

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const handleIllustrationClick = async (illustration: Illustration) => {
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
    if (!isElectron) {
      alert('PDF generation is only available in Electron environment. Please run the application in Electron.');
      return;
    }

    // Check if PDF path is stored and file exists
    let pdfPath = illustration.pdfPath || getPdfPath(illustration.id);
    
    if (pdfPath) {
      console.log('[IllustrationHistoryPage] Found stored PDF path:', pdfPath);
      // Verify file still exists
      const exists = await checkFileExists(pdfPath);
      console.log('[IllustrationHistoryPage] File exists check result:', exists);
      if (exists) {
        try {
          console.log('[IllustrationHistoryPage] Opening existing PDF:', pdfPath);
          const opened = await openPDFFile(pdfPath, true, router);
          if (!opened) {
            alert('Could not open PDF file.');
          }
        } catch (error) {
          console.error('Error opening PDF:', error);
          alert('Error opening PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
        return;
      } else {
        console.log('[IllustrationHistoryPage] Stored PDF file does not exist, removing from storage');
        // File doesn't exist, remove from storage
        const paths = getStoredPdfPaths();
        delete paths[illustration.id];
        localStorage.setItem(PDF_PATHS_STORAGE_KEY, JSON.stringify(paths));
        pdfPath = null;
      }
    } else {
      console.log('[IllustrationHistoryPage] No stored PDF path found for illustration:', illustration.id);
    }

    // Otherwise, generate new PDF
    setIsGeneratingPDF(illustration.id);
    try {
      // Parse name to get first and last name
      const nameParts = illustration.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Parse policy code to extract product info
      // Format: "PWL - 30 - M - N" or similar
      const policyParts = illustration.policyCode.split(' - ');
      const product = policyParts[0] || illustration.product || 'PWL';
      
      // Determine company logo path (default to NFL)
      const companyLogoUri = illustration.company === 'CompanyB' 
        ? '/aml_brand_logo.jpg' 
        : '/nfl_brand_logo.png';

      // Parse date string (e.g., "December 25, 2025")
      let createdAt = Math.floor(Date.now() / 1000);
      try {
        const dateObj = new Date(illustration.date);
        if (!isNaN(dateObj.getTime())) {
          createdAt = Math.floor(dateObj.getTime() / 1000);
        }
      } catch (error) {
        console.warn('Could not parse date:', illustration.date);
      }

      // Prepare quote data for PDF
      const quoteData: QuoteDataForPDF = {
        id: illustration.id,
        company: (illustration.company === 'CompanyA' || illustration.company === 'CompanyB') 
          ? illustration.company 
          : 'CompanyA',
        product: product,
        configureProduct: product,
        faceAmount: illustration.faceAmount || illustration.deathBenefit,
        premium: illustration.monthlyPayment * 12, // Convert monthly to annual
        paymentMode: illustration.paymentMode || 'Monthly',
        paymentMethod: 'Regular',
        created_at: createdAt,
        insured: {
          age: illustration.insured?.age || 30,
          sex: (illustration.insured?.sex === 'Male' || illustration.insured?.sex === 'Female')
            ? illustration.insured.sex
            : 'Male',
          smokingHabit: illustration.insured?.smokingHabit || 'Non-smoker',
        },
      };

      // Get agent data if agentId is available
      let agentData: AgentInfo | undefined;
      if (illustration.agentId && window.electron?.db) {
        try {
          const agentResult = await window.electron.db.getAgentById(illustration.agentId);
          if (agentResult.success && agentResult.data) {
            agentData = {
              firstName: agentResult.data.firstName || '',
              lastName: agentResult.data.lastName || '',
              email: agentResult.data.email || '',
              phone: agentResult.data.phone || '',
              street: agentResult.data.street || '',
              city: agentResult.data.city || '',
              state: agentResult.data.state || '',
              zipCode: agentResult.data.zipCode || '',
            };
          }
        } catch (error) {
          console.warn('Could not load agent data:', error);
        }
      }

      console.log('[IllustrationHistoryPage] Generating PDF for illustration:', illustration.id);
      console.log('[IllustrationHistoryPage] Quote data:', quoteData);
      
      // Get userData directory for saving PDFs
      let pdfDirectory: string;
      console.log('[IllustrationHistoryPage] Checking Electron API availability...');
      console.log('[IllustrationHistoryPage] window.electron:', window.electron);
      console.log('[IllustrationHistoryPage] window.electron?.app:', window.electron?.app);
      
      if (!window.electron) {
        console.error('[IllustrationHistoryPage] window.electron is not available');
        alert('Electron API not available. Please restart the application.');
        return;
      }
      
      if (!window.electron.app) {
        console.error('[IllustrationHistoryPage] window.electron.app is not available');
        alert('Electron app API not available. Please restart the application.');
        return;
      }
      
      try {
        console.log('[IllustrationHistoryPage] Calling getUserDataPath...');
        const userDataResult = await window.electron.app.getUserDataPath();
        console.log('[IllustrationHistoryPage] getUserDataPath result:', userDataResult);
        
        if (userDataResult.success && userDataResult.data) {
          pdfDirectory = userDataResult.data;
          console.log('[IllustrationHistoryPage] UserData path:', pdfDirectory);
        } else {
          console.error('[IllustrationHistoryPage] getUserDataPath failed:', userDataResult.error);
          throw new Error(userDataResult.error || 'Could not get userData path');
        }
      } catch (error) {
        console.error('[IllustrationHistoryPage] Error getting userData path:', error);
        console.error('[IllustrationHistoryPage] Error details:', error instanceof Error ? error.message : String(error));
        console.error('[IllustrationHistoryPage] Full error object:', error);
        
        // Show detailed error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Error getting save directory: ${errorMessage}\n\nPlease restart the Electron application to apply the latest changes.`);
        return;
      }

      // Create PDFs directory path
      const pdfsDir = `${pdfDirectory}/pdfs`;
      
      // Generate deterministic filename based on illustration ID
      const deterministicFileName = `illustration_${illustration.id}.pdf`;
      const deterministicFilePath = `${pdfsDir}/${deterministicFileName}`;
      
      console.log('[IllustrationHistoryPage] Deterministic PDF path:', deterministicFilePath);
      
      // Check if file already exists with deterministic name
      const fileExists = await checkFileExists(deterministicFilePath);
      console.log('[IllustrationHistoryPage] File exists check for deterministic path:', fileExists);
      if (fileExists) {
        console.log('[IllustrationHistoryPage] PDF file already exists with deterministic name:', deterministicFilePath);
        // Save path to storage
        savePdfPath(illustration.id, deterministicFilePath);
        // Update state
        setIllustrations(prev => 
          prev.map(ill => 
            ill.id === illustration.id 
              ? { ...ill, pdfPath: deterministicFilePath }
              : ill
          )
        );
        // Open existing PDF
        try {
          const opened = await openPDFFile(deterministicFilePath, true, router);
          if (!opened) {
            alert('Could not open PDF file.');
          }
        } catch (error) {
          console.error('Error opening PDF:', error);
          alert('Error opening PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
        return;
      }

      // Generate HTML for PDF
      const html = await pdfService.generateHTMLTemplate({
        quote: quoteData,
        agent: agentData,
        recipientEmail: illustration.email,
        insuredFirstName: firstName,
        insuredLastName: lastName,
        companyLogoUri: companyLogoUri,
      });

      if (!html || html.trim().length === 0) {
        throw new Error('Generated HTML template is empty');
      }

      // Generate PDF buffer
      const pdfBuffer = await generatePDFFromHTML(html, {
        pageSize: 'Letter',
        printBackground: true,
      });

      if (!pdfBuffer) {
        alert('PDF generation failed.');
        return;
      }

      // Save PDF to deterministic path
      const filePath = await savePDFFileToPath(pdfBuffer, deterministicFilePath);

      if (!filePath) {
        console.log('[IllustrationHistoryPage] PDF save failed');
        alert('PDF save failed.');
        return;
      }

      console.log('[IllustrationHistoryPage] PDF generated successfully:', filePath);
      console.log('[IllustrationHistoryPage] Saving PDF path to storage for illustration:', illustration.id);
      
      // Save PDF path to database
      try {
        await db.updateIllustrationPdfPath(illustration.id, filePath);
        console.log('[IllustrationHistoryPage] PDF path saved to database');
      } catch (error) {
        console.error('[IllustrationHistoryPage] Error saving PDF path to database:', error);
        // Fallback to localStorage
        savePdfPath(illustration.id, filePath);
      }
      
      // Update illustration in state
      setIllustrations(prev => {
        const updated = prev.map(ill => 
          ill.id === illustration.id 
            ? { ...ill, pdfPath: filePath }
            : ill
        );
        console.log('[IllustrationHistoryPage] Updated illustrations state:', updated);
        return updated;
      });
      
      // Open PDF in app viewer
      try {
        const opened = await openPDFFile(filePath, true, router);
        if (!opened) {
          alert('PDF generated successfully, but could not be opened automatically. File saved at: ' + filePath);
        }
      } catch (error) {
        console.error('Error opening PDF:', error);
        alert('PDF generated successfully, but could not be opened. File saved at: ' + filePath);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const filteredIllustrations = useMemo(() => {
    if (!searchQuery.trim()) {
      return illustrations;
    }

    const query = searchQuery.toLowerCase();
    return illustrations.filter(
      (illustration) =>
        illustration.name.toLowerCase().includes(query) ||
        illustration.email.toLowerCase().includes(query)
    );
  }, [searchQuery, illustrations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Illustration History" onBack={handleBack} onHome={handleHome} />
      <div className="px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-4">
            <FiSearch
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-[#000000] placeholder:text-gray-400 focus:outline-none focus:border-[#0D175C] focus:ring-2 focus:ring-[#0D175C]/10"
              style={{ borderRadius: 10 }}
            />
          </div>

          {/* Illustration List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">Loading illustrations...</p>
              </div>
            ) : filteredIllustrations.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">No illustrations found</p>
              </div>
            ) : (
              filteredIllustrations.map((illustration) => (
                <div
                  key={illustration.id}
                  onClick={() => handleIllustrationClick(illustration)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[#0D175C]/30 transition-all"
                  style={{ borderRadius: 10 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#000000] mb-1">
                        {illustration.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">{illustration.email}</p>
                      <p className="text-sm text-gray-700">{illustration.policyCode}</p>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-nowrap ml-4">
                      {illustration.date}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-green-100 rounded-full"
                        style={{ backgroundColor: '#E8F9F0' }}
                      >
                        DEATH BENEFIT:
                      </span>
                      <span className="text-sm font-semibold text-[#000000]">
                        {formatCurrency(illustration.deathBenefit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 text-xs font-medium text-gray-700 rounded-full"
                        style={{ backgroundColor: '#FFF4D9' }}
                      >
                        MONTHLY PAYMENT:
                      </span>
                      <span className="text-sm font-semibold text-[#000000]">
                        {formatCurrency(illustration.monthlyPayment)}
                      </span>
                    </div>
                    {isGeneratingPDF === illustration.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0D175C]"></div>
                        <span className="text-xs text-gray-600">Generating PDF...</span>
                      </div>
                    )}
                    {illustration.pdfPath && isGeneratingPDF !== illustration.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-green-600">✓ PDF available</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
