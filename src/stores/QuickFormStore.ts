import { create } from 'zustand';
import {
  calculatePremium,
  PaymentMode,
  PaymentMethod,
  ProductType,
} from '../services/premiumCalculating';
import type {
  PolicyInfo
} from '../services/premiumCalculating';
import { getTablePremium } from '../services/tableRating/formulas';
import { shortSex } from '../utils/shortSex';
import { shortSmokingStatus } from '../utils/shortSmokingStatus';
import { getProductShortCode } from '../utils/productCode';
import { isTermProduct as checkIsTermProduct } from '../services/premiumCalculating/controlCodes';
import { getRequiredExaminations } from '../services/qualificationExaminations';
import type { Requirement } from '../services/qualificationExaminations';
import { Gender } from '../services/premiumCalculating/types';

// Helper function to convert payment mode string to PaymentMode type
const convertPaymentMode = (mode: string): PaymentMode => {
  const modeMap: Record<string, PaymentMode> = {
    'Monthly': PaymentMode.Monthly,
    'Quarterly': PaymentMode.Quarterly,
    'Annual': PaymentMode.Annual,
    'Semi-Annual': PaymentMode.SemiAnnual,
    'Every 4 Weeks': PaymentMode.EveryFourWeeks,
    'Semi-Monthly': PaymentMode.SemiMonthly,
    'Bi-Weekly': PaymentMode.BiWeekly,
    'Weekly': PaymentMode.Weekly,
  };
  return modeMap[mode] || PaymentMode.Monthly;
};

// Helper function to convert payment method string to PaymentMethod type
const convertPaymentMethod = (method: string): PaymentMethod => {
  if (method === 'Regular' || method === 'R') {
    return PaymentMethod.Regular;
  }
  return PaymentMethod.EFT;
};

// Helper function to convert product short code to ProductType
const convertProductType = (shortCode: string | undefined): ProductType | null => {
  if (!shortCode) return null;
  
  const productTypeMap: Record<string, ProductType> = {
    'PWL': ProductType.PWL,
    'LT10': ProductType.LegacyTerm10,
    'LT20': ProductType.LegacyTerm20,
    'LT30': ProductType.LegacyTerm30,
    'ST10': ProductType.SelectTerm10,
    'ST15': ProductType.SelectTerm15,
    'ST20': ProductType.SelectTerm20,
    'ST30': ProductType.SelectTerm30,
    'PC_LEVEL': ProductType.PremierChoiceLevel,
    'PC_GRADED': ProductType.PremierChoiceGraded,
    'WSP_PART': ProductType.WorkSitePlusParticipating,
    'WSP_TERM': ProductType.WorkSitePlusTerm
  };
  
  return productTypeMap[shortCode] || null;
};

export interface QuotePersonData {
  age: number;
  sex: 'Male' | 'Female';
  smokingHabit: string;
}

export interface QuoteFormData {
  company: 'CompanyA' | 'CompanyB';
  insured: QuotePersonData;
  payorEnabled: boolean;
  payor?: QuotePersonData;
}

export interface QuoteConfigureData {
  product: string;
  paymentMethod: string;
  paymentMode: string;
  configureProduct: string;
  faceAmount: number;
  tableRating?: number; // 0 = standard, 1-16 = substandard tables
  table?: number; // номер таблицы рейтинга (1-16)
  flatExtra?: number; // дополнительная премия на $1000
  waiverOfPremiumEnabled: boolean;
  waiverOfPremiumValue: number | null;
  accidentalDeathEnabled: boolean;
  accidentalDeath: { type: 'ADD' | 'ADB' | null, value: number };
  dependentChildEnabled: boolean;
  dependentChild: number | null;
  guaranteedInsurabilityEnabled: boolean;
  guaranteedInsurability: number | null;
}

export type ExtendedPersonData = QuoteFormData['insured'] & {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
};

export type QuickFormState = QuoteFormData & QuoteConfigureData & {
  insured: ExtendedPersonData;
  payor?: ExtendedPersonData;
  effectiveStartDate?: string;
};

type PremiumResult = {
  premiumBasicRate: number;
  premiumWOP?: number;
  premiumAcidentalDeth?: number;
  premiumDependentChild?: number;
  premiumGuaranteedInsurability?: number;
  totalPremium: number;
  totalAnnualPremium: number;
};

/**
 * Рассчитывает премии на основе состояния формы
 */
