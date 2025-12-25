import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
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

export const ConfigureQuotePage = () => {
  const navigate = useNavigate();
  const { updateConfigure, product: storeProduct, paymentMethod: storePaymentMethod, 
    paymentMode: storePaymentMode, faceAmount: storeFaceAmount, 
    waiverOfPremiumEnabled: storeWaiverOfPremium, accidentalDeathEnabled: storeAccidentalDeath,
    accidentalDeath: storeAccidentalDeathData, dependentChildEnabled: storeDependentChild,
    dependentChild: storeDependentChildValue, guaranteedInsurabilityEnabled: storeGuaranteedInsurability,
    guaranteedInsurability: storeGuaranteedInsurabilityValue, insured: storeInsured } = useQuickFormStore();

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

  // Load dynamic data on mount
  useEffect(() => {
    const loadQuoteData = async () => {
      try {
        // TODO: Replace with actual API call
        const data = await fetchMockQuoteData();

        // Only use mock data if store values are defaults
        // Note: planCode is calculated automatically based on product and insured data
        if (!storeProduct || storeProduct === 'PWL - Participating Whole Life') {
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
        setPremium(data.premium);
      } catch (error) {
        console.error("Error loading quote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuoteData();
  }, [storeProduct]);

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

  // Sync waiverOfPremium to store
  useEffect(() => {
    const parsedFaceAmount = parseFormattedNumber(faceAmount);
    updateConfigure({ 
      waiverOfPremiumEnabled: waiverOfPremium,
      waiverOfPremiumValue: waiverOfPremium ? parsedFaceAmount : null
    });
  }, [waiverOfPremium, faceAmount, updateConfigure]);

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

  // Sync dependentChild to store
  useEffect(() => {
    const parsedAmount = parseFormattedNumber(dependentChildAmount);
    updateConfigure({ 
      dependentChildEnabled: dependentChild,
      dependentChild: dependentChild ? parsedAmount : null
    });
  }, [dependentChild, dependentChildAmount, updateConfigure]);

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
    const smokingStatus = shortSmokingStatus(storeInsured.smokingHabit); // Returns 'Y' or 'N'
    
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
    window.history.back();
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleDetails = () => {
    navigate({ to: "/quote-details" });
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
                    <option value="PWL - Participating Whole Life">
                      PWL - Participating Whole Life
                    </option>
                    <option value="Flexible Premium Annuity">
                      Flexible Premium Annuity
                    </option>
                    <option value="Payroll Participating">
                      Payroll Participating
                    </option>
                    <option value="Legacy Term - 10 Year">
                      Legacy Term - 10 Year
                    </option>
                    <option value="Legacy Term - 20 Year">
                      Legacy Term - 20 Year
                    </option>
                    <option value="Legacy Term - 30 Year">
                      Legacy Term - 30 Year
                    </option>
                    <option value="Payroll - 20 Year Term">
                      Payroll - 20 Year Term
                    </option>
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
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                </label>
              </div>

              {/* Accidental Death */}
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
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
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
                        <span>Max: $10,000.00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dependent Child */}
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
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                  </label>
                </div>
                {dependentChild && (
                  <div className="px-4 pb-3 flex gap-2">
                    {["1000", "2000", "3000", "4000"].map((amount) => {
                      const formattedAmount = formatNumberWithCommas(parseInt(amount, 10));
                      return (
                        <button
                          key={amount}
                          onClick={() => setDependentChildAmount(formattedAmount)}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                            parseFormattedNumber(dependentChildAmount) === parseInt(amount, 10)
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

              {/* Guaranteed Insurability */}
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
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                  </label>
                </div>
                {guaranteedInsurability && (
                  <div className="px-4 pb-3 flex gap-2">
                    {["5000", "10000"].map((amount) => {
                      const formattedAmount = formatNumberWithCommas(parseInt(amount, 10));
                      return (
                        <button
                          key={amount}
                          onClick={() => setGuaranteedInsurabilityAmount(formattedAmount)}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                            parseFormattedNumber(guaranteedInsurabilityAmount) === parseInt(amount, 10)
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
