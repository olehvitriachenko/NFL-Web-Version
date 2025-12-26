/**
 * Converts smoking habit value to short format
 * @param smokingHabit - Smoking habit value ('Smoker', 'Non-smoker', 'Standard', 'Preferred')
 * @returns Short smoking status ('Y' for Smoker, 'N' for others)
 * Note: Database uses 'Y' for Smoker and 'N' for Non-smoker
 */
export const shortSmokingStatus = (
  smokingHabit: 'Smoker' | 'Non-smoker' | 'Standard' | 'Preferred' | string
): 'Y' | 'N' => {
  return smokingHabit === 'Smoker' ? 'Y' : 'N';
};

