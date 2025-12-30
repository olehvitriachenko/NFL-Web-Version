/**
 * Premium Calculator
 * Main calculator for NFL insurance products using Electron IPC
 */

import {
  Gender,
  SmokingStatus,
  PaymentMode,
  RIDER_CONTROL_CODES,
} from './types';
import type {
  PolicyInfo,
  PremiumResult,
} from './types';
import { getControlCode, isTermProduct, validateControlCodeParams } from './controlCodes';
import {
  getRate,
  getTermRate,
  getRiskRatingFactor,
} from './queries';

// Mode factor multipliers for non-standard payment modes (from monthly premium)
// These multipliers convert monthly premium to the corresponding payment mode
const modeFactor: Record<string, number> = {
  'EveryFourWeeks': 12 / 13,  // 12 monthly payments / 13 four-weekly payments
  'SemiMonthly': 1 / 2,       // Semi-monthly: monthly premium / 2
  'BiWeekly': 12 / 26,        // Bi-weekly: monthly premium * 12 / 26
  'Weekly': 12 / 52           // Weekly: monthly premium * 12 / 52
};

// ==================== MAIN CALCULATOR ====================

/**
 * Calculate premium for a policy
 */
export async function calculatePremium(
  policy: PolicyInfo,
  duration: number = 1
): Promise<PremiumResult> {
  // Validate inputs
  validatePolicyInfo(policy);

  // Get control code
  let controlCode = getControlCode({
    productType: policy.productType,
    gender: policy.gender,
    smokingStatus: policy.smokingStatus,
    faceAmount: policy.faceAmount
  });

  if (policy.suffix) {
    controlCode += policy.suffix;
  }

  if (policy.dependentChild) {
    controlCode = RIDER_CONTROL_CODES.DEPENDENT_CHILD;
  }

  if (policy.guaranteedInsurability) {
    controlCode = RIDER_CONTROL_CODES.GUARANTEED_INSURABILITY;
  }

  let mode = policy.paymentMode;
  if (['EveryFourWeeks', 'SemiMonthly', 'BiWeekly', 'Weekly'].includes(policy.paymentMode)) {
    mode = 'Monthly';
  }

  // Get rate from database
  const rateParams = {
    controlCode,
    age: policy.age,
    gender: policy.gender,
    smokingStatus: policy.smokingStatus,
    paymentMode: mode,
    paymentMethod: policy.paymentMethod
  };

  // For dependent child and guaranteed insurability, always use getRate (not getTermRate)
  // because they have special queries in the database
  const isRiderControlCode = controlCode === RIDER_CONTROL_CODES.DEPENDENT_CHILD || 
                              controlCode === RIDER_CONTROL_CODES.GUARANTEED_INSURABILITY;

  // For term products, add duration (unless it's a rider control code)
  const rate = isTermProduct(policy.productType) && !isRiderControlCode
    ? await getTermRate({ ...rateParams, duration })
    : await getRate(rateParams);

  if (!rate) {
    throw new Error(
      `No rate found for control code ${controlCode}, age ${policy.age}, ` +
      `gender ${policy.gender}, smoking status ${policy.smokingStatus}`
    );
  }

  // Special handling for dependent child with WOP
  if (policy.dependentChild && policy.suffix === '_WP') {
    if (policy.age <= 30) {
      rate.BasicRate += 0.25;
    } else {
      rate.BasicRate += 0.35;
    }
  }

  // Calculate base premium
  let premiumAmount = calculateBasePremium(
    policy.faceAmount,
    rate.BasicRate,
    rate.Unit,
    rate.ModeFactor
  );

  // Add service fee (skip for riders with suffix or guaranteed insurability)
  if (!policy.suffix && controlCode !== '9000') {
    premiumAmount += rate.ServiceFee;
  }

  // Calculate annual premium
  const annualPremium = calculateAnnualPremium(
    policy.faceAmount,
    rate.BasicRate,
    rate.Unit,
    rate.AnnualFactor,
    rate.AnnualServiceFee,
    policy.tableRating,
    policy.flatExtra
  );

  // Round to 2 decimal places
  let modalPremium = Math.round(premiumAmount * 100) / 100;
  
  // Apply mode factor for non-standard payment modes
  if (['EveryFourWeeks', 'SemiMonthly', 'BiWeekly', 'Weekly'].includes(policy.paymentMode)) {
    modalPremium *= modeFactor[policy.paymentMode] || 1;
  }
  
  const annualPremiumRounded = Math.round(annualPremium * 100) / 100;

  return {
    modalPremium,
    annualPremium: annualPremiumRounded,
    basicRate: rate.BasicRate,
    modeFactor: rate.ModeFactor,
    serviceFee: rate.ServiceFee,
    controlCode: rate.ControlCode
  };
}

// ==================== CALCULATION HELPERS ====================

/**
 * Calculate base premium (without service fee)
 * Formula: (FaceAmount / Unit) * (BasicRate * ModeFactor)
 */
export function calculateBasePremium(
  faceAmount: number,
  basicRate: number,
  unit: number,
  modeFactor: number
): number {
  const adjustedRate = basicRate * modeFactor;
  const premium = (faceAmount / unit) * adjustedRate;
  return premium;
}

/**
 * Calculate annual premium
 */
function calculateAnnualPremium(
  faceAmount: number,
  basicRate: number,
  unit: number,
  annualFactor: number,
  annualServiceFee: number,
  tableRating?: number,
  flatExtra?: number
): number {
  let premium = (faceAmount / unit) * basicRate * annualFactor;
  premium += annualServiceFee;

  // Apply table rating
  if (tableRating && tableRating > 0) {
    // For annual, we'd need to get the table factor again
    // For simplicity, approximating here
    // In production, should query the database
  }

  // Apply flat extra
  if (flatExtra && flatExtra > 0) {
    premium += (faceAmount / 1000) * flatExtra * annualFactor;
  }

  return premium;
}

/**
 * Calculate flat extra per thousand
 * Formula: (FaceAmount / 1000) * FlatExtra * ModeFactor
 */
export function calculateFlatExtra(
  faceAmount: number,
  flatExtra: number,
  modeFactor: number
): number {
  return (faceAmount / 1000) * flatExtra * modeFactor;
}

// ==================== VALIDATION ====================

/**
 * Validate policy information
 */
function validatePolicyInfo(policy: PolicyInfo): void {
  if (!policy.productType) {
    throw new Error('Product type is required');
  }

  if (!policy.faceAmount || policy.faceAmount <= 0) {
    throw new Error('Face amount must be greater than 0');
  }

  if (!policy.age || policy.age < 0) {
    throw new Error('Age must be a positive number');
  }

  if (!policy.gender) {
    throw new Error('Gender is required');
  }

  if (!policy.smokingStatus) {
    throw new Error('Smoking status is required');
  }

  if (!policy.paymentMode) {
    throw new Error('Payment mode is required');
  }

  if (!policy.paymentMethod) {
    throw new Error('Payment method is required');
  }

  // Validate control code params
  validateControlCodeParams({
    productType: policy.productType,
    gender: policy.gender,
    smokingStatus: policy.smokingStatus,
    faceAmount: policy.faceAmount
  });

  // Validate table rating
  if (policy.tableRating && (policy.tableRating < 0 || policy.tableRating > 16)) {
    throw new Error('Table rating must be between 0 and 16');
  }

  // Validate flat extra
  if (policy.flatExtra && policy.flatExtra < 0) {
    throw new Error('Flat extra must be a positive number');
  }
}

