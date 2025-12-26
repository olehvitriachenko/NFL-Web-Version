/**
 * Prepaid Policy Calculation
 * Functions for calculating prepaid policy amounts
 */

import { prepayFactors, getPrepayFactor } from './prepayFactors';

/**
 * Calculate total prepaid amount needed for a given number of years
 * @param annualPremium - Annual premium amount
 * @param years - Number of prepay years (0-20)
 * @returns Total prepaid amount needed
 */
export const totalPrepaidNeeded = (annualPremium: number, years: number): number => {
  if (years < 0 || years > 20) {
    throw new Error(`Prepay years must be between 0 and 20, got ${years}`);
  }
  
  if (annualPremium <= 0) {
    return 0;
  }
  
  return annualPremium * getPrepayFactor(years);
};

/**
 * Calculate prepaid amounts for each year
 * @param years - Number of prepay years
 * @param totalPrepaidNeeded - Total prepaid amount needed
 * @param premium - Annual premium amount
 * @returns Array of prepaid amounts for each year (index 0 is year 0, index 1 is year 1, etc.)
 */
export const prepaidYear = (
  years: number,
  totalPrepaidNeeded: number,
  premium: number
): number[] => {
  if (years < 0 || years > 20) {
    throw new Error(`Prepay years must be between 0 and 20, got ${years}`);
  }
  
  const prepays: number[] = [];
  let remainingPrepaid = totalPrepaidNeeded;
  
  for (let i = 0; i <= years; i++) {
    if (i === 0) {
      // Year 0: no prepay calculation
      prepays.push(0);
    } else if (i === 1) {
      // Year 1: subtract premium from total
      remainingPrepaid -= premium;
      prepays.push(remainingPrepaid);
    } else {
      // Year 2+: apply 3% growth, then subtract premium
      remainingPrepaid *= 1.03;
      remainingPrepaid -= premium;
      prepays.push(remainingPrepaid);
    }
  }
  
  return prepays;
};

/**
 * Calculate prepaid policy details for a given number of years
 * @param annualPremium - Annual premium amount
 * @param years - Number of prepay years (0-20)
 * @returns Object with total prepaid needed and yearly breakdown
 */
export const calculatePrepaidPolicy = (
  annualPremium: number,
  years: number
): {
  totalPrepaidNeeded: number;
  yearlyBreakdown: number[];
} => {
  const total = totalPrepaidNeeded(annualPremium, years);
  const breakdown = prepaidYear(years, total, annualPremium);
  
  return {
    totalPrepaidNeeded: total,
    yearlyBreakdown: breakdown
  };
};

