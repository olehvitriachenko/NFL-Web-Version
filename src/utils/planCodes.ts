import { PLAN_CODE_MAPPING, PLAN_CODE_TO_CONTROL_KEY } from '../types/planCodes';
import type { PlanCodeInfo, ProductType } from '../types/planCodes';

/**
 * Проверяет, является ли продукт Term продуктом
 */
export function isTermProduct(controlCodeKey: string): boolean;
export function isTermProduct(planCode: string, byPlanCode?: boolean): boolean;
export function isTermProduct(planCodeOrKey: string, byPlanCode: boolean = false): boolean {
  let planCodeInfo: PlanCodeInfo | undefined;

  if (byPlanCode) {
    // Поиск по Plan Code
    const controlKey = PLAN_CODE_TO_CONTROL_KEY[planCodeOrKey];
    planCodeInfo = controlKey ? PLAN_CODE_MAPPING[controlKey] : undefined;
  } else {
    // Поиск по Control Code Key
    planCodeInfo = PLAN_CODE_MAPPING[planCodeOrKey];
  }

  if (!planCodeInfo) {
    return false;
  }

  const termProductTypes: ProductType[] = ['LegacyTerm', 'SelectTerm', 'WorkSitePlusTerm'];
  return termProductTypes.includes(planCodeInfo.productType);
}

/**
 * Получает Plan Code по Control Code Key
 */
export function getPlanCode(controlCodeKey: string): string | null {
  const planCodeInfo = PLAN_CODE_MAPPING[controlCodeKey];
  return planCodeInfo?.planCode || null;
}

/**
 * Получает Plan Code по параметрам продукта
 */
export function getPlanCodeByParams(
  productType: ProductType,
  gender: 'M' | 'F',
  smokingStatus: 'Y' | 'N',
  term?: number
): string | null {
  // Поиск по параметрам
  const found = Object.values(PLAN_CODE_MAPPING).find(
    (info) =>
      info.productType === productType &&
      info.gender === gender &&
      info.smokingStatus === smokingStatus &&
      (term === undefined || info.term === term)
  );

  return found?.planCode || null;
}

/**
 * Получает Control Code Key по Plan Code
 */
export function getControlCodeKey(planCode: string): string | null {
  return PLAN_CODE_TO_CONTROL_KEY[planCode] || null;
}

/**
 * Получает информацию о Plan Code
 */
export function getPlanCodeInfo(controlCodeKey: string): PlanCodeInfo | null;
export function getPlanCodeInfo(planCode: string, byPlanCode: boolean): PlanCodeInfo | null;
export function getPlanCodeInfo(codeOrKey: string, byPlanCode: boolean = false): PlanCodeInfo | null {
  if (byPlanCode) {
    const controlKey = PLAN_CODE_TO_CONTROL_KEY[codeOrKey];
    return controlKey ? PLAN_CODE_MAPPING[controlKey] || null : null;
  }
  return PLAN_CODE_MAPPING[codeOrKey] || null;
}

/**
 * Получает все Plan Codes для определенного типа продукта
 */
export function getPlanCodesByProductType(productType: ProductType): PlanCodeInfo[] {
  return Object.values(PLAN_CODE_MAPPING).filter((info) => info.productType === productType);
}

/**
 * Получает все Plan Codes для Term продуктов
 */
export function getAllTermPlanCodes(): PlanCodeInfo[] {
  return Object.values(PLAN_CODE_MAPPING).filter((info) => isTermProduct(info.controlCodeKey));
}

/**
 * Получает Control Code для использования в БД (с учетом Term продуктов)
 * Для Term продуктов возвращает формат: {planCode}_DUR_{term}
 */
export function getControlCodeForDB(controlCodeKey: string): string {
  const planCodeInfo = PLAN_CODE_MAPPING[controlCodeKey];
  if (!planCodeInfo) {
    return controlCodeKey;
  }

  // Для Term продуктов используем формат с DUR
  if (isTermProduct(controlCodeKey) && planCodeInfo.term) {
    return `${planCodeInfo.planCode}_DUR_${planCodeInfo.term}`;
  }

  // Для остальных продуктов используем Plan Code
  return planCodeInfo.planCode;
}

/**
 * Парсит Control Code Key и возвращает компоненты
 */
export function parseControlCodeKey(controlCodeKey: string): {
  gender: 'M' | 'F' | null;
  smokingStatus: 'Y' | 'N' | null;
  term: number | null;
} {
  const planCodeInfo = PLAN_CODE_MAPPING[controlCodeKey];
  if (planCodeInfo) {
    return {
      gender: planCodeInfo.gender,
      smokingStatus: planCodeInfo.smokingStatus,
      term: planCodeInfo.term || null,
    };
  }

  // Fallback: попытка парсинга по формату
  const match = controlCodeKey.match(/^([MF])([YN])(\d+)?/);
  if (match) {
    return {
      gender: match[1] as 'M' | 'F',
      smokingStatus: match[2] as 'Y' | 'N',
      term: match[3] ? parseInt(match[3], 10) : null,
    };
  }

  return { gender: null, smokingStatus: null, term: null };
}

