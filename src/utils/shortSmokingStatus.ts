/**
 * Converts smoking habit value to short format
 * @param smokingHabit - Smoking habit value ('Smoker', 'Non-smoker', 'Standard', 'Preferred')
 * @returns Short smoking status ('S' for Smoker, 'N' for others)
 * Note: Database uses 'S' for Smoker and 'N' for Non-smoker
 */
export const shortSmokingStatus = (
  smokingHabit: 'Smoker' | 'Non-smoker' | 'Standard' | 'Preferred' | string
): 'S' | 'N' => {
  return smokingHabit === 'Smoker' ? 'S' : 'N';
};

