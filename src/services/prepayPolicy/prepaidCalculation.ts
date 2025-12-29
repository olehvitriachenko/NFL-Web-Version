/**
 * Prepaid Policy Calculation
 * Functions for calculating prepaid policy amounts
 */

import { prepayFactors } from './prepayFactors';

/**
 * Calculate total prepaid amount needed for a given number of years
 * @param annualPremium - Annual premium amount
 * @param year - Number of prepay years (0-20)
 * @returns Total prepaid amount needed
 */
export const totalPrepaidNeeded = (annualPremium: number, year: number): number => {
  return annualPremium * prepayFactors[year];
};

/**
 * Calculate prepaid amounts for each year
 * @param year - Number of prepay years
 * @param totalPrepaidNeeded - Total prepaid amount needed
 * @param premium - Annual premium amount
 * @returns Array of prepaid amounts for each year
 */
export const prepaidYear = (year: number, totalPrepaidNeeded: number, premium: number): number[] => {
  let prepays: number[] = [];
  for (let i = 0; i < year + 1; i++) {
    if (i === 0) {
      // Year 0: do nothing
    } else if (i === 1) {
      totalPrepaidNeeded -= premium;
      prepays.push(totalPrepaidNeeded);
    } else {
      totalPrepaidNeeded *= 1.03;
      totalPrepaidNeeded -= premium;
      prepays.push(totalPrepaidNeeded);
    }
  }
  return prepays;
};

/**
 * Calculate prepaid policy details for a given number of years
 * @param annualPremium - Annual premium amount
 * @param year - Number of prepay years (0-20)
 * @returns Object with total prepaid needed and yearly breakdown
 */
export const calculatePrepaidPolicy = (
  annualPremium: number,
  year: number
): {
  totalPrepaidNeeded: number;
  yearlyBreakdown: number[];
} => {
  const total = totalPrepaidNeeded(annualPremium, year);
  const breakdown = prepaidYear(year, total, annualPremium);
  
  return {
    totalPrepaidNeeded: total,
    yearlyBreakdown: breakdown
  };
};

