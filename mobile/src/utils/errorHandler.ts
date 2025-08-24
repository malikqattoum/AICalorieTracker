import Toast from 'react-native-toast-message';
import { logError, ENABLE_LOGGING } from '../config';
import { ApiError } from '../services/apiService';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export type ErrorType =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'permission'
  | 'server'
  | 'jsonParse'
  | 'unknown';

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  details?: any;
  retryable?: boolean;
}

/**
 * Comprehensive error handling utility for mobile applications
 *
 * Features:
 * - Error classification and normalization
 * - User-friendly error messaging
 * - Crash reporting integration
 * - Automatic error logging
 * - Async operation wrappers
 */
export class ErrorHandler {
  /**
   * Type guard to check if value is a proper object
   */
  private static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  /**
   * Safely extracts error message from unknown error type
   */
  private static getErrorMessage(error: unknown): string {
    if (this.isObject(error) && typeof error.message === 'string') {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
  static createError(
    message: string,
    type: ErrorType,
    code?: string,
    details?: any
  ): AppError {
    const error = new Error(message) as AppError;
    error.type = type;
    error.code = code;
    error.details = details;
    error.retryable = this.isRetryableError(type);
    
    return error;
  }

  /**
   * Main error handling method that coordinates logging, user feedback, and crash reporting
   *
   * @param error - The raw error object
   * @param context - Additional context about where the error occurred
   */
  static async handleError(error: unknown, context?: string): Promise<void> {
    const appError = await this.normalizeError(error);
    
    logError(`Error in ${context || 'unknown context'}:`, {
      message: appError.message,
      type: appError.type,
      code: appError.code,
      stack: appError.stack,
      details: appError.details,
    });

    // Show user-friendly error message
    this.showErrorToast(appError);

    // Report to crash analytics (in production)
    if (!ENABLE_LOGGING && appError.type !== 'validation') {
      this.reportToCrashlytics(appError, context);
    }
  }

  /**
   * Normalizes various error types into standardized AppError format
   *
   * @param error - The raw error object
   * @returns Normalized AppError instance
   */
  static async normalizeError(error: unknown): Promise<AppError> {
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return this.createError(
        'Server returned invalid data. Please try again.',
        'jsonParse',
        'JSON_PARSE_ERROR',
        { originalError: error.message }
      );
    }

    // Handle API errors
    if (this.isApiError(error)) {
      return this.createError(
        error.message,
        this.mapApiErrorType(error.status),
        error.code,
        error.details
      );
    }

    // Handle network errors
    // Check network status using NetInfo first
    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) {
      return this.createError(
        'No internet connection. Please check your network and try again.',
        'network',
        'NETWORK_ERROR'
      );
    }

    // Use type-safe property access
    if (this.isObject(error) && error.code === 'NETWORK_ERROR') {
      return this.createError(
        'Unable to connect to the server. Please try again later.',
        'network',
        'SERVER_UNREACHABLE'
      );
    }

    // Handle validation errors
    if (this.isObject(error) && error.name === 'ValidationError') {
      return this.createError(
        this.getErrorMessage(error),
        'validation',
        'VALIDATION_ERROR',
        this.isObject(error) ? error.errors : undefined
      );
    }

    // Handle permission errors
    if (this.isObject(error)) {
      const message = typeof error.message === 'string' ? error.message : '';
      const code = typeof error.code === 'string' ? error.code : '';
      
      const hasPermissionMessage = message.includes('permission');
      const hasPermissionCode = code === 'E_PERMISSION_DENIED';
      
      if (hasPermissionMessage || hasPermissionCode) {
        return this.createError(
          'Permission denied. Please check your app permissions.',
          'permission',
          'PERMISSION_DENIED'
        );
      }
    }

    // Handle camera/media errors
    if (this.isObject(error) &&
        (error.code === 'E_CAMERA_UNAVAILABLE' || error.code === 'E_PICKER_CANCELLED')) {
      return this.createError(
        'Camera or photo library access was cancelled or is unavailable.',
        'permission',
        typeof error.code === 'string' ? error.code : 'UNKNOWN_CAMERA_ERROR'
      );
    }

    // Default case
    return this.createError(
      this.getErrorMessage(error),
      'unknown',
      this.isObject(error) && typeof error.code === 'string' ? error.code : undefined,
      error
    );
  }

