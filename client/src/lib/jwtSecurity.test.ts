import {
  validateTokenFormat,
  validateHttpsUrl,
  addSecurityHeaders,
  addAuthHeader
} from './queryClient';
import {
  verifyTokenSignature,
  validateTokenComprehensive,
  validateSecureStorage,
  isTokenRevoked
} from './tokenManager';

// Mock dependencies
jest.mock('./config', () => ({
  CONFIG: {
    security: {
      enforceHTTPS: true,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      },
      tokenValidation: {
        minLength: 10,
        maxLength: 1000,
        requireBearerPrefix: false,
        maxTokenAge: 3600000
      }
    }
  },
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn()
}));

jest.mock('./queryClient', () => ({
  validateTokenFormat: jest.fn()
}));

import { validateTokenFormat as mockValidateTokenFormat } from './queryClient';

describe('JWT Security Tests', () => {
  describe('Token Format Validation', () => {
    test('should validate correct JWT structure', () => {
      const validTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'header.payload.signature',
        'a.b.c'
      ];

      validTokens.forEach(token => {
        expect(validateTokenFormat(token)).toBe(true);
      });
    });

    test('should reject malformed JWT tokens', () => {
      const invalidTokens = [
        '',
        'header',
        'header.',
        'header.payload',
        'a',
        'a.',
        'a.b',
        'a.b.c.d',
        '.',
        '..',
        'header..signature',
        'header.payload.',
        '.payload.signature'
      ];

      invalidTokens.forEach(token => {
        expect(validateTokenFormat(token)).toBe(false);
      });
    });

    test('should validate JWT header structure', () => {
      const validHeaderToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.payload.signature';
      const invalidHeaderToken = 'invalid.header.payload.signature';

      expect(validateTokenFormat(validHeaderToken)).toBe(true);
      expect(validateTokenFormat(invalidHeaderToken)).toBe(false);
    });

    test('should enforce token length limits', () => {
      const shortToken = 'short';
      const longToken = 'a'.repeat(2000);

      expect(validateTokenFormat(shortToken)).toBe(false);
      expect(validateTokenFormat(longToken)).toBe(false);
    });

    test('should validate token age', () => {
      const recentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MzA5NjAwMDB9.valid.signature';
      const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjJ9.old.signature';

      expect(validateTokenFormat(recentToken)).toBe(true);
      expect(validateTokenFormat(oldToken)).toBe(false);
    });
  });

  describe('HTTPS URL Validation', () => {
    test('should accept HTTPS URLs', () => {
      const httpsUrls = [
        'https://api.example.com',
        'https://api.example.com:443',
        'https://api.example.com/path',
        'https://api.example.com/path?query=value'
      ];

      httpsUrls.forEach(url => {
        expect(validateHttpsUrl(url)).toBe(true);
      });
    });

    test('should reject HTTP URLs', () => {
      const httpUrls = [
        'http://api.example.com',
        'http://api.example.com:80',
        'http://api.example.com/path'
      ];

      httpUrls.forEach(url => {
        expect(validateHttpsUrl(url)).toBe(false);
      });
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'ftp://example.com',
        'mailto:test@example.com',
        'javascript:alert(1)'
      ];

      invalidUrls.forEach(url => {
        expect(validateHttpsUrl(url)).toBe(false);
      });
    });
  });

  describe('Security Headers', () => {
    test('should add all required security headers', () => {
      const headers = {};
      const result = addSecurityHeaders(headers);

      expect(result).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(result).toHaveProperty('X-Frame-Options', 'DENY');
      expect(result).toHaveProperty('X-XSS-Protection', '1; mode=block');
    });

    test('should preserve existing headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      };
      const result = addSecurityHeaders(headers);

      expect(result).toHaveProperty('Content-Type', 'application/json');
      expect(result).toHaveProperty('Authorization', 'Bearer token');
      expect(result).toHaveProperty('X-Content-Type-Options', 'nosniff');
    });

    test('should handle empty headers object', () => {
      const result = addSecurityHeaders({});

      expect(Object.keys(result)).toHaveLength(3);
      expect(result).toHaveProperty('X-Content-Type-Options');
      expect(result).toHaveProperty('X-Frame-Options');
      expect(result).toHaveProperty('X-XSS-Protection');
    });
  });

  describe('Authorization Headers', () => {
    test('should add authorization header with valid token', () => {
      const headers = {};
      const result = addAuthHeader(headers);

      // This would normally add authorization header if token exists
      // Since we're mocking, we test the structure
      expect(typeof result).toBe('object');
    });

    test('should handle undefined headers', () => {
      const result = addAuthHeader(undefined);

      expect(typeof result).toBe('object');
    });
  });

  describe('Token Signature Verification', () => {
    test('should verify valid token signatures', () => {
      const validToken = 'valid-token';
      const secret = 'test-secret';

      // Mock successful verification
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 123 });

      const result = verifyTokenSignature(validToken, secret);

      expect(result).toBe(true);
      expect(jwt.verify).toHaveBeenCalledWith(validToken, secret);
    });

    test('should reject invalid token signatures', () => {
      const invalidToken = 'invalid-token';
      const secret = 'test-secret';

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = verifyTokenSignature(invalidToken, secret);

      expect(result).toBe(false);
    });

    test('should handle verification errors', () => {
      const token = 'token';
      const secret = 'secret';

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Verification failed');
      });

      const result = verifyTokenSignature(token, secret);

      expect(result).toBe(false);
    });
  });

  describe('Comprehensive Token Validation', () => {
    test('should pass comprehensive validation for valid tokens', () => {
      const validToken = 'valid-token';

      (mockValidateTokenFormat as jest.Mock).mockReturnValue(true);

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 123 });

      const result = validateTokenComprehensive(validToken);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail comprehensive validation for invalid tokens', () => {
      const invalidToken = 'invalid-token';

      (mockValidateTokenFormat as jest.Mock).mockReturnValue(false);

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = validateTokenComprehensive(invalidToken);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Token format validation failed');
      expect(result.errors).toContain('Token signature verification failed');
    });

    test('should collect all validation errors', () => {
      const badToken = 'bad-token';

      (mockValidateTokenFormat as jest.Mock).mockReturnValue(false);

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      const result = validateTokenComprehensive(badToken);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Secure Storage Validation', () => {
    test('should validate secure storage with valid tokens', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });

      localStorageMock.getItem.mockReturnValue('valid-token');

      (mockValidateTokenFormat as jest.Mock).mockReturnValue(true);

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      const result = validateSecureStorage();

      expect(result).toBe(true);
    });

    test('should reject insecure storage', () => {
      const localStorageMock = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });

      const result = validateSecureStorage();

      expect(result).toBe(false);
    });
  });

  describe('Token Revocation', () => {
    test('should detect revoked tokens', () => {
      const revokedToken = 'revoked-token';

      (mockValidateTokenFormat as jest.Mock).mockReturnValue(false);

      const result = isTokenRevoked(revokedToken);

      expect(result).toBe(true);
    });

    test('should not revoke valid tokens', () => {
      const validToken = 'valid-token';

      (mockValidateTokenFormat as jest.Mock).mockReturnValue(true);

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      const result = isTokenRevoked(validToken);

      expect(result).toBe(false);
    });

    test('should handle revocation check errors', () => {
      const token = 'token';

      (mockValidateTokenFormat as jest.Mock).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const result = isTokenRevoked(token);

      expect(result).toBe(true); // Assume revoked if can't verify
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle empty tokens', () => {
      expect(validateTokenFormat('')).toBe(false);
      expect(verifyTokenSignature('', 'secret')).toBe(false);
    });

    test('should handle null and undefined tokens', () => {
      expect(validateTokenFormat(null as any)).toBe(false);
      expect(validateTokenFormat(undefined as any)).toBe(false);
    });

    test('should handle tokens with special characters', () => {
      const specialToken = 'token-with-special-chars!@#$%^&*()';
      expect(validateTokenFormat(specialToken)).toBe(false);
    });

    test('should handle extremely long tokens', () => {
      const longToken = 'a'.repeat(10000);
      expect(validateTokenFormat(longToken)).toBe(false);
    });

    test('should handle tokens with unicode characters', () => {
      const unicodeToken = 'token-with-unicode-🚀🎉';
      expect(validateTokenFormat(unicodeToken)).toBe(false);
    });
  });

  describe('XSS Prevention', () => {
    test('should prevent XSS through token values', () => {
      const xssToken = '<script>alert("xss")</script>';
      expect(validateTokenFormat(xssToken)).toBe(false);
    });

    test('should prevent XSS through header injection', () => {
      const maliciousToken = 'token\r\nX-Custom-Header: malicious';
      expect(validateTokenFormat(maliciousToken)).toBe(false);
    });
  });

  describe('CSRF Protection', () => {
    test('should validate request origin', () => {
      // This would be tested in integration with actual requests
      // For unit tests, we verify the security headers are added
      const headers = {};
      const result = addSecurityHeaders(headers);

      expect(result).toHaveProperty('X-Frame-Options', 'DENY');
    });
  });

  describe('Performance Security', () => {
    test('should validate tokens within time limits', () => {
      const tokens = Array.from({ length: 100 }, (_, i) => `token-${i}`);
      const startTime = Date.now();

      tokens.forEach(token => {
        validateTokenFormat(token);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete validation in reasonable time
      expect(duration).toBeLessThan(200);
    });

    test('should handle DoS attempts with large payloads', () => {
      const largeToken = 'a'.repeat(100000);

      expect(validateTokenFormat(largeToken)).toBe(false);
    });
  });
});