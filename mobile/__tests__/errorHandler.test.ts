import { ErrorHandler, ErrorType } from '../src/utils/errorHandler';

// Mock dependencies
jest.mock('../src/config', () => ({
  logError: jest.fn(),
  ENABLE_LOGGING: false,
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createError', () => {
    test('should create error with correct properties', () => {
      const error = ErrorHandler.createError('Test error', 'network', 'NETWORK_ERROR', { details: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('network');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.details).toEqual({ details: 'test' });
      expect(error.retryable).toBe(true); // Network errors are retryable
    });

    test('should set retryable based on error type', () => {
      const validationError = ErrorHandler.createError('Validation error', 'validation');
      expect(validationError.retryable).toBe(false);

      const serverError = ErrorHandler.createError('Server error', 'server');
      expect(serverError.retryable).toBe(true);
    });
  });

  describe('normalizeError', () => {
    test('should handle JSON parsing errors', () => {
      const jsonError = new SyntaxError('Unexpected end of JSON input');
      const normalized = ErrorHandler.normalizeError(jsonError);
      
      expect(normalized.type).toBe('jsonParse');
      expect(normalized.code).toBe('JSON_PARSE_ERROR');
      expect(normalized.details).toEqual({ originalError: jsonError.message });
    });

    test('should handle API errors', () => {
      const apiError = {
        message: 'API error',
        status: 404,
        code: 'NOT_FOUND',
        details: { field: 'id' }
      };
      const normalized = ErrorHandler.normalizeError(apiError);
      
      expect(normalized.type).toBe('validation'); // 404 maps to validation
      expect(normalized.code).toBe('NOT_FOUND');
      expect(normalized.details).toEqual({ field: 'id' });
    });

    test('should handle network errors', () => {
      const networkError = new Error('Network error') as any;
      networkError.code = 'NETWORK_ERROR';
      const normalized = ErrorHandler.normalizeError(networkError);
      
      expect(normalized.type).toBe('network');
      expect(normalized.code).toBe('NETWORK_ERROR');
    });

    test('should handle validation errors', () => {
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      const normalized = ErrorHandler.normalizeError(validationError);
      
      expect(normalized.type).toBe('validation');
      expect(normalized.code).toBe('VALIDATION_ERROR');
    });

    test('should handle permission errors', () => {
      const permissionError = new Error('Permission denied') as any;
      permissionError.code = 'E_PERMISSION_DENIED';
      const normalized = ErrorHandler.normalizeError(permissionError);
      
      expect(normalized.type).toBe('permission');
      expect(normalized.code).toBe('PERMISSION_DENIED');
    });

    test('should handle camera errors', () => {
      const cameraError = new Error('Camera unavailable') as any;
      cameraError.code = 'E_CAMERA_UNAVAILABLE';
      const normalized = ErrorHandler.normalizeError(cameraError);
      
      expect(normalized.type).toBe('permission');
      expect(normalized.code).toBe('E_CAMERA_UNAVAILABLE');
    });

    test('should handle unknown errors', () => {
      const unknownError = new Error('Unknown error');
      const normalized = ErrorHandler.normalizeError(unknownError);
      
      expect(normalized.type).toBe('unknown');
      expect(normalized.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('handleError', () => {
    test('should log error and show toast', () => {
      const error = new Error('Test error');
      const spyLog = require('../src/config').logError;
      
      ErrorHandler.handleError(error, 'test context');
      
      expect(spyLog).toHaveBeenCalledWith('Error in test context:', expect.any(Object));
      require('react-native-toast-message').show.mock.calls.forEach(([config]) => {
        expect(config.type).toBe('error');
      });
    });

    test('should not report to crashlytics for validation errors when logging is disabled', () => {
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      
      // Mock the reportToCrashlytics method to track calls
      (ErrorHandler as any).reportToCrashlytics = jest.fn();
      
      ErrorHandler.handleError(validationError, 'test context');
      
      expect((ErrorHandler as any).reportToCrashlytics).not.toHaveBeenCalled();
    });

    test('should report to crashlytics for non-validation errors when logging is disabled', () => {
      const error = new Error('Test error');
      
      // Mock the reportToCrashlytics method to track calls
      (ErrorHandler as any).reportToCrashlytics = jest.fn();
      
      ErrorHandler.handleError(error, 'test context');
      
      expect((ErrorHandler as any).reportToCrashlytics).toHaveBeenCalledWith(expect.any(Error), 'test context');
    });
  });

  describe('showErrorToast', () => {
    test('should show network error toast', () => {
      const networkError = ErrorHandler.createError('Network error', 'network');
      (ErrorHandler as any).showErrorToast(networkError);
      
      expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Connection Problem',
        text2: 'Network error',
        position: 'bottom',
      });
    });

    test('should show validation error toast', () => {
      const validationError = ErrorHandler.createError('Validation error', 'validation');
      (ErrorHandler as any).showErrorToast(validationError);
      
      expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Please Check Your Input',
        text2: 'Validation error',
        position: 'top',
      });
    });

    test('should show authentication error toast', () => {
      const authError = ErrorHandler.createError('Auth error', 'authentication');
      (ErrorHandler as any).showErrorToast(authError);
      
      expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please log in to continue',
        position: 'top',
      });
    });

    test('should show permission error toast', () => {
      const permissionError = ErrorHandler.createError('Permission error', 'permission');
      (ErrorHandler as any).showErrorToast(permissionError);
      
      expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Permission Required',
        text2: 'Permission error',
        position: 'top',
      });
    });

    test('should show server error toast', () => {
      const serverError = ErrorHandler.createError('Server error', 'server');
      (ErrorHandler as any).showErrorToast(serverError);
      
      expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Server Error',
        text2: 'We\'re working to fix this. Please try again later.',
        position: 'bottom',
      });
    });

    test('should show JSON parse error toast', () => {
      const jsonError = ErrorHandler.createError('JSON parse error', 'jsonParse');
      (ErrorHandler as any).showErrorToast(jsonError);
      
      expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Data Loading Issue',
        text2: 'Unable to load data. Using cached information.',
        position: 'bottom',
      });
    });

    test('should show default error toast', () => {
      const unknownError = ErrorHandler.createError('Unknown error', 'unknown');
      (ErrorHandler as any).showErrorToast(unknownError);
      
      expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Unknown error',
        position: 'bottom',
      });
    });
  });

  describe('handleAsyncOperation', () => {
    test('should handle async operation errors', async () => {
      const failingOperation = () => Promise.reject(new Error('Test error'));
      const spyHandleError = jest.spyOn(ErrorHandler, 'handleError');
      
      await expect(ErrorHandler.handleAsyncOperation(failingOperation, 'test context')).rejects.toThrow('Test error');
      expect(spyHandleError).toHaveBeenCalledWith(new Error('Test error'), 'test context');
    });

    test('should handle successful async operation', async () => {
      const successfulOperation = () => Promise.resolve('success');
      const spyHandleError = jest.spyOn(ErrorHandler, 'handleError');
      
      const result = await ErrorHandler.handleAsyncOperation(successfulOperation, 'test context');
      expect(result).toBe('success');
      expect(spyHandleError).not.toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    test('should handle permission error', () => {
      const permissionError = ErrorHandler.handlePermissionError('camera');
      
      expect(permissionError.type).toBe('permission');
      expect(permissionError.code).toBe('PERMISSION_REQUIRED');
      expect(permissionError.details).toEqual({ permission: 'camera' });
      expect(permissionError.message).toContain('camera permission is required');
    });

    test('should handle validation error', () => {
      const validationError = ErrorHandler.handleValidationError('email', 'Invalid email');
      
      expect(validationError.type).toBe('validation');
      expect(validationError.code).toBe('FIELD_VALIDATION_ERROR');
      expect(validationError.details).toEqual({ field: 'email' });
      expect(validationError.message).toBe('Invalid email');
    });

    test('should handle network error', () => {
      const networkError = ErrorHandler.handleNetworkError();
      
      expect(networkError.type).toBe('network');
      expect(networkError.code).toBe('NETWORK_ERROR');
      expect(networkError.message).toContain('Unable to connect to the server');
    });
  });
});