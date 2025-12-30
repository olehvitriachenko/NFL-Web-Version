/**
 * HTTP Instance
 * 
 * Axios instance for API requests
 */

import axios, { AxiosError } from 'axios';
import { getApiBaseUrl } from '../../config/api';
import { authStorage } from './authStorage';

const BASE_URL = getApiBaseUrl();

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Create axios instance
const httpInstance = axios.create({
  baseURL: BASE_URL,
  // Don't set default Content-Type - let axios/browser set it automatically
  // For JSON requests, axios will set 'application/json'
  // For FormData, browser will set 'multipart/form-data' with boundary
});

// Request interceptor - adds access token to requests
httpInstance.interceptors.request.use(
  async (config: any) => {
    // Skip token addition for auth endpoints
    const authEndpoints = [
      '/api/sign-in/',
      '/api/nfl/sign-in/',
      '/api/register/',
      '/api/refresh-tokens/',
    ];

    const isAuthEndpoint = authEndpoints.some(endpoint =>
      config.url?.includes(endpoint)
    );

    if (!isAuthEndpoint) {
      const accessToken = localStorage.getItem('@auth_access_token');
      if (accessToken) {
        // Ensure Authorization header is set, even if headers were overridden
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        console.warn('[HttpInstance] No access token found for request to:', config.url);
      }
    }

    // For FormData, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles token refresh on 401 errors
httpInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return httpInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = authStorage.getRefreshToken();
        
        if (!refreshToken) {
          // No refresh token - clear storage and reject
          await authStorage.clearTokens();
          processQueue(new Error('No refresh token'), null);
          return Promise.reject(error);
        }

        // Check if refresh token is expired
        const isRefreshExpired = authStorage.isRefreshTokenExpired();
        if (isRefreshExpired) {
          await authStorage.clearTokens();
          processQueue(new Error('Refresh token expired'), null);
          return Promise.reject(error);
        }

        // Try to refresh tokens
        const refreshResponse = await axios.post<{ access?: { token: string; expires_at: number; user_id: number } | null; refresh?: { token: string; expires_at: number; user_id: number } | null }>(
          `${BASE_URL}/api/refresh-tokens/`,
          {
            refreshToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const newTokens = refreshResponse.data;
        await authStorage.saveTokens(newTokens);

        const newAccessToken = newTokens.access?.token || null;
        processQueue(null, newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers && newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return httpInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and reject
        processQueue(refreshError, null);
        await authStorage.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default httpInstance;

