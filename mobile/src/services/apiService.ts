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

// Create API instance
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: NETWORK_CONFIG.timeout,
  });

  // Request interceptor
  instance.interceptors.request.use(
    async (config: any) => {
      try {
        // Add auth token if required
        if (config.requiresAuth !== false) {
          const token = await SecureStore.getItemAsync(CACHE_KEYS.AUTH_TOKEN);
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request timestamp
        config.metadata = { startTime: Date.now() };
        
        log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      } catch (error) {
        logError('Request interceptor error:', error);
        return Promise.reject(error);
      }
    },
    (error) => {
      logError('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const duration = Date.now() - response.config.metadata?.startTime;
      log(`API Response: ${response.status} in ${duration}ms`);
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;
      
      // Handle token expiration
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = await SecureStore.getItemAsync(CACHE_KEYS.REFRESH_TOKEN);
          if (refreshToken) {
            const response = await instance.post('/api/auth/refresh-token', {
              refreshToken,
            });
            
            const { token } = response.data;
            await SecureStore.setItemAsync(CACHE_KEYS.AUTH_TOKEN, token);
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          await SecureStore.deleteItemAsync(CACHE_KEYS.AUTH_TOKEN);
          await SecureStore.deleteItemAsync(CACHE_KEYS.REFRESH_TOKEN);
          
          // Navigate to login (would need navigation ref)
          logError('Token refresh failed, user needs to login');
        }
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

const apiInstance = createApiInstance();

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
      const response = await retryRequest(() => apiInstance.request<T>(config));
      
      // Cache response if enabled
      if (config.cache && config.cacheKey && response.data) {
        await setCache(config.cacheKey, response.data, config.cacheDuration);
      }
      
      return {
        data: response.data,
        status: response.status,
        message: response.statusText,
      };
    } catch (error) {
      const apiError = handleApiError(error, config);
      
      // Try to return cached data as fallback
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
}

// Create and export service instance
export const apiService = new ApiService();
export default apiService;