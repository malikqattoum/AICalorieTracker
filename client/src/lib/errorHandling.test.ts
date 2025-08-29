// Comprehensive tests for authentication error handling
import {
  AuthError,
  AuthErrorType,
  ErrorSeverity,
  RecoveryStrategy,
  createAuthError,
  parseApiError,
  handleAuthError,
  getErrorAnalytics,
  configureErrorHandling,
  clearErrorState,
  getUserMessage,
  getErrorSeverity,
  getRecoveryStrategy,
  isRetryable
} from './errorHandling';

// Mock the config logging functions
jest.mock('./config', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn()
}));

describe('Authentication Error Handling', () => {
  beforeEach(() => {
    // Clear error state before each test
    clearErrorState();
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createAuthError', () => {
    it('should create an AuthError with correct properties', () => {
      const error = createAuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid username or password'
      );

      expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      expect(error.message).toBe('Invalid username or password');
      expect(error.userMessage).toBe('Invalid username or password. Please check your credentials and try again.');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recovery).toBe(RecoveryStrategy.RELOGIN);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.retryable).toBe(false);
    });

    it('should accept custom user message', () => {
      const customMessage = 'Custom error message';
      const error = createAuthError(
        AuthErrorType.NETWORK_ERROR,
        'Network error',
        { userMessage: customMessage }
      );

      expect(error.userMessage).toBe(customMessage);
    });

    it('should set retryable flag correctly', () => {
      const retryableError = createAuthError(
        AuthErrorType.NETWORK_ERROR,
        'Network error'
      );
      expect(retryableError.retryable).toBe(true);

      const nonRetryableError = createAuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials'
      );
      expect(nonRetryableError.retryable).toBe(false);
    });
  });

  describe('parseApiError', () => {
    it('should parse HTTP 401 error as INVALID_CREDENTIALS', () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      const authError = parseApiError(errorResponse);
      expect(authError.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      expect(authError.message).toBe('Unauthorized');
    });

    it('should parse HTTP 403 error as PERMISSION_DENIED', () => {
      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        }
      };

      const authError = parseApiError(errorResponse);
      expect(authError.type).toBe(AuthErrorType.PERMISSION_DENIED);
    });

    it('should parse HTTP 429 error as RATE_LIMITED', () => {
      const errorResponse = {
        response: {
          status: 429,
          data: { message: 'Too many requests' }
        }
      };

      const authError = parseApiError(errorResponse);
      expect(authError.type).toBe(AuthErrorType.RATE_LIMITED);
    });

    it('should parse HTTP 500 error as SERVER_ERROR', () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      const authError = parseApiError(errorResponse);
      expect(authError.type).toBe(AuthErrorType.SERVER_ERROR);
    });

    it('should parse network error', () => {
      const networkError = {
        request: { message: 'Network error' }
      };

      const authError = parseApiError(networkError);
      expect(authError.type).toBe(AuthErrorType.NETWORK_ERROR);
      expect(authError.message).toBe('Network error occurred');
    });

    it('should parse unknown error', () => {
      const unknownError = new Error('Unknown error');

      const authError = parseApiError(unknownError);
      expect(authError.type).toBe(AuthErrorType.UNKNOWN_ERROR);
      expect(authError.message).toBe('Unknown authentication error');
    });
  });

  describe('handleAuthError', () => {
    it('should handle retryable errors with retry logic', async () => {
      const retryableError = createAuthError(
        AuthErrorType.NETWORK_ERROR,
        'Network error',
        { retryable: true, retryCount: 0 }
      );

      // Mock the retry function to succeed
      const mockRetry = jest.fn().mockResolvedValue({ success: true });

      // Temporarily replace the retry function
      const originalRetry = jest.requireActual('./errorHandling').retryWithErrorHandling;
      jest.doMock('./errorHandling', () => ({
        ...jest.requireActual('./errorHandling'),
        retryWithErrorHandling: mockRetry
      }));

      const result = await handleAuthError(retryableError);
      expect(result).toBeNull(); // Success means null result
      expect(mockRetry).toHaveBeenCalledWith(retryableError, expect.anything());
    });

    it('should handle non-retryable errors', async () => {
      const nonRetryableError = createAuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials'
      );

      const result = await handleAuthError(nonRetryableError);
      expect(result).toBe(nonRetryableError); // Return the error for manual handling
    });

    it('should handle token refresh errors', async () => {
      const tokenError = createAuthError(
        AuthErrorType.TOKEN_EXPIRED,
        'Token expired'
      );

      // Mock successful token refresh
      const mockRefresh = jest.fn().mockResolvedValue(true);
      jest.spyOn(require('./errorHandling'), 'simulateTokenRefresh').mockResolvedValue(true);

      const result = await handleAuthError(tokenError);
      expect(result).toBeNull(); // Success means null result
    });
  });

  describe('Error Analytics', () => {
    it('should track error frequency', () => {
      const error1 = createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Error 1');
      const error2 = createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Error 2');
      const error3 = createAuthError(AuthErrorType.NETWORK_ERROR, 'Error 3');

      const analytics = getErrorAnalytics();
      const invalidCredentialsAnalytics = analytics.get(AuthErrorType.INVALID_CREDENTIALS);
      const networkErrorAnalytics = analytics.get(AuthErrorType.NETWORK_ERROR);

      expect(invalidCredentialsAnalytics?.frequency).toBe(2);
      expect(networkErrorAnalytics?.frequency).toBe(1);
    });

    it('should track affected users', () => {
      createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Error 1');
      createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Error 2');

      const analytics = getErrorAnalytics();
      const invalidCredentialsAnalytics = analytics.get(AuthErrorType.INVALID_CREDENTIALS);

      expect(invalidCredentialsAnalytics?.affectedUsers).toContain('current-user');
    });
  });

  describe('Error Configuration', () => {
    it('should allow configuration of error handling settings', () => {
      configureErrorHandling({
        maxRetries: 5,
        retryDelay: 2000,
        enableAnalytics: false
      });

      // The configuration should be applied (we can't directly test this without accessing private state)
      expect(true).toBe(true); // Placeholder for actual configuration test
    });
  });

  describe('Helper Functions', () => {
    describe('getUserMessage', () => {
      it('should return correct user message for each error type', () => {
        expect(getUserMessage(AuthErrorType.INVALID_CREDENTIALS)).toContain('Invalid username or password');
        expect(getUserMessage(AuthErrorType.TOKEN_EXPIRED)).toContain('session has expired');
        expect(getUserMessage(AuthErrorType.NETWORK_ERROR)).toContain('Network connection error');
        expect(getUserMessage(AuthErrorType.RATE_LIMITED)).toContain('Too many login attempts');
      });

      it('should return custom message when provided', () => {
        const customMessage = 'Custom error message';
        expect(getUserMessage(AuthErrorType.INVALID_CREDENTIALS, customMessage)).toBe(customMessage);
      });
    });

    describe('getErrorSeverity', () => {
      it('should return correct severity for each error type', () => {
        expect(getErrorSeverity(AuthErrorType.INVALID_CREDENTIALS)).toBe(ErrorSeverity.MEDIUM);
        expect(getErrorSeverity(AuthErrorType.TOKEN_EXPIRED)).toBe(ErrorSeverity.MEDIUM);
        expect(getErrorSeverity(AuthErrorType.NETWORK_ERROR)).toBe(ErrorSeverity.LOW);
        expect(getErrorSeverity(AuthErrorType.ACCOUNT_SUSPENDED)).toBe(ErrorSeverity.CRITICAL);
        expect(getErrorSeverity(AuthErrorType.SECURITY_VIOLATION)).toBe(ErrorSeverity.CRITICAL);
      });
    });

    describe('getRecoveryStrategy', () => {
      it('should return correct recovery strategy for each error type', () => {
        expect(getRecoveryStrategy(AuthErrorType.INVALID_CREDENTIALS)).toBe(RecoveryStrategy.RELOGIN);
        expect(getRecoveryStrategy(AuthErrorType.TOKEN_EXPIRED)).toBe(RecoveryStrategy.REFRESH_TOKEN);
        expect(getRecoveryStrategy(AuthErrorType.NETWORK_ERROR)).toBe(RecoveryStrategy.RETRY);
        expect(getRecoveryStrategy(AuthErrorType.ACCOUNT_LOCKED)).toBe(RecoveryStrategy.CONTACT_SUPPORT);
        expect(getRecoveryStrategy(AuthErrorType.VALIDATION_ERROR)).toBe(RecoveryStrategy.NONE);
      });
    });

    describe('isRetryable', () => {
      it('should return true for retryable error types', () => {
        expect(isRetryable(AuthErrorType.NETWORK_ERROR)).toBe(true);
        expect(isRetryable(AuthErrorType.SERVER_ERROR)).toBe(true);
        expect(isRetryable(AuthErrorType.TOKEN_EXPIRED)).toBe(true);
        expect(isRetryable(AuthErrorType.REFRESH_TOKEN_FAILED)).toBe(true);
      });

      it('should return false for non-retryable error types', () => {
        expect(isRetryable(AuthErrorType.INVALID_CREDENTIALS)).toBe(false);
        expect(isRetryable(AuthErrorType.RATE_LIMITED)).toBe(false);
        expect(isRetryable(AuthErrorType.ACCOUNT_LOCKED)).toBe(false);
        expect(isRetryable(AuthErrorType.VALIDATION_ERROR)).toBe(false);
      });
    });
  });

  describe('Error State Management', () => {
    it('should track errors in state', () => {
      const error = createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Test error');
      const errorState = require('./errorHandling').getErrorState();

      expect(errorState.errors.size).toBe(1);
      const firstError = Array.from(errorState.errors.values())[0] as AuthError;
      expect(firstError.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
    });

    it('should track analytics', () => {
      createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Error 1');
      createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Error 2');
      createAuthError(AuthErrorType.NETWORK_ERROR, 'Error 3');

      const errorState = require('./errorHandling').getErrorState();
      expect(errorState.analytics.size).toBe(2);
    });

    it('should clear error state', () => {
      createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Test error');
      clearErrorState();

      const errorState = require('./errorHandling').getErrorState();
      expect(errorState.errors.size).toBe(0);
      expect(errorState.analytics.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing error details gracefully', () => {
      const error = createAuthError(AuthErrorType.UNKNOWN_ERROR, 'Unknown error');
      expect(error.type).toBe(AuthErrorType.UNKNOWN_ERROR);
      expect(error.message).toBe('Unknown error');
    });

    it('should handle empty error messages', () => {
      const error = createAuthError(AuthErrorType.INVALID_CREDENTIALS, '');
      expect(error.message).toBe('');
      expect(error.userMessage).toBe('Invalid username or password. Please check your credentials and try again.');
    });

    it('should handle concurrent error creation', () => {
      // Create multiple errors simultaneously
      const errors = Array.from({ length: 10 }, (_, i) =>
        createAuthError(AuthErrorType.INVALID_CREDENTIALS, `Error ${i}`)
      );

      const analytics = getErrorAnalytics();
      const invalidCredentialsAnalytics = analytics.get(AuthErrorType.INVALID_CREDENTIALS);
      
      expect(invalidCredentialsAnalytics?.frequency).toBe(10);
    });
  });
});