export const calculatePremiumForState = async (state: QuickFormState): Promise<PremiumResult> => {
  let totalAnnualPremium = 0;
  
  // Handle annuity products
  if (state.product === 'Flexible Premium Annuity' || state.product === 'NFL Annuity') {
    return {
      premiumBasicRate: state.faceAmount,
      premiumWOP: undefined,
      premiumAcidentalDeth: undefined,
      premiumDependentChild: undefined,
      premiumGuaranteedInsurability: undefined,
      totalPremium: state.faceAmount,
      totalAnnualPremium: state.faceAmount
    };
  }
  
  // Get product type
  const productShortCode = getProductShortCode(state.product);
  const productType = convertProductType(productShortCode);
  
  if (!productType) {
    throw new Error(`Unknown product type: ${state.product}`);
  }
  
  // Calculate base premium
  const params: PolicyInfo = {
    productType,
    faceAmount: state.faceAmount,
    age: state.insured.age,
    gender: shortSex(state.insured.sex),
    smokingStatus: shortSmokingStatus(state.insured.smokingHabit) as 'S' | 'N',
    paymentMode: convertPaymentMode(state.paymentMode),
    paymentMethod: convertPaymentMethod(state.paymentMethod),
    tableRating: state.tableRating && state.tableRating > 0 ? state.tableRating : undefined,
  };
  
  // Use getTablePremium if table or flatExtra values are present
  const hasTableOrFlatExtra = (state.table && state.table > 0) || (state.flatExtra && state.flatExtra > 0);
  let testBasePremium;
  
  if (hasTableOrFlatExtra) {
    // Use table rating formula
    const tableNumber = state.table && state.table > 0 ? state.table : (state.tableRating && state.tableRating > 0 ? state.tableRating : 0);
    const flatExtraFactor = state.flatExtra || 0;
    // Update params with table number for getTablePremium
    const paramsWithTable = {
      ...params,
      tableRating: tableNumber > 0 ? tableNumber : undefined,
    };
    testBasePremium = await getTablePremium(paramsWithTable, 1, flatExtraFactor);
  } else {
    testBasePremium = await calculatePremium(params);
  }

  const premiumBasicRate = testBasePremium.modalPremium;
  totalAnnualPremium += testBasePremium.annualPremium;

  // Calculate WOP premium if enabled
  let premiumWOP: number | undefined;
  if (state.waiverOfPremiumEnabled) {
    const paramsWOP: PolicyInfo = {
      ...params,
      suffix: '_WP',
    };
    const testBasePremiumWOP = await calculatePremium(paramsWOP);
    premiumWOP = testBasePremiumWOP.modalPremium;
    totalAnnualPremium += testBasePremiumWOP.annualPremium;
  }

  // Calculate accidental death premium if enabled
  let premiumAcidentalDeth: number | undefined;
  if (state.accidentalDeathEnabled && state.accidentalDeath?.value) {
    const paramsAccidDeath: PolicyInfo = {
      ...params,
      faceAmount: state.accidentalDeath.value,
      suffix: state.accidentalDeath.type === 'ADB' ? '_ADB' : '_ADD',
    };
    const testBasePremiumAccidDeath = await calculatePremium(paramsAccidDeath);
    premiumAcidentalDeth = testBasePremiumAccidDeath.modalPremium;
    totalAnnualPremium += testBasePremiumAccidDeath.annualPremium;
  }

  // Calculate dependent child premium if enabled
  let premiumDependentChild: number | undefined;
  if (state.dependentChild && state.dependentChildEnabled) {
    const paramsDepChild: PolicyInfo = {
      ...params,
      faceAmount: state.dependentChild,
      dependentChild: true,
      suffix: state.waiverOfPremiumEnabled ? '_WP' : undefined,
    };
    const testBasePremiumDepChild = await calculatePremium(paramsDepChild);
    premiumDependentChild = testBasePremiumDepChild.modalPremium;
    totalAnnualPremium += testBasePremiumDepChild.annualPremium;
  }

  // Calculate guaranteed insurability premium if enabled
  let premiumGuaranteedInsurability: number | undefined;
  if (state.guaranteedInsurability && state.guaranteedInsurabilityEnabled) {
    const paramsGuaranteedInsurabitily: PolicyInfo = {
      ...params,
      faceAmount: state.guaranteedInsurability,
      guaranteedInsurability: true
    };
    const testBasePremiumGuaranteedInsurabitily = await calculatePremium(paramsGuaranteedInsurabitily);
    premiumGuaranteedInsurability = testBasePremiumGuaranteedInsurabitily.modalPremium;
    totalAnnualPremium += testBasePremiumGuaranteedInsurabitily.annualPremium;
  }

  // Calculate total premium
  const totalPremium = 
    premiumBasicRate +
    (premiumWOP || 0) +
    (premiumAcidentalDeth || 0) +
    (premiumDependentChild || 0) +
    (premiumGuaranteedInsurability || 0);

  return {
    premiumBasicRate,
    premiumWOP,
    premiumAcidentalDeth,
    premiumDependentChild,
    premiumGuaranteedInsurability,
    totalPremium,
    totalAnnualPremium
  };
};

