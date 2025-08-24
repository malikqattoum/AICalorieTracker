import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import {
  API_URL,
  USE_MOCK_DATA,
  NETWORK_CONFIG,
  CACHE_KEYS,
  ERROR_MESSAGES,
  log,
  logError
} from '../config';
import secureApiService from './secureApiService';
import { validateApiResponse } from '../utils/responseValidator';
import { ApiMonitoring } from '../utils/monitoring';

// Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  cached?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface RequestConfig extends AxiosRequestConfig {
  cache?: boolean;
  cacheKey?: string;
  cacheDuration?: number;
  retry?: boolean;
  showErrorToast?: boolean;
  requiresAuth?: boolean;
}

// Network status
let isOnline = true;
let networkListener: (() => void) | null = null;

// Initialize network monitoring
export const initializeNetworkMonitoring = () => {
  if (networkListener) return;
  
  networkListener = NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? false;
    
    if (!wasOnline && isOnline) {
      log('Network connection restored');
      Toast.show({
        type: 'success',
        text1: 'Connection Restored',
        text2: 'You are back online',
        position: 'bottom',
      });
    } else if (wasOnline && !isOnline) {
      log('Network connection lost');
      Toast.show({
        type: 'error',
        text1: 'No Internet Connection',
        text2: 'Using cached data when available',
        position: 'bottom',
      });
    }
  });
};

// Cache management
const getCacheKey = (key: string): string => `api_cache_${key}`;

const setCache = async (key: string, data: any, duration: number = NETWORK_CONFIG.cacheExpiration): Promise<void> => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      duration,
    };
    await AsyncStorage.setItem(getCacheKey(key), JSON.stringify(cacheData));
  } catch (error) {
    logError('Cache set error:', error);
  }
};

const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(key));
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const isExpired = Date.now() - cacheData.timestamp > cacheData.duration;
    
    if (isExpired) {
      await AsyncStorage.removeItem(getCacheKey(key));
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    logError('Cache get error:', error);
    return null;
  }
};

const clearCache = async (pattern?: string): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith('api_cache_') && 
      (!pattern || key.includes(pattern))
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      log(`Cleared ${cacheKeys.length} cache entries`);
    }
  } catch (error) {
    logError('Cache clear error:', error);
  }
};

// Use secure API instance
const apiInstance = secureApiService.getApiInstance();