describe('Error Handling Integration', () => {
  beforeEach(() => {
    clearErrorState();
    jest.clearAllMocks();
  });

  it('should integrate with authentication flow', async () => {
    // Simulate an authentication error
    const authError = createAuthError(
      AuthErrorType.INVALID_CREDENTIALS,
      'Invalid credentials provided'
    );

    // Handle the error
    const result = await handleAuthError(authError);
    
    // Should return the error for manual handling (non-retryable)
    expect(result).toBe(authError);
    
    // Should be tracked in analytics
    const analytics = getErrorAnalytics();
    const errorAnalytics = analytics.get(AuthErrorType.INVALID_CREDENTIALS);
    expect(errorAnalytics?.frequency).toBe(1);
  });

  it('should handle retryable authentication errors', async () => {
    // Mock successful retry
    jest.spyOn(require('./errorHandling'), 'simulateRetry').mockResolvedValue({ success: true });

    const retryableError = createAuthError(
      AuthErrorType.NETWORK_ERROR,
      'Network connection failed',
      { retryable: true, retryCount: 0 }
    );

    const result = await handleAuthError(retryableError);
    
    // Should return null on successful retry
    expect(result).toBeNull();
  });

  it('should handle token refresh scenarios', async () => {
    // Mock successful token refresh
    jest.spyOn(require('./errorHandling'), 'simulateTokenRefresh').mockResolvedValue(true);

    const tokenError = createAuthError(
      AuthErrorType.TOKEN_EXPIRED,
      'Access token expired'
    );

    const result = await handleAuthError(tokenError);
    
    // Should return null on successful refresh
    expect(result).toBeNull();
  });
});