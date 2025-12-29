import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { navigateBack } from "../utils/navigation";
import { BORDER, COLORS } from "../constants/theme";
import { FiChevronDown } from "react-icons/fi";
import { useQuickFormStore } from "../stores/QuickFormStore";
import { getPlanCodeByParams, getPlanCode } from "../utils/planCodes";
import type { ProductType } from "../types/planCodes";
import { getProductShortCode } from "../utils/productCode";
import { shortSex } from "../utils/shortSex";
import { shortSmokingStatus } from "../utils/shortSmokingStatus";

// Type for quote data
interface QuoteData {
  product: string;
  paymentMethod: string;
  paymentMode: string;
  faceAmount: string;
  planCode: string;
  waiverOfPremium: boolean;
  accidentalDeath: boolean;
  accidentalDeathType: "ADB" | "ADD";
  accidentalDeathAmount: string;
  dependentChild: boolean;
  dependentChildAmount: string;
  guaranteedInsurability: boolean;
  guaranteedInsurabilityAmount: string;
  premium: string;
}

// Mock data - will be replaced with API call later
const fetchMockQuoteData = async (): Promise<QuoteData> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        product: "PWL - Participating Whole Life",
        paymentMethod: "Regular",
        paymentMode: "Monthly",
        faceAmount: "10,000",
        planCode: "54015",
        waiverOfPremium: false,
        accidentalDeath: false,
        accidentalDeathType: "ADB",
        accidentalDeathAmount: "0",
        dependentChild: false,
        dependentChildAmount: "1000",
        guaranteedInsurability: false,
        guaranteedInsurabilityAmount: "5000",
        premium: "14.73",
      });
    }, 100);
  });
};

// Helper function to convert number to formatted string with commas
const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString('en-US');
};

// Helper function to parse string with commas to number
const parseFormattedNumber = (str: string): number => {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
};

// Helper function to format input value with commas while typing
const formatInputValue = (value: string): string => {
  // Remove all non-digit characters
  const numericValue = value.replace(/[^\d]/g, '');
  
  // If empty, return empty string
  if (!numericValue) return '';
  
  // Parse to number and format with commas
  const num = parseInt(numericValue, 10);
  if (isNaN(num)) return '';
  
  return num.toLocaleString('en-US');
};

// Helper function to convert product name to ProductType from planCodes
const convertProductNameToProductType = (productName: string): ProductType | null => {
  const shortCode = getProductShortCode(productName);
  if (!shortCode) return null;

  // Map short codes to ProductType enum
  const productTypeMap: Record<string, ProductType> = {
    'PWL': 'PWL',
    'LT10': 'LegacyTerm',
    'LT15': 'LegacyTerm',
    'LT20': 'LegacyTerm',
    'LT25': 'LegacyTerm',
    'LT30': 'LegacyTerm',
    'LT35': 'LegacyTerm',
    'ST10': 'SelectTerm',
    'ST15': 'SelectTerm',
    'ST20': 'SelectTerm',
    'ST30': 'SelectTerm',
    'WSP_PART': 'WorkSitePlusParticipating',
    'WSP_TERM': 'WorkSitePlusTerm',
    'PC_LEVEL': 'PremierChoiceLevel',
    'PC_GRADED': 'PremierChoiceGraded',
  };

  return productTypeMap[shortCode] || null;
};

// Helper function to extract term from product name
const extractTermFromProduct = (productName: string, shortCode?: string): number | undefined => {
  // For Legacy Term and SelectTerm, extract term from name or short code
  if (shortCode?.startsWith('LT') || shortCode?.startsWith('ST')) {
    // Try to extract from short code first (e.g., LT10, ST20)
    const codeMatch = shortCode.match(/(\d+)/);
    if (codeMatch) {
      return parseInt(codeMatch[1], 10);
    }
    // Fallback: extract from product name
    const nameMatch = productName.match(/(\d+)\s*Year/);
    if (nameMatch) {
      return parseInt(nameMatch[1], 10);
    }
  }
  
  // For WorkSitePlus Term, check if it's a term product
  if (shortCode === 'WSP_TERM') {
    const nameMatch = productName.match(/(\d+)\s*Year/);
    if (nameMatch) {
      return parseInt(nameMatch[1], 10);
    }
    // Default to 20 for WorkSitePlus Term
    return 20;
  }
  
  return undefined;
};

