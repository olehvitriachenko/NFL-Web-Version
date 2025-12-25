/**
 * Illustration Summary Calculations
 * Functions for calculating insurance policy illustrations
 */

import { getIllustrationFactor, getAllIllustrationFactors } from '../premiumCalculating/queries';
import {
  getCashRates,
  getNSPRate,
  getPaidUpAdditionPremiumRates,
  getPaidUpAdditionDividendRates,
  getBaseDividendRates
} from './illustrationQueries';
import { IllustrationType } from '../premiumCalculating/types';

/**
 * Transform plan code based on gender for illustration table lookups
 */
function transformPlanCode(planCode: string, sex: 'M' | 'F'): string {
  if (planCode.endsWith('00')) {
    return planCode.slice(0, -2) + '18';
  } else if (planCode.endsWith('01')) {
    return planCode.slice(0, -2) + '19';
  } else {
    return sex === 'M'
      ? planCode.slice(0, -1) + '8'
      : planCode.slice(0, -1) + '9';
  }
}

/**
 * Get all rates needed for illustration calculations
 */
async function getRates(params: {
  planCode: string;
  sex: 'M' | 'F';
  risk: 'N' | 'S';
  issueAge: number;
  maxAge?: number;
}): Promise<{
  baseDividendRates: Array<{ duration: number; rate: number }>;
  puaPremiumRates: Record<number, number>;
  puaDividendRates: Record<number, number>;
}> {
  const maxAge = params.maxAge || 120;

  // Get base dividend rates
  const baseDividendRates = await getBaseDividendRates({
    planCode: params.planCode,
    sex: params.sex,
    issueAge: params.issueAge
  });

  // Get PUA premium rates
  const puaPremiumRates = await getPaidUpAdditionPremiumRates({
    planCode: params.planCode,
    sex: params.sex,
    risk: params.risk,
    minIssueAge: params.issueAge,
    maxIssueAge: maxAge
  });

  // Get PUA dividend rates (using transformed plan code)
  const transformedPlanCode = transformPlanCode(params.planCode, params.sex);
  const puaDividendRates = await getPaidUpAdditionDividendRates({
    planCode: transformedPlanCode,
    sex: params.sex,
    risk: null, // PUA dividend rates use Risk IS NULL
    minIssueAge: params.issueAge + 1, // IssueAge > issueAge
    maxIssueAge: maxAge
  });

  return {
    baseDividendRates,
    puaPremiumRates,
    puaDividendRates
  };
}

/**
 * Round to specified decimal places
 */
function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate base dividend
 */
function BaseDividend(faceAmount: number, baseDividendRate: number): number {
  return (faceAmount / 1000) * baseDividendRate;
}

/**
 * Calculate paid-up addition dividend
 */
function PaidUpAdditionDividend(
  prevAccumulatedPUA: number,
  paidUpAdditionDividendRate: number
): number {
  if (prevAccumulatedPUA === 0) {
    return 0;
  }
  return round((prevAccumulatedPUA / 1000) * paidUpAdditionDividendRate, 2);
}

/**
 * Calculate total dividend (base + PUA dividend)
 */
function TotalDividend(
  faceAmount: number,
  baseDividendRate: number,
  prevAccumulatedPUA: number,
  paidUpAdditionDividendRate: number
): number {
  return (
    BaseDividend(faceAmount, baseDividendRate) +
    PaidUpAdditionDividend(prevAccumulatedPUA, paidUpAdditionDividendRate)
  );
}

/**
 * Calculate purchased PUA amount
 */
function PurchasedPUA(
  faceAmount: number,
  baseDividendRate: number,
  prevAccumulatedPUA: number,
  paidUpAdditionDividendRate: number,
  paidUpAdditionPremiumRate: number
): number {
  if (paidUpAdditionPremiumRate === 0) {
    return 0;
  }

  return Math.trunc(
    (TotalDividend(
      faceAmount,
      baseDividendRate,
      prevAccumulatedPUA,
      paidUpAdditionDividendRate
    ) /
      paidUpAdditionPremiumRate) *
      1000
  );
}

/**
 * Calculate guaranteed cash value
 */
function GuaranteedCashValue(faceAmount: number, cashRate: number): number {
  return (faceAmount / 1000) * cashRate;
}

/**
 * Calculate accumulated PUA and related values
 */
export async function AccumulatedPUA(
  faceAmount: number,
  years: number,
  planCode: string,
  sex: 'M' | 'F',
  smoker: 'N' | 'S',
  age: number
): Promise<{
  guaranteed: number;
  mid: number;
  current: number;
  totalPaidUp: number;
  paidUpMid: number;
  totalDeathBenefit: number;
  midDeathBenefit: number;
}> {
  let accumulatedPUA = 0;

  const { baseDividendRates, puaPremiumRates, puaDividendRates } = await getRates({
    planCode,
    sex,
    risk: smoker,
    issueAge: age
  });

  for (let year = 1; year <= years; year++) {
    const baseDividendRate = baseDividendRates[year - 1]?.rate || 0;
    const currentAge = age + year;

    let puaDividendRate = 0;
    let puaPremiumRate = 0;

    if (121 - age === years) {
      // Special handling for year 121
      if (puaDividendRates[currentAge]) {
        puaDividendRate = puaDividendRates[currentAge];
        puaPremiumRate = puaPremiumRates[currentAge - 1] || 0;
      } else {
        puaDividendRate = puaDividendRates[currentAge - 1] || 0;
        puaPremiumRate = puaPremiumRates[currentAge - 1] || 0;
      }
    } else {
      puaDividendRate = puaDividendRates[currentAge] || 0;
      puaPremiumRate = puaPremiumRates[currentAge] || 0;
    }

    if (puaPremiumRate > 0) {
      const purchasedPUA = PurchasedPUA(
        faceAmount,
        baseDividendRate,
        accumulatedPUA,
        puaDividendRate,
        puaPremiumRate
      );
      accumulatedPUA += purchasedPUA;
    }
  }

  // Get cash rate for the duration
  const cashRate = await getCashRates({
    planCode,
    sex,
    issueAge: age,
    duration: years
  });

  const guaranteed = GuaranteedCashValue(faceAmount, cashRate);

  // Calculate current cash value
  const currentAge = age + years;
  let current = 0;
  if (puaDividendRates[currentAge]) {
    current = (accumulatedPUA * puaPremiumRates[currentAge]) / 1000 + guaranteed;
  } else {
    current = (accumulatedPUA * puaPremiumRates[currentAge - 1]) / 1000 + guaranteed;
  }

  // Calculate total paid-up
  let totalPaidUp = 0;
  if (puaDividendRates[currentAge]) {
    totalPaidUp = Math.round(current / puaPremiumRates[currentAge] * 1000);
  } else {
    totalPaidUp = Math.round(current / puaPremiumRates[currentAge - 1] * 1000);
  }
  const paidUpMid = Math.round(totalPaidUp / 2);

  // Calculate death benefits
  const totalDeathBenefit = Math.round(faceAmount + accumulatedPUA);
  const midDeathBenefit = Math.round((totalDeathBenefit + faceAmount) / 2);

  return {
    guaranteed,
    mid: Math.trunc((guaranteed + current) / 2),
    current,
    totalPaidUp,
    paidUpMid,
    totalDeathBenefit,
    midDeathBenefit
  };
}

/**
 * Calculate NFL Annuity values
 */
export function calculateNflAnnuity(
  issueAge: number,
  monthlyPremium: number,
  targetYear: number
): Array<{
  year: number;
  age: number;
  yearlyPremium: number;
  totalDeposit: number;
  balance: number;
  cashSurrenderValue: number;
  surrenderPercent: string;
}> {
  const INTEREST_RATE = 0.03;
  let surrenderPercent = 0.90;

  const annualPremium = monthlyPremium * 12;

  let totalDeposit = 0;
  let guaranteed = 0;
  const results: Array<{
    year: number;
    age: number;
    yearlyPremium: number;
    totalDeposit: number;
    balance: number;
    cashSurrenderValue: number;
    surrenderPercent: string;
  }> = [];

  for (let year = 1; year <= targetYear; year++) {
    const yearlyPremium = annualPremium;
    totalDeposit += yearlyPremium;

    // Increase surrender percent
    if (surrenderPercent < 1.0) {
      surrenderPercent += 0.01;
    }

    // Initialize guaranteed in first year
    if (year === 1) {
      guaranteed = yearlyPremium * INTEREST_RATE;
    }

    // Calculate balance
    const balanceGuaranteed = yearlyPremium + guaranteed + (guaranteed * INTEREST_RATE);

    // Calculate cash surrender value
    const cashSurrenderValue = Math.round(balanceGuaranteed * surrenderPercent);

    results.push({
      year,
      age: issueAge + year,
      yearlyPremium,
      totalDeposit,
      balance: Math.round(balanceGuaranteed),
      cashSurrenderValue,
      surrenderPercent: Math.round(surrenderPercent * 100) + '%'
    });

    // Update guaranteed for next iteration
    guaranteed = (balanceGuaranteed * INTEREST_RATE) + balanceGuaranteed;
  }

  return results;
}

/**
 * Calculate Premier Choice illustration
 */
export async function calculatePremierIllustration(
  faceAmount: number,
  year: number,
  planCode: string,
  sex: 'M' | 'F',
  smoker: 'N' | 'S',
  age: number
): Promise<{
  guaranteedCashValue: number;
  deathBenefit: number;
  reducedPaidUp: number;
}> {
  const cashRate = await getCashRates({
    planCode,
    sex,
    issueAge: age,
    duration: year
  });

  const guaranteedCashValue = GuaranteedCashValue(faceAmount, cashRate);
  const deathBenefit = faceAmount;

  const nspRate = await getNSPRate({
    planCode,
    sex,
    issueAge: age,
    year,
    risk: smoker
  });

  const reducedPaidUp = nspRate > 0
    ? Math.round(guaranteedCashValue / nspRate * 1000)
    : 0;

  return { guaranteedCashValue, deathBenefit, reducedPaidUp };
}

/**
 * Yearly illustration row interface
 */
export interface YearlyIllustrationRow {
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
}

/**
 * Generate yearly illustration data
 */
export async function generateYearlyIllustrationData(
  faceAmount: number,
  annualPremium: number,
  planCode: string,
  sex: 'M' | 'F',
  smoker: 'N' | 'S',
  issueAge: number
): Promise<YearlyIllustrationRow[]> {
  const results: YearlyIllustrationRow[] = [];
  let accumulatedPUA = 0;

  // Get all required rates
  const { baseDividendRates, puaPremiumRates, puaDividendRates } = await getRates({
    planCode,
    sex,
    risk: smoker,
    issueAge
  });

  // Determine years to calculate: 1-20 each year, then every 5 years to age 121
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

  // Add year for age 121 if not included
  const yearFor121 = 121 - issueAge;
  if (yearFor121 > 20 && !yearsToCalculate.includes(yearFor121)) {
    yearsToCalculate.push(yearFor121);
  }

  // Calculate data for each year
  let lastCalculatedYear = 0;
  for (const year of yearsToCalculate) {
    const age = issueAge + year;

    // Calculate accumulated PUA from last calculated year to current (excluding current)
    for (let y = lastCalculatedYear + 1; y < year; y++) {
      const baseDividendRate = baseDividendRates[y - 1]?.rate || 0;
      const currentAgeForYear = issueAge + y;

      const puaDividendRate = puaDividendRates[currentAgeForYear] || 0;
      const puaPremiumRate = puaPremiumRates[currentAgeForYear] || 0;

      if (puaPremiumRate > 0) {
        const purchasedPUA = PurchasedPUA(
          faceAmount,
          baseDividendRate,
          accumulatedPUA,
          puaDividendRate,
          puaPremiumRate
        );
        accumulatedPUA += purchasedPUA;
      }
    }

    // Save accumulatedPUA at start of year
    const accumulatedPUAAtStartOfYear = accumulatedPUA;

    // Process current year
    const baseDividendRate = baseDividendRates[year - 1]?.rate || 0;
    let puaDividendRate = 0;
    if (year > 1 && accumulatedPUAAtStartOfYear > 0) {
      if (121 - issueAge === year) {
        puaDividendRate = puaDividendRates[age] || puaDividendRates[age - 1] || 0;
      } else {
        puaDividendRate = puaDividendRates[age] || 0;
      }
    }
    const baseDividend = BaseDividend(faceAmount, baseDividendRate);
    const puaDividend = PaidUpAdditionDividend(accumulatedPUAAtStartOfYear, puaDividendRate);
    const annualDividend = baseDividend + puaDividend;

    // Determine PUA Premium Rate
    let puaPremiumRate = 0;
    if (121 - issueAge === year) {
      if (puaDividendRates[age]) {
        puaPremiumRate = puaPremiumRates[age - 1] || 0;
      } else {
        puaPremiumRate = puaPremiumRates[age - 1] || 0;
      }
    } else {
      puaPremiumRate = puaPremiumRates[age] || 0;
    }

    // Purchase PUA with current year dividends
    if (puaPremiumRate > 0) {
      const purchasedPUA = PurchasedPUA(
        faceAmount,
        baseDividendRate,
        accumulatedPUAAtStartOfYear,
        puaDividendRate,
        puaPremiumRate
      );
      accumulatedPUA += purchasedPUA;
    }

    lastCalculatedYear = year;

    // Get guaranteed cash value
    const cashRate = await getCashRates({
      planCode,
      sex,
      issueAge,
      duration: year
    });
    const guaranteedCashValue = GuaranteedCashValue(faceAmount, cashRate);
    const guaranteedDeathBenefit = faceAmount;

    // Calculate current cash value
    const puaCashValue = puaPremiumRate > 0
      ? (accumulatedPUA * puaPremiumRate / 1000)
      : 0;
    const currentCashValue = guaranteedCashValue + puaCashValue;

    // Current death benefit
    const currentDeathBenefit = faceAmount + accumulatedPUA;

    // Total paid-up
    const totalPaidUp = puaPremiumRate > 0
      ? Math.round(currentCashValue / puaPremiumRate * 1000)
      : 0;

    results.push({
      age,
      endOfYear: year,
      contractPremium: annualPremium,
      guaranteedCashValue: Math.round(guaranteedCashValue),
      guaranteedDeathBenefit: Math.round(guaranteedDeathBenefit),
      annualDividend: round(annualDividend, 2),
      accumPaidUpAdditions: Math.round(accumulatedPUA),
      currentCashValue: Math.round(currentCashValue),
      currentDeathBenefit: Math.round(currentDeathBenefit),
      totalPaidUp: Math.round(totalPaidUp)
    });
  }

  return results;
}

