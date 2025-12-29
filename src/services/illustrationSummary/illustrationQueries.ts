/**
 * Illustration Queries
 * Additional queries for illustration calculations
 */

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

/**
 * Get cash rates for all durations
 */
export async function getCashRatesAll(params: {
  planCode: string;
  sex: 'M' | 'F';
  issueAge: number;
}): Promise<Array<{ Duration: number; Factor: number }>> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getCashRates(
      params.planCode,
      params.sex,
      params.issueAge,
      null
    );

    if (!result.success || !result.data) {
      return [];
    }

    return result.data as Array<{ Duration: number; Factor: number }>;
  } catch (error) {
    console.error('Error fetching cash rates:', error);
    return [];
  }
}

/**
 * Get cash rate for a specific duration
 */
export async function getCashRates(params: {
  planCode: string;
  sex: 'M' | 'F';
  issueAge: number;
  duration: number;
}): Promise<number> {
  const allRates = await getCashRatesAll({
    planCode: params.planCode,
    sex: params.sex,
    issueAge: params.issueAge
  });

  const factor = allRates.find(f => f.Duration === params.duration);
  return factor?.Factor || 0;
}

/**
 * Get NSP (Net Single Premium) rate
 */
export async function getNSPRate(params: {
  planCode: string;
  sex: 'M' | 'F';
  issueAge: number;
  year: number;
  risk: 'N' | 'S';
}): Promise<number> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getNSPRate(
      params.planCode,
      params.sex,
      params.issueAge + params.year,
      params.risk
    );

    if (!result.success) {
      return 0;
    }

    return result.data || 0;
  } catch (error) {
    console.error('Error fetching NSP rate:', error);
    return 0;
  }
}

/**
 * Get paid-up addition premium rates for age range
 */
export async function getPaidUpAdditionPremiumRates(params: {
  planCode: string;
  sex: 'M' | 'F';
  risk: 'N' | 'S';
  minIssueAge: number;
  maxIssueAge: number;
}): Promise<Record<number, number>> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getPaidUpAdditionPremiumRates(
      params.planCode,
      params.sex,
      params.risk,
      params.minIssueAge,
      params.maxIssueAge
    );

    if (!result.success || !result.data) {
      return {};
    }

    const rates: Record<number, number> = {};
    result.data.forEach((item: { IssueAge: number; Factor: number }) => {
      rates[item.IssueAge] = item.Factor;
    });

    return rates;
  } catch (error) {
    console.error('Error fetching PUA premium rates:', error);
    return {};
  }
}

/**
 * Get paid-up addition dividend rates for age range
 */
export async function getPaidUpAdditionDividendRates(params: {
  planCode: string;
  sex: 'M' | 'F';
  risk: 'N' | 'S' | null;
  minIssueAge: number;
  maxIssueAge: number;
}): Promise<Record<number, number>> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getPaidUpAdditionDividendRates(
      params.planCode,
      params.sex,
      params.risk,
      params.minIssueAge,
      params.maxIssueAge
    );

    if (!result.success || !result.data) {
      return {};
    }

    const rates: Record<number, number> = {};
    result.data.forEach((item: { IssueAge: number; Factor: number }) => {
      rates[item.IssueAge] = item.Factor;
    });

    return rates;
  } catch (error) {
    console.error('Error fetching PUA dividend rates:', error);
    return {};
  }
}

/**
 * Get base dividend rates for all durations
 */
export async function getBaseDividendRates(params: {
  planCode: string;
  sex: 'M' | 'F';
  issueAge: number;
  risk: 'N' | 'S';
}): Promise<Array<{ duration: number; rate: number }>> {
  if (!isElectron || !window.electron?.rates) {
    throw new Error('Electron IPC not available. This function requires Electron.');
  }

  try {
    const result = await window.electron.rates.getAllIllustrationFactors(
      params.planCode,
      'div',
      params.sex,
      params.issueAge,
      params.risk
    );

    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map(item => ({
      duration: item.Duration,
      rate: item.Factor
    }));
  } catch (error) {
    console.error('Error fetching base dividend rates:', error);
    return [];
  }
}

