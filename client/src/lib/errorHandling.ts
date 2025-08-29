// Comprehensive error handling for authentication failures

import { logError, logInfo, logWarning } from './config';

// Authentication error types
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  REFRESH_TOKEN_FAILED = 'REFRESH_TOKEN_FAILED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error recovery strategies
export enum RecoveryStrategy {
  NONE = 'NONE',
  RETRY = 'RETRY',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  RELOGIN = 'RELOGIN',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  CLEAR_CACHE = 'CLEAR_CACHE'
}

// Authentication error interface
export interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  recovery: RecoveryStrategy;
  timestamp: Date;
  code?: string;
  details?: any;
  retryable?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

// Error analytics interface
export interface ErrorAnalytics {
  errorType: AuthErrorType;
  frequency: number;
  lastOccurrence: Date;
  affectedUsers: string[];
  commonPatterns?: string[];
}

// Error tracking state
interface ErrorState {
  errors: Map<string, AuthError>;
  analytics: Map<AuthErrorType, ErrorAnalytics>;
  recoveryAttempts: Map<string, number>;
}

// Global error state
const errorState: ErrorState = {
  errors: new Map(),
  analytics: new Map(),
  recoveryAttempts: new Map()
};

// Error configuration
interface ErrorConfig {
  maxRetries: number;
  retryDelay: number;
  retryBackoff: number;
  enableAnalytics: boolean;
  enableLogging: boolean;
  enableRecovery: boolean;
}

const defaultConfig: ErrorConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 2,
  enableAnalytics: true,
  enableLogging: true,
  enableRecovery: true
};

let config: ErrorConfig = { ...defaultConfig };

/**
 * Create a standardized authentication error
 */
export function createAuthError(
  type: AuthErrorType,
  message: string,
  options: Partial<AuthError> = {}
): AuthError {
  const error: AuthError = {
    type,
    message,
    userMessage: getUserMessage(type, options.userMessage),
    severity: getErrorSeverity(type),
    recovery: getRecoveryStrategy(type),
    timestamp: new Date(),
    retryable: isRetryable(type),
    retryCount: 0,
    retryDelay: config.retryDelay,
    ...options
  };

  // Update error state
  if (config.enableAnalytics) {
    updateErrorAnalytics(error);
  }

  // Log the error
  if (config.enableLogging) {
    logAuthError(error);
  }

  return error;
}

/**
 * Get user-friendly error message
 */