// Retry mechanism
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries: number = NETWORK_CONFIG.retryAttempts
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      log(`Retrying request, ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.retryDelay));
      return retryRequest(requestFn, retries - 1);
    }
    throw error;
  }
};

const isRetryableError = (error: any): boolean => {
  if (!error.response) return true; // Network error
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429; // Server error, timeout, or rate limit
};

// Error handling
const handleApiError = (error: any, config?: RequestConfig): ApiError => {
  let apiError: ApiError;
  
  if (error.response) {
    // Server responded with error status
    apiError = {
      message: error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR,
      status: error.response.status,
      code: error.response.data?.code,
      details: error.response.data,
    };
  } else if (error.request) {
    // Network error
    apiError = {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      code: 'NETWORK_ERROR',
    };
  } else if (error.code === 'ECONNABORTED') {
    // Timeout error
    apiError = {
      message: ERROR_MESSAGES.TIMEOUT_ERROR,
      code: 'TIMEOUT_ERROR',
    };
  } else {
    // Unknown error
    apiError = {
      message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      code: 'UNKNOWN_ERROR',
    };
  }
  
  logError('API Error:', apiError);
  
  // Show error toast if enabled
  if (config?.showErrorToast !== false) {
    Toast.show({
      type: 'error',
      text1: 'Request Failed',
      text2: apiError.message,
      position: 'bottom',
    });
  }
  
  return apiError;
};

// Main API service
export class ApiService {
  // Generic request method
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Check cache first if enabled
    if (config.cache && config.cacheKey) {
      const cached = await getCache<T>(config.cacheKey);
      if (cached) {
        log('Returning cached data for:', config.cacheKey);
        return {
          data: cached,
          status: 200,
          cached: true,
        };
      }
    }
    
    // If offline and no cache, throw error
    if (!isOnline && !config.cache) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    try {
      // Use secure API service with retry logic
      const response = await retryRequest(async () => {
        const axiosConfig: AxiosRequestConfig = {
          method: config.method?.toUpperCase() as any,
          url: config.url,
          data: config.data,
          headers: config.headers,
          params: config.params,
        };

        if (config.requiresAuth !== false) {
          const response = await secureApiService.getApiInstance().request(axiosConfig);
          return response.data;
        } else {
          const response = await axios({
            ...axiosConfig,
            baseURL: API_URL,
          });
          return response.data;
        }
      });
      
      // Validate response data
      const validation = validateApiResponse(
        response,
        config.url || '',
        this.getDefaultDataForEndpoint(config.url || '')
      );

      if (!validation.isValid && validation.fallbackData) {
        log(`Using fallback data for ${config.url} due to: ${validation.error}`);
        
        // Cache the fallback data if caching is enabled
        if (config.cache && config.cacheKey) {
          await setCache(config.cacheKey, validation.fallbackData, config.cacheDuration);
        }

        return {
          data: validation.fallbackData,
          status: 200,
          message: 'Using cached/fallback data due to server response issue',
          cached: true,
        };
      }

      if (!validation.isValid) {
        throw new Error(`Invalid API response: ${validation.error}`);
      }
      
      // Cache response if enabled
      if (config.cache && config.cacheKey && response) {
        await setCache(config.cacheKey, response, config.cacheDuration);
      }
      
      return {
        data: response,
        status: 200,
        message: 'Success',
      };
    } catch (error) {
      // Handle JSON parsing errors specifically
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        logError('JSON Parse Error:', {
          endpoint: config.url,
          error: error.message,
          message: 'Server returned malformed JSON, using fallback data'
        });

        // Try to return cached data as fallback
        if (config.cache && config.cacheKey) {
          const cached = await getCache<T>(config.cacheKey);
          if (cached) {
            log('Returning cached data due to JSON parse error:', config.cacheKey);
            return {
              data: cached,
              status: 200,
              cached: true,
              message: 'Using cached data due to server response issue',
            };
          }
        }

        // Use default fallback data
        const fallbackData = this.getDefaultDataForEndpoint(config.url || '');
        if (fallbackData) {
          log('Using default fallback data for:', config.url);
          return {
            data: fallbackData,
            status: 200,
            cached: true,
            message: 'Using default data due to server response issue',
          };
        }
        
        // If no fallback data available, throw a more informative error
        throw new Error(`JSON parsing failed for endpoint ${config.url}: ${error.message}. This may indicate a server issue or network problem.`);
      }

      const apiError = handleApiError(error, config);
      
      // Try to return cached data as fallback for other errors
      if (config.cache && config.cacheKey && !isOnline) {
        const cached = await getCache<T>(config.cacheKey);
        if (cached) {
          log('Returning stale cached data due to offline:', config.cacheKey);
          return {
            data: cached,
            status: 200,
            cached: true,
            message: 'Offline - showing cached data',
          };
        }
      }
      
      throw apiError;
    }
  }
  
  // HTTP methods
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }
  
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }
  
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }
  
  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }
  
  // File upload method
  async uploadFile(url: string, file: any, onProgress?: (progress: number) => void, config?: RequestConfig): Promise<ApiResponse<any>> {
    try {
      const response = await secureApiService.uploadFile(url, file, onProgress, config);
      return {
        data: response,
        status: 200,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      const apiError = handleApiError(error, config);
      throw apiError;
    }
  }
  
  // Utility methods
  async clearAllCache(): Promise<void> {
    await clearCache();
  }
  
  async clearCachePattern(pattern: string): Promise<void> {
    await clearCache(pattern);
  }
  
  isOnline(): boolean {
    return isOnline;
  }
  
  // Authentication methods
  async setAuthToken(token: string): Promise<void> {
    await secureApiService.setAuthToken(token);
  }
  
  async clearAuthToken(): Promise<void> {
    await secureApiService.clearAuthToken();
  }
  
  // Add method to get default data for endpoints
  private getDefaultDataForEndpoint(url: string): any {
    if (url.includes('/api/auth/me')) {
      return {
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@example.com',
        isPremium: false,
      };
    }
    
    if (url && url.includes('/api/user/profile')) {
      return {
        totalMeals: 0,
        streakDays: 0,
        perfectDays: 0,
        favoriteFoods: [],
      };
    }

    if (url.includes('/api/user/settings')) {
      return {
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
        privacy: {
          shareAnalytics: true,
          storeImages: false,
        },
        goals: {
          calorieGoal: 2000,
          proteinGoal: 150,
          carbsGoal: 200,
          fatGoal: 65,
        },
      };
    }

    // Add more endpoint defaults as needed
    return null;
  }
}

// Create and export service instance
export const apiService = new ApiService();
export default apiService;