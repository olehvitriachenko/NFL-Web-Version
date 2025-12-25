/**
 * Qualification Examinations Configuration
 * Converted from C# NFLQualificationExamProvider
 *
 * NFL Products that use Examinations:
 * - ParticipatingWholeLifeProduct (PWL) - uses ExamsForPWL()
 * - SelectTermProduct - uses ExamsForSelectTerm()
 * - LegacyTermProduct - uses ExamsForSelectTerm()
 *
 * NFL Products WITHOUT Examinations:
 * - PremierChoice
 * - WorkSitePlusParticipating
 * - WorkSitePlusTerm
 * - NFLAnnuityProduct
 * - FlexibleAnnuityProduct
 */

import { Gender } from '../premiumCalculating/types';

// Extended Gender enum for examinations (includes Both option)
export enum ExaminationGender {
  Male = 'M',
  Female = 'F',
  Both = 'B',
}

export interface QualifyingCondition {
  minAge: number;
  maxAge: number;
  minAmount: number;
  maxAmount: number;
  genders: ExaminationGender[];
}

export interface QualifyingExam {
  code?: string;
  text: string;
  conditions: QualifyingCondition[];
}

export interface QualificationExamsConfig {
  [productType: string]: {
    exams: QualifyingExam[];
  };
}

const MAX_FACE_AMOUNT = 9999999;
const MAX_AGE = 150;

/**
 * NFL Examinations Configuration
 */
export const NFLExaminations = {
  PWL: {
    exams: [
      {
        code: 'BASIC',
        text: 'para-med exam, blood profile and urine specimen required',
        conditions: [
          { minAge: 0, maxAge: 3, minAmount: 200_001, maxAmount: MAX_FACE_AMOUNT, genders: [ExaminationGender.Both] },
          { minAge: 4, maxAge: 65, minAmount: 250_001, maxAmount: MAX_FACE_AMOUNT, genders: [ExaminationGender.Both] },
          { minAge: 66, maxAge: MAX_AGE, minAmount: 50_001, maxAmount: MAX_FACE_AMOUNT, genders: [ExaminationGender.Both] },
        ],
      },
      {
        code: 'MVR',
        text: 'a motor vehicle report (MVR) is required',
        conditions: [
          { minAge: 16, maxAge: 30, minAmount: 0, maxAmount: 250_000, genders: [ExaminationGender.Male] },
          { minAge: 0, maxAge: MAX_AGE, minAmount: 250_000, maxAmount: 500_001, genders: [ExaminationGender.Both] },
        ],
      },
      {
        code: 'MVR_INSPECTION',
        text: 'inspection and motor vehicle report (MVR) is required',
        conditions: [
          { minAge: 0, maxAge: MAX_AGE, minAmount: 500_001, maxAmount: MAX_FACE_AMOUNT, genders: [ExaminationGender.Both] },
        ],
      },
    ],
  },
  SelectTerm: {
    exams: [
      {
        code: 'BASIC',
        text: 'para-med exam, blood profile and urine specimen required',
        conditions: [
          { minAge: 18, maxAge: MAX_AGE, minAmount: 250_001, maxAmount: MAX_FACE_AMOUNT, genders: [ExaminationGender.Both] },
        ],
      },
      {
        code: 'MVR',
        text: 'a motor vehicle report (MVR) is required',
        conditions: [
          { minAge: 16, maxAge: 30, minAmount: 0, maxAmount: 250_000, genders: [ExaminationGender.Male] },
          { minAge: 0, maxAge: MAX_AGE, minAmount: 250_000, maxAmount: 500_001, genders: [ExaminationGender.Both] },
        ],
      },
      {
        code: 'MVR_INSPECTION',
        text: 'inspection and motor vehicle report (MVR) is required',
        conditions: [
          { minAge: 0, maxAge: MAX_AGE, minAmount: 500_001, maxAmount: MAX_FACE_AMOUNT, genders: [ExaminationGender.Both] },
        ],
      },
    ],
  },
};

/**
 * Check if a condition fits the policy
 */
export function conditionFits(
  condition: QualifyingCondition,
  age: number,
  faceAmount: number,
  gender: Gender
): boolean {
  const fitsAge = age >= condition.minAge && age <= condition.maxAge;
  const fitsAmount = faceAmount >= condition.minAmount && faceAmount < condition.maxAmount;
  // Convert Gender to ExaminationGender for comparison
  const examGender = gender === Gender.Male ? ExaminationGender.Male : ExaminationGender.Female;
  const fitsGender = condition.genders.includes(examGender) || condition.genders.includes(ExaminationGender.Both);
  return fitsAge && fitsAmount && fitsGender;
}

/**
 * Get required examinations for a policy
 */
export interface Requirement {
  code?: string;
  text: string;
}

export function getRequiredExaminations(
  productType: keyof typeof NFLExaminations,
  age: number,
  faceAmount: number,
  gender: Gender
): Requirement[] {
  const productConfig = NFLExaminations[productType];
  if (!productConfig) {
    return [];
  }

  const requirements: Requirement[] = [];

  for (const exam of productConfig.exams) {
    // Check if any condition matches
    const matches = exam.conditions.some((condition) =>
      conditionFits(condition, age, faceAmount, gender)
    );

    if (matches) {
      requirements.push({
        code: exam.code,
        text: exam.text,
      });
    }
  }

  return requirements;
}

/**
 * Export default object with all examinations
 */
export default {
  NFLExaminations,
  getRequiredExaminations,
  conditionFits,
};

