/**
 * PDF Generation Service
 * Generates PDF documents from quote data using HTML templates
 * Adapted from React Native version for web/Electron environment
 */

import { generateAndSavePDF } from '../../utils/pdf';
import { generatePDFHTMLTemplate } from './pdfTemplate';
import { 
  AccumulatedPUA, 
  calculateNflAnnuity,
  calculatePremierIllustration,
  generateYearlyIllustrationData
} from '../illustrationSummary/illustrationSummaryCalculations';
import { getProductShortCode } from '../../utils/productCode';
import { shortSex } from '../../utils/shortSex';
import { shortSmokingStatus } from '../../utils/shortSmokingStatus';
import { getPlanCode } from '../../utils/planCodes';
import { isTermProduct } from '../../utils/planCodes';
import { calculatePremium, PaymentMode, PaymentMethod, ProductType } from '../premiumCalculating';
import { Gender } from '../premiumCalculating/types';
import { getRequiredExaminations } from '../qualificationExaminations';
import type { AgentInfo } from '../../types/agent';

// Re-export types for convenience
export type { AgentInfo };

/**
 * Quote data interface for PDF generation
 */
export interface QuoteDataForPDF {
  id?: string | number;
  company?: 'CompanyA' | 'CompanyB';
  product?: string;
  configureProduct?: string;
  faceAmount: number;
  premium?: number;
  paymentMode?: string;
  paymentMethod?: string;
  created_at?: number;
  insured?: {
    age: number;
    sex: 'Male' | 'Female';
    smokingHabit: string;
  };
  smokingHabit?: string;
}

/**
 * PDF Generation Options
 */
export interface PdfGenerationOptions {
  quote: QuoteDataForPDF;
  agent?: AgentInfo;
  recipientEmail?: string;
  insuredFirstName?: string;
  insuredLastName?: string;
  /**
   * Optional URI to the company logo image used in Quick Quote.
   * If provided, will be rendered in the PDF header instead of the gray placeholder block.
   */
  companyLogoUri?: string;
  illustrationData?: {
    current?: {
      totalPaidUp?: { guaranteed?: number; midpoint?: number; current?: number };
      deathBenefit?: { guaranteed?: number; midpoint?: number; current?: number };
    };
    age70?: {
      premiums?: { guaranteed?: number; midpoint?: string | number; current?: string | number };
      cashSurrenderValue?: { guaranteed?: number; midpoint?: number; current?: number };
      totalPaidUp?: { guaranteed?: number; midpoint?: number; current?: number };
      deathBenefit?: { guaranteed?: number; midpoint?: number; current?: number };
    };
    year5?: {
      premiums?: number;
      cashSurrenderValue?: { guaranteed?: number; midpoint?: number; current?: number };
      deathBenefit?: { guaranteed?: number; midpoint?: number; current?: number };
    };
    year10?: {
      premiums?: number;
      cashSurrenderValue?: { guaranteed?: number; midpoint?: number; current?: number };
      deathBenefit?: { guaranteed?: number; midpoint?: number; current?: number };
    };
    year20?: {
      premiums?: number;
      cashSurrenderValue?: { guaranteed?: number; midpoint?: number; current?: number };
      deathBenefit?: { guaranteed?: number; midpoint?: number; current?: number };
    };
    year90?: {
      premiums?: number;
      cashSurrenderValue?: { guaranteed?: number; midpoint?: number; current?: number };
      deathBenefit?: { guaranteed?: number; midpoint?: number; current?: number };
    };
  };
}

/**
 * Helper function to format currency
 */
function formatCurrency(amount: number | undefined | string): string {
  if (!amount && amount !== 0) return 'N/A';
  if (typeof amount === 'string') return amount === '' ? '-' : amount;
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Helper function to format number (no currency symbol)
 */
function formatNumber(amount: number | undefined | string): string {
  if (!amount && amount !== 0) return '-';
  if (typeof amount === 'string') return amount === '' ? '-' : amount;
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Helper function to format currency without decimals
 */
function formatCurrencyNoDecimals(amount: number | undefined | string): string {
  if (!amount && amount !== 0) return 'N/A';
  if (typeof amount === 'string') return amount === '' ? '-' : amount;
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Helper function to format smoking habit
 */
function formatSmokingHabit(smokingHabit: string): string {
  if (smokingHabit === 'Smoker' || smokingHabit === 'Y') return 'Smoker';
  if (smokingHabit === 'Non-smoker' || smokingHabit === 'Non smoker' || smokingHabit === 'N') return 'Non Smoker';
  return smokingHabit;
}

/**
 * Convert premium to monthly based on payment mode
 */
function convertToMonthly(totalPremium: number, paymentMode: string): number {
  const modeMap: Record<string, number> = {
    'Monthly': 1,
    'Quarterly': 3,
    'Semi-Annual': 6,
    'Annual': 12
  };
  
  const months = modeMap[paymentMode] || 12;
  return totalPremium / months;
}

/**
 * Check if product is term product by plan code
 */
function isTermProductByPlanCode(planCode: string): boolean {
  return isTermProduct(planCode, true);
}

class PdfService {
  /**
   * Generates HTML template for PDF
   */
  async generateHTMLTemplate(options: PdfGenerationOptions): Promise<string> {
    const { quote, agent, insuredFirstName, insuredLastName, illustrationData, companyLogoUri } = options;
    
    // Get quote number
    const quoteNumber = quote.id ? `${quote.id}` : `${Date.now()}`;
    
    // Get product name
    const productNameRaw = quote.product || quote.configureProduct || 'PWL - Participating Whole Life';
    
    // Try to get product info
    let productName = 'Participating Whole Life';
    let productAbbrev = 'PWL';
    let productType = 'Participating Whole Life Insurance';
    
    try {
      // Always use full product name from productNameRaw
      productName = productNameRaw;
      
      if (productNameRaw.includes('Participating Whole Life') || productNameRaw.includes('PWL')) {
        productAbbrev = 'PWL';
        productType = 'Participating Whole Life Insurance';
      } else if (productNameRaw.includes('Term')) {
        productAbbrev = getProductShortCode(productNameRaw) || productNameRaw.split(' - ')[0] || productNameRaw;
        productType = 'Term Life Insurance';
      } else if (productNameRaw.includes('Annuity')) {
        productAbbrev = getProductShortCode(productNameRaw) || productNameRaw.split(' - ')[0] || productNameRaw;
        productType = 'Annuity Product';
      } else if (productNameRaw.includes('Premier')) {
        productAbbrev = getProductShortCode(productNameRaw) || productNameRaw.split(' - ')[0] || productNameRaw;
        productType = 'Whole Life Insurance';
      } else {
        productAbbrev = getProductShortCode(productNameRaw) || productNameRaw.split(' - ')[0] || productNameRaw;
      }
    } catch (error) {
      console.warn('[PdfService] Failed to get product info, using defaults:', error);
      // Fallback to full product name
      productName = productNameRaw;
    }
    
    // Format date
    const formatDate = (timestamp?: number) => {
      if (!timestamp) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      return new Date(timestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    // Get insured name
    const insuredName = (insuredFirstName && insuredLastName) 
      ? `${insuredFirstName} ${insuredLastName}`
      : (insuredFirstName || insuredLastName || 'N/A');
    
    // Get insured details
    const insuredAge = quote.insured?.age || 0;
    const insuredSex = quote.insured?.sex || 'Male';
    const smokingStatus = quote.insured?.smokingHabit || quote.smokingHabit || 'Non-smoker';
    const smokingDisplay = formatSmokingHabit(smokingStatus);
    const sexDisplay = insuredSex === 'Male' ? 'Male' : 'Female';
    
    // Get product form name
    const productForm = 'Form Par WL - 3-04';

    // Company logo HTML
    const companyLogoHtml = companyLogoUri
      ? `<img src="${companyLogoUri}" class="logo-image" alt="Company Logo" />`
      : `
        <div class="logo-graphic"></div>
        <div>
          <div class="company-name">National</div>
          <div class="company-tagline">FARM • LIFE</div>
        </div>
      `;
    const smallCompanyLogo = companyLogoUri
      ? `<img src="${companyLogoUri}" class="logo-image-small" alt="Company Logo" />`
      : `
        <div class="logo-graphic"></div>
        <div>
          <div class="company-name">National</div>
          <div class="company-tagline">FARM • LIFE</div>
        </div>
      `;
    
    // Calculate illustration data
    const baseAmountForIllustration = quote.faceAmount || 0;
    const issueAge = insuredAge;
    const productNameForIllustration = productNameRaw;
    
    // Calculate premium if not provided
    let calculatedPremium = quote.premium || 0;
    if (!calculatedPremium || calculatedPremium === 0) {
      if (productNameForIllustration === 'Flexible Premium Annuity' || productNameForIllustration === 'NFL Annuity') {
        calculatedPremium = baseAmountForIllustration;
      } else {
        try {
          const premiumParams = {
            productType: getProductShortCode(productNameForIllustration) as ProductType,
            faceAmount: baseAmountForIllustration,
            age: issueAge,
            gender: shortSex(insuredSex),
            smokingStatus: shortSmokingStatus(smokingStatus) as 'S' | 'N',
            paymentMode: (quote.paymentMode || 'Monthly') as PaymentMode,
            paymentMethod: (quote.paymentMethod === 'Regular' || quote.paymentMethod === 'R' ? PaymentMethod.Regular : PaymentMethod.EFT) as PaymentMethod,
          };
          const premiumResult = await calculatePremium(premiumParams);
          calculatedPremium = premiumResult.modalPremium;
        } catch (error) {
          console.warn('[PdfService] Failed to calculate premium, using 0:', error);
          calculatedPremium = 0;
        }
      }
    }
    
    // Calculate annual premium
    const monthlyPremium = calculatedPremium;
    const paymentModeStr = quote.paymentMode || 'Monthly';
    const monthlyPremiumConverted = convertToMonthly(monthlyPremium, paymentModeStr);
    const annualPremium = Math.round(monthlyPremiumConverted * 12);
    
    // Get plan code, sex, and smoker status
    const gender = shortSex(insuredSex);
    const smoking = shortSmokingStatus(smokingStatus);
    const smokerForPlanCode = smoking === 'S' ? 'Y' : 'N';
    const smokerForIllustration = smoking === 'S' ? 'S' : 'N';
    const sex = gender === 'M' ? 'M' : 'F';
    
    // Build control code key for plan code lookup
    const smokingKey = smokerForPlanCode;
    const genderKey = gender;
    let controlCodeKey = `${genderKey}${smokingKey}`;
    
    // For term products, add term number if available
    if (productNameRaw.includes('Term')) {
      const termMatch = productNameRaw.match(/(\d+)/);
      if (termMatch) {
        controlCodeKey = `${controlCodeKey}${termMatch[1]}`;
        if (getProductShortCode(productNameRaw)?.startsWith('ST')) {
          controlCodeKey += '_ST';
        }
      }
    }
    
    const planCodeForIllustration = getPlanCode(controlCodeKey) || '';
    
    // Calculate illustration data for Summary Years
    let calculatedIllustration: any = {
      current: {
        totalPaidUp: { guaranteed: 0, midpoint: 0, current: 0 },
        deathBenefit: { guaranteed: baseAmountForIllustration, midpoint: 0, current: 0 },
      },
      age70: {
        premiums: { guaranteed: 0, midpoint: '', current: '' },
        cashSurrenderValue: { guaranteed: 0, midpoint: 0, current: 0 },
        totalPaidUp: { guaranteed: 0, midpoint: 0, current: 0 },
        deathBenefit: { guaranteed: baseAmountForIllustration, midpoint: 0, current: 0 },
      },
      year5: {
        premiums: 0,
        cashSurrenderValue: { guaranteed: 0, midpoint: 0, current: 0 },
        deathBenefit: { guaranteed: baseAmountForIllustration, midpoint: 0, current: 0 },
      },
      year10: {
        premiums: 0,
        cashSurrenderValue: { guaranteed: 0, midpoint: 0, current: 0 },
        deathBenefit: { guaranteed: baseAmountForIllustration, midpoint: 0, current: 0 },
      },
      year20: {
        premiums: 0,
        cashSurrenderValue: { guaranteed: 0, midpoint: 0, current: 0 },
        deathBenefit: { guaranteed: baseAmountForIllustration, midpoint: 0, current: 0 },
      },
      year90: {
        premiums: 0,
        cashSurrenderValue: { guaranteed: baseAmountForIllustration, midpoint: 0, current: 0 },
        deathBenefit: { guaranteed: baseAmountForIllustration, midpoint: 0, current: 0 },
      },
    };
    
    // Calculate Summary Years data using AccumulatedPUA if we have valid plan code
    if (planCodeForIllustration && !isTermProduct(productNameForIllustration)) {
      try {
        // Calculate for year 5
        const year5Data = await AccumulatedPUA(baseAmountForIllustration, 5, planCodeForIllustration, sex, smokerForIllustration, issueAge);
        calculatedIllustration.year5 = {
          premiums: Math.round(5 * annualPremium),
          cashSurrenderValue: {
            guaranteed: year5Data.guaranteed,
            midpoint: year5Data.mid,
            current: year5Data.current,
          },
          deathBenefit: {
            guaranteed: baseAmountForIllustration,
            midpoint: year5Data.midDeathBenefit,
            current: year5Data.totalDeathBenefit,
          },
        };
        
        // Calculate for year 10
        const year10Data = await AccumulatedPUA(baseAmountForIllustration, 10, planCodeForIllustration, sex, smokerForIllustration, issueAge);
        calculatedIllustration.year10 = {
          premiums: Math.round(10 * annualPremium),
          cashSurrenderValue: {
            guaranteed: year10Data.guaranteed,
            midpoint: year10Data.mid,
            current: year10Data.current,
          },
          deathBenefit: {
            guaranteed: baseAmountForIllustration,
            midpoint: year10Data.midDeathBenefit,
            current: year10Data.totalDeathBenefit,
          },
        };
        
        // Calculate for year 20
        const year20Data = await AccumulatedPUA(baseAmountForIllustration, 20, planCodeForIllustration, sex, smokerForIllustration, issueAge);
        calculatedIllustration.year20 = {
          premiums: Math.round(20 * annualPremium),
          cashSurrenderValue: {
            guaranteed: year20Data.guaranteed,
            midpoint: year20Data.mid,
            current: year20Data.current,
          },
          deathBenefit: {
            guaranteed: baseAmountForIllustration,
            midpoint: year20Data.midDeathBenefit,
            current: year20Data.totalDeathBenefit,
          },
        };
        
        // Calculate for age 70
        const yearsTo70 = Math.max(0, 70 - issueAge);
        if (yearsTo70 > 0) {
          const age70Data = await AccumulatedPUA(baseAmountForIllustration, yearsTo70, planCodeForIllustration, sex, smokerForIllustration, issueAge);
          calculatedIllustration.age70 = {
            premiums: {
              guaranteed: Math.round(yearsTo70 * annualPremium),
              midpoint: '',
              current: '',
            },
            cashSurrenderValue: {
              guaranteed: age70Data.guaranteed,
              midpoint: age70Data.mid,
              current: age70Data.current,
            },
            totalPaidUp: {
              guaranteed: 0,
              midpoint: age70Data.paidUpMid,
              current: age70Data.totalPaidUp,
            },
            deathBenefit: {
              guaranteed: baseAmountForIllustration,
              midpoint: age70Data.midDeathBenefit,
              current: age70Data.totalDeathBenefit,
            },
          };
        }
        
        // Calculate for final year (age 121)
        const finalYear = 121 - issueAge;
        if (finalYear > 0 && productNameForIllustration !== 'Payroll - 20 Year Term') {
          const finalYearData = await AccumulatedPUA(baseAmountForIllustration, finalYear, planCodeForIllustration, sex, smokerForIllustration, issueAge);
          calculatedIllustration.year90 = {
            premiums: Math.round(finalYear * annualPremium),
            cashSurrenderValue: {
              guaranteed: finalYearData.guaranteed,
              midpoint: finalYearData.mid,
              current: finalYearData.current,
            },
            deathBenefit: {
              guaranteed: baseAmountForIllustration,
              midpoint: finalYearData.midDeathBenefit,
              current: finalYearData.totalDeathBenefit,
            },
          };
        }
      } catch (error) {
        console.warn('[PdfService] Failed to calculate illustration data for Summary Years:', error);
      }
    } else if (productNameForIllustration.includes('Premier')) {
      // Handle Premier products
      try {
        const yearsTo70 = Math.max(0, 70 - issueAge);
        if (yearsTo70 > 0 && planCodeForIllustration) {
          const age70Data = await calculatePremierIllustration(baseAmountForIllustration, yearsTo70, planCodeForIllustration, sex, smokerForIllustration, issueAge);
          calculatedIllustration.age70 = {
            premiums: {
              guaranteed: Math.round(yearsTo70 * annualPremium),
              midpoint: '',
              current: '',
            },
            cashSurrenderValue: {
              guaranteed: age70Data.guaranteedCashValue,
              midpoint: age70Data.guaranteedCashValue,
              current: age70Data.guaranteedCashValue,
            },
            deathBenefit: {
              guaranteed: age70Data.deathBenefit,
              midpoint: age70Data.deathBenefit,
              current: age70Data.deathBenefit,
            },
          };
        }
      } catch (error) {
        console.warn('[PdfService] Failed to calculate Premier illustration:', error);
      }
    } else if (planCodeForIllustration && isTermProductByPlanCode(planCodeForIllustration)) {
      // Handle Term products
      try {
        const productType = getProductShortCode(productNameForIllustration) as ProductType;
        const convertedPaymentMode = (quote.paymentMode || 'Monthly') as PaymentMode;
        const convertedPaymentMethod = (quote.paymentMethod === 'Regular' || quote.paymentMethod === 'R' ? PaymentMethod.Regular : PaymentMethod.EFT) as PaymentMethod;

        // Helper function to calculate total premiums for a given number of years
        const calculateTermPremiums = async (years: number): Promise<number> => {
          let totalPremiums = 0;
          for (let year = 1; year <= years; year++) {
            try {
              const premiumResult = await calculatePremium({
                productType,
                faceAmount: baseAmountForIllustration,
                age: issueAge,
                gender: sex,
                smokingStatus: smokerForIllustration,
                paymentMode: convertedPaymentMode,
                paymentMethod: convertedPaymentMethod,
              }, year);
              totalPremiums += premiumResult.modalPremium * 12;
            } catch (error) {
              console.log(`[PdfService] Failed to calculate premium for term year ${year}:`, error);
            }
          }
          return Math.round(totalPremiums);
        };

        // Calculate for year 5
        const year5Premiums = await calculateTermPremiums(5);
        calculatedIllustration.year5 = {
          premiums: year5Premiums,
          deathBenefit: {
            guaranteed: baseAmountForIllustration,
            midpoint: 0,
            current: 0,
          },
        };

        // Calculate for year 10
        const year10Premiums = await calculateTermPremiums(10);
        calculatedIllustration.year10 = {
          premiums: year10Premiums,
          deathBenefit: {
            guaranteed: baseAmountForIllustration,
            midpoint: 0,
            current: 0,
          },
        };

        // Calculate for year 20
        const year20Premiums = await calculateTermPremiums(20);
        calculatedIllustration.year20 = {
          premiums: year20Premiums,
          deathBenefit: {
            guaranteed: baseAmountForIllustration,
            midpoint: 0,
            current: 0,
          },
        };

        // Calculate for age 70
        const yearsTo70 = Math.max(0, 70 - issueAge);
        if (yearsTo70 > 0) {
          const age70Premiums = await calculateTermPremiums(yearsTo70);
          calculatedIllustration.age70 = {
            premiums: {
              guaranteed: age70Premiums,
              midpoint: '',
              current: '',
            },
            deathBenefit: {
              guaranteed: baseAmountForIllustration,
              midpoint: 0,
              current: 0,
            },
          };
        }

        // Calculate for final year
        const finalYear = 121 - issueAge;
        if (finalYear > 0 && productNameForIllustration !== 'Payroll - 20 Year Term') {
          const finalYearPremiums = await calculateTermPremiums(finalYear);
          calculatedIllustration.year90 = {
            premiums: finalYearPremiums,
            deathBenefit: {
              guaranteed: baseAmountForIllustration,
              midpoint: 0,
              current: 0,
            },
          };
        }
      } catch (error) {
        console.warn('[PdfService] Failed to calculate term product illustration:', error);
      }
    }
    
    // Use calculated illustration data
    const illustration = calculatedIllustration;
    const baseAmount = quote.faceAmount || 0;
    
    // Check if this is a term product
    const isTermProductForPdf = planCodeForIllustration ? isTermProductByPlanCode(planCodeForIllustration) : false;
    
    // Generate yearly illustration data
    let yearlyIllustrationData: Array<{
      age: number;
      endOfYear: number;
      contractPremium: number;
      guaranteedCashValue: number;
      guaranteedDeathBenefit: number;
      annualDividend: number;
      accumPaidUpAdditions: number;
      currentCashValue: number;
      currentDeathBenefit: number;
      totalPaidUp: number;
    }> = [];
    
    // Helper function to generate yearly illustration data for term products
    const generateYearlyIllustrationDataForTerm = async (
      faceAmount: number,
      issueAge: number,
      productType: ProductType,
      sex: 'M' | 'F',
      smoker: 'N' | 'S',
      paymentMode: PaymentMode,
      paymentMethod: PaymentMethod
    ): Promise<Array<{
      age: number;
      endOfYear: number;
      contractPremium: number;
      guaranteedCashValue: number;
      guaranteedDeathBenefit: number;
      annualDividend: number;
      accumPaidUpAdditions: number;
      currentCashValue: number;
      currentDeathBenefit: number;
      totalPaidUp: number;
    }>> => {
      const results: Array<{
        age: number;
        endOfYear: number;
        contractPremium: number;
        guaranteedCashValue: number;
        guaranteedDeathBenefit: number;
        annualDividend: number;
        accumPaidUpAdditions: number;
        currentCashValue: number;
        currentDeathBenefit: number;
        totalPaidUp: number;
      }> = [];

      // Determine years to calculate: 1-20 every year, then every 5 years until age 121
      const yearsToCalculate: number[] = [];
      for (let year = 1; year <= 20; year++) {
        yearsToCalculate.push(year);
      }
      
      let year = 25;
      while (true) {
        const age = issueAge + year;
        if (age > 121) break;
        yearsToCalculate.push(year);
        year += 5;
      }
      
      const yearFor121 = 121 - issueAge;
      if (yearFor121 > 20 && !yearsToCalculate.includes(yearFor121)) {
        yearsToCalculate.push(yearFor121);
      }

      // Calculate data for each year
      for (const year of yearsToCalculate) {
        const age = issueAge + year;
        
        // Calculate annual premium for this specific year
        let annualPremiumForYear = 0;
        try {
          const premiumResult = await calculatePremium({
            productType,
            faceAmount,
            age: issueAge,
            gender: sex,
            smokingStatus: smoker,
            paymentMode,
            paymentMethod,
          }, year);
          annualPremiumForYear = Math.round(premiumResult.modalPremium * 12);
        } catch (error) {
          console.log(`[PdfService] Failed to calculate premium for term year ${year}:`, error);
        }

        results.push({
          age,
          endOfYear: year,
          contractPremium: annualPremiumForYear,
          guaranteedCashValue: 0,
          guaranteedDeathBenefit: faceAmount,
          annualDividend: 0,
          accumPaidUpAdditions: 0,
          currentCashValue: 0,
          currentDeathBenefit: faceAmount,
          totalPaidUp: 0,
        });
      }

      return results;
    };

    try {
      if (planCodeForIllustration && isTermProductByPlanCode(planCodeForIllustration)) {
        const productType = getProductShortCode(productNameForIllustration) as ProductType;
        const convertedPaymentMode = (quote.paymentMode || 'Monthly') as PaymentMode;
        const convertedPaymentMethod = (quote.paymentMethod === 'Regular' || quote.paymentMethod === 'R' ? PaymentMethod.Regular : PaymentMethod.EFT) as PaymentMethod;
        
        yearlyIllustrationData = await generateYearlyIllustrationDataForTerm(
          baseAmountForIllustration,
          issueAge,
          productType,
          sex,
          smokerForIllustration,
          convertedPaymentMode,
          convertedPaymentMethod
        );
      } else if (planCodeForIllustration && !isTermProduct(productNameForIllustration)) {
        yearlyIllustrationData = await generateYearlyIllustrationData(
          baseAmountForIllustration,
          annualPremium,
          planCodeForIllustration,
          sex,
          smokerForIllustration,
          issueAge
        );
      }
    } catch (error) {
      console.warn('[PdfService] Failed to generate yearly illustration data:', error);
    }

    // Generate table rows from illustration data
    const generateTableRows = (dataToShow: typeof yearlyIllustrationData): string => {
      const rows: string[] = [];
      let previousYear = 0;

      dataToShow.forEach((row, index) => {
        if (index > 0 && previousYear % 10 === 0 && previousYear !== row.endOfYear) {
          rows.push(
            '<tr>' +
            '<td style="height: 10px; border-left: 1px solid #000; border-right: 1px solid #000;"></td>'.repeat(10) +
            '</tr>'
          );
        }
        
        previousYear = row.endOfYear;

        rows.push(
          '<tr>' +
          '<td class="age-col">' + row.age + '</td>' +
          '<td class="age-col">' + row.endOfYear + '</td>' +
          '<td>' + formatNumber(row.contractPremium) + '</td>' +
          '<td>' + formatNumber(row.guaranteedCashValue) + '</td>' +
          '<td>' + formatNumber(row.guaranteedDeathBenefit) + '</td>' +
          '<td>' + formatNumber(row.annualDividend) + '</td>' +
          '<td>' + formatNumber(row.accumPaidUpAdditions) + '</td>' +
          '<td>' + formatNumber(row.currentCashValue) + '</td>' +
          '<td>' + formatNumber(row.currentDeathBenefit) + '</td>' +
          '<td>' + formatNumber(row.totalPaidUp) + '</td>' +
          '</tr>'
        );
      });

      return rows.join('');
    };

    // Generate table rows for term products
    const generateTermTableRows = (dataToShow: typeof yearlyIllustrationData): string => {
      const rows: string[] = [];
      let previousYear = 0;

      dataToShow.forEach((row, index) => {
        if (row.contractPremium === 0) {
          return;
        }

        if (index > 0 && previousYear % 10 === 0 && previousYear !== row.endOfYear) {
          rows.push(
            '<tr>' +
            '<td style="height: 10px; border-left: 1px solid #000; border-right: 1px solid #000;"></td>'.repeat(4) +
            '</tr>'
          );
        }
        
        previousYear = row.endOfYear;

        rows.push(
          '<tr>' +
          '<td class="age-col">' + row.age + '</td>' +
          '<td class="age-col">' + row.endOfYear + '</td>' +
          '<td>' + formatNumber(row.contractPremium) + '</td>' +
          '<td>' + formatNumber(row.guaranteedDeathBenefit) + '</td>' +
          '</tr>'
        );
      });

      return rows.join('');
    };
    
    // Filter and split data for pages
    const filteredIllustrationData = isTermProductForPdf
      ? yearlyIllustrationData.filter(({ contractPremium }) => contractPremium > 0)
      : yearlyIllustrationData;
    
    const page5Data = filteredIllustrationData.filter(({ endOfYear }) => endOfYear <= 40);
    const page6Data = filteredIllustrationData.filter(({ endOfYear }) => endOfYear > 40);
    
    // Continue with HTML template generation...
    // Due to length, I'll continue in the next part

    return await this.getHTMLTemplate({
      quote,
      agent,
      insuredName,
      insuredAge,
      sexDisplay,
      smokingDisplay,
      productName,
      productAbbrev,
      productType,
      productForm,
      quoteNumber,
      calculatedPremium,
      baseAmount,
      illustration,
      isTermProductForPdf,
      productNameForIllustration,
      page5Data,
      page6Data,
      generateTableRows,
      generateTermTableRows,
      companyLogoHtml,
      smallCompanyLogo,
      formatDate,
      formatCurrency,
      formatNumber,
      formatCurrencyNoDecimals,
    });
  }

  private async getHTMLTemplate(params: any): Promise<string> {
    try {
      return generatePDFHTMLTemplate(params);
    } catch (error) {
      console.error('[PdfService] Error generating HTML template:', error);
      throw new Error(`Failed to generate HTML template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getHorizontalLine(): string {
    return '<hr/>';
  }

  /**
   * Converts image path to base64 data URL for use in PDF
   */
  private async convertImageToBase64(imagePath: string): Promise<string | null> {
    try {
      // In Electron, we need to use the full path to the file
      // Files from public folder are available at runtime
      const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
      
      if (!isElectron) {
        console.warn('[PdfService] Not in Electron, cannot convert image to base64');
        return null;
      }

      // Try to fetch the image and convert to base64
      // In Electron, public files are available at runtime
      // We'll use a data URL approach by loading the image
      const response = await fetch(imagePath);
      if (!response.ok) {
        console.warn(`[PdfService] Failed to load image: ${imagePath}`);
        return null;
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn(`[PdfService] Error converting image to base64: ${imagePath}`, error);
      return null;
    }
  }

  /**
   * Generates PDF from quote and agent data
   */
  async generatePdf(options: PdfGenerationOptions): Promise<string | null> {
    try {
      console.log('[PdfService] Generating PDF with options:', {
        quoteId: options.quote.id,
        insuredName: `${options.insuredFirstName || ''} ${options.insuredLastName || ''}`.trim() || 'N/A',
        product: options.quote.product || options.quote.configureProduct,
      });
      
      // Convert company logo to base64 if provided
      let companyLogoUri = options.companyLogoUri;
      if (companyLogoUri && (companyLogoUri.startsWith('/') || companyLogoUri.startsWith('./'))) {
        const base64Logo = await this.convertImageToBase64(companyLogoUri);
        if (base64Logo) {
          companyLogoUri = base64Logo;
          console.log('[PdfService] Converted company logo to base64');
        } else {
          console.warn('[PdfService] Failed to convert logo to base64, using original path');
        }
      }
      
      const html = await this.generateHTMLTemplate({
        ...options,
        companyLogoUri,
      });
      
      if (!html || html.trim().length === 0) {
        throw new Error('Generated HTML template is empty');
      }
      
      console.log('[PdfService] HTML template generated, length:', html.length);
      
      const fileName = `quote_${options.quote.id || Date.now()}_${Date.now()}.pdf`;
      
      console.log('[PdfService] Saving PDF with filename:', fileName);
      
      // Don't set margins in Electron options since @page in HTML already handles margins
      // The HTML template uses @page { margin: 0.5in; } which is handled by the browser
      const filePath = await generateAndSavePDF(html, fileName, {
        pageSize: 'Letter',
        printBackground: true,
        // margins are handled by @page CSS rule in the HTML template
      });
      
      if (!filePath) {
        console.warn('[PdfService] PDF save dialog was canceled by user');
        return null;
      }
      
      console.log('[PdfService] PDF generated successfully:', filePath);
      return filePath;
    } catch (error) {
      console.error('[PdfService] Error generating PDF:', error);
      throw error;
    }
  }
}

export const pdfService = new PdfService();

