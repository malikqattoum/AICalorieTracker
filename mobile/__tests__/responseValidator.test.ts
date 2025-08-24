import { validateApiResponse } from '../src/utils/responseValidator';
import { describe, test, expect } from '@jest/globals';

describe('Response Validator', () => {
  test('should validate valid JSON string', () => {
    const validJson = '{"name": "test"}';
    const result = validateApiResponse(validJson, '/api/test');
    expect(result.isValid).toBe(true);
  });

  test('should validate valid JSON object', () => {
    const validObject = { name: 'test' };
    const result = validateApiResponse(validObject, '/api/test');
    expect(result.isValid).toBe(true);
  });

  test('should detect empty string response', () => {
    const result = validateApiResponse('', '/api/test');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty string');
  });

  test('should detect null response', () => {
    const result = validateApiResponse(null, '/api/test');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('null or undefined');
  });

  test('should detect undefined response', () => {
    const result = validateApiResponse(undefined, '/api/test');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('null or undefined');
  });

  test('should detect empty object response', () => {
    const result = validateApiResponse({}, '/api/test');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty object');
  });

  test('should provide fallback data when specified', () => {
    const fallback = { name: 'fallback' };
    const result = validateApiResponse(null, '/api/test', fallback);
    expect(result.isValid).toBe(false);
    expect(result.fallbackData).toEqual(fallback);
  });

  test('should detect invalid JSON string', () => {
    const invalidJson = '{"name": "test"';
    const result = validateApiResponse(invalidJson, '/api/test');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });

  test('should handle whitespace-only string', () => {
    const whitespaceString = '   ';
    const result = validateApiResponse(whitespaceString, '/api/test');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty string');
  });

  test('should handle object with only whitespace values', () => {
    const whitespaceObject = { name: '   ' };
    const result = validateApiResponse(whitespaceObject, '/api/test');
    expect(result.isValid).toBe(true); // Object is not empty, even if values are whitespace
  });

  test('should handle array response', () => {
    const arrayResponse = [1, 2, 3];
    const result = validateApiResponse(arrayResponse, '/api/test');
    expect(result.isValid).toBe(true);
  });

  test('should handle empty array response', () => {
    const emptyArrayResponse = [];
    const result = validateApiResponse(emptyArrayResponse, '/api/test');
    expect(result.isValid).toBe(true); // Empty arrays are valid
  });

  test('should handle boolean response', () => {
    const booleanResponse = true;
    const result = validateApiResponse(booleanResponse, '/api/test');
    expect(result.isValid).toBe(true);
  });

  test('should handle number response', () => {
    const numberResponse = 42;
    const result = validateApiResponse(numberResponse, '/api/test');
    expect(result.isValid).toBe(true);
  });

  test('should handle string with valid JSON', () => {
    const jsonString = '{"user": "John", "age": 30}';
    const result = validateApiResponse(jsonString, '/api/user');
    expect(result.isValid).toBe(true);
  });

  test('should handle string with invalid JSON', () => {
    const invalidJsonString = '{"user": "John", "age": 30';
    const result = validateApiResponse(invalidJsonString, '/api/user');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });
});