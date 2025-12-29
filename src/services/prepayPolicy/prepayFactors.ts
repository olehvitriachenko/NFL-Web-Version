/**
 * Prepay Factors
 * Factors for calculating prepaid policy amounts
 * Index represents number of years (0-20)
 */
export const prepayFactors = [
  0,
  1.0000,
  1.9709,
  2.9135,
  3.8286,
  4.7171,
  5.5797,
  6.4172,
  7.2303,
  8.0197,
  8.7861,
  9.5302,
  10.2526,
  10.954,
  11.635,
  12.2961,
  12.9379,
  13.5611,
  14.1661,
  14.7535,
  15.3238
] as const;

/**
 * Get prepay factor for a specific number of years
 * @param years - Number of prepay years (0-20)
 * @returns Prepay factor
 */
export function getPrepayFactor(years: number): number {
  if (years < 0 || years > 20) {
    throw new Error(`Prepay years must be between 0 and 20, got ${years}`);
  }
  return prepayFactors[years];
}

/**
 * Get maximum prepay years
 */
export function getMaxPrepayYears(): number {
  return prepayFactors.length - 1;
}

