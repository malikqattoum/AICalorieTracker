import { ApiMonitoring } from '../src/utils/monitoring';

// Mock the logError function
jest.mock('../src/config', () => ({
  logError: jest.fn(),
}));

describe('ApiMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ApiMonitoring.resetErrorCounts();
  });

  describe('logJsonParseError', () => {
    test('should log JSON parse error with correct details', () => {
      const error = new Error('Unexpected end of JSON input');
      const response = { status: 200, data: '' };
      const endpoint = '/api/user/profile';

      ApiMonitoring.logJsonParseError(error, endpoint, response);

      expect(require('../src/config').logError).toHaveBeenCalledWith('JSON Parse Error:', {
        endpoint,
        error: error.message,
        response: {
          status: 200,
          dataType: 'string',
          dataSize: 0,
          isEmpty: true,
        },
        count: 1,
        timestamp: expect.any(String),
      });
    });

    test('should increment error count for same endpoint', () => {
      const error = new Error('JSON parse error');
      const response = { status: 200, data: '' };
      const endpoint = '/api/test';

      ApiMonitoring.logJsonParseError(error, endpoint, response);
      ApiMonitoring.logJsonParseError(error, endpoint, response);

      expect(require('../src/config').logError).toHaveBeenCalledTimes(2);
      // Check that the count increments
      const firstCall = require('../src/config').logError.mock.calls[0][1];
      const secondCall = require('../src/config').logError.mock.calls[1][1];
      expect(firstCall.count).toBe(1);
      expect(secondCall.count).toBe(2);
    });

    test('should send alert after 5 errors', () => {
      const error = new Error('JSON parse error');
      const response = { status: 200, data: '' };
      const endpoint = '/api/test';

      // Log 6 errors to trigger alert
      for (let i = 0; i < 6; i++) {
        ApiMonitoring.logJsonParseError(error, endpoint, response);
      }

      expect(require('../src/config').logError).toHaveBeenCalledTimes(7); // 6 logs + 1 alert
    });
  });

  describe('logApiError', () => {
    test('should log API error with correct details', () => {
      const error = new Error('Network error');
      const endpoint = '/api/auth/login';
      const context = 'login attempt';

      ApiMonitoring.logApiError(error, endpoint, context);

      expect(require('../src/config').logError).toHaveBeenCalledWith('API Error:', {
        endpoint,
        context,
        error: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
      });
    });

    test('should log API error without context', () => {
      const error = new Error('Server error');
      const endpoint = '/api/user/profile';

      ApiMonitoring.logApiError(error, endpoint);

      expect(require('../src/config').logError).toHaveBeenCalledWith('API Error:', {
        endpoint,
        context: undefined,
        error: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
      });
    });
  });

  describe('getErrorStats', () => {
    test('should return empty stats when no errors logged', () => {
      const stats = ApiMonitoring.getErrorStats();
      expect(stats).toEqual({});
    });

    test('should return error counts for logged errors', () => {
      const error = new Error('Test error');
      const response = { status: 200, data: '' };

      ApiMonitoring.logJsonParseError(error, '/api/test1', response);
      ApiMonitoring.logJsonParseError(error, '/api/test1', response);
      ApiMonitoring.logJsonParseError(error, '/api/test2', response);

      const stats = ApiMonitoring.getErrorStats();
      expect(stats).toEqual({
        '/api/test1_json_parse': 2,
        '/api/test2_json_parse': 1,
      });
    });
  });

  describe('resetErrorCounts', () => {
    test('should reset error counts to zero', () => {
      const error = new Error('Test error');
      const response = { status: 200, data: '' };

      ApiMonitoring.logJsonParseError(error, '/api/test', response);
      expect(ApiMonitoring.getErrorStats()).toEqual({
        '/api/test_json_parse': 1,
      });

      ApiMonitoring.resetErrorCounts();
      expect(ApiMonitoring.getErrorStats()).toEqual({});
    });
  });
});