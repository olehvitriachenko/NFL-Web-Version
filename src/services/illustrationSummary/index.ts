/**
 * Illustration Summary Module
 * Exports for illustration summary functionality
 */

export {
  AccumulatedPUA,
  calculateNflAnnuity,
  calculatePremierIllustration,
  generateYearlyIllustrationData,
  type YearlyIllustrationRow
} from './illustrationSummaryCalculations';

export { getIllustrationData } from './getIllustrationData';

export {
  getCashRates,
  getCashRatesAll,
  getNSPRate,
  getPaidUpAdditionPremiumRates,
  getPaidUpAdditionDividendRates,
  getBaseDividendRates
} from './illustrationQueries';