// Helper function to get age restrictions for a product
const getProductAgeRestrictions = (productName: string): { minAge: number; maxAge: number } | null => {
  const shortCode = getProductShortCode(productName);
  
  // PWL - Participating Whole Life: 0-85
  if (shortCode === 'PWL') {
    return { minAge: 0, maxAge: 85 };
  }
  
  // Legacy Term products
  if (shortCode?.startsWith('LT')) {
    const termMatch = shortCode.match(/(\d+)/);
    const term = termMatch ? parseInt(termMatch[1], 10) : null;
    
    // Legacy Term 30: 18-50
    if (term === 30) {
      return { minAge: 18, maxAge: 50 };
    }
    // Legacy Term 10, 15, 20, 25, 35: 18-65
    if (term === 10 || term === 15 || term === 20 || term === 25 || term === 35) {
      return { minAge: 18, maxAge: 65 };
    }
    // Default for other Legacy Term: 18-65
    return { minAge: 18, maxAge: 65 };
  }
  
  // Select Term products: 18-65
  if (shortCode?.startsWith('ST')) {
    return { minAge: 18, maxAge: 65 };
  }
  
  // Premier Choice: 50-85
  if (shortCode === 'PC_LEVEL' || shortCode === 'PC_GRADED') {
    return { minAge: 50, maxAge: 85 };
  }
  
  // Payroll Participating (WorkSitePlus Participating): 0-70
  if (shortCode === 'WSP_PART') {
    return { minAge: 0, maxAge: 70 };
  }
  
  // Payroll - 20 Year Term (WorkSitePlus Term): 18-65
  if (shortCode === 'WSP_TERM') {
    return { minAge: 18, maxAge: 65 };
  }
  
  // Flexible Premium Annuity: 0-75
  if (shortCode === 'FPA') {
    return { minAge: 0, maxAge: 75 };
  }
  
  // NFL Annuity: 0-75
  if (shortCode === 'NFLA') {
    return { minAge: 0, maxAge: 75 };
  }
  
  return null;
};

// Helper function to check if age is valid for product
const isAgeValidForProduct = (productName: string, age: number): boolean => {
  const restrictions = getProductAgeRestrictions(productName);
  if (!restrictions) return true; // No restrictions = valid
  
  return age >= restrictions.minAge && age <= restrictions.maxAge;
};

