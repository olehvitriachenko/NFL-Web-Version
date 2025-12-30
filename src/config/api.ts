/**
 * API Configuration
 */

export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_BACKEND_API_URL || 'https://nfl-api.test.emorydevelopment.com';
};