interface QuickFormActions {
  updateForm: (data: Partial<QuoteFormData>) => void;
  updateConfigure: (data: Partial<QuoteConfigureData>) => void;
  getPremium: () => Promise<PremiumResult>;
  getExaminations: () => Requirement[];
  reverseLookup: (targetPremium: number) => Promise<{
    faceAmount: number;
    accidentalDeathValue: number;
    dependentChildValue: number;
    guaranteedInsurabilityValue: number;
  }>;
  clear: () => void;
}

type QuickFormStore = QuickFormState & QuickFormActions;

const initialState: QuickFormState = {
  // Form (QuickQuoteFormScreen)
  company: 'CompanyA',

  insured: { age: 30, sex: 'Male', smokingHabit: 'Non-smoker' },
  payorEnabled: false,
  payor: { age: 30, sex: 'Male', smokingHabit: 'Non-smoker' },
  effectiveStartDate: undefined,

  // Configure (QuickQuoteConfigureScreen)
  product: 'PWL - Participating Whole Life',
  paymentMethod: 'Regular',
  paymentMode: 'Monthly',
  configureProduct: 'Standard',
  faceAmount: 10000,
  tableRating: 0, // 0 = standard
  table: undefined, // номер таблицы рейтинга (1-16)
  flatExtra: undefined, // дополнительная премия на $1000
  waiverOfPremiumEnabled: false,
  waiverOfPremiumValue: null,
  accidentalDeathEnabled: false,
  accidentalDeath: { type: null, value: 0 },
  dependentChildEnabled: false,
  dependentChild: null,
  guaranteedInsurabilityEnabled: false,
  guaranteedInsurability: null,
};

export const useQuickFormStore = create<QuickFormStore>((set, get) => ({
  ...initialState,

  // Обновление только данных первой формы (company / insured / payor*)
  updateForm: (data) =>
    set((state) => ({
      ...state,
      ...data,
      insured: data.insured ? { ...state.insured, ...data.insured } : state.insured,
      payor: data.payor
        ? { ...(state.payor ?? initialState.payor), ...data.payor }
        : state.payor,
      effectiveStartDate: (data as any).effectiveStartDate !== undefined 
        ? (data as any).effectiveStartDate 
        : state.effectiveStartDate,
    })),

  // Обновление только конфигурационных полей (product, basePlan, riders, и т.д.)
  updateConfigure: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  // Получение премиумов на основе текущих данных формы
  getPremium: async () => {
    const state = get();
    return calculatePremiumForState(state);
  },

  // Получение необходимых экзаменов на основе текущих данных формы
  getExaminations: () => {
    const state = get();
    const productShortCode = getProductShortCode(state.product);
    
    // Check if it's a term product
    if (checkIsTermProduct(productShortCode as any)) {
      return getRequiredExaminations(
        'SelectTerm',
        state.insured.age,
        state.faceAmount,
        shortSex(state.insured.sex) as Gender
      );
    }
    
    // Check if it's PWL
    if (productShortCode === 'PWL') {
      return getRequiredExaminations(
        'PWL',
        state.insured.age,
        state.faceAmount,
        shortSex(state.insured.sex) as Gender
      );
    }
    
    // No examinations for other products
    return [];
  },

  // Обратный поиск: найти faceAmount по целевой премии
  reverseLookup: async (targetPremium: number) => {
    const { reverseLookUp } = await import('../services/reverseLookup');
    const state = get();
    return reverseLookUp(targetPremium, state);
  },

  clear: () => set(initialState),
}));

