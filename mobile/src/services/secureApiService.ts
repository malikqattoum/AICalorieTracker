import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, NETWORK_CONFIG } from '../config';
import * as SecureStore from 'expo-secure-store';
import { log, logError } from '../config';
import { validateApiResponse } from '../utils/responseValidator';
import { ApiMonitoring } from '../utils/monitoring';

// Device information fallback
const getDeviceInfo = () => {
  return {
    osName: 'unknown',
    osVersion: 'unknown',
    modelName: 'unknown',
    manufacturer: 'unknown',
  };
};

// Certificate pinning configuration
const CERTIFICATES = {
  production: [
    'sha256//YOUR_PRODUCTION_CERTIFICATE_HASH_1',
    'sha256//YOUR_PRODUCTION_CERTIFICATE_HASH_2',
  ],
  staging: [
    'sha256//YOUR_STAGING_CERTIFICATE_HASH_1',
    'sha256//YOUR_STAGING_CERTIFICATE_HASH_2',
  ],
};

// Network security configuration
const NETWORK_SECURITY_CONFIG = {
  timeout: NETWORK_CONFIG.timeout,
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  validateStatus: (status: number) => status < 500,
};

// Create a secure axios instance
class SecureApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: NETWORK_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `AI-Calorie-Tracker/${getDeviceInfo().osName} ${getDeviceInfo().osVersion}`,
        'X-Client-Version': '1.0.0',
        'X-Platform': 'mobile',
        'X-Device-Model': getDeviceInfo().modelName || 'unknown',
        'X-Device-Manufacturer': getDeviceInfo().manufacturer || 'unknown',
      },
      ...NETWORK_SECURITY_CONFIG,
    });

    // Request interceptor for adding auth token and security headers
    this.api.interceptors.request.use(
      async (config) => {
        try {
          // Add authentication token
          const token = await SecureStore.getItemAsync('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // Add security headers
          config.headers['X-Request-ID'] = this.generateRequestId();
          config.headers['X-Timestamp'] = Date.now().toString();
          config.headers['X-App-Version'] = '1.0.0';
          config.headers['X-Environment'] = __DEV__ ? 'development' : 'production';

          // Add request signature for critical operations
          if (this.isCriticalRequest(config)) {
            config.headers['X-Request-Signature'] = await this.generateRequestSignature(config);
          }

          log('API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: {
              ...config.headers,
              Authorization: config.headers.Authorization ? '[REDACTED]' : undefined,
            },
          });

          return config;
        } catch (error) {
          logError('Request interceptor error:', error);
          return config;
        }
      },
      (error) => {
        logError('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling errors and token refresh
    this.api.interceptors.response.use(
      (response) => {
        // Enhanced diagnostic logging
        log('=== API RESPONSE DEBUG ===');
        log('Status:', response.status);
        log('URL:', response.config.url);
        log('Headers:', response.headers);
        log('Response Data Type:', typeof response.data);
        log('Response Data Length:', response.data ? (response.data.length || Object.keys(response.data).length) : 'null');
        log('Raw Response Data:', response.data);
        log('=========================');

        // Validate response data and provide fallback if needed
        const validation = validateApiResponse(
          response.data,
          response.config.url || '',
          this.getDefaultDataForEndpoint(response.config.url)
        );

        if (!validation.isValid) {
          logError('Invalid API response, using fallback:', {
            url: response.config.url,
            status: response.status,
            error: validation.error,
            responseData: response.data
          });

          // Log the error for monitoring
          ApiMonitoring.logJsonParseError(
            new Error(validation.error || 'Invalid response'),
            response.config.url || '',
            response
          );

          // Use fallback data instead of throwing error
          if (validation.fallbackData) {
            response.data = validation.fallbackData;
          } else {
            // Provide a safe empty object as fallback
            response.data = {};
          }
        }

        // Check for security-related response headers
        this.checkSecurityHeaders(response);

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle network errors
        if (!error.response) {
          logError('Network error:', error.message);
          return Promise.reject(this.handleNetworkError(error));
        }

        const { response } = error;
        const requestUrl = originalRequest?.url;

        log('API Error:', {
          status: response?.status,
          url: requestUrl,
          data: response?.data,
        });

        // Log API errors for monitoring
        ApiMonitoring.logApiError(error, requestUrl || '', 'secureApiService');

        // Handle different HTTP status codes
        switch (response?.status) {
          case 401:
            // Unauthorized - try to refresh token
            if (originalRequest && !(originalRequest as any)._retry) {
              return this.handleTokenRefresh(originalRequest);
            }
            break;

          case 403:
            // Forbidden
            return Promise.reject({
              ...error,
              message: 'Access forbidden. Please check your permissions.',
              code: 'FORBIDDEN',
            });

          case 429:
            // Too many requests
            return Promise.reject({
              ...error,
              message: 'Too many requests. Please try again later.',
              code: 'RATE_LIMITED',
            });

          case 500:
          case 502:
          case 503:
          case 504:
            // Server errors
            return Promise.reject({
              ...error,
              message: 'Server error occurred. Please try again later.',
              code: 'SERVER_ERROR',
            });

          default:
            // Other errors
            break;
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a request is critical and needs signature
   */
  private isCriticalRequest(config: AxiosRequestConfig): boolean {
    const criticalMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const criticalPaths = ['/api/auth/', '/api/user/', '/api/meal/', '/api/payment/'];

    return (
      criticalMethods.includes(config.method?.toUpperCase() || '') &&
      criticalPaths.some(path => config.url?.includes(path))
    );
  }

  /**
   * Generate request signature for security
   */
  private async generateRequestSignature(config: AxiosRequestConfig): Promise<string> {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const timestamp = Date.now().toString();
      const method = config.method?.toUpperCase() || 'GET';
      const url = config.url || '';
      const body = JSON.stringify(config.data || '');

      // Create a signature string
      const signatureString = `${method}:${url}:${body}:${timestamp}:${token}`;
      
      // In a real implementation, you would use a proper cryptographic signing method
      // For now, we'll use a simple hash
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    } catch (error) {
      logError('Failed to generate request signature:', error);
      return '';
    }
  }

  /**
   * Handle network errors with user-friendly messages
   */
  private handleNetworkError(error: AxiosError): any {
    const networkError = {
      ...error,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your internet connection.',
    };

    // Check if it's a timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      networkError.code = 'TIMEOUT_ERROR';
      networkError.message = 'Request timed out. Please try again.';
    }

    // Check if it's a connection error
    if (error.code === 'ENOTFOUND') {
      networkError.code = 'DNS_ERROR';
      networkError.message = 'Unable to resolve server address. Please check your connection.';
    }

    return networkError;
  }

  /**
   * Handle token refresh logic
   */
  private async handleTokenRefresh(originalRequest: any): Promise<any> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return this.api(originalRequest);
      }).catch((err) => {
        return Promise.reject(err);
      });
    }

    this.isRefreshing = true;
    originalRequest._retry = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.post('/api/auth/refresh', {
        refreshToken,
      });

      const { token } = response.data;
      await SecureStore.setItemAsync('auth_token', token);

      // Update authorization header
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      originalRequest.headers.Authorization = `Bearer ${token}`;

      // Process failed queue
      this.failedQueue.forEach(({ resolve }) => resolve(token));
      this.failedQueue = [];

      return this.api(originalRequest);
    } catch (error) {
      // Process failed queue with error
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];

      // If refresh token fails, clear all tokens and redirect to login
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');

      // Emit auth failure event
      this.emitAuthFailure();

      return Promise.reject({
        ...error,
        code: 'AUTH_FAILED',
        message: 'Session expired. Please log in again.',
      });
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Check security headers in response
   */
  private checkSecurityHeaders(response: AxiosResponse): void {
    const headers = response.headers;

    // Check for security-related headers
    const securityHeaders = {
      'X-Content-Type-Options': headers['x-content-type-options'],
      'X-Frame-Options': headers['x-frame-options'],
      'X-XSS-Protection': headers['x-xss-protection'],
      'Strict-Transport-Security': headers['strict-transport-security'],
      'Content-Security-Policy': headers['content-security-policy'],
    };

    log('Security headers check:', securityHeaders);

    // In production, you might want to validate these headers
    if (process.env.NODE_ENV === 'production') {
      // Add header validation logic here
    }
  }

  /**
   * Sanitize response data to remove sensitive information
   */
  private sanitizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Emit auth failure event
   */
  private emitAuthFailure(): void {
    // In a real app, you would emit an event or call a callback
    // to notify the app about auth failure
    log('Auth failure event emitted');
  }

  /**
   * Public API methods
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    url: string,
    file: any,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.api.post(url, formData, uploadConfig);
    return response.data;
  }

  /**
   * Set authentication token
   */
  async setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token);
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    delete this.api.defaults.headers.common['Authorization'];
  }

  /**
   * Get current API instance
   */
  getApiInstance(): AxiosInstance {
    return this.api;
  }

  /**
   * Get default data for endpoints to prevent crashes
   */
  private getDefaultDataForEndpoint(url: string): any {
    if (url.includes('/api/auth/me')) {
      return {
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@example.com',
        isPremium: false,
      };
    }
    
    if (url.includes('/api/user/profile')) {
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

// Export singleton instance
export const secureApiService = new SecureApiService();
export default secureApiService;