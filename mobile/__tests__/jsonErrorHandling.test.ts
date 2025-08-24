import { validateApiResponse } from '../src/utils/responseValidator';
import { ApiMonitoring } from '../src/utils/monitoring';

// Mock the logError function
jest.mock('../src/config', () => ({
  logError: jest.fn(),
}));

describe('JSON Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ApiMonitoring.resetErrorCounts();
  });

  test('should handle empty string response gracefully', () => {
    const emptyString = '';
    const result = validateApiResponse(emptyString, '/api/user/profile');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty string');
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle null response gracefully', () => {
    const nullResponse = null;
    const result = validateApiResponse(nullResponse, '/api/user/profile');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('null or undefined');
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle undefined response gracefully', () => {
    const undefinedResponse = undefined;
    const result = validateApiResponse(undefinedResponse, '/api/user/profile');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('null or undefined');
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle invalid JSON string gracefully', () => {
    const invalidJson = '{"name": "test", "age": 30'; // Missing closing brace
    const result = validateApiResponse(invalidJson, '/api/user/profile');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid JSON');
    expect(result.fallbackData).toBeUndefined();
  });

  test('should provide fallback data when specified', () => {
    const fallbackData = { name: 'fallback', age: 25 };
    const emptyString = '';
    const result = validateApiResponse(emptyString, '/api/user/profile', fallbackData);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty string');
    expect(result.fallbackData).toEqual(fallbackData);
  });

  test('should log JSON parse errors correctly', () => {
    const error = new Error('Unexpected end of JSON input');
    const response = { status: 200, data: '' };
    const endpoint = '/api/user/profile';

    ApiMonitoring.logJsonParseError(error, endpoint, response);

    expect(require('../src/config').logError).toHaveBeenCalledWith('JSON Parse Error:', {
      endpoint,
      error: error.message,
      response: {
        status: 200,
        dataType: 'object',
        dataSize: 16,
        isEmpty: true,
      },
      count: 1,
      timestamp: expect.any(String),
    });
  });

  test('should handle valid JSON responses correctly', () => {
    const validJson = '{"name": "John", "age": 30}';
    const result = validateApiResponse(validJson, '/api/user/profile');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle valid JSON object responses correctly', () => {
    const validObject = { name: 'John', age: 30 };
    const result = validateApiResponse(validObject, '/api/user/profile');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle array responses correctly', () => {
    const arrayResponse = [1, 2, 3, 'test', { name: 'John' }];
    const result = validateApiResponse(arrayResponse, '/api/user/profile');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle empty array responses correctly', () => {
    const emptyArrayResponse = [];
    const result = validateApiResponse(emptyArrayResponse, '/api/user/profile');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle boolean responses correctly', () => {
    const booleanResponse = true;
    const result = validateApiResponse(booleanResponse, '/api/user/profile');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle number responses correctly', () => {
    const numberResponse = 42;
    const result = validateApiResponse(numberResponse, '/api/user/profile');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle whitespace-only string responses correctly', () => {
    const whitespaceString = '   ';
    const result = validateApiResponse(whitespaceString, '/api/user/profile');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty string');
    expect(result.fallbackData).toBeUndefined();
  });

  test('should handle empty object responses correctly', () => {
    const emptyObject = {};
    const result = validateApiResponse(emptyObject, '/api/user/profile');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty object');
    expect(result.fallbackData).toBeUndefined();
  });
});