/**
 * Table Rating Formulas
 * Formulas for calculating premiums with table ratings and flat extras
 */

import { calculatePremium } from '../premiumCalculating';
import type { PolicyInfo, PremiumResult } from '../premiumCalculating';
import { calculateBasePremium } from '../premiumCalculating/premiumCalculator';
import { getRiskRatingFactor, getRate, getTermRate } from '../premiumCalculating/queries';
import { getControlCode, isTermProduct } from '../premiumCalculating/controlCodes';

/**
 * Get code for table rating query based on product type
 */
function getCode(productType: string): string {
  // Standard rating code for NFL
  return '7000';
}

/**
 * Calculate flat extra amount
 */
const flatExtraAmount = (modeFactor: number, faceAmount: number, flatExtraFactor: number): number => {
  if (flatExtraFactor > 0) {
    return (faceAmount * flatExtraFactor * modeFactor) / 1000;
  }
  return 0;
};

/**
 * Calculate premium with table rating and flat extra
 */
export const getTablePremium = async (
  policyInfo: PolicyInfo,
  duration: number = 1,
  flatExtraFactor: number = 0
): Promise<PremiumResult> => {
  const premium = await calculatePremium(policyInfo, duration);
  
  if ((!policyInfo.tableRating || policyInfo.tableRating === 0) && flatExtraFactor === 0) {
    return premium;
  }

  // Get control code (same logic as in calculatePremium)
  let controlCode = getControlCode({
    productType: policyInfo.productType,
    gender: policyInfo.gender,
    smokingStatus: policyInfo.smokingStatus,
    faceAmount: policyInfo.faceAmount
  });

  let mode = policyInfo.paymentMode;
  if (['EveryFourWeeks', 'SemiMonthly', 'BiWeekly', 'Weekly'].includes(policyInfo.paymentMode)) {
    mode = 'Monthly';
  }

  // Get rate from database to get ModeFactor
  const rateParams = {
    controlCode,
    age: policyInfo.age,
    gender: policyInfo.gender,
    smokingStatus: policyInfo.smokingStatus,
    paymentMode: mode,
    paymentMethod: policyInfo.paymentMethod
  };

  const rate = isTermProduct(policyInfo.productType)
    ? await getTermRate({ ...rateParams, duration })
    : await getRate(rateParams);

  if (!rate) {
    throw new Error(
      `No rate found for ${policyInfo.productType}, age ${policyInfo.age}, ` +
      `gender ${policyInfo.gender}, smoking status ${policyInfo.smokingStatus}`
    );
  }

  const code = getCode(policyInfo.productType);
  // Convert 'U' to 'M' for query (query already includes 'U' in IN clause)
  const gender = (policyInfo.gender === 'U' ? 'M' : policyInfo.gender) as 'M' | 'F';
  
  if (policyInfo.tableRating && policyInfo.tableRating !== 0) {
    const tableFactor = await getRiskRatingFactor({
      code,
      age: policyInfo.age,
      gender,
      tableNumber: policyInfo.tableRating
    });

    // Use standard unit of 1000 for table rating calculation
    const unit = 1000;
    premium.modalPremium += calculateBasePremium(policyInfo.faceAmount, tableFactor, unit, rate.ModeFactor);
  }

  premium.modalPremium += flatExtraAmount(rate.ModeFactor, policyInfo.faceAmount, flatExtraFactor);

  return premium;
};

