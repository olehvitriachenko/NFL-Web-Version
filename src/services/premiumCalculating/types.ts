/**
 * TypeScript types for premium calculation
 * Adapted from mobile app for web/Electron
 */

// ==================== CONSTANTS ====================

/**
 * Gender constants
 */
export const Gender = {
  Male: 'M',
  Female: 'F',
  Unisex: 'U'
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

/**
 * Smoking Status constants
 * Note: Database uses 'S' for Smoker and 'N' for Non-smoker
 */
export const SmokingStatus = {
  NonSmoker: 'N',
  Smoker: 'S'
} as const;

export type SmokingStatus = typeof SmokingStatus[keyof typeof SmokingStatus];

/**
 * Payment Mode constants
 */
export const PaymentMode = {
  Annual: 'Annual',
  SemiAnnual: 'SemiAnnual',
  Quarterly: 'Quarterly',
  Monthly: 'Monthly',
  EveryFourWeeks: 'EveryFourWeeks',
  SemiMonthly: 'SemiMonthly',
  BiWeekly: 'BiWeekly',
  Weekly: 'Weekly'
} as const;

export type PaymentMode = typeof PaymentMode[keyof typeof PaymentMode];

/**
 * Payment Method constants
 */
export const PaymentMethod = {
  Regular: 'R',
  EFT: 'E'
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

/**
 * Product Type constants
 */
export const ProductType = {
  PWL: 'PWL',
  LegacyTerm10: 'LT10',
  LegacyTerm20: 'LT20',
  LegacyTerm30: 'LT30',
  SelectTerm10: 'ST10',
  SelectTerm15: 'ST15',
  SelectTerm20: 'ST20',
  SelectTerm30: 'ST30',
  PremierChoiceLevel: 'PC_LEVEL',
  PremierChoiceGraded: 'PC_GRADED',
  WorkSitePlusParticipating: 'WSP_PART',
  WorkSitePlusTerm: 'WSP_TERM'
} as const;

export type ProductType = typeof ProductType[keyof typeof ProductType];

/**
 * Illustration Type constants
 */
export const IllustrationType = {
  Dividend: 'div',
  CashValue: 'cash',
  PaidUpAdditionsPremium: 'pua_prem',
  PaidUpAdditionsDividend: 'pua_div',
  NetSinglePremium: 'nsp'
} as const;

export type IllustrationType = typeof IllustrationType[keyof typeof IllustrationType];

// ==================== CONTROL CODES ====================

export type ControlCode = string;

export interface ControlCodeMap {
  [key: string]: ControlCode;
}

/**
 * PWL - Participating Whole Life
 */
export const PWL_CONTROL_CODES: ControlCodeMap = {
  'M_Y': '54000',
  'F_Y': '54001',
  'M_N': '54015',
  'F_N': '54016'
};

/**
 * Legacy Term 10 Year
 */
export const LEGACY_TERM_10_CONTROL_CODES: ControlCodeMap = {
  'M_N_BAND1': '42585',
  'M_Y_BAND1': '42586',
  'F_N_BAND1': '42588',
  'F_Y_BAND1': '42589',
  'M_N_BAND2': '42685',
  'M_Y_BAND2': '42686',
  'F_N_BAND2': '42688',
  'F_Y_BAND2': '42689'
};

/**
 * Legacy Term 20 Year
 */
export const LEGACY_TERM_20_CONTROL_CODES: ControlCodeMap = {
  'M_N_BAND1': '47585',
  'M_Y_BAND1': '47586',
  'F_N_BAND1': '47588',
  'F_Y_BAND1': '47589',
  'M_N_BAND2': '47685',
  'M_Y_BAND2': '47686',
  'F_N_BAND2': '47688',
  'F_Y_BAND2': '47689'
};

/**
 * Legacy Term 30 Year
 */
export const LEGACY_TERM_30_CONTROL_CODES: ControlCodeMap = {
  'M_N_BAND1': '47785',
  'M_Y_BAND1': '47786',
  'F_N_BAND1': '47788',
  'F_Y_BAND1': '47789',
  'M_N_BAND2': '47885',
  'M_Y_BAND2': '47886',
  'F_N_BAND2': '47888',
  'F_Y_BAND2': '47889'
};

/**
 * Select Term 10 Year
 */
export const SELECT_TERM_10_CONTROL_CODES: ControlCodeMap = {
  'M_N': '24585',
  'M_Y': '24586',
  'F_N': '24588',
  'F_Y': '24589'
};

/**
 * Select Term 15 Year
 */
export const SELECT_TERM_15_CONTROL_CODES: ControlCodeMap = {
  'M_N': '24685',
  'M_Y': '24686',
  'F_N': '24688',
  'F_Y': '24689'
};

/**
 * Select Term 20 Year
 */
export const SELECT_TERM_20_CONTROL_CODES: ControlCodeMap = {
  'M_N': '24785',
  'M_Y': '24786',
  'F_N': '24788',
  'F_Y': '24789'
};

/**
 * Select Term 30 Year
 */
export const SELECT_TERM_30_CONTROL_CODES: ControlCodeMap = {
  'M_N': '24885',
  'M_Y': '24886',
  'F_N': '24888',
  'F_Y': '24889'
};

/**
 * Premier Choice (Level and Graded)
 */
export const PREMIER_CHOICE_CONTROL_CODES: ControlCodeMap = {
  'M_N_LEVEL': '56100',
  'M_Y_LEVEL': '56101',
  'F_N_LEVEL': '56102',
  'F_Y_LEVEL': '56103',
  'M_N_GRADED': '56104',
  'M_Y_GRADED': '56105',
  'F_N_GRADED': '56106',
  'F_Y_GRADED': '56107'
};

/**
 * WorkSite Plus Participating
 */
export const WSP_PARTICIPATING_CONTROL_CODES: ControlCodeMap = {
  'M_Y': '66020',
  'F_Y': '66021',
  'M_N': '66025',
  'F_N': '66026'
};

/**
 * WorkSite Plus Term 20
 */
export const WSP_TERM_CONTROL_CODES: ControlCodeMap = {
  'M_N': '66251',
  'M_Y': '66252',
  'F_N': '66253',
  'F_Y': '66254'
};

/**
 * Rider Control Codes
 */
export const RIDER_CONTROL_CODES = {
  WAIVER_OF_PREMIUM_SUFFIX: '_WP',
  ADB_SUFFIX: '_ADB',
  ADD_SUFFIX: '_ADD',
  DEPENDENT_CHILD: 'dep_child',
  GUARANTEED_INSURABILITY: '9000'
};

// ==================== DATABASE TYPES ====================

/**
 * Rate query result
 */
export interface RateQueryResult {
  PlanCode: string;
  ControlCode: string;
  BasicRate: number;
  Unit: number;
  ModeFactor: number;
  AnnualFactor: number;
  ServiceFee: number;
  AnnualServiceFee: number;
  Age?: number;
}

/**
 * Parameters for rate query
 */
export interface RateQueryParams {
  controlCode: ControlCode;
  age?: number;
  gender: Gender;
  smokingStatus: SmokingStatus;
  paymentMode: PaymentMode;
  paymentMethod: PaymentMethod;
  duration?: number; // For term products with DUR_X format
}

/**
 * Parameters for illustration query
 */
export interface IllustrationQueryParams {
  planCode: string;
  kind: IllustrationType;
  sex: Gender;
  issueAge: number;
  duration: number | null;
  risk?: SmokingStatus;
}

/**
 * Parameters for risk rating query
 */
export interface RiskRatingQueryParams {
  code: string;
  age: number;
  gender: Gender;
  tableNumber: number;
}

/**
 * Control code selector parameters
 */
export interface ControlCodeSelector {
  productType: ProductType;
  gender: Gender;
  smokingStatus: SmokingStatus;
  faceAmount?: number; // For band selection in Legacy Term
  duration?: number; // For term products
}

/**
 * Policy information for calculations
 */
export interface PolicyInfo {
  productType: ProductType;
  faceAmount: number;
  age: number;
  gender: Gender;
  smokingStatus: SmokingStatus;
  paymentMode: PaymentMode;
  paymentMethod: PaymentMethod;
  suffix?: '_WP' | '_ADB' | '_ADD';
  dependentChild?: boolean;
  guaranteedInsurability?: boolean;
  tableRating?: number; // 0 = standard, 1-16 = substandard
  flatExtra?: number; // Additional per $1000
}

/**
 * Premium calculation result
 */
export interface PremiumResult {
  modalPremium: number;
  annualPremium: number;
  basicRate: number;
  modeFactor: number;
  serviceFee: number;
  controlCode: string;
}

