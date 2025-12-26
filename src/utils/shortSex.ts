/**
 * Converts full sex value to short format
 * @param sex - Full sex value ('Male' or 'Female')
 * @returns Short sex value ('M' or 'F')
 */
export const shortSex = (sex: 'Male' | 'Female'): 'M' | 'F' => {
  return sex === 'Male' ? 'M' : 'F';
};

