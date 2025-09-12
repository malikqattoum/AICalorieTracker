import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock process.env
const originalEnv = process.env;

describe('Domain Configuration', () => {
  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    // Clear module cache to force reload
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Clear module cache
    jest.resetModules();
  });

  describe('Environment Variable Loading', () => {
    it('should load SUPPORT_EMAIL from environment', async () => {
      process.env.SUPPORT_EMAIL = 'test@example.com';
      const { domains } = await import('../config/domains');
      expect(domains.supportEmail).toBe('test@example.com');
    });

    it('should use fallback for SUPPORT_EMAIL when not set', async () => {
      delete process.env.SUPPORT_EMAIL;
      const { domains } = await import('../config/domains');
      expect(domains.supportEmail).toBe('support@aical.scanitix.com');
    });

    it('should load PRIVACY_URL from environment', async () => {
      process.env.PRIVACY_URL = 'https://test.com/privacy';
      const { domains } = await import('../config/domains');
      expect(domains.privacyUrl).toBe('https://test.com/privacy');
    });

    it('should load TERMS_URL from environment', async () => {
      process.env.TERMS_URL = 'https://test.com/terms';
      const { domains } = await import('../config/domains');
      expect(domains.termsUrl).toBe('https://test.com/terms');
    });

    it('should load APP_URL from environment', async () => {
      process.env.APP_URL = 'https://test.com';
      const { domains } = await import('../config/domains');
      expect(domains.appUrl).toBe('https://test.com');
    });
  });

  describe('API URL Configuration', () => {
    it('should return development API URL when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_API_URL_DEV = 'http://localhost:3001';
      const { getCurrentApiUrl } = await import('../config/domains');
      expect(getCurrentApiUrl()).toBe('http://localhost:3001');
    });

    it('should return staging API URL when NODE_ENV is staging', async () => {
      process.env.NODE_ENV = 'staging';
      process.env.VITE_API_URL_STAGING = 'https://staging.test.com';
      const { getCurrentApiUrl } = await import('../config/domains');
      expect(getCurrentApiUrl()).toBe('https://staging.test.com');
    });

    it('should return production API URL when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_API_URL_PROD = 'https://prod.test.com';
      const { getCurrentApiUrl } = await import('../config/domains');
      expect(getCurrentApiUrl()).toBe('https://prod.test.com');
    });

    it('should use fallback API URLs when environment variables not set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VITE_API_URL_DEV;
      const { getCurrentApiUrl } = await import('../config/domains');
      expect(getCurrentApiUrl()).toBe('http://localhost:3000');
    });
  });

  describe('CORS Configuration', () => {
    it('should load CORS_ORIGINS from environment', async () => {
      process.env.CORS_ORIGINS = 'https://test1.com,https://test2.com';
      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toEqual(['https://test1.com', 'https://test2.com']);
    });

    it('should fallback to ALLOWED_ORIGINS when CORS_ORIGINS not set', async () => {
      delete process.env.CORS_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'https://fallback1.com,https://fallback2.com';
      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toEqual(['https://fallback1.com', 'https://fallback2.com']);
    });

    it('should use default CORS origins when neither CORS_ORIGINS nor ALLOWED_ORIGINS set', async () => {
      delete process.env.CORS_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;
      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toContain('https://aicalorietracker.com');
      expect(domains.corsOrigins).toContain('https://www.aicalorietracker.com');
    });

    it('should filter out empty origins', async () => {
      process.env.CORS_ORIGINS = 'https://test.com,,https://test2.com,';
      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toEqual(['https://test.com', 'https://test2.com']);
    });

    it('should trim whitespace from origins', async () => {
      process.env.CORS_ORIGINS = ' https://test.com , https://test2.com ';
      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toEqual(['https://test.com', 'https://test2.com']);
    });
  });

  describe('Environment-specific CORS Origins', () => {
    it('should return development CORS origins when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      const { getCurrentCorsOrigins } = await import('../config/domains');
      const origins = getCurrentCorsOrigins();
      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('http://localhost:5000');
      expect(origins).toContain('http://localhost:5173');
    });

    it('should return staging CORS origins when NODE_ENV is staging', async () => {
      process.env.NODE_ENV = 'staging';
      const { getCurrentCorsOrigins } = await import('../config/domains');
      const origins = getCurrentCorsOrigins();
      expect(origins).toContain('https://staging.aicalorietracker.com');
      expect(origins).toContain('https://staging-api.aicalorietracker.com');
    });

    it('should return production CORS origins when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      const { getCurrentCorsOrigins } = await import('../config/domains');
      const origins = getCurrentCorsOrigins();
      expect(origins).toContain('https://aicalorietracker.com');
      expect(origins).toContain('https://www.aicalorietracker.com');
      expect(origins).toContain('http://146.190.120.35:3002');
    });
  });

  describe('Domain Validation', () => {
    it('should validate valid HTTP URLs', async () => {
      const { isValidDomain } = await import('../config/domains');
      expect(isValidDomain('http://example.com')).toBe(true);
      expect(isValidDomain('https://example.com')).toBe(true);
      expect(isValidDomain('https://example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', async () => {
      const { isValidDomain } = await import('../config/domains');
      expect(isValidDomain('not-a-url')).toBe(false);
      expect(isValidDomain('ftp://example.com')).toBe(false);
      expect(isValidDomain('')).toBe(false);
    });

    it('should handle malformed URLs gracefully', async () => {
      const { isValidDomain } = await import('../config/domains');
      expect(isValidDomain('http://')).toBe(false);
      expect(isValidDomain('https://')).toBe(false);
    });
  });

  describe('Origin Validation', () => {
    beforeEach(() => {
      process.env.CORS_ORIGINS = 'https://allowed1.com,https://allowed2.com';
    });

    it('should allow origins in CORS_ORIGINS list', async () => {
      const { isAllowedOrigin } = await import('../config/domains');
      expect(isAllowedOrigin('https://allowed1.com')).toBe(true);
      expect(isAllowedOrigin('https://allowed2.com')).toBe(true);
    });

    it('should allow origins in environment-specific CORS list', async () => {
      process.env.NODE_ENV = 'development';
      const { isAllowedOrigin } = await import('../config/domains');
      expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
      expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    });

    it('should reject origins not in allowed lists', async () => {
      const { isAllowedOrigin } = await import('../config/domains');
      expect(isAllowedOrigin('https://notallowed.com')).toBe(false);
      expect(isAllowedOrigin('http://malicious.com')).toBe(false);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use all fallback values when no environment variables set', async () => {
      // Clear all relevant environment variables
      delete process.env.SUPPORT_EMAIL;
      delete process.env.PRIVACY_URL;
      delete process.env.TERMS_URL;
      delete process.env.APP_URL;
      delete process.env.CORS_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;
      delete process.env.VITE_API_URL_DEV;
      delete process.env.VITE_API_URL_PROD;
      delete process.env.VITE_API_URL_STAGING;

      const { domains } = await import('../config/domains');

      expect(domains.supportEmail).toBe('support@aical.scanitix.com');
      expect(domains.privacyUrl).toBe('https://aicalorietracker.com/privacy');
      expect(domains.termsUrl).toBe('https://aicalorietracker.com/terms');
      expect(domains.appUrl).toBe('https://aicalorietracker.com');
      expect(domains.corsOrigins).toContain('https://aicalorietracker.com');
    });
  });
});