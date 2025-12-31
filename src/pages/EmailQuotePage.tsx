import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { navigateBack } from "../utils/navigation";
import { BORDER, COLORS } from "../constants/theme";
import { db } from "../utils/database";
import { useQuickFormStore } from "../stores/QuickFormStore";
import { shortSex } from "../utils/shortSex";
import { pdfService, type QuoteDataForPDF } from "../services/pdf/pdfService";
import { openPDFFile } from "../utils/pdf";
import { quoteService, quickQuoteQueueService, syncService, pdfQueueService } from "../services/quotes";
import type { QuickQuoteRequest } from "../types/quotes";
import { getProductShortCode } from "../utils/productCode";
import { useAnalytics } from "../hooks/useAnalytics";

export const EmailQuotePage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const analytics = useAnalytics();
  const {
    insured,
    product,
    faceAmount,
    paymentMode,
    getPremium,
    payorEnabled,
    company,
    paymentMethod,
    configureProduct,
    waiverOfPremiumEnabled,
    waiverOfPremiumValue,
    accidentalDeathEnabled,
    accidentalDeath,
    dependentChildEnabled,
    dependentChild,
    guaranteedInsurabilityEnabled,
    guaranteedInsurability,
    payor,
  } = useQuickFormStore();
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientStreet, setClientStreet] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientState, setClientState] = useState("");
  const [clientZipCode, setClientZipCode] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [payorFirstName, setPayorFirstName] = useState("");
  const [payorLastName, setPayorLastName] = useState("");
  const [payorEmail, setPayorEmail] = useState("");
  const [quoteData, setQuoteData] = useState<{
    details: string;
    initialPremium: string;
  } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<{
    clientFirstName?: string;
    clientLastName?: string;
    clientEmail?: string;
    payorFirstName?: string;
    payorLastName?: string;
    payorEmail?: string;
  }>({});
  
  // Email validation function - matches Django's EmailValidator (RFC 5322)
  const validateEmail = (email: string): boolean => {
    // Django's EmailValidator pattern (simplified but RFC 5322 compliant)
    // Matches: local-part@domain
    // Local part: can contain letters, digits, and special characters like .-_+!
    // Domain: must have at least one dot and valid TLD (2-6 characters)
    const emailRegex = /^[-!#$%&'*+/=?^_`{}|~0-9A-Z]+(\.[-!#$%&'*+/=?^_`{}|~0-9A-Z]+)*@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?$/i;
    
    // Additional checks like Django
    if (!email || email.length === 0) {
      return false;
    }
    
    // Check length (Django has max length of 254 characters for email field)
    if (email.length > 254) {
      return false;
    }
    
    // Check for @ symbol
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }
    
    const [localPart, domain] = parts;
    
    // Local part cannot be empty
    if (!localPart || localPart.length === 0) {
      return false;
    }
    
    // Local part cannot start or end with dot
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }
    
    // Domain cannot be empty
    if (!domain || domain.length === 0) {
      return false;
    }
    
    // Domain must contain at least one dot
    if (!domain.includes('.')) {
      return false;
    }
    
    // Apply regex
    return emailRegex.test(email);
  };
  
  // Validate field function
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    if (name === 'clientFirstName' || name === 'payorFirstName') {
      if (!value.trim()) {
        newErrors[name as keyof typeof errors] = 'First name is required';
      } else {
        delete newErrors[name as keyof typeof errors];
      }
    } else if (name === 'clientLastName' || name === 'payorLastName') {
      if (!value.trim()) {
        newErrors[name as keyof typeof errors] = 'Last name is required';
      } else {
        delete newErrors[name as keyof typeof errors];
      }
    } else if (name === 'clientEmail' || name === 'payorEmail') {
      if (!value.trim()) {
        newErrors[name as keyof typeof errors] = 'Email is required';
      } else if (!validateEmail(value)) {
        newErrors[name as keyof typeof errors] = 'Please enter a valid email address';
      } else {
        delete newErrors[name as keyof typeof errors];
      }
    }
    
    setErrors(newErrors);
  };
  
  // Validate all required fields
  const validateAllFields = (): { isValid: boolean; firstErrorField?: string } => {
    const newErrors: typeof errors = {};
    let isValid = true;
    let firstErrorField: string | undefined;
    
    // Validate client fields
    if (!clientFirstName.trim()) {
      newErrors.clientFirstName = 'First name is required';
      if (!firstErrorField) firstErrorField = 'clientFirstName';
      isValid = false;
    }
    
    if (!clientLastName.trim()) {
      newErrors.clientLastName = 'Last name is required';
      if (!firstErrorField) firstErrorField = 'clientLastName';
      isValid = false;
    }
    
    if (!clientEmail.trim()) {
      newErrors.clientEmail = 'Email is required';
      if (!firstErrorField) firstErrorField = 'clientEmail';
      isValid = false;
    } else if (!validateEmail(clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
      if (!firstErrorField) firstErrorField = 'clientEmail';
      isValid = false;
    }
    
    // Validate payor fields if payor is enabled
    if (payorEnabled) {
      if (!payorFirstName.trim()) {
        newErrors.payorFirstName = 'Payor first name is required';
        if (!firstErrorField) firstErrorField = 'payorFirstName';
        isValid = false;
      }
      
      if (!payorLastName.trim()) {
        newErrors.payorLastName = 'Payor last name is required';
        if (!firstErrorField) firstErrorField = 'payorLastName';
        isValid = false;
      }
      
      if (!payorEmail.trim()) {
        newErrors.payorEmail = 'Payor email is required';
        if (!firstErrorField) firstErrorField = 'payorEmail';
        isValid = false;
      } else if (!validateEmail(payorEmail)) {
        newErrors.payorEmail = 'Please enter a valid email address';
        if (!firstErrorField) firstErrorField = 'payorEmail';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return { isValid, firstErrorField };
  };

  useEffect(() => {
    const loadAgentInfo = async () => {
      try {
        await db.init();
        const agents = await db.getAllAgents();
        if (agents.length > 0) {
          setAgentInfo(agents[0]);
        } else {
          // Mock agent data if no agent in database
          setAgentInfo({
            firstName: "John",
            lastName: "Doe",
            phone: "(940) 123 4567",
            email: "web.dev.test@nflic.com",
          });
        }
      } catch (error) {
        console.error("Error loading agent info:", error);
        // Fallback to mock data
        setAgentInfo({
          firstName: "John",
          lastName: "Doe",
          phone: "(940) 123 4567",
          email: "web.dev.test@nflic.com",
        });
      }
    };

    loadAgentInfo();
  }, []);

  useEffect(() => {
    const loadQuoteData = async () => {
      try {
        // Get premium data
        const premiumResult = await getPremium();
        
        // Format policy details - using real data from store
        const genderDisplay = shortSex(insured.sex) === 'M' ? 'Male' : 'Female';
        const smokingDisplay = insured.smokingHabit === 'Non-smoker' ? 'Non smoker' : 'Smoker';
        const details = `${genderDisplay}/Age ${insured.age}/${smokingDisplay} $${faceAmount.toLocaleString('en-US')}`;
        
        // Format premium - using real calculated premium from getPremium()
        const calculatedPremium = premiumResult.totalPremium && premiumResult.totalPremium > 0 
          ? premiumResult.totalPremium 
          : 0;
        const initialPremium = `Initial Contract Premium: $${calculatedPremium.toFixed(2)}/${paymentMode}`;
        
        setQuoteData({
          details,
          initialPremium,
        });
      } catch (error) {
        console.error('Error loading quote data:', error);
        // Fallback to calculated values even on error
        const genderDisplay = shortSex(insured.sex) === 'M' ? 'Male' : 'Female';
        const smokingDisplay = insured.smokingHabit === 'Non-smoker' ? 'Non smoker' : 'Smoker';
        setQuoteData({
          details: `${genderDisplay}/Age ${insured.age}/${smokingDisplay} $${faceAmount.toLocaleString('en-US')}`,
          initialPremium: `Initial Contract Premium: $0.00/${paymentMode}`,
        });
      }
    };

    loadQuoteData();
  }, [insured, product, faceAmount, paymentMode, getPremium]);

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleEditInformation = () => {
    navigate({ to: "/agent-info" });
  };

  const handleViewPDF = async () => {
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
    if (!isElectron) {
      alert('PDF generation is only available in Electron environment. Please run the application in Electron.');
      return;
    }
    
    // Отслеживание попытки просмотра PDF
    analytics.trackClick('view_pdf', 'quote_pdf', 'button');
    
    // Validate all fields before proceeding
    const validation = validateAllFields();
    if (!validation.isValid) {
      // Find and scroll to first error field
      if (validation.firstErrorField) {
        const firstErrorField = document.querySelector(`[name="${validation.firstErrorField}"]`) as HTMLElement;
        if (firstErrorField) {
          setTimeout(() => {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorField.focus();
          }, 100);
        }
      }
      analytics.trackEvent('pdf_view_validation_error', {
        field: validation.firstErrorField || 'unknown'
      });
      return;
    }
    
    setIsGeneratingPDF(true);
    
    // Отслеживание начала генерации PDF котировки
    analytics.trackEvent('quote_pdf_generation_started', {
      company: company || 'unknown',
      product: product || 'unknown',
      face_amount: faceAmount || 0
    });
    try {
      // Get premium data
      const premiumResult = await getPremium();
      
      // Determine company logo path based on company
      let companyLogoUri: string | undefined;
      if (company === 'CompanyA') {
        // National Farm Life
        companyLogoUri = '/nfl_brand_logo.png';
      } else if (company === 'CompanyB') {
        // American Farm Life
        companyLogoUri = '/aml_brand_logo.jpg';
      }
      
      // Prepare quote data for PDF
      const quoteData: QuoteDataForPDF = {
        id: Date.now(),
        company: company,
        product: product,
        configureProduct: product,
        faceAmount: faceAmount,
        premium: premiumResult.totalPremium,
        paymentMode: paymentMode,
        paymentMethod: 'Regular', // You can get this from store if needed
        created_at: Math.floor(Date.now() / 1000),
        insured: {
          age: insured.age,
          sex: insured.sex,
          smokingHabit: insured.smokingHabit,
        },
      };
      
      // Prepare agent data
      const agentData = agentInfo ? {
        firstName: agentInfo.firstName || '',
        lastName: agentInfo.lastName || '',
        id: agentInfo.id?.toString() || '',
        email: agentInfo.email || '',
        phone: agentInfo.phone || '',
        street: agentInfo.street || '',
        city: agentInfo.city || '',
        state: agentInfo.state || '',
        zipCode: agentInfo.zipCode || '',
      } : undefined;
      
      console.log('[EmailQuotePage] Starting PDF generation...');
      console.log('[EmailQuotePage] Quote data:', quoteData);
      console.log('[EmailQuotePage] Agent data:', agentData);
      
      // Get userData path for deterministic file path
      let pdfDirectory: string;
      if (!window.electron || !window.electron.app) {
        alert('Electron API not available. Please restart the application.');
        return;
      }
      try {
        const userDataResult = await window.electron.app.getUserDataPath();
        if (userDataResult.success && userDataResult.data) {
          pdfDirectory = userDataResult.data;
        } else {
          throw new Error(userDataResult.error || 'Could not get userData path');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Error getting save directory: ${errorMessage}\n\nPlease restart the Electron application to apply the latest changes.`);
        return;
      }
      
      const illustrationsDir = `${pdfDirectory}/illustrations`;
      const quoteId = String(quoteData.id);
      const deterministicFileName = `quote_${quoteId}.pdf`;
      const deterministicFilePath = `${illustrationsDir}/${deterministicFileName}`;
      
      console.log('[EmailQuotePage] Deterministic PDF path:', deterministicFilePath);
      
      // Generate PDF with deterministic path
      const filePath = await pdfService.generatePdf({
        quote: quoteData,
        agent: agentData,
        recipientEmail: clientEmail,
        insuredFirstName: clientFirstName,
        insuredLastName: clientLastName,
        companyLogoUri: companyLogoUri,
        deterministicPath: deterministicFilePath,
      });
      
      console.log('[EmailQuotePage] PDF generation result:', filePath);
      
      if (filePath) {
        console.log('[EmailQuotePage] PDF generated successfully:', filePath);
        
        // Отслеживание успешной генерации PDF котировки
        analytics.trackEvent('quote_pdf_generated', {
          company: company || 'unknown',
          product: product || 'unknown',
          face_amount: faceAmount || 0,
          quote_id: quoteData.id,
          success: true
        });
        
        // Save quote to database and add to sync queue
        try {
          console.log('[EmailQuotePage] Saving quote to database and adding to sync queue...');
          
          // Prepare QuoteData for saving
          const quoteDataForDb = {
            company: company,
            insured: {
              age: insured.age,
              sex: insured.sex,
              smokingHabit: insured.smokingHabit,
            },
            payorEnabled: payorEnabled,
            payor: payorEnabled && payor ? {
              age: payor.age,
              sex: payor.sex,
              smokingHabit: payor.smokingHabit,
            } : undefined,
            product: product,
            paymentMethod: paymentMethod || 'Regular',
            paymentMode: paymentMode,
            configureProduct: configureProduct || product,
            basePlan: faceAmount,
            waiverOfPremium: waiverOfPremiumEnabled,
            waiverOfPremiumValue: waiverOfPremiumValue,
            accidentalDeath: accidentalDeathEnabled,
            dependentChild: dependentChildEnabled,
            guaranteedInsurability: guaranteedInsurabilityEnabled,
            faceAmount: faceAmount,
            smokingHabit: insured.smokingHabit,
            premium: premiumResult.totalPremium,
            paymentMethod_details: paymentMethod || 'Regular',
            status: 'draft' as const,
          };
          
          // Save quote to database
          const newQuoteId = await quoteService.createQuote(quoteDataForDb);
          console.log('[EmailQuotePage] Quote saved to database with ID:', newQuoteId);
          
          // Extract termLength from product name if it's a term product
          // If not a term product, set to 0
          const extractTermFromProduct = (productName: string): number => {
            const shortCode = getProductShortCode(productName);
            
            // Check if it's a term product
            if (shortCode?.startsWith('LT') || shortCode?.startsWith('ST')) {
              const match = shortCode.match(/(\d+)/);
              if (match) {
                return parseInt(match[1], 10);
              }
            }
            
            // For WorkSitePlus Term
            if (shortCode === 'WSP_TERM') {
              const nameMatch = productName.match(/(\d+)\s*Year/);
              if (nameMatch) {
                return parseInt(nameMatch[1], 10);
              }
              return 20; // Default for WSP_TERM
            }
            
            // Try to extract from product name
            const nameMatch = productName.match(/(\d+)\s*Year/);
            if (nameMatch) {
              return parseInt(nameMatch[1], 10);
            }
            
            // If not a term product, return 0
            return 0;
          };

          const termLength = extractTermFromProduct(product || '');

          // Prepare QuickQuoteRequest for backend
          const quickQuoteRequest: QuickQuoteRequest = {
            insuranceCompanyId: company === 'CompanyA' ? 1 : 2,
            age: insured.age,
            gender: insured.sex === 'Female' ? 'Female' : 'Male',
            smoker: insured.smokingHabit === 'Smoker',
            coverageAmount: faceAmount,
            termLength: termLength,
            state: clientState.trim() || '',
            product: product || null,
            paymentMethod: paymentMethod || null,
            paymentMode: paymentMode || null,
            waiverOfPremium: waiverOfPremiumEnabled || false,
            accidentalDeathAdd: accidentalDeathEnabled && accidentalDeath?.type === 'ADD',
            accidentalDeathAddValue: accidentalDeathEnabled && accidentalDeath?.type === 'ADD' 
              ? String(accidentalDeath.value) 
              : null,
            accidentalDeathAdb: accidentalDeathEnabled && accidentalDeath?.type === 'ADB',
            accidentalDeathAdbValue: accidentalDeathEnabled && accidentalDeath?.type === 'ADB' 
              ? String(accidentalDeath.value) 
              : null,
            dependentChild: dependentChildEnabled || false,
            dependentChildAmount: dependentChildEnabled && dependentChild 
              ? String(dependentChild) 
              : null,
            guaranteedInsurability: guaranteedInsurabilityEnabled || false,
            guaranteedAmount: guaranteedInsurabilityEnabled && guaranteedInsurability 
              ? String(guaranteedInsurability) 
              : null,
            insuredFirstName: clientFirstName.trim() || null,
            insuredLastName: clientLastName.trim() || null,
            insuredEmail: clientEmail.trim() || null,
            payorFirstName: payorEnabled && payorFirstName.trim() ? payorFirstName.trim() : null,
            payorLastName: payorEnabled && payorLastName.trim() ? payorLastName.trim() : null,
            payorEmail: payorEnabled && payorEmail.trim() ? payorEmail.trim() : null,
          };
          
          // Add to queue for synchronization
          await quickQuoteQueueService.addToQueue(
            quickQuoteRequest,
            filePath,
            newQuoteId
          );
          console.log('[EmailQuotePage] Quote added to sync queue');
          
          // Save illustration to database with the correct quote ID
          try {
            await db.init();
            
            // Format date for illustration (e.g., "December 25, 2025")
            const formatDate = (date: Date) => {
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            };
            
            // Generate policy code from quote data
            const genderDisplay = shortSex(insured.sex) === 'M' ? 'M' : 'F';
            const smokingDisplay = insured.smokingHabit === 'Non-smoker' ? 'N' : 'S';
            const productCode = product.split(' ')[0] || 'PWL'; // Extract product code (e.g., "PWL" from "PWL - 30")
            const policyCode = `${productCode} - ${insured.age} - ${genderDisplay} - ${smokingDisplay}`;
            
            // Calculate monthly payment from premium
            // totalPremium is the modal premium (for the selected payment mode)
            // totalAnnualPremium is the annual premium
            // For illustration, we want to store the monthly equivalent
            // Use totalAnnualPremium if available, otherwise convert totalPremium based on payment mode
            let monthlyPayment = 0;
            if (premiumResult.totalAnnualPremium && premiumResult.totalAnnualPremium > 0) {
              // Convert annual premium to monthly
              monthlyPayment = premiumResult.totalAnnualPremium / 12;
            } else if (premiumResult.totalPremium && premiumResult.totalPremium > 0) {
              // Fallback: convert modal premium to monthly based on payment mode
              const modeMap: Record<string, number> = {
                Monthly: 1,
                Quarterly: 3,
                'Semi-Annual': 6,
                Annual: 12,
              };
              const months = modeMap[paymentMode] || 12;
              monthlyPayment = premiumResult.totalPremium / months;
            }
            
            // Save illustration with the new quote ID
            const illustration = {
              id: String(newQuoteId), // Use the new quote ID
              firstName: clientFirstName.trim(),
              lastName: clientLastName.trim(),
              email: clientEmail,
              policyCode: policyCode,
              date: formatDate(new Date()),
              deathBenefit: faceAmount,
              monthlyPayment: monthlyPayment,
              pdfPath: filePath,
              product: product,
              company: company,
              faceAmount: faceAmount,
              paymentMode: paymentMode,
              insuredAge: insured.age,
              insuredSex: insured.sex,
              insuredSmokingHabit: insured.smokingHabit,
              agentId: agentData?.id ? parseInt(agentData.id) : undefined,
              quoteId: String(newQuoteId), // Store quote ID for reference
            };
            
            await db.saveIllustration(illustration);
            console.log('[EmailQuotePage] Illustration saved to database with quote ID:', newQuoteId);
          } catch (error) {
            console.error('[EmailQuotePage] Error saving illustration:', error);
            // Don't block PDF opening if illustration save fails
          }
          
          // Add to PDF queue for Mail page
          try {
            await pdfQueueService.addToQueueWithPath(
              {
                quote: { ...quoteDataForDb, id: newQuoteId },
                agent: agentData || undefined,
                recipientEmail: clientEmail,
                insuredFirstName: clientFirstName.trim() || undefined,
                insuredLastName: clientLastName.trim() || undefined,
              },
              filePath
            );
            console.log('[EmailQuotePage] PDF added to queue for Mail page');
          } catch (error) {
            console.error('[EmailQuotePage] Error adding PDF to queue:', error);
            // Don't block PDF opening if queue add fails
          }
          
          // Try to sync immediately if online
          syncService.syncPendingQuickQuotes().catch(error => {
            console.error('[EmailQuotePage] Error syncing quotes:', error);
            // Don't block PDF opening if sync fails
          });
        } catch (error) {
          console.error('[EmailQuotePage] Error saving quote to database or adding to queue:', error);
          // Don't block PDF opening if quote save fails
        }
        
        // Open PDF in system default application
        try {
          console.log('[EmailQuotePage] Opening PDF file:', filePath);
          const opened = await openPDFFile(filePath, true, router);
          if (opened) {
            console.log('[EmailQuotePage] PDF opened successfully in app viewer');
          } else {
            console.warn('[EmailQuotePage] PDF file was not opened');
            alert('PDF generated successfully, but could not be opened automatically. File saved at: ' + filePath);
          }
        } catch (error) {
          console.error('[EmailQuotePage] Error opening PDF:', error);
          alert('PDF generated successfully, but failed to open. File saved at: ' + filePath);
        }
      } else {
        console.warn('[EmailQuotePage] PDF generation returned null - user may have canceled save dialog');
        // Don't show error if user canceled
      }
    } catch (error) {
      console.error('[EmailQuotePage] Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Отслеживание ошибки генерации PDF
      analytics.trackEvent('quote_pdf_generation_error', {
        company: company || 'unknown',
        product: product || 'unknown',
        error: errorMessage
      });
      
      alert(`Failed to generate PDF: ${errorMessage}. Please check the console for details.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Email Quote" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Quote Details */}
            {quoteData && (
              <div className="bg-gray-100 p-5 rounded-lg" style={{ borderRadius: BORDER.borderRadius }}>
                <p className="text-[#000000] text-base mb-2 font-medium">{quoteData.details}</p>
                <p className="text-[#000000] text-base">{quoteData.initialPremium}</p>
              </div>
            )}

            {/* Agent Information */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                Agent Information
              </h2>
              {agentInfo && (
                <div className="bg-gray-100 p-5 rounded-lg mb-3" style={{ borderRadius: BORDER.borderRadius }}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[#000000] text-base font-medium">
                      {agentInfo.firstName} {agentInfo.lastName} (test account)
                    </p>
                    <p className="text-[#000000] text-base">{agentInfo.phone || "(940) 123 4567"}</p>
                  </div>
                  <p className="text-[#000000] text-base">{agentInfo.email || "web.dev.test@nflic.com"}</p>
                </div>
              )}
              <div className="text-center">
                <button
                  onClick={handleEditInformation}
                  className="text-[#0D175C] hover:text-[#39458C] transition-colors text-sm font-medium underline"
                >
                  EDIT INFORMATION
                </button>
              </div>
            </div>

            {/* Client Information */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                Client Information
              </h2>
              <div className="bg-white" style={{ borderRadius: BORDER.borderRadius }}>
                <div className="flex flex-col gap-4">
                <FormField
                  label="First Name"
                  name="clientFirstName"
                  placeholder="First Name"
                  value={clientFirstName}
                  onChange={(e) => {
                    setClientFirstName(e.target.value);
                    validateField('clientFirstName', e.target.value);
                  }}
                  onBlur={(e) => validateField('clientFirstName', e.target.value)}
                  required
                  error={errors.clientFirstName}
                />
                <FormField
                  label="Last Name"
                  name="clientLastName"
                  placeholder="Last Name"
                  value={clientLastName}
                  onChange={(e) => {
                    setClientLastName(e.target.value);
                    validateField('clientLastName', e.target.value);
                  }}
                  onBlur={(e) => validateField('clientLastName', e.target.value)}
                  required
                  error={errors.clientLastName}
                />
                <FormField
                  label="Street"
                  name="clientStreet"
                  placeholder="Street"
                  value={clientStreet}
                  onChange={(e) => setClientStreet(e.target.value)}
                />
                <FormField
                  label="City"
                  name="clientCity"
                  placeholder="City"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormField
                      label="State"
                      name="clientState"
                      placeholder="State"
                      value={clientState}
                      onChange={(e) => setClientState(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      label="ZIP Code"
                      name="clientZipCode"
                      placeholder="00000"
                      value={clientZipCode}
                      onChange={(e) => setClientZipCode(e.target.value)}
                    />
                  </div>
                </div>
                <FormField
                  label="Phone"
                  name="clientPhone"
                  type="tel"
                  placeholder="(405) 918 9876"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
                <FormField
                  label="Email"
                  name="clientEmail"
                  type="email"
                  placeholder="email@email.com"
                  value={clientEmail}
                  onChange={(e) => {
                    setClientEmail(e.target.value);
                    validateField('clientEmail', e.target.value);
                  }}
                  onBlur={(e) => validateField('clientEmail', e.target.value)}
                  required
                  error={errors.clientEmail}
                />
                </div>
              </div>
            </div>

            {/* Payor Information - only show if payor is enabled */}
            {payorEnabled && (
              <div>
                <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                  Payor Information
                </h2>
                <div className="bg-white" style={{ borderRadius: BORDER.borderRadius }}>
                  <div className="flex flex-col gap-4">
                  <FormField
                    label="Payor First Name"
                    name="payorFirstName"
                    placeholder="First Name"
                    value={payorFirstName}
                    onChange={(e) => {
                      setPayorFirstName(e.target.value);
                      validateField('payorFirstName', e.target.value);
                    }}
                    onBlur={(e) => validateField('payorFirstName', e.target.value)}
                    required
                    error={errors.payorFirstName}
                  />
                  <FormField
                    label="Payor Last Name"
                    name="payorLastName"
                    placeholder="Last Name"
                    value={payorLastName}
                    onChange={(e) => {
                      setPayorLastName(e.target.value);
                      validateField('payorLastName', e.target.value);
                    }}
                    onBlur={(e) => validateField('payorLastName', e.target.value)}
                    required
                    error={errors.payorLastName}
                  />
                  <FormField
                    label="Payor Email"
                    name="payorEmail"
                    type="email"
                    placeholder="email@email.com"
                    value={payorEmail}
                    onChange={(e) => {
                      setPayorEmail(e.target.value);
                      validateField('payorEmail', e.target.value);
                    }}
                    onBlur={(e) => validateField('payorEmail', e.target.value)}
                    required
                    error={errors.payorEmail}
                  />
                  </div>
                </div>
              </div>
            )}

            {/* View PDF Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleViewPDF} fullWidth disabled={isGeneratingPDF}>
                {isGeneratingPDF ? 'GENERATING PDF...' : 'VIEW PDF'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

