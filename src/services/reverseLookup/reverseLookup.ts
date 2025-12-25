/**
 * Reverse Lookup
 * Finds face amount and rider values based on target premium
 */

import {
  calculatePremiumForState,
  QuickFormState,
} from '../../stores/QuickFormStore';

/**
 * Calculate adjusted accidental death value based on current face amount
 */
const getAccidentalDeathValue = (currentFaceAmount: number, accidentalDeathValue: number): number => {
  return currentFaceAmount > 300_000
    ? 300_000
    : accidentalDeathValue >= currentFaceAmount
      ? currentFaceAmount
      : accidentalDeathValue;
};

/**
 * Calculate adjusted dependent child value based on current face amount
 * Dependent Child может быть от 1000 до 10000 с шагом 1000
 */
const getDependentChildValue = (currentFaceAmount: number, dependentChildValue: number): number => {
  const MIN_DEPENDENT_CHILD = 1_000;
  const MAX_DEPENDENT_CHILD = 10_000;
  const STEP = 1_000;

  // Если currentFaceAmount меньше минимального значения, вернуть 0
  if (currentFaceAmount <= MIN_DEPENDENT_CHILD) {
    return 0;
  }

  if (currentFaceAmount <= MAX_DEPENDENT_CHILD) {
    dependentChildValue *= 0.5;
  }

  // Взять минимум между dependentChildValue и currentFaceAmount
  const maxAllowed = Math.min(dependentChildValue, currentFaceAmount);

  // Округлить вниз до ближайшего значения, кратного 1000
  const roundedDown = Math.floor(maxAllowed / (3 * STEP)) * STEP;

  // Убедиться, что значение в допустимом диапазоне [1000, 10000]
  if (roundedDown < MIN_DEPENDENT_CHILD) {
    return 0;
  }

  if (roundedDown > MAX_DEPENDENT_CHILD) {
    return MAX_DEPENDENT_CHILD;
  }

  return roundedDown;
};

/**
 * Calculate adjusted guaranteed insurability value based on current face amount
 * Guaranteed Insurability может быть от 5000 до 25000 с шагом 5000
 */
const getGuaranteedInsurabilityValue = (currentFaceAmount: number, guaranteedInsurabilityValue: number): number => {
  const MIN_GUARANTEED_INSURABILITY = 5_000;
  const MAX_GUARANTEED_INSURABILITY = 25_000;
  const STEP = 5_000;

  // Если currentFaceAmount меньше минимального значения, вернуть 0
  if (currentFaceAmount <= MIN_GUARANTEED_INSURABILITY) {
    return 0;
  }

  // Взять минимум между guaranteedInsurabilityValue и currentFaceAmount
  const maxAllowed = Math.min(guaranteedInsurabilityValue, currentFaceAmount);

  // Округлить вниз до ближайшего значения, кратного 5000
  const roundedDown = Math.floor(maxAllowed / (2 * STEP)) * STEP;

  // Убедиться, что значение в допустимом диапазоне [5000, 25000]
  if (roundedDown < MIN_GUARANTEED_INSURABILITY) {
    return 0;
  }

  if (roundedDown > MAX_GUARANTEED_INSURABILITY) {
    return MAX_GUARANTEED_INSURABILITY;
  }

  return roundedDown;
};

/**
 * Get premium for a given face amount with adjusted rider values
 */
const getPremium = async (
  state: QuickFormState,
  faceAmount: number
): Promise<{
  accidentalDeathValue: number;
  dependentChildValue: number;
  guaranteedInsurabilityValue: number;
  totalPremium: number;
}> => {
  const accidentalDeathValue = getAccidentalDeathValue(
    faceAmount,
    state.accidentalDeath.value
  );
  const dependentChildValue = getDependentChildValue(
    faceAmount,
    state.dependentChild as number
  );
  const guaranteedInsurabilityValue = getGuaranteedInsurabilityValue(
    faceAmount,
    state.guaranteedInsurability as number
  );

  const { totalPremium } = await calculatePremiumForState({
    ...state,
    faceAmount: faceAmount,
    accidentalDeath: {
      type: state.accidentalDeath.type,
      value: accidentalDeathValue
    },
    dependentChild: dependentChildValue,
    guaranteedInsurability: guaranteedInsurabilityValue
  });

  return {
    accidentalDeathValue,
    dependentChildValue,
    guaranteedInsurabilityValue,
    totalPremium
  };
};

/**
 * Find minimum and maximum face amounts where premium exceeds target
 */
const findMinAndMax = async (
  state: QuickFormState,
  targetPremium: number
): Promise<{ maxFaceAmount: number; minFaceAmount: number }> => {
  let minFaceAmount = 1_000;
  let currentFaceAmount = minFaceAmount;
  let maxFaceAmount = 0;

  while (maxFaceAmount === 0) {
    const { totalPremium } = await getPremium(state, currentFaceAmount);

    const delta = totalPremium - targetPremium;

    if (delta > 0) {
      maxFaceAmount = currentFaceAmount;
      return { maxFaceAmount, minFaceAmount };
    }

    minFaceAmount = currentFaceAmount;

    if (minFaceAmount === 1_000) {
      currentFaceAmount += 9_000;
    } else {
      currentFaceAmount *= 2;
    }
  }

  return { maxFaceAmount, minFaceAmount };
};

/**
 * Binary search for face amount that matches target premium
 */
const binarySearchPremium = async (
  state: QuickFormState,
  minFaceAmount: number,
  maxFaceAmount: number,
  targetPremium: number
): Promise<{
  faceAmount: number;
  accidentalDeathValue: number;
  dependentChildValue: number;
  guaranteedInsurabilityValue: number;
}> => {
  let max = maxFaceAmount;
  let min = minFaceAmount;

  let tries = 0;
  const MAX_TRIES = 50;
  const TOLERANCE = 0.01;

  while (true) {
    const mid = Math.round((max + min) / 2);

    const {
      totalPremium,
      accidentalDeathValue,
      dependentChildValue,
      guaranteedInsurabilityValue
    } = await getPremium(state, mid);

    const delta = totalPremium - targetPremium;

    if (delta >= TOLERANCE) {
      max = mid;
    } else if (delta <= -TOLERANCE) {
      min = mid;
    } else {
      return {
        faceAmount: mid,
        accidentalDeathValue,
        dependentChildValue,
        guaranteedInsurabilityValue
      };
    }

    tries++;

    if (tries > MAX_TRIES) {
      return {
        faceAmount: mid,
        accidentalDeathValue,
        dependentChildValue,
        guaranteedInsurabilityValue
      };
    }
  }
};

/**
 * Reverse lookup: find face amount and rider values for target premium
 * @param targetPremium - Target premium amount
 * @param state - Current form state (optional, will use store state if not provided)
 * @returns Face amount and adjusted rider values
 */
export const reverseLookUp = async (
  targetPremium: number,
  state?: QuickFormState
): Promise<{
  faceAmount: number;
  accidentalDeathValue: number;
  dependentChildValue: number;
  guaranteedInsurabilityValue: number;
}> => {
  // If state is not provided, get it from store
  if (!state) {
    const { useQuickFormStore } = await import('../../stores/QuickFormStore');
    state = useQuickFormStore.getState();
  }

  const { maxFaceAmount, minFaceAmount } = await findMinAndMax(state, targetPremium);
  const {
    faceAmount,
    accidentalDeathValue,
    dependentChildValue,
    guaranteedInsurabilityValue
  } = await binarySearchPremium(state, minFaceAmount, maxFaceAmount, targetPremium);

  return {
    faceAmount,
    accidentalDeathValue,
    dependentChildValue,
    guaranteedInsurabilityValue
  };
};

