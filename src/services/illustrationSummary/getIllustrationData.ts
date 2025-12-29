/**
 * Get Illustration Data
 * Main function to get illustration summary data for different products
 */

import {
  AccumulatedPUA,
  calculateNflAnnuity,
  calculatePremierIllustration
} from './illustrationSummaryCalculations';
import { getProductShortCode } from '../../utils/productCode';
import { shortSex } from '../../utils/shortSex';
import { shortSmokingStatus } from '../../utils/shortSmokingStatus';
import { getPlanCode } from '../../utils/planCodes';
import { isTermProduct } from '../../utils/planCodes';

const MAX_AGE = 95;
const SUMMARY_YEARS = [5, 10, 20, 30, 40, 50, 60, 70];

/**
 * Get available summary years based on current age
 */
const getAvailableSummaryYears = (currentAge: number): number[] => {
  return SUMMARY_YEARS.filter(years => currentAge + years <= MAX_AGE);
};

/**
 * Convert premium to monthly (placeholder - needs actual conversion based on payment mode)
 */
function convertToMonthly(totalPremium: number, paymentMode: string): number {
  // This is a placeholder - actual conversion depends on payment mode
  // Monthly: totalPremium / 12
  // Quarterly: totalPremium / 4
  // Semi-Annual: totalPremium / 2
  // Annual: totalPremium
  
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
 * Get illustration data for a policy
 */
export const getIllustrationData = async (
  getPremium: () => Promise<{ totalPremium: number; totalAnnualPremium: number }>,
  faceAmount: number,
  insured: { sex: 'Male' | 'Female'; age: number; smokingHabit: string },
  product: string,
  paymentMode: string = 'Monthly'
): Promise<Record<string, any>> => {
  const { totalPremium } = await getPremium();

  // Convert to monthly premium
  const monthlyPremium = convertToMonthly(totalPremium, paymentMode);
  const baseAmount = faceAmount;

  // Get plan code
  const gender = shortSex(insured.sex);
  const smoking = shortSmokingStatus(insured.smokingHabit);
  const productShortCode = getProductShortCode(product);
  
  // Try to get plan code from mapping
  let planCode = '';
  try {
    // Build control code key based on gender and smoking status
    const smokingKey = smoking === 'S' ? 'Y' : 'N';
    const genderKey = gender === 'M' ? 'M' : 'F';
    const controlCodeKey = `${genderKey}${smokingKey}`;
    
    // For term products, add term number if available
    let finalKey = controlCodeKey;
    if (productShortCode?.startsWith('LT') || productShortCode?.startsWith('ST')) {
      const termMatch = product.match(/(\d+)/);
      if (termMatch) {
        finalKey = `${controlCodeKey}${termMatch[1]}`;
        if (productShortCode.startsWith('ST')) {
          finalKey += '_ST';
        }
      }
    }
    
    planCode = getPlanCode(finalKey) || '';
  } catch (error) {
    console.warn('Could not get plan code:', error);
  }

  // Helper function to calculate data for a specific age
  const calculateAgeData = async (targetAge: number) => {
    const totalPremiums = targetAge * monthlyPremium * 12;

    // Handle Flexible Premium Annuity
    if (product === 'Flexible Premium Annuity' || product === 'NFL Annuity') {
      const results = calculateNflAnnuity(insured.age, monthlyPremium, targetAge);
      const lastResult = results[results.length - 1];

      return {
        totalDeposit: {
          guaranteed: Math.round(totalPremiums),
          midpoint: '',
          current: '',
        },
        cashSurrenderValue: {
          guaranteed: lastResult.cashSurrenderValue,
          midpoint: lastResult.cashSurrenderValue,
          current: lastResult.cashSurrenderValue,
        },
      };
    }

    // Handle Premier Choice products
    if (product.includes('Premier')) {
      if (!planCode) {
        throw new Error('Plan code required for Premier products');
      }

      const { guaranteedCashValue, reducedPaidUp, deathBenefit } = await calculatePremierIllustration(
        faceAmount,
        targetAge,
        planCode,
        gender,
        smoking,
        insured.age
      );

      return {
        premiums: {
          guaranteed: Math.round(totalPremiums),
          midpoint: '',
          current: '',
        },
        cashSurrenderValue: {
          guaranteed: Math.round(guaranteedCashValue),
          midpoint: '',
          current: '',
        },
        reducedPaidUp: {
          guaranteed: reducedPaidUp,
          midpoint: '',
          current: '',
        },
        deathBenefit: {
          guaranteed: deathBenefit,
          midpoint: '',
          current: '',
        },
      };
    }

    // Handle Term products
    if (isTermProduct(productShortCode || '')) {
      return {
        premiums: {
          guaranteed: Math.round(totalPremiums),
          midpoint: '',
          current: '',
        },
        deathBenefit: {
          guaranteed: baseAmount,
          midpoint: '',
          current: '',
        },
      };
    }

    // Handle Whole Life products (PWL, etc.)
    if (!planCode) {
      throw new Error('Plan code required for illustration calculations');
    }

    const {
      guaranteed,
      mid,
      current,
      totalPaidUp,
      paidUpMid,
      totalDeathBenefit,
      midDeathBenefit
    } = await AccumulatedPUA(
      faceAmount,
      targetAge,
      planCode,
      gender,
      smoking,
      insured.age
    );

    return {
      premiums: {
        guaranteed: Math.round(totalPremiums),
        midpoint: '',
        current: '',
      },
      cashSurrenderValue: {
        guaranteed: Math.round(guaranteed),
        midpoint: Math.round(mid),
        current: Math.round(current),
      },
      totalPaidUp: {
        guaranteed: 0,
        midpoint: paidUpMid,
        current: totalPaidUp,
      },
      deathBenefit: {
        guaranteed: baseAmount,
        midpoint: midDeathBenefit,
        current: totalDeathBenefit,
      },
    };
  };

  // Calculate only for available years based on current age
  const availableYears = getAvailableSummaryYears(insured.age);
  const results: Record<string, any> = {};

  // Calculate data for each available year
  for (const years of availableYears) {
    try {
      const data = await calculateAgeData(years);
      results[`age${years}`] = data;
    } catch (error) {
      console.warn(`[Illustration] Failed to calculate data for year ${years}:`, error);
      // Set empty structure for failed calculations
      results[`age${years}`] = {
        premiums: {
          guaranteed: Math.round(years * 12 * monthlyPremium),
          midpoint: '',
          current: '',
        },
        deathBenefit: {
          guaranteed: baseAmount,
          midpoint: '',
          current: '',
        },
      };
    }
  }

  // Ensure 20 years is calculated (if not already in availableYears)
  if (!availableYears.includes(20) && insured.age + 20 <= MAX_AGE) {
    try {
      const age20Data = await calculateAgeData(20);
      results['age20'] = age20Data;
    } catch (error) {
      console.warn(`[Illustration] Failed to calculate data for 20 years:`, error);
      results['age20'] = {
        premiums: {
          guaranteed: Math.round(20 * 12 * monthlyPremium),
          midpoint: '',
          current: '',
        },
        deathBenefit: {
          guaranteed: baseAmount,
          midpoint: '',
          current: '',
        },
      };
    }
  }

  // Calculate for age 70 (70 - insured.age years)
  const age70Years = 70 - insured.age;
  if (age70Years > 0 && insured.age + age70Years <= MAX_AGE) {
    try {
      const age70Data = await calculateAgeData(age70Years);
      results['age70'] = age70Data;
    } catch (error) {
      console.warn(`[Illustration] Failed to calculate data for age 70 (${age70Years} years):`, error);
      results['age70'] = {
        premiums: {
          guaranteed: Math.round(age70Years * 12 * monthlyPremium),
          midpoint: '',
          current: '',
        },
        deathBenefit: {
          guaranteed: baseAmount,
          midpoint: '',
          current: '',
        },
      };
    }
  }

  // Calculate target year (121 - insured.age) only if it's not already in other sections
  const targetYear = 121 - insured.age;
  const existingYears = [5, 10, 20, age70Years];
  
  // Only calculate if target year is unique and not already covered
  if (targetYear > 0 && !existingYears.includes(targetYear)) {
    try {
      const targetYearData = await calculateAgeData(targetYear);
      results['targetYear'] = targetYearData;
    } catch (error) {
      console.warn(`[Illustration] Failed to calculate data for target year ${targetYear}:`, error);
      // Set empty structure for failed calculations
      results['targetYear'] = {
        premiums: {
          guaranteed: Math.round(targetYear * 12 * monthlyPremium),
          midpoint: '',
          current: '',
        },
        deathBenefit: {
          guaranteed: baseAmount,
          midpoint: '',
          current: '',
        },
      };
    }
  }

  return results;
};