  /**
   * Type guard for API errors
   */
  private static isApiError(error: unknown): error is ApiError {
    return this.isObject(error) &&
           'status' in error &&
           typeof error.status === 'number' &&
           'message' in error &&
           typeof error.message === 'string';
  }

  private static mapApiErrorType(status?: number): ErrorType {
    if (!status) return 'network';
    
    if (status === 401 || status === 403) return 'authentication';
    if (status >= 400 && status < 500) return 'validation';
    if (status >= 500) return 'server';
    
    return 'unknown';
  }

  private static isRetryableError(type: ErrorType): boolean {
    return ['network', 'server'].includes(type);
  }

  private static showErrorToast(error: AppError): void {
    const getToastConfig = (error: AppError) => {
      switch (error.type) {
        case 'network':
          return {
            type: 'error' as const,
            text1: 'Connection Problem',
            text2: error.message,
            position: 'bottom' as const,
          };
        
        case 'validation':
          return {
            type: 'info' as const,
            text1: 'Please Check Your Input',
            text2: error.message,
            position: 'top' as const,
          };
        
        case 'authentication':
          return {
            type: 'error' as const,
            text1: 'Authentication Required',
            text2: 'Please log in to continue',
            position: 'top' as const,
          };
        
        case 'permission':
          return {
            type: 'info' as const,
            text1: 'Permission Required',
            text2: error.message,
            position: 'top' as const,
          };
        
        case 'server':
          return {
            type: 'error' as const,
            text1: 'Server Error',
            text2: 'We\'re working to fix this. Please try again later.',
            position: 'bottom' as const,
          };
        
        case 'jsonParse':
          return {
            type: 'info' as const,
            text1: 'Data Loading Issue',
            text2: 'Unable to load data. Using cached information.',
            position: 'bottom' as const,
          };
        
        default:
          return {
            type: 'error' as const,
            text1: 'Something went wrong',
            text2: error.message,
            position: 'bottom' as const,
          };
      }
    };

    Toast.show(getToastConfig(error));
  }

  /**
   * Reports error to crash analytics service
   */
  private static reportToCrashlytics(error: AppError, context?: string): void {
    try {
      // Firebase Crashlytics integration
      const crashlytics = require('@react-native-firebase/crashlytics');
      
      // Record error with stack trace
      crashlytics().recordError(new Error(error.message), {
        type: error.type,
        code: error.code || 'unknown',
        context: context || 'unknown',
      });

      // Set custom attributes
      crashlytics().setAttributes({
        errorType: error.type,
        errorCode: error.code || 'unknown',
        context: context || 'unknown',
        retryable: String(error.retryable),
      });

      // Log custom error message
      crashlytics().log(`Error: ${error.message} [${context || 'no context'}]`);
    } catch (crashlyticsError) {
      logError('Failed to report to Crashlytics:', crashlyticsError);
    }
  }

  // Utility methods for common error scenarios
  /**
   * Wrapper for async operations that automatically handles errors
   *
   * @param operation - Async function to execute
   * @param context - Context for error reporting
   * @returns Promise with error handling
   */
  static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      throw error; // Re-throw for component handling
    }
  }

  static handlePermissionError(permission: string): AppError {
    return this.createError(
      `${permission} permission is required for this feature. Please enable it in your device settings.`,
      'permission',
      'PERMISSION_REQUIRED',
      { permission }
    );
  }

  static handleValidationError(field: string, message: string): AppError {
    return this.createError(
      message,
      'validation',
      'FIELD_VALIDATION_ERROR',
      { field }
    );
  }

  static handleNetworkError(): AppError {
    return this.createError(
      'Unable to connect to the server. Please check your internet connection and try again.',
      'network',
      'NETWORK_ERROR'
    );
  }
}

// Global error boundary helper
/**
 * Higher-order function that wraps any function with error handling
 *
 * @param fn - The function to wrap
 * @param context - Context for error reporting
 * @returns Wrapped function with error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions and promises
      if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
        return result.catch(async (error: unknown) => {
          await ErrorHandler.handleError(error, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      ErrorHandler.handleError(error, context);
      throw error;
    }
  }) as T;
};

export default ErrorHandler;