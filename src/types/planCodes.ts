export type Gender = 'M' | 'F';
export type SmokingStatus = 'Y' | 'N';
export type ProductType = 'PWL' | 'LegacyTerm' | 'SelectTerm' | 'WorkSitePlusTerm' | 'WorkSitePlusParticipating' | 'PremierChoiceLevel' | 'PremierChoiceGraded' | 'Rider' | 'Annuity';

export interface PlanCodeInfo {
  controlCodeKey: string;
  planCode: string;
  productType: ProductType;
  description: string;
  term?: number; // Для Term продуктов
  gender: Gender;
  smokingStatus: SmokingStatus;
}

export interface PlanCodeMapping {
  [controlCodeKey: string]: PlanCodeInfo;
}

/**
 * Маппинг Control Code Key -> Plan Code
 */
export const PLAN_CODE_MAPPING: PlanCodeMapping = {
  // PWL - Participating Whole Life
  'MY': { controlCodeKey: 'MY', planCode: '54000', productType: 'PWL', description: 'PWL Male Smoker', gender: 'M', smokingStatus: 'Y' },
  'FY': { controlCodeKey: 'FY', planCode: '54001', productType: 'PWL', description: 'PWL Female Smoker', gender: 'F', smokingStatus: 'Y' },
  'MN': { controlCodeKey: 'MN', planCode: '54015', productType: 'PWL', description: 'PWL Male Non-smoker', gender: 'M', smokingStatus: 'N' },
  'FN': { controlCodeKey: 'FN', planCode: '54016', productType: 'PWL', description: 'PWL Female Non-smoker', gender: 'F', smokingStatus: 'N' },

  // Legacy Term 10
  'MN10': { controlCodeKey: 'MN10', planCode: '42585', productType: 'LegacyTerm', description: 'Legacy Term 10 Male Non-smoker', term: 10, gender: 'M', smokingStatus: 'N' },
  'MY10': { controlCodeKey: 'MY10', planCode: '42586', productType: 'LegacyTerm', description: 'Legacy Term 10 Male Smoker', term: 10, gender: 'M', smokingStatus: 'Y' },
  'FN10': { controlCodeKey: 'FN10', planCode: '42588', productType: 'LegacyTerm', description: 'Legacy Term 10 Female Non-smoker', term: 10, gender: 'F', smokingStatus: 'N' },
  'FY10': { controlCodeKey: 'FY10', planCode: '42589', productType: 'LegacyTerm', description: 'Legacy Term 10 Female Smoker', term: 10, gender: 'F', smokingStatus: 'Y' },

  // Legacy Term 15
  'MN15': { controlCodeKey: 'MN15', planCode: '42685', productType: 'LegacyTerm', description: 'Legacy Term 15 Male Non-smoker', term: 15, gender: 'M', smokingStatus: 'N' },
  'MY15': { controlCodeKey: 'MY15', planCode: '42686', productType: 'LegacyTerm', description: 'Legacy Term 15 Male Smoker', term: 15, gender: 'M', smokingStatus: 'Y' },
  'FN15': { controlCodeKey: 'FN15', planCode: '42688', productType: 'LegacyTerm', description: 'Legacy Term 15 Female Non-smoker', term: 15, gender: 'F', smokingStatus: 'N' },
  'FY15': { controlCodeKey: 'FY15', planCode: '42689', productType: 'LegacyTerm', description: 'Legacy Term 15 Female Smoker', term: 15, gender: 'F', smokingStatus: 'Y' },

  // Legacy Term 20
  'MN20': { controlCodeKey: 'MN20', planCode: '47585', productType: 'LegacyTerm', description: 'Legacy Term 20 Male Non-smoker', term: 20, gender: 'M', smokingStatus: 'N' },
  'MY20': { controlCodeKey: 'MY20', planCode: '47586', productType: 'LegacyTerm', description: 'Legacy Term 20 Male Smoker', term: 20, gender: 'M', smokingStatus: 'Y' },
  'FN20': { controlCodeKey: 'FN20', planCode: '47588', productType: 'LegacyTerm', description: 'Legacy Term 20 Female Non-smoker', term: 20, gender: 'F', smokingStatus: 'N' },
  'FY20': { controlCodeKey: 'FY20', planCode: '47589', productType: 'LegacyTerm', description: 'Legacy Term 20 Female Smoker', term: 20, gender: 'F', smokingStatus: 'Y' },

  // Legacy Term 25
  'MN25': { controlCodeKey: 'MN25', planCode: '47685', productType: 'LegacyTerm', description: 'Legacy Term 25 Male Non-smoker', term: 25, gender: 'M', smokingStatus: 'N' },
  'MY25': { controlCodeKey: 'MY25', planCode: '47686', productType: 'LegacyTerm', description: 'Legacy Term 25 Male Smoker', term: 25, gender: 'M', smokingStatus: 'Y' },
  'FN25': { controlCodeKey: 'FN25', planCode: '47688', productType: 'LegacyTerm', description: 'Legacy Term 25 Female Non-smoker', term: 25, gender: 'F', smokingStatus: 'N' },
  'FY25': { controlCodeKey: 'FY25', planCode: '47689', productType: 'LegacyTerm', description: 'Legacy Term 25 Female Smoker', term: 25, gender: 'F', smokingStatus: 'Y' },

  // Legacy Term 30
  'MN30': { controlCodeKey: 'MN30', planCode: '47785', productType: 'LegacyTerm', description: 'Legacy Term 30 Male Non-smoker', term: 30, gender: 'M', smokingStatus: 'N' },
  'MY30': { controlCodeKey: 'MY30', planCode: '47786', productType: 'LegacyTerm', description: 'Legacy Term 30 Male Smoker', term: 30, gender: 'M', smokingStatus: 'Y' },
  'FN30': { controlCodeKey: 'FN30', planCode: '47788', productType: 'LegacyTerm', description: 'Legacy Term 30 Female Non-smoker', term: 30, gender: 'F', smokingStatus: 'N' },
  'FY30': { controlCodeKey: 'FY30', planCode: '47789', productType: 'LegacyTerm', description: 'Legacy Term 30 Female Smoker', term: 30, gender: 'F', smokingStatus: 'Y' },

  // Legacy Term 35
  'MN35': { controlCodeKey: 'MN35', planCode: '47885', productType: 'LegacyTerm', description: 'Legacy Term 35 Male Non-smoker', term: 35, gender: 'M', smokingStatus: 'N' },
  'MY35': { controlCodeKey: 'MY35', planCode: '47886', productType: 'LegacyTerm', description: 'Legacy Term 35 Male Smoker', term: 35, gender: 'M', smokingStatus: 'Y' },
  'FN35': { controlCodeKey: 'FN35', planCode: '47888', productType: 'LegacyTerm', description: 'Legacy Term 35 Female Non-smoker', term: 35, gender: 'F', smokingStatus: 'N' },
  'FY35': { controlCodeKey: 'FY35', planCode: '47889', productType: 'LegacyTerm', description: 'Legacy Term 35 Female Smoker', term: 35, gender: 'F', smokingStatus: 'Y' },

  // SelectTerm 10
  'MN10_ST': { controlCodeKey: 'MN10_ST', planCode: '24585', productType: 'SelectTerm', description: 'SelectTerm 10 Male Non-smoker', term: 10, gender: 'M', smokingStatus: 'N' },
  'MY10_ST': { controlCodeKey: 'MY10_ST', planCode: '24586', productType: 'SelectTerm', description: 'SelectTerm 10 Male Smoker', term: 10, gender: 'M', smokingStatus: 'Y' },
  'FN10_ST': { controlCodeKey: 'FN10_ST', planCode: '24588', productType: 'SelectTerm', description: 'SelectTerm 10 Female Non-smoker', term: 10, gender: 'F', smokingStatus: 'N' },
  'FY10_ST': { controlCodeKey: 'FY10_ST', planCode: '24589', productType: 'SelectTerm', description: 'SelectTerm 10 Female Smoker', term: 10, gender: 'F', smokingStatus: 'Y' },

  // SelectTerm 15
  'MN15_ST': { controlCodeKey: 'MN15_ST', planCode: '24685', productType: 'SelectTerm', description: 'SelectTerm 15 Male Non-smoker', term: 15, gender: 'M', smokingStatus: 'N' },
  'MY15_ST': { controlCodeKey: 'MY15_ST', planCode: '24686', productType: 'SelectTerm', description: 'SelectTerm 15 Male Smoker', term: 15, gender: 'M', smokingStatus: 'Y' },
  'FN15_ST': { controlCodeKey: 'FN15_ST', planCode: '24688', productType: 'SelectTerm', description: 'SelectTerm 15 Female Non-smoker', term: 15, gender: 'F', smokingStatus: 'N' },
  'FY15_ST': { controlCodeKey: 'FY15_ST', planCode: '24689', productType: 'SelectTerm', description: 'SelectTerm 15 Female Smoker', term: 15, gender: 'F', smokingStatus: 'Y' },

  // SelectTerm 20
  'MN20_ST': { controlCodeKey: 'MN20_ST', planCode: '24785', productType: 'SelectTerm', description: 'SelectTerm 20 Male Non-smoker', term: 20, gender: 'M', smokingStatus: 'N' },
  'MY20_ST': { controlCodeKey: 'MY20_ST', planCode: '24786', productType: 'SelectTerm', description: 'SelectTerm 20 Male Smoker', term: 20, gender: 'M', smokingStatus: 'Y' },
  'FN20_ST': { controlCodeKey: 'FN20_ST', planCode: '24788', productType: 'SelectTerm', description: 'SelectTerm 20 Female Non-smoker', term: 20, gender: 'F', smokingStatus: 'N' },
  'FY20_ST': { controlCodeKey: 'FY20_ST', planCode: '24789', productType: 'SelectTerm', description: 'SelectTerm 20 Female Smoker', term: 20, gender: 'F', smokingStatus: 'Y' },

  // SelectTerm 30
  'MN30_ST': { controlCodeKey: 'MN30_ST', planCode: '24885', productType: 'SelectTerm', description: 'SelectTerm 30 Male Non-smoker', term: 30, gender: 'M', smokingStatus: 'N' },
  'MY30_ST': { controlCodeKey: 'MY30_ST', planCode: '24886', productType: 'SelectTerm', description: 'SelectTerm 30 Male Smoker', term: 30, gender: 'M', smokingStatus: 'Y' },
  'FN30_ST': { controlCodeKey: 'FN30_ST', planCode: '24888', productType: 'SelectTerm', description: 'SelectTerm 30 Female Non-smoker', term: 30, gender: 'F', smokingStatus: 'N' },
  'FY30_ST': { controlCodeKey: 'FY30_ST', planCode: '24889', productType: 'SelectTerm', description: 'SelectTerm 30 Female Smoker', term: 30, gender: 'F', smokingStatus: 'Y' },

  // WorkSitePlus Term 20
  'MN20_WSP': { controlCodeKey: 'MN20_WSP', planCode: '66251', productType: 'WorkSitePlusTerm', description: 'WorkSitePlus Term 20 Male Non-smoker', term: 20, gender: 'M', smokingStatus: 'N' },
  'MY20_WSP': { controlCodeKey: 'MY20_WSP', planCode: '66252', productType: 'WorkSitePlusTerm', description: 'WorkSitePlus Term 20 Male Smoker', term: 20, gender: 'M', smokingStatus: 'Y' },
  'FN20_WSP': { controlCodeKey: 'FN20_WSP', planCode: '66253', productType: 'WorkSitePlusTerm', description: 'WorkSitePlus Term 20 Female Non-smoker', term: 20, gender: 'F', smokingStatus: 'N' },
  'FY20_WSP': { controlCodeKey: 'FY20_WSP', planCode: '66254', productType: 'WorkSitePlusTerm', description: 'WorkSitePlus Term 20 Female Smoker', term: 20, gender: 'F', smokingStatus: 'Y' },

  // WorkSitePlus Participating
  'MY_WSP': { controlCodeKey: 'MY_WSP', planCode: '66020', productType: 'WorkSitePlusParticipating', description: 'WorkSitePlus Participating Male Smoker', gender: 'M', smokingStatus: 'Y' },
  'FY_WSP': { controlCodeKey: 'FY_WSP', planCode: '66021', productType: 'WorkSitePlusParticipating', description: 'WorkSitePlus Participating Female Smoker', gender: 'F', smokingStatus: 'Y' },
  'MN_WSP': { controlCodeKey: 'MN_WSP', planCode: '66025', productType: 'WorkSitePlusParticipating', description: 'WorkSitePlus Participating Male Non-smoker', gender: 'M', smokingStatus: 'N' },
  'FN_WSP': { controlCodeKey: 'FN_WSP', planCode: '66026', productType: 'WorkSitePlusParticipating', description: 'WorkSitePlus Participating Female Non-smoker', gender: 'F', smokingStatus: 'N' },

  // PremierChoice Level
  'MN_PC_L': { controlCodeKey: 'MN_PC_L', planCode: '56100', productType: 'PremierChoiceLevel', description: 'PremierChoice Level Male Non-smoker', gender: 'M', smokingStatus: 'N' },
  'MY_PC_L': { controlCodeKey: 'MY_PC_L', planCode: '56101', productType: 'PremierChoiceLevel', description: 'PremierChoice Level Male Smoker', gender: 'M', smokingStatus: 'Y' },
  'FN_PC_L': { controlCodeKey: 'FN_PC_L', planCode: '56102', productType: 'PremierChoiceLevel', description: 'PremierChoice Level Female Non-smoker', gender: 'F', smokingStatus: 'N' },
  'FY_PC_L': { controlCodeKey: 'FY_PC_L', planCode: '56103', productType: 'PremierChoiceLevel', description: 'PremierChoice Level Female Smoker', gender: 'F', smokingStatus: 'Y' },

  // PremierChoice Graded
  'MN_PC_G': { controlCodeKey: 'MN_PC_G', planCode: '56104', productType: 'PremierChoiceGraded', description: 'PremierChoice Graded Male Non-smoker', gender: 'M', smokingStatus: 'N' },
  'MY_PC_G': { controlCodeKey: 'MY_PC_G', planCode: '56105', productType: 'PremierChoiceGraded', description: 'PremierChoice Graded Male Smoker', gender: 'M', smokingStatus: 'Y' },
  'FN_PC_G': { controlCodeKey: 'FN_PC_G', planCode: '56106', productType: 'PremierChoiceGraded', description: 'PremierChoice Graded Female Non-smoker', gender: 'F', smokingStatus: 'N' },
  'FY_PC_G': { controlCodeKey: 'FY_PC_G', planCode: '56107', productType: 'PremierChoiceGraded', description: 'PremierChoice Graded Female Smoker', gender: 'F', smokingStatus: 'Y' },
};

/**
 * Маппинг Plan Code -> Control Code Key (обратный поиск)
 */
export const PLAN_CODE_TO_CONTROL_KEY: Record<string, string> = Object.entries(PLAN_CODE_MAPPING).reduce(
  (acc, [key, value]) => {
    acc[value.planCode] = key;
    return acc;
  },
  {} as Record<string, string>
);

