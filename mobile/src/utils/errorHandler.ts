import Toast from 'react-native-toast-message';
import { logError, ENABLE_LOGGING } from '../config';
import { ApiError } from '../services/apiService';

export type ErrorType = 
  | 'network'
  | 'validation'
  | 'authentication'
  | 'permission'
  | 'server'
  | 'unknown';

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  details?: any;
  retryable?: boolean;
}

export class ErrorHandler {
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

  static handleError(error: any, context?: string): void {
    const appError = this.normalizeError(error);
    
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

  static normalizeError(error: any): AppError {
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
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return this.createError(
        'No internet connection. Please check your network and try again.',
        'network',
        'NETWORK_ERROR'
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return this.createError(
        error.message,
        'validation',
        'VALIDATION_ERROR',
        error.errors
      );
    }

    // Handle permission errors
    if (error.message?.includes('permission') || error.code === 'E_PERMISSION_DENIED') {
      return this.createError(
        'Permission denied. Please check your app permissions.',
        'permission',
        'PERMISSION_DENIED'
      );
    }

    // Handle camera/media errors
    if (error.code === 'E_CAMERA_UNAVAILABLE' || error.code === 'E_PICKER_CANCELLED') {
      return this.createError(
        'Camera or photo library access was cancelled or is unavailable.',
        'permission',
        error.code
      );
    }

    // Default case
    return this.createError(
      error.message || 'An unexpected error occurred',
      'unknown',
      error.code,
      error
    );
  }

  private static isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'status' in error;
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

  private static reportToCrashlytics(error: AppError, context?: string): void {
    // In a real app, you would integrate with Firebase Crashlytics or similar
    // Example:
    // crashlytics().recordError(error);
    // crashlytics().setAttributes({
    //   errorType: error.type,
    //   errorCode: error.code || 'unknown',
    //   context: context || 'unknown',
    // });
    
    logError('Error reported to analytics:', {
      message: error.message,
      type: error.type,
      context,
    });
  }

  // Utility methods for common error scenarios
  static handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return operation().catch(error => {
      this.handleError(error, context);
      throw error; // Re-throw for component handling
    });
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
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.catch === 'function') {
        return result.catch((error: any) => {
          ErrorHandler.handleError(error, context);
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