/**
 * SQL Queries for rates database
 * Uses Electron IPC to access rates.sqlite
 */

import type {
  RateQueryParams,
  RateQueryResult,
  IllustrationQueryParams,
  RiskRatingQueryParams,
  PaymentMode,
  PaymentMethod,
  Gender,
  SmokingStatus,
  IllustrationType
} from './types';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

/**
 * Get rate from database
 */
export async function getRate(
  params: RateQueryParams
): Promise<RateQueryResult | null> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getRate({
      controlCode: params.controlCode,
      age: params.age,
      gender: params.gender,
      smokingStatus: params.smokingStatus,
      paymentMode: params.paymentMode,
      paymentMethod: params.paymentMethod
    });

    if (!result.success || !result.data) {
      return null;
    }

    // Convert Unit from string to number if needed
    const data = result.data;
    return {
      PlanCode: data.PlanCode,
      ControlCode: data.ControlCode,
      BasicRate: data.BasicRate,
      Unit: typeof data.Unit === 'string' ? parseFloat(data.Unit) || 1000 : data.Unit,
      ModeFactor: data.ModeFactor,
      AnnualFactor: data.AnnualFactor,
      ServiceFee: data.ServiceFee,
      AnnualServiceFee: data.AnnualServiceFee,
      Age: data.Age
    };
  } catch (error) {
    console.error('Error executing rate query:', error);
    throw error;
  }
}

/**
 * Get term rate from database (with duration)
 */
export async function getTermRate(
  params: RateQueryParams & { duration: number }
): Promise<RateQueryResult | null> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getTermRate({
      controlCode: params.controlCode,
      age: params.age,
      gender: params.gender,
      smokingStatus: params.smokingStatus,
      paymentMode: params.paymentMode,
      paymentMethod: params.paymentMethod,
      duration: params.duration
    });

    if (!result.success || !result.data) {
      return null;
    }

    const data = result.data;
    return {
      PlanCode: data.PlanCode,
      ControlCode: data.ControlCode,
      BasicRate: data.BasicRate,
      Unit: typeof data.Unit === 'string' ? parseFloat(data.Unit) || 1000 : data.Unit,
      ModeFactor: data.ModeFactor,
      AnnualFactor: data.AnnualFactor,
      ServiceFee: data.ServiceFee,
      AnnualServiceFee: data.AnnualServiceFee,
      Age: data.Age
    };
  } catch (error) {
    console.error('Error executing term rate query:', error);
    throw error;
  }
}

/**
 * Get illustration factor from database
 */
export async function getIllustrationFactor(
  params: IllustrationQueryParams
): Promise<number> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    // Map IllustrationType to the format expected by the database
    const kindMap: Record<IllustrationType, string> = {
      'div': 'div',
      'cash': 'cash_value',
      'pua_prem': 'pua_prem',
      'pua_div': 'pua_div',
      'nsp': 'nsp'
    };

    const result = await window.electron.rates.getIllustrationFactor({
      planCode: params.planCode,
      kind: kindMap[params.kind] || params.kind,
      sex: params.sex,
      issueAge: params.issueAge,
      duration: params.duration,
      risk: params.risk
    });

    if (!result.success) {
      return 0;
    }

    return result.data || 0;
  } catch (error) {
    console.error('Error executing illustration factor query:', error);
    return 0;
  }
}

/**
 * Get risk rating factor from database
 */
export async function getRiskRatingFactor(
  params: RiskRatingQueryParams
): Promise<number> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getRiskRatingFactor({
      code: params.code,
      age: params.age,
      gender: params.gender,
      tableNumber: params.tableNumber
    });

    if (!result.success) {
      return 0;
    }

    return result.data || 0;
  } catch (error) {
    console.error('Error executing risk rating factor query:', error);
    return 0;
  }
}

/**
 * Get all illustration factors for all durations
 */
export async function getAllIllustrationFactors(
  planCode: string,
  kind: IllustrationType,
  sex: Gender,
  issueAge: number,
  risk?: SmokingStatus
): Promise<Array<{ Duration: number; Factor: number }>> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const kindMap: Record<IllustrationType, string> = {
      'div': 'div',
      'cash': 'cash_value',
      'pua_prem': 'pua_prem',
      'pua_div': 'pua_div',
      'nsp': 'nsp'
    };

    const result = await window.electron.rates.getAllIllustrationFactors(
      planCode,
      kindMap[kind] || kind,
      sex,
      issueAge,
      risk
    );

    if (!result.success || !result.data) {
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error executing all illustration factors query:', error);
    return [];
  }
}

/**
 * Get available ages for a control code
 */
export async function getAvailableAges(controlCode: string): Promise<number[]> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getAvailableAges(controlCode);

    if (!result.success || !result.data) {
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error executing available ages query:', error);
    return [];
  }
}

/**
 * Check if rate exists for given parameters
 */
export async function checkRateExists(params: RateQueryParams): Promise<boolean> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.checkRateExists({
      controlCode: params.controlCode,
      age: params.age,
      gender: params.gender,
      smokingStatus: params.smokingStatus
    });

    if (!result.success) {
      return false;
    }

    return result.data || false;
  } catch (error) {
    console.error('Error checking rate existence:', error);
    return false;
  }
}

