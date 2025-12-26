/**
 * Returns short product code for displaying in compact UI (e.g. PDF history card).
 *
 * Examples:
 * - "Legacy Term - 10 Year" -> "LT10"
 * - "Legacy Term - 20 Year" -> "LT20"
 * - "PWL - Participating Whole Life" -> "PWL"
 *
 * For unknown patterns it falls back to the first segment before "-" or the
 * original name if it cannot be split.
 */
export const getProductShortCode = (
  productName?: string | null
): string | undefined => {
  if (!productName) {
    return undefined;
  }

  const name = productName.trim();

  // Generic Legacy Term ... N ... -> LT{N}
  if (/Legacy\s*Term/i.test(name)) {
    const legacyDigits = name.match(/(\d+)/);
    if (legacyDigits && legacyDigits[1]) {
      return `LT${legacyDigits[1]}`;
    }
    return 'LT';
  }

  // Generic SelectTerm ... N ... -> ST{N}
  if (/Select\s*Term/i.test(name) || /SelectTerm/i.test(name)) {
    const selectDigits = name.match(/(\d+)/);
    if (selectDigits && selectDigits[1]) {
      return `ST${selectDigits[1]}`;
    }
    return 'ST';
  }

  // WorkSitePlus Term - N Year or Payroll - N Year Term -> WSP{N}
  const wspTermMatch = /^(?:WorkSitePlus\s+Term|Payroll)\s*-\s*(\d+)\s*Year(?:\s+Term)?/i.exec(name);
  if (wspTermMatch) {
    return `WSP_TERM`;
  }

  // WorkSitePlus / Payroll Participating -> WSP
  if (/^(WorkSitePlus|Payroll)\s+Participating/i.test(name)) {
    return 'WSP_PART';
  }

  // PWL products -> PWL
  if (/^PWL\b/i.test(name) || /Participating Whole Life/i.test(name)) {
    return 'PWL';
  }

  // PremierChoice - Level / Graded -> PCL / PCG
  if (/^Premier Choice\s*-\s*Level/i.test(name)) {
    return 'PC_LEVEL';
  }
  if (/^Premier Choice\s*-\s*Graded/i.test(name)) {
    return 'PC_GRADED';
  }

  // NFL Annuity / Flexible (Premium) Annuity
  if (/^NFL Annuity/i.test(name)) {
    return 'NFLA';
  }
  if (/^Flexible (Premium )?Annuity/i.test(name)) {
    return 'FPA';
  }

  // Fallback: take the part before the first "-"
  const [firstPart] = name.split('-');
  const short = firstPart.trim();
  return short.length > 0 ? short : name;
};