function getUserMessage(type: AuthErrorType, customMessage?: string): string {
  if (customMessage) return customMessage;

  const messages: Record<AuthErrorType, string> = {
    [AuthErrorType.INVALID_CREDENTIALS]: 'Invalid username or password. Please check your credentials and try again.',
    [AuthErrorType.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    [AuthErrorType.TOKEN_INVALID]: 'Invalid authentication token. Please log in again.',
    [AuthErrorType.NETWORK_ERROR]: 'Network connection error. Please check your internet connection and try again.',
    [AuthErrorType.RATE_LIMITED]: 'Too many login attempts. Please wait a few minutes before trying again.',
    [AuthErrorType.ACCOUNT_LOCKED]: 'Your account has been locked due to too many failed attempts. Please try again later or contact support.',
    [AuthErrorType.ACCOUNT_SUSPENDED]: 'Your account has been suspended. Please contact support for assistance.',
    [AuthErrorType.SESSION_EXPIRED]: 'Your session has expired. Please log in again to continue.',
    [AuthErrorType.REFRESH_TOKEN_FAILED]: 'Failed to refresh your session. Please log in again.',
    [AuthErrorType.TOKEN_REVOKED]: 'Your access has been revoked. Please log in again.',
    [AuthErrorType.SECURITY_VIOLATION]: 'Security violation detected. Your session has been terminated for your protection.',
    [AuthErrorType.SERVER_ERROR]: 'Server error occurred. Please try again later.',
    [AuthErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    [AuthErrorType.VALIDATION_ERROR]: 'Invalid input. Please check your information and try again.',
    [AuthErrorType.PERMISSION_DENIED]: 'You do not have permission to perform this action.'
  };

  return messages[type] || 'An authentication error occurred. Please try again.';
}

/**
 * Get error severity based on type
 */
function getErrorSeverity(type: AuthErrorType): ErrorSeverity {
  const severityMap: Record<AuthErrorType, ErrorSeverity> = {
    [AuthErrorType.INVALID_CREDENTIALS]: ErrorSeverity.MEDIUM,
    [AuthErrorType.TOKEN_EXPIRED]: ErrorSeverity.MEDIUM,
    [AuthErrorType.TOKEN_INVALID]: ErrorSeverity.HIGH,
    [AuthErrorType.NETWORK_ERROR]: ErrorSeverity.LOW,
    [AuthErrorType.RATE_LIMITED]: ErrorSeverity.MEDIUM,
    [AuthErrorType.ACCOUNT_LOCKED]: ErrorSeverity.HIGH,
    [AuthErrorType.ACCOUNT_SUSPENDED]: ErrorSeverity.CRITICAL,
    [AuthErrorType.SESSION_EXPIRED]: ErrorSeverity.MEDIUM,
    [AuthErrorType.REFRESH_TOKEN_FAILED]: ErrorSeverity.HIGH,
    [AuthErrorType.TOKEN_REVOKED]: ErrorSeverity.HIGH,
    [AuthErrorType.SECURITY_VIOLATION]: ErrorSeverity.CRITICAL,
    [AuthErrorType.SERVER_ERROR]: ErrorSeverity.HIGH,
    [AuthErrorType.UNKNOWN_ERROR]: ErrorSeverity.HIGH,
    [AuthErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
    [AuthErrorType.PERMISSION_DENIED]: ErrorSeverity.MEDIUM
  };

  return severityMap[type] || ErrorSeverity.MEDIUM;
}

/**
 * Get recovery strategy based on error type
 */
function getRecoveryStrategy(type: AuthErrorType): RecoveryStrategy {
  const strategyMap: Record<AuthErrorType, RecoveryStrategy> = {
    [AuthErrorType.INVALID_CREDENTIALS]: RecoveryStrategy.RELOGIN,
    [AuthErrorType.TOKEN_EXPIRED]: RecoveryStrategy.REFRESH_TOKEN,
    [AuthErrorType.TOKEN_INVALID]: RecoveryStrategy.RELOGIN,
    [AuthErrorType.NETWORK_ERROR]: RecoveryStrategy.RETRY,
    [AuthErrorType.RATE_LIMITED]: RecoveryStrategy.NONE,
    [AuthErrorType.ACCOUNT_LOCKED]: RecoveryStrategy.CONTACT_SUPPORT,
    [AuthErrorType.ACCOUNT_SUSPENDED]: RecoveryStrategy.CONTACT_SUPPORT,
    [AuthErrorType.SESSION_EXPIRED]: RecoveryStrategy.RELOGIN,
    [AuthErrorType.REFRESH_TOKEN_FAILED]: RecoveryStrategy.RELOGIN,
    [AuthErrorType.TOKEN_REVOKED]: RecoveryStrategy.RELOGIN,
    [AuthErrorType.SECURITY_VIOLATION]: RecoveryStrategy.CONTACT_SUPPORT,
    [AuthErrorType.SERVER_ERROR]: RecoveryStrategy.RETRY,
    [AuthErrorType.UNKNOWN_ERROR]: RecoveryStrategy.RETRY,
    [AuthErrorType.VALIDATION_ERROR]: RecoveryStrategy.NONE,
    [AuthErrorType.PERMISSION_DENIED]: RecoveryStrategy.NONE
  };

  return strategyMap[type] || RecoveryStrategy.NONE;
}

/**
 * Check if error is retryable
 */
function isRetryable(type: AuthErrorType): boolean {
  const retryableTypes = [
    AuthErrorType.NETWORK_ERROR,
    AuthErrorType.SERVER_ERROR,
    AuthErrorType.UNKNOWN_ERROR,
    AuthErrorType.TOKEN_EXPIRED,
    AuthErrorType.REFRESH_TOKEN_FAILED
  ];

  return retryableTypes.includes(type);
}

/**
 * Log authentication error
 */
function logAuthError(error: AuthError): void {
  const logData = {
    type: error.type,
    message: error.message,
    severity: error.severity,
    timestamp: error.timestamp.toISOString(),
    code: error.code,
    details: error.details,
    retryCount: error.retryCount
  };

  switch (error.severity) {
    case ErrorSeverity.LOW:
      logWarning(`Authentication warning: ${error.message}`, logData);
      break;
    case ErrorSeverity.MEDIUM:
      logWarning(`Authentication error: ${error.message}`, logData);
      break;
    case ErrorSeverity.HIGH:
      logError(`Authentication error: ${error.message}`, logData);
      break;
    case ErrorSeverity.CRITICAL:
      logError(`Critical authentication error: ${error.message}`, logData);
      break;
  }
}

/**
 * Update error analytics
 */
function updateErrorAnalytics(error: AuthError): void {
  const existing = errorState.analytics.get(error.type);
  
  if (existing) {
    existing.frequency++;
    existing.lastOccurrence = error.timestamp;
    if (!existing.affectedUsers.includes('current-user')) {
      existing.affectedUsers.push('current-user');
    }
  } else {
    errorState.analytics.set(error.type, {
      errorType: error.type,
      frequency: 1,
      lastOccurrence: error.timestamp,
      affectedUsers: ['current-user']
    });
  }
}

/**
 * Get error analytics
 */
export function getErrorAnalytics(): Map<AuthErrorType, ErrorAnalytics> {
  return new Map(errorState.analytics);
}

/**
 * Handle authentication error with recovery
 */
export async function handleAuthError(
  error: AuthError,
  context?: any
): Promise<AuthError | null> {
  const errorId = `${error.type}-${error.timestamp.getTime()}`;
  errorState.errors.set(errorId, error);

  // Check if we should retry
  if (error.retryable && error.retryCount! < config.maxRetries) {
    return await retryWithErrorHandling(error, context);
  }

  // Apply recovery strategy
  switch (error.recovery) {
    case RecoveryStrategy.RETRY:
      return await retryWithErrorHandling(error, context);
    
    case RecoveryStrategy.REFRESH_TOKEN:
      return await handleTokenRefresh(error, context);
    
    case RecoveryStrategy.RELOGIN:
      return await handleRelogin(error, context);
    
    case RecoveryStrategy.CLEAR_CACHE:
      return await handleCacheClear(error, context);
    
    case RecoveryStrategy.CONTACT_SUPPORT:
      return await handleContactSupport(error, context);
    
    default:
      return error;
  }
}

/**
 * Retry with error handling and backoff
 */
async function retryWithErrorHandling(
  error: AuthError,
  context?: any
): Promise<AuthError | null> {
  const errorId = `${error.type}-${error.timestamp.getTime()}`;
  const currentAttempt = errorState.recoveryAttempts.get(errorId) || 0;
  
  if (currentAttempt >= config.maxRetries) {
    return error;
  }

  errorState.recoveryAttempts.set(errorId, currentAttempt + 1);
  
  // Calculate delay with exponential backoff
  const delay = error.retryDelay! * Math.pow(config.retryBackoff, currentAttempt);
  
  logInfo(`Retrying authentication operation (attempt ${currentAttempt + 1}/${config.maxRetries}) after ${delay}ms`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Here you would typically retry the original operation
  // For now, we'll simulate a retry result
  const retryResult = await simulateRetry(error, context);
  
  if (retryResult.success) {
    logInfo('Authentication retry successful');
    errorState.recoveryAttempts.delete(errorId);
    return null;
  } else {
    const newError = {
      ...error,
      retryCount: currentAttempt + 1,
      retryDelay: delay * config.retryBackoff
    };
    
    errorState.errors.set(errorId, newError);
    return newError;
  }
}

/**
 * Handle token refresh
 */
async function handleTokenRefresh(
  error: AuthError,
  context?: any
): Promise<AuthError | null> {
  logInfo('Attempting token refresh due to authentication error');
  
  try {
    // This would integrate with your token refresh logic
    const refreshSuccess = await simulateTokenRefresh();
    
    if (refreshSuccess) {
      logInfo('Token refresh successful');
      return null;
    } else {
      return createAuthError(
        AuthErrorType.REFRESH_TOKEN_FAILED,
        'Token refresh failed',
        { details: context }
      );
    }
  } catch (refreshError) {
    logError('Token refresh failed with exception', refreshError);
    return createAuthError(
      AuthErrorType.REFRESH_TOKEN_FAILED,
      'Token refresh failed with exception',
      { details: refreshError }
    );
  }
}

/**
 * Handle relogin scenario
 */
async function handleRelogin(
  error: AuthError,
  context?: any
): Promise<AuthError | null> {
  logInfo('Authentication error requires relogin');
  
  // This would trigger the relogin flow
  // For now, we'll return the error to indicate relogin is needed
  return error;
}

/**
 * Handle cache clear scenario
 */
async function handleCacheClear(
  error: AuthError,
  context?: any
): Promise<AuthError | null> {
  logInfo('Clearing authentication cache due to error');
  
  try {
    // Clear any cached authentication data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('authState');
    }
    
    logInfo('Authentication cache cleared successfully');
    return null;
  } catch (clearError) {
    logError('Failed to clear authentication cache', clearError);
    return error;
  }
}

/**
 * Handle contact support scenario
 */
async function handleContactSupport(
  error: AuthError,
  context?: any
): Promise<AuthError | null> {
  logInfo('Authentication error requires contacting support');
  
  // This would trigger support contact flow
  // For now, we'll return the error to indicate support contact is needed
  return error;
}

/**
 * Simulate retry operation (for demonstration)
 */
async function simulateRetry(error: AuthError, context?: any): Promise<{ success: boolean }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate occasional success
  return { success: Math.random() > 0.5 };
}

/**
 * Simulate token refresh (for demonstration)
 */
async function simulateTokenRefresh(): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Simulate occasional success
  return Math.random() > 0.3;
}

/**
 * Parse error from API response
 */
export function parseApiError(error: any): AuthError {
  if (error.response) {
    // Handle HTTP errors
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return createAuthError(
          AuthErrorType.VALIDATION_ERROR,
          data.message || 'Invalid request data',
          { details: data }
        );
      case 401:
        return createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          data.message || 'Invalid authentication credentials',
          { details: data }
        );
      case 403:
        return createAuthError(
          AuthErrorType.PERMISSION_DENIED,
          data.message || 'Access denied',
          { details: data }
        );
      case 429:
        return createAuthError(
          AuthErrorType.RATE_LIMITED,
          data.message || 'Too many requests',
          { details: data }
        );
      case 419:
        return createAuthError(
          AuthErrorType.SESSION_EXPIRED,
          data.message || 'Session expired',
          { details: data }
        );
      case 500:
      case 502:
      case 503:
        return createAuthError(
          AuthErrorType.SERVER_ERROR,
          data.message || 'Server error',
          { details: data }
        );
      default:
        return createAuthError(
          AuthErrorType.UNKNOWN_ERROR,
          data.message || `HTTP error ${status}`,
          { details: data, code: `HTTP_${status}` }
        );
    }
  } else if (error.request) {
    // Handle network errors
    return createAuthError(
      AuthErrorType.NETWORK_ERROR,
      'Network error occurred',
      { details: error.message }
    );
  } else {
    // Handle other errors
    return createAuthError(
      AuthErrorType.UNKNOWN_ERROR,
      error.message || 'Unknown authentication error',
      { details: error }
    );
  }
}

/**
 * Configure error handling
 */
export function configureErrorHandling(newConfig: Partial<ErrorConfig>): void {
  config = { ...config, ...newConfig };
  logInfo('Error handling configuration updated', config);
}

/**
 * Get current error state
 */
export function getErrorState(): ErrorState {
  return {
    errors: new Map(errorState.errors),
    analytics: new Map(errorState.analytics),
    recoveryAttempts: new Map(errorState.recoveryAttempts)
  };
}

/**
 * Clear error state (useful for testing)
 */
export function clearErrorState(): void {
  errorState.errors.clear();
  errorState.analytics.clear();
  errorState.recoveryAttempts.clear();
  logInfo('Error state cleared');
}

// Export helper functions
export {
  getUserMessage,
  getErrorSeverity,
  getRecoveryStrategy,
  isRetryable
};
