/**
 * Main export file for Premium Calculation module
 */

// Types
export * from './types';

// Control Codes
export {
  getControlCode,
  getPWLControlCode,
  getLegacyTerm10ControlCode,
  getLegacyTerm20ControlCode,
  getLegacyTerm30ControlCode,
  getSelectTerm10ControlCode,
  getSelectTerm15ControlCode,
  getSelectTerm20ControlCode,
  getSelectTerm30ControlCode,
  getPremierChoiceLevelControlCode,
  getPremierChoiceGradedControlCode,
  getWSPParticipatingControlCode,
  getWSPTermControlCode,
  isTermProduct,
  usesBandPricing,
  getBand,
  validateControlCodeParams
} from './controlCodes';

// Queries
export {
  getRate,
  getTermRate,
  getIllustrationFactor,
  getAllIllustrationFactors,
  getRiskRatingFactor,
  getAvailableAges,
  checkRateExists
} from './queries';

// Premium Calculator
export {
  calculatePremium,
  calculateBasePremium,
  calculateFlatExtra
} from './premiumCalculator';