export const ConfigureQuotePage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const { updateConfigure, product: storeProduct, paymentMethod: storePaymentMethod, 
    paymentMode: storePaymentMode, faceAmount: storeFaceAmount, 
    waiverOfPremiumEnabled: storeWaiverOfPremium, accidentalDeathEnabled: storeAccidentalDeath,
    accidentalDeath: storeAccidentalDeathData, dependentChildEnabled: storeDependentChild,
    dependentChild: storeDependentChildValue, guaranteedInsurabilityEnabled: storeGuaranteedInsurability,
    guaranteedInsurability: storeGuaranteedInsurabilityValue, insured: storeInsured, getPremium,
    tableRating: storeTableRating, reverseLookup } = useQuickFormStore();

  // Initialize state from store
  const [product, setProduct] = useState(storeProduct || "");
  const [paymentMethod, setPaymentMethod] = useState(storePaymentMethod || "");
  const [paymentMode, setPaymentMode] = useState(storePaymentMode || "");
  const [faceAmount, setFaceAmount] = useState(storeFaceAmount ? formatNumberWithCommas(storeFaceAmount) : "");
  const [planCode, setPlanCode] = useState("");
  const [waiverOfPremium, setWaiverOfPremium] = useState(storeWaiverOfPremium || false);
  const [accidentalDeath, setAccidentalDeath] = useState(storeAccidentalDeath || false);
  const [accidentalDeathType, setAccidentalDeathType] = useState<"ADB" | "ADD">(
    storeAccidentalDeathData?.type || "ADB"
  );
  const [accidentalDeathAmount, setAccidentalDeathAmount] = useState(
    storeAccidentalDeathData?.value ? formatNumberWithCommas(storeAccidentalDeathData.value) : "0"
  );
  const [dependentChild, setDependentChild] = useState(storeDependentChild || false);
  const [dependentChildAmount, setDependentChildAmount] = useState(
    storeDependentChildValue ? formatNumberWithCommas(storeDependentChildValue) : "1000"
  );
  const [guaranteedInsurability, setGuaranteedInsurability] = useState(storeGuaranteedInsurability || false);
  const [guaranteedInsurabilityAmount, setGuaranteedInsurabilityAmount] = useState(
    storeGuaranteedInsurabilityValue ? formatNumberWithCommas(storeGuaranteedInsurabilityValue) : "5000"
  );
  const [premium, setPremium] = useState("14.73");
  const [loading, setLoading] = useState(true);
  const [pickYourPremium, setPickYourPremium] = useState(false);
  const [targetPremium, setTargetPremium] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  // Load premium from store
  useEffect(() => {
    const loadPremium = async () => {
      try {
        const premiumResult = await getPremium();
        if (premiumResult && premiumResult.totalPremium) {
          setPremium(premiumResult.totalPremium.toFixed(2));
        }
      } catch (error) {
        console.error("Error loading premium:", error);
      }
    };

    // Only load premium when we have required data
    if (!loading && storeInsured && storeProduct && storeFaceAmount) {
      loadPremium();
    }
  }, [getPremium, loading, storeInsured, storeProduct, storeFaceAmount, 
      storePaymentMode, storePaymentMethod, storeWaiverOfPremium, 
      storeAccidentalDeath, storeAccidentalDeathData, storeDependentChild, 
      storeDependentChildValue, storeGuaranteedInsurability, storeGuaranteedInsurabilityValue]);

  useEffect(() => {
    const loadQuoteData = async () => {
      try {
        // Only load mock data if store is empty (first time load)
        // Don't overwrite existing store values when product changes
        if (!storeProduct && !storeFaceAmount) {
          // TODO: Replace with actual API call
          const data = await fetchMockQuoteData();
          setProduct(data.product);
          setPaymentMethod(data.paymentMethod);
          setPaymentMode(data.paymentMode);
          setFaceAmount(formatInputValue(data.faceAmount));
          // Don't set planCode from mock data - it will be calculated by useEffect
          setWaiverOfPremium(data.waiverOfPremium);
          setAccidentalDeath(data.accidentalDeath);
          setAccidentalDeathType(data.accidentalDeathType);
          setAccidentalDeathAmount(formatInputValue(data.accidentalDeathAmount));
          setDependentChild(data.dependentChild);
          setDependentChildAmount(formatInputValue(data.dependentChildAmount));
          setGuaranteedInsurability(data.guaranteedInsurability);
          setGuaranteedInsurabilityAmount(formatInputValue(data.guaranteedInsurabilityAmount));
        }
        // Premium is now loaded from store via getPremium() method
      } catch (error) {
        console.error("Error loading quote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuoteData();
  }, []); // Only run once on mount, don't depend on storeProduct

  // Sync product to store
  useEffect(() => {
    if (product) {
      updateConfigure({ product });
    }
  }, [product, updateConfigure]);

  // Sync paymentMethod to store
  useEffect(() => {
    if (paymentMethod) {
      updateConfigure({ paymentMethod });
    }
  }, [paymentMethod, updateConfigure]);

  // Sync paymentMode to store
  useEffect(() => {
    if (paymentMode) {
      updateConfigure({ paymentMode });
    }
  }, [paymentMode, updateConfigure]);

  // Sync faceAmount to store
  useEffect(() => {
    const parsedAmount = parseFormattedNumber(faceAmount);
    if (parsedAmount > 0) {
      updateConfigure({ faceAmount: parsedAmount });
    }
  }, [faceAmount, updateConfigure]);

  // Eligibility checks for riders
  const insuredAge = storeInsured?.age || 0;
  const tableRatingValue = storeTableRating || 0;
  const isStandardRisk = tableRatingValue === 0;
  const isFlexibleAnnuity = product === 'Flexible Premium Annuity';
  const isPremierChoiceLevel = product === 'Premier Choice - Level';
  const isPremierChoiceGraded = product === 'Premier Choice - Graded';
  const isPremierChoice = isPremierChoiceLevel || isPremierChoiceGraded;
  const isPayrollParticipating = product === 'Payroll Participating';
  const isPayrollTerm = product === 'Payroll - 20 Year Term';
  const isLegacyTerm = product?.startsWith('Legacy Term');
  
  // Products without any riders (only Basic)
  const isProductWithoutRiders = isFlexibleAnnuity || isPremierChoice;

  // All available products
  const allProducts = [
    'PWL - Participating Whole Life',
    'Legacy Term - 10 Year',
    'Legacy Term - 20 Year',
    'Legacy Term - 30 Year',
    'Payroll Participating',
    'Payroll - 20 Year Term',
    'Premier Choice - Level',
    'Premier Choice - Graded',
    'Flexible Premium Annuity',
  ];

  // Filter products by age restrictions
  const availableProducts = allProducts.filter(p => isAgeValidForProduct(p, insuredAge));

  // Reset product if current selection is not available for current age
  useEffect(() => {
    if (product && !isAgeValidForProduct(product, insuredAge)) {
      // Reset to first available product or empty
      if (availableProducts.length > 0) {
        setProduct(availableProducts[0]);
      } else {
        setProduct('');
      }
    }
  }, [insuredAge, product, availableProducts]);

  // Check if Accidental Death is eligible
  // Available for: PWL, Legacy Term, Select Term
  // NOT available for: Flexible Premium Annuity, Premier Choice, Payroll Participating, Payroll - 20 Year Term
  const isAccidentalDeathEligible = !isProductWithoutRiders && 
    !isPayrollParticipating && 
    !isPayrollTerm && 
    isStandardRisk && 
    insuredAge >= 0 && 
    insuredAge <= 55;
  
  // Check if Waiver of Premium is eligible
  // Available for: PWL, Select Term, Payroll Participating, Payroll - 20 Year Term
  // NOT available for: Flexible Premium Annuity, Premier Choice, Legacy Term
  const isWaiverOfPremiumEligible = !isProductWithoutRiders && 
    !isLegacyTerm &&
    isStandardRisk && 
    insuredAge >= 15 && 
    insuredAge <= 55;
  
  // Check if Dependent Child is eligible
  // Available for: PWL, Legacy Term, Select Term, Payroll Participating, Payroll - 20 Year Term
  // NOT available for: Flexible Premium Annuity, Premier Choice
  const isDependentChildEligible = !isProductWithoutRiders && insuredAge < 51;
  
  // Check if Guaranteed Insurability is eligible
  // Available for: PWL, Legacy Term, Select Term, Payroll Participating
  // NOT available for: Flexible Premium Annuity, Premier Choice, Payroll - 20 Year Term
  // Maximum age: 37 years
  const isGuaranteedInsurabilityEligible = !isProductWithoutRiders && 
    insuredAge <= 37 && 
    product !== 'Payroll - 20 Year Term';

  // Sync waiverOfPremium to store
  useEffect(() => {
    const parsedFaceAmount = parseFormattedNumber(faceAmount);
    updateConfigure({ 
      waiverOfPremiumEnabled: waiverOfPremium,
      waiverOfPremiumValue: waiverOfPremium ? parsedFaceAmount : null
    });
  }, [waiverOfPremium, faceAmount, updateConfigure]);

  // Adjust accidental death amount if it exceeds limits
  useEffect(() => {
    if (!accidentalDeath) return;
    
    const faceAmountValue = parseFormattedNumber(faceAmount);
    const currentAmount = parseFormattedNumber(accidentalDeathAmount);
    const MIN_ACCIDENTAL_DEATH = 10000;
    const MAX_ACCIDENTAL_DEATH = Math.min(300000, faceAmountValue);
    
    if (currentAmount < MIN_ACCIDENTAL_DEATH) {
      const newAmount = formatNumberWithCommas(MIN_ACCIDENTAL_DEATH);
      if (newAmount !== accidentalDeathAmount) {
        setAccidentalDeathAmount(newAmount);
      }
    } else if (currentAmount > MAX_ACCIDENTAL_DEATH) {
      const newAmount = formatNumberWithCommas(MAX_ACCIDENTAL_DEATH);
      if (newAmount !== accidentalDeathAmount) {
        setAccidentalDeathAmount(newAmount);
      }
    }
  }, [faceAmount, accidentalDeath]); // Removed accidentalDeathAmount from dependencies to prevent infinite loop

  // Disable accidental death if not eligible
  useEffect(() => {
    if (!isAccidentalDeathEligible && accidentalDeath) {
      setAccidentalDeath(false);
    }
  }, [isAccidentalDeathEligible, accidentalDeath]);

  // Disable waiver of premium if not eligible
  useEffect(() => {
    if (!isWaiverOfPremiumEligible && waiverOfPremium) {
      setWaiverOfPremium(false);
    }
  }, [isWaiverOfPremiumEligible, waiverOfPremium]);

  // Disable dependent child if not eligible
  useEffect(() => {
    if (!isDependentChildEligible && dependentChild) {
      setDependentChild(false);
    }
  }, [isDependentChildEligible, dependentChild]);

  // Disable guaranteed insurability if not eligible
  useEffect(() => {
    if (!isGuaranteedInsurabilityEligible && guaranteedInsurability) {
      setGuaranteedInsurability(false);
    }
  }, [isGuaranteedInsurabilityEligible, guaranteedInsurability]);

  // Sync accidentalDeath to store
  useEffect(() => {
    const parsedAmount = parseFormattedNumber(accidentalDeathAmount);
    updateConfigure({ 
      accidentalDeathEnabled: accidentalDeath,
      accidentalDeath: accidentalDeath 
        ? { type: accidentalDeathType, value: parsedAmount }
        : { type: null, value: 0 }
    });
  }, [accidentalDeath, accidentalDeathType, accidentalDeathAmount, updateConfigure]);

  // Generate available dependent child amounts based on face amount
  // Options: from 1000 to min(faceAmount, 10000) with step 1000
  // If faceAmount <= $1,000, return empty array (no options available)
  const getAvailableDependentChildAmounts = (): number[] => {
    const faceAmountValue = parseFormattedNumber(faceAmount);
    if (faceAmountValue <= 1000) return []; // If faceAmount <= $1,000, return 0 (empty array)
    
    const MAX_DEPENDENT_CHILD = 10000;
    const STEP = 1000;
    const MIN_DEPENDENT_CHILD = 1000;
    
    // Max allowed is the minimum of faceAmount and $10,000
    const maxAllowed = Math.min(faceAmountValue, MAX_DEPENDENT_CHILD);
    
    const amounts: number[] = [];
    for (let amount = MIN_DEPENDENT_CHILD; amount <= maxAllowed; amount += STEP) {
      amounts.push(amount);
    }
    
    return amounts;
  };

  // Adjust dependent child amount if it exceeds face amount or max limit
  useEffect(() => {
    if (!dependentChild) return;
    
    const faceAmountValue = parseFormattedNumber(faceAmount);
    const currentAmount = parseFormattedNumber(dependentChildAmount);
    const MAX_DEPENDENT_CHILD = 10000;
    
    if (faceAmountValue > 0) {
      const maxAllowed = Math.min(faceAmountValue, MAX_DEPENDENT_CHILD);
      if (currentAmount > maxAllowed) {
        // Round down to nearest 1000 that doesn't exceed limit
        const adjustedAmount = Math.floor(maxAllowed / 1000) * 1000;
        const finalAmount = Math.max(1000, adjustedAmount);
        const newAmount = formatNumberWithCommas(finalAmount);
        if (newAmount !== dependentChildAmount) {
          setDependentChildAmount(newAmount);
        }
      }
    }
  }, [faceAmount, dependentChild]); // Removed dependentChildAmount from dependencies to prevent infinite loop

  // Sync dependentChild to store
  useEffect(() => {
    const parsedAmount = parseFormattedNumber(dependentChildAmount);
    updateConfigure({ 
      dependentChildEnabled: dependentChild,
      dependentChild: dependentChild ? parsedAmount : null
    });
  }, [dependentChild, dependentChildAmount, updateConfigure]);

  // Generate available guaranteed insurability amounts based on face amount
  // Options: from 5000 to min(faceAmount, 25000) with step 5000
  // Rounding: Math.floor(maxAllowed / (2 * 5000)) * 5000
  // If faceAmount <= $5,000, return 0 (empty array)
  const getAvailableGuaranteedInsurabilityAmounts = (): number[] => {
    const faceAmountValue = parseFormattedNumber(faceAmount);
    if (faceAmountValue <= 5000) return [];
    
    const MAX_GUARANTEED_INSURABILITY = 25000;
    const STEP = 5000;
    const MIN_GUARANTEED_INSURABILITY = 5000;
    
    const maxAllowed = Math.min(faceAmountValue, MAX_GUARANTEED_INSURABILITY);
    // Rounding: Math.floor(maxAllowed / (2 * 5000)) * 5000
    const roundedMax = Math.floor(maxAllowed / (2 * STEP)) * STEP;
    const finalMax = Math.min(roundedMax, MAX_GUARANTEED_INSURABILITY);
    
    if (finalMax < MIN_GUARANTEED_INSURABILITY) return [];
    
    const amounts: number[] = [];
    for (let amount = MIN_GUARANTEED_INSURABILITY; amount <= finalMax; amount += STEP) {
      amounts.push(amount);
    }
    
    return amounts;
  };

  // Generate available accidental death amounts
  // Min: $10,000, Max: min($300,000, faceAmount)
  const getAccidentalDeathMaxAmount = (): number => {
    const faceAmountValue = parseFormattedNumber(faceAmount);
    return Math.min(300000, faceAmountValue);
  };

  // Adjust guaranteed insurability amount if it exceeds face amount or max limit
  useEffect(() => {
    if (!guaranteedInsurability) return;
    
    const faceAmountValue = parseFormattedNumber(faceAmount);
    const currentAmount = parseFormattedNumber(guaranteedInsurabilityAmount);
    const MAX_GUARANTEED_INSURABILITY = 25000;
    
    if (faceAmountValue > 0) {
      const maxAllowed = Math.min(faceAmountValue, MAX_GUARANTEED_INSURABILITY);
      if (currentAmount > maxAllowed) {
        // Round down to nearest 5000 that doesn't exceed limit
        const adjustedAmount = Math.floor(maxAllowed / 5000) * 5000;
        const finalAmount = Math.max(5000, adjustedAmount);
        const newAmount = formatNumberWithCommas(finalAmount);
        // Only update if the value actually changed to avoid infinite loop
        if (newAmount !== guaranteedInsurabilityAmount) {
          setGuaranteedInsurabilityAmount(newAmount);
        }
      }
    }
  }, [faceAmount, guaranteedInsurability]); // Removed guaranteedInsurabilityAmount from dependencies to prevent infinite loop

  // Sync guaranteedInsurability to store
  useEffect(() => {
    const parsedAmount = parseFormattedNumber(guaranteedInsurabilityAmount);
    updateConfigure({ 
      guaranteedInsurabilityEnabled: guaranteedInsurability,
      guaranteedInsurability: guaranteedInsurability ? parsedAmount : null
    });
  }, [guaranteedInsurability, guaranteedInsurabilityAmount, updateConfigure]);

  // Calculate plan code based on product and insured parameters
  useEffect(() => {
    // Wait until loading is complete to avoid race conditions
    if (loading) {
      return;
    }

    if (!product) {
      return;
    }

    const shortCode = getProductShortCode(product);
    
    // Handle Annuity products - they have special plan codes
    if (product === 'Flexible Premium Annuity') {
      setPlanCode('FlexibleAnnuity');
      return;
    }
    
    if (product === 'NFL Annuity') {
      setPlanCode('NFLAnnuity');
      return;
    }

    // For other products, we need insured data
    if (!storeInsured) {
      return;
    }

    const productType = convertProductNameToProductType(product);
    if (!productType) {
      return;
    }

    // Convert insured data to plan code format
    const gender = shortSex(storeInsured.sex) === 'M' ? 'M' : 'F';
    const smokingStatusShort = shortSmokingStatus(storeInsured.smokingHabit); // Returns 'S' or 'N'
    // Convert 'S' to 'Y' for plan code mapping keys (MY, FY, etc. use 'Y')
    const smokingStatus = smokingStatusShort === 'S' ? 'Y' : 'N';
    
    // For PWL, use direct control code key approach (most reliable)
    if (shortCode === 'PWL') {
      const controlCodeKey = `${gender}${smokingStatus}`; // MY, FY, MN, or FN
      const pwlPlanCode = getPlanCode(controlCodeKey);
      if (pwlPlanCode) {
        setPlanCode(pwlPlanCode);
        return;
      }
    }
    
    // Extract term for term products
    const term = extractTermFromProduct(product, shortCode);

    // Get plan code
    const calculatedPlanCode = getPlanCodeByParams(productType, gender, smokingStatus, term);
    if (calculatedPlanCode) {
      setPlanCode(calculatedPlanCode);
    } else {
      // Fallback: try to build control code key like in getIllustrationData
      try {
        const controlCodeKey = `${gender}${smokingStatus}`;
        let finalKey = controlCodeKey;
        
        if (shortCode?.startsWith('LT') || shortCode?.startsWith('ST')) {
          if (term) {
            finalKey = `${controlCodeKey}${term}`;
            if (shortCode.startsWith('ST')) {
              finalKey += '_ST';
            }
          }
        } else if (shortCode === 'WSP_TERM') {
          finalKey = `${controlCodeKey}20_WSP`;
        } else if (shortCode === 'WSP_PART') {
          finalKey = `${controlCodeKey}_WSP`;
        } else if (shortCode === 'PC_LEVEL') {
          finalKey = `${controlCodeKey}_PC_L`;
        } else if (shortCode === 'PC_GRADED') {
          finalKey = `${controlCodeKey}_PC_G`;
        }
        
        const fallbackPlanCode = getPlanCode(finalKey);
        if (fallbackPlanCode) {
          setPlanCode(fallbackPlanCode);
        }
      } catch (error) {
        console.warn('Could not get plan code:', error);
      }
    }
  }, [product, storeInsured, loading]);

  // Premium will be calculated by backend - just display the value from API

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleDetails = () => {
    navigate({ to: "/quote-details" });
  };

  const handleCalculatePremium = async () => {
    const targetPremiumValue = parseFloat(targetPremium.replace(/[^0-9.]/g, ''));
    if (!targetPremiumValue || targetPremiumValue <= 0) {
      return;
    }

    setIsCalculating(true);
    try {
      const result = await reverseLookup(targetPremiumValue);
      
      // Update face amount
      setFaceAmount(formatNumberWithCommas(result.faceAmount));
      
      // Update accidental death if enabled
      if (accidentalDeath && result.accidentalDeathValue > 0) {
        setAccidentalDeathAmount(formatNumberWithCommas(result.accidentalDeathValue));
      }
      
      // Update dependent child if enabled
      if (dependentChild && result.dependentChildValue > 0) {
        setDependentChildAmount(formatNumberWithCommas(result.dependentChildValue));
      }
      
      // Update guaranteed insurability if enabled
      if (guaranteedInsurability && result.guaranteedInsurabilityValue > 0) {
        setGuaranteedInsurabilityAmount(formatNumberWithCommas(result.guaranteedInsurabilityValue));
      }
      
      // Reload premium to reflect new values
      const premiumResult = await getPremium();
      if (premiumResult && premiumResult.totalPremium) {
        setPremium(premiumResult.totalPremium.toFixed(2));
      }
    } catch (error) {
      console.error("Error calculating reverse lookup:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Helper function to format premium input
  const formatPremiumInput = (value: string): string => {
    // Remove all non-digit and non-decimal characters
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // If empty, return empty string
    if (!numericValue) return '';
    
    // Allow only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    return numericValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading quote data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader
        title="Configure Quote"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Premium Display */}
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: COLORS.PRIMARY }}
              >
                Premium: ${premium}
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              {/* Product */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Product
                </label>
                <div className="relative">
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 appearance-none pr-10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    {availableProducts.length > 0 ? (
                      availableProducts.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))
                    ) : (
                      <option value="">No products available for this age</option>
                    )}
                  </select>
                  <FiChevronDown
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 appearance-none pr-10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    <option value="Regular">Regular</option>
                  </select>
                  <FiChevronDown
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Payment Mode
                </label>
                <div className="relative">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 appearance-none pr-10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                    <option value="Every 4 Weeks">Every 4 Weeks</option>
                    <option value="Semi-Monthly">Semi-Monthly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                  <FiChevronDown
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Face Amount */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Face Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="text"
                    value={faceAmount}
                    onChange={(e) => {
                      const formatted = formatInputValue(e.target.value);
                      setFaceAmount(formatted);
                    }}
                    className="w-full px-4 pl-8 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                    placeholder="10,000"
                  />
                </div>
              </div>
            </div>

            {/* Plan Code */}
            <div className="text-sm text-gray-600">Plan code {planCode}</div>

            {/* Toggle Options */}
            <div
              className="flex flex-col gap-0 bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              {/* Waiver of Premium */}
              {isWaiverOfPremiumEligible && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <span className="text-[#000000] font-medium">
                    Waiver of Premium
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiverOfPremium}
                      onChange={(e) => setWaiverOfPremium(e.target.checked)}
                      className="sr-only peer"
                      disabled={!isWaiverOfPremiumEligible}
                    />
                    <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md ${!isWaiverOfPremiumEligible ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>
              )}

              {/* Accidental Death */}
              {isAccidentalDeathEligible && (
                <div className="border-b border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-[#000000] font-medium">
                      Accidental Death
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accidentalDeath}
                        onChange={(e) => setAccidentalDeath(e.target.checked)}
                        className="sr-only peer"
                        disabled={!isAccidentalDeathEligible}
                      />
                      <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md ${!isAccidentalDeathEligible ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                {accidentalDeath && (
                  <div className="px-4 pb-3 flex flex-col gap-3">
                    {/* ADB/ADD Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAccidentalDeathType("ADB")}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                          accidentalDeathType === "ADB"
                            ? "bg-[#0D175C] text-white"
                            : "bg-gray-200 text-[#000000]"
                        }`}
                        style={{ borderRadius: BORDER.borderRadius }}
                      >
                        ADB
                      </button>
                      <button
                        onClick={() => setAccidentalDeathType("ADD")}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                          accidentalDeathType === "ADD"
                            ? "bg-[#0D175C] text-white"
                            : "bg-gray-200 text-[#000000]"
                        }`}
                        style={{ borderRadius: BORDER.borderRadius }}
                      >
                        ADD
                      </button>
                    </div>
                    {/* Accidental Death Amount */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-600">
                        Accidental Death Amount
                      </label>
                      <input
                        type="text"
                        value={accidentalDeathAmount}
                        onChange={(e) => {
                          const formatted = formatInputValue(e.target.value);
                          setAccidentalDeathAmount(formatted);
                        }}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                        style={{ borderRadius: BORDER.borderRadius }}
                        placeholder="0"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: $10,000.00</span>
                        <span>Max: ${formatNumberWithCommas(getAccidentalDeathMaxAmount())}</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              )}

              {/* Dependent Child */}
              {isDependentChildEligible && (
                <div className="border-b border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-[#000000] font-medium">
                      Dependent Child
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dependentChild}
                        onChange={(e) => setDependentChild(e.target.checked)}
                        className="sr-only peer"
                        disabled={!isDependentChildEligible}
                      />
                      <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md ${!isDependentChildEligible ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {dependentChild && (
                    <div className="px-4 pb-3 flex gap-2 flex-wrap">
                      {getAvailableDependentChildAmounts().map((amount) => {
                        const formattedAmount = formatNumberWithCommas(amount);
                        return (
                          <button
                            key={amount}
                            onClick={() => setDependentChildAmount(formattedAmount)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 min-w-[100px] ${
                              parseFormattedNumber(dependentChildAmount) === amount
                                ? "bg-[#0D175C] text-white"
                                : "bg-gray-200 text-[#000000]"
                            }`}
                            style={{ borderRadius: BORDER.borderRadius }}
                          >
                            ${formattedAmount}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Guaranteed Insurability */}
              {isGuaranteedInsurabilityEligible && (
                <div>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-[#000000] font-medium">
                      Guaranteed Insurability
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guaranteedInsurability}
                        onChange={(e) =>
                          setGuaranteedInsurability(e.target.checked)
                        }
                        className="sr-only peer"
                        disabled={!isGuaranteedInsurabilityEligible}
                      />
                      <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md ${!isGuaranteedInsurabilityEligible ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {guaranteedInsurability && (
                    <div className="px-4 pb-3 flex gap-2 flex-wrap">
                      {getAvailableGuaranteedInsurabilityAmounts().map((amount) => {
                        const formattedAmount = formatNumberWithCommas(amount);
                        return (
                          <button
                            key={amount}
                            onClick={() => setGuaranteedInsurabilityAmount(formattedAmount)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 min-w-[100px] ${
                              parseFormattedNumber(guaranteedInsurabilityAmount) === amount
                                ? "bg-[#0D175C] text-white"
                                : "bg-gray-200 text-[#000000]"
                            }`}
                            style={{ borderRadius: BORDER.borderRadius }}
                          >
                            ${formattedAmount}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Pick your premium (Reverse Lookup) */}
            <div
              className="flex flex-col gap-0 bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-[#000000] font-medium">
                  Pick your premium
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickYourPremium}
                    onChange={(e) => setPickYourPremium(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                </label>
              </div>
              {pickYourPremium && (
                <div className="px-4 pb-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-600">
                      Pick your premium
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="text"
                        value={targetPremium}
                        onChange={(e) => {
                          const formatted = formatPremiumInput(e.target.value);
                          setTargetPremium(formatted);
                        }}
                        className="w-full px-4 pl-8 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                        style={{ borderRadius: BORDER.borderRadius }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCalculatePremium}
                    fullWidth
                    disabled={isCalculating || !targetPremium || parseFloat(targetPremium.replace(/[^0-9.]/g, '')) <= 0}
                  >
                    {isCalculating ? "Calculating..." : "Calculate"}
                  </Button>
                </div>
              )}
            </div>

            {/* Details Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleDetails} fullWidth>
                DETAILS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
