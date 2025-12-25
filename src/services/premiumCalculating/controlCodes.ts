/**
 * Control Code Utilities
 * Helper functions to get control codes for different products
 */

import {
  Gender,
  SmokingStatus,
  ProductType,
  PWL_CONTROL_CODES,
  LEGACY_TERM_10_CONTROL_CODES,
  LEGACY_TERM_20_CONTROL_CODES,
  LEGACY_TERM_30_CONTROL_CODES,
  SELECT_TERM_10_CONTROL_CODES,
  SELECT_TERM_15_CONTROL_CODES,
  SELECT_TERM_20_CONTROL_CODES,
  SELECT_TERM_30_CONTROL_CODES,
  PREMIER_CHOICE_CONTROL_CODES,
  WSP_PARTICIPATING_CONTROL_CODES,
  WSP_TERM_CONTROL_CODES,
  RIDER_CONTROL_CODES
} from './types';
import type {
  ControlCode,
  ControlCodeSelector
} from './types';

// ==================== MAIN CONTROL CODE SELECTOR ====================

/**
 * Get control code for a product
 */
export function getControlCode(params: ControlCodeSelector): ControlCode {
  const { productType, gender, smokingStatus, faceAmount = 0 } = params;

  switch (productType) {
    case ProductType.PWL:
      return getPWLControlCode(gender, smokingStatus);

    case ProductType.LegacyTerm10:
      return getLegacyTerm10ControlCode(gender, smokingStatus, faceAmount);

    case ProductType.LegacyTerm20:
      return getLegacyTerm20ControlCode(gender, smokingStatus, faceAmount);

    case ProductType.LegacyTerm30:
      return getLegacyTerm30ControlCode(gender, smokingStatus, faceAmount);

    case ProductType.SelectTerm10:
      return getSelectTerm10ControlCode(gender, smokingStatus);

    case ProductType.SelectTerm15:
      return getSelectTerm15ControlCode(gender, smokingStatus);

    case ProductType.SelectTerm20:
      return getSelectTerm20ControlCode(gender, smokingStatus);

    case ProductType.SelectTerm30:
      return getSelectTerm30ControlCode(gender, smokingStatus);

    case ProductType.PremierChoiceLevel:
      return getPremierChoiceLevelControlCode(gender, smokingStatus);

    case ProductType.PremierChoiceGraded:
      return getPremierChoiceGradedControlCode(gender, smokingStatus);

    case ProductType.WorkSitePlusParticipating:
      return getWSPParticipatingControlCode(gender, smokingStatus);

    case ProductType.WorkSitePlusTerm:
      return getWSPTermControlCode(gender, smokingStatus);

    default:
      throw new Error(`Unknown product type: ${productType}`);
  }
}

// ==================== PRODUCT-SPECIFIC FUNCTIONS ====================

/**
 * Get PWL control code
 */
export function getPWLControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}`;
  
  const code = PWL_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No PWL control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Legacy Term 10 control code
 * Band 1: up to $250,000
 * Band 2: over $250,000
 */
export function getLegacyTerm10ControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus,
  faceAmount: number
): ControlCode {
  const band = faceAmount <= 250_000 ? 'BAND1' : 'BAND2';
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}_${band}`;
  
  const code = LEGACY_TERM_10_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Legacy Term 10 control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Legacy Term 20 control code
 */
export function getLegacyTerm20ControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus,
  faceAmount: number
): ControlCode {
  const band = faceAmount <= 250_000 ? 'BAND1' : 'BAND2';
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}_${band}`;
  
  const code = LEGACY_TERM_20_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Legacy Term 20 control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Legacy Term 30 control code
 */
export function getLegacyTerm30ControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus,
  faceAmount: number
): ControlCode {
  const band = faceAmount <= 250_000 ? 'BAND1' : 'BAND2';
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}_${band}`;
  
  const code = LEGACY_TERM_30_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Legacy Term 30 control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Select Term 10 control code
 */
export function getSelectTerm10ControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}`;
  
  const code = SELECT_TERM_10_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Select Term 10 control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Select Term 15 control code
 */
export function getSelectTerm15ControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}`;
  
  const code = SELECT_TERM_15_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Select Term 15 control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Select Term 20 control code
 */
export function getSelectTerm20ControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}`;
  
  const code = SELECT_TERM_20_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Select Term 20 control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Select Term 30 control code
 */
export function getSelectTerm30ControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}`;
  
  const code = SELECT_TERM_30_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Select Term 30 control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Premier Choice Level control code
 */
export function getPremierChoiceLevelControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}_LEVEL`;
  
  const code = PREMIER_CHOICE_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Premier Choice Level control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get Premier Choice Graded control code
 */
export function getPremierChoiceGradedControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}_GRADED`;
  
  const code = PREMIER_CHOICE_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No Premier Choice Graded control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get WorkSite Plus Participating control code
 */
export function getWSPParticipatingControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}`;
  
  const code = WSP_PARTICIPATING_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No WSP Participating control code found for ${key}`);
  }
  
  return code;
}

/**
 * Get WorkSite Plus Term control code
 */
export function getWSPTermControlCode(
  gender: Gender,
  smokingStatus: SmokingStatus
): ControlCode {
  const genderKey = gender === Gender.Male ? 'M' : 'F';
  const smokingKey = smokingStatus === SmokingStatus.NonSmoker ? 'N' : 'Y';
  const key = `${genderKey}_${smokingKey}`;
  
  const code = WSP_TERM_CONTROL_CODES[key];
  if (!code) {
    throw new Error(`No WSP Term control code found for ${key}`);
  }
  
  return code;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if product is a term product
 */
export function isTermProduct(productType: ProductType): boolean {
  return [
    ProductType.LegacyTerm10,
    ProductType.LegacyTerm20,
    ProductType.LegacyTerm30,
    ProductType.SelectTerm10,
    ProductType.SelectTerm15,
    ProductType.SelectTerm20,
    ProductType.SelectTerm30,
    ProductType.WorkSitePlusTerm
  ].includes(productType);
}

/**
 * Check if product uses band pricing
 */
export function usesBandPricing(productType: ProductType): boolean {
  return [
    ProductType.LegacyTerm10,
    ProductType.LegacyTerm20,
    ProductType.LegacyTerm30
  ].includes(productType);
}

/**
 * Get band for face amount (for Legacy Term products)
 */
export function getBand(faceAmount: number): 1 | 2 {
  return faceAmount <= 250_000 ? 1 : 2;
}

/**
 * Validate control code selector parameters
 */
export function validateControlCodeParams(params: ControlCodeSelector): void {
  const { productType, gender, smokingStatus, faceAmount } = params;

  if (!Object.values(ProductType).includes(productType)) {
    throw new Error(`Invalid product type: ${productType}`);
  }

  if (![Gender.Male, Gender.Female].includes(gender)) {
    throw new Error(`Invalid gender: ${gender}`);
  }

  if (![SmokingStatus.NonSmoker, SmokingStatus.Smoker].includes(smokingStatus)) {
    throw new Error(`Invalid smoking status: ${smokingStatus}`);
  }

  // Validate face amount for band pricing products
  if (usesBandPricing(productType) && (faceAmount === undefined || faceAmount <= 0)) {
    throw new Error(`Face amount is required for ${productType}`);
  }
}

