import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock process.env
const originalEnv = process.env;

describe('Runtime Behavior Testing', () => {
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

  describe('API URL Generation', () => {
    it('should generate correct API URLs for different environments', async () => {
      // Test development environment
      process.env.NODE_ENV = 'development';
      process.env.VITE_API_URL_DEV = 'http://localhost:3001';

      const { getCurrentApiUrl } = await import('../config/domains');
      expect(getCurrentApiUrl()).toBe('http://localhost:3001');

      // Clear cache and test production
      jest.resetModules();
      process.env.NODE_ENV = 'production';
      process.env.VITE_API_URL_PROD = 'https://api.example.com';

      const { getCurrentApiUrl: getProdApiUrl } = await import('../config/domains');
      expect(getProdApiUrl()).toBe('https://api.example.com');

      // Clear cache and test staging
      jest.resetModules();
      process.env.NODE_ENV = 'staging';
      process.env.VITE_API_URL_STAGING = 'https://staging-api.example.com';

      const { getCurrentApiUrl: getStagingApiUrl } = await import('../config/domains');
      expect(getStagingApiUrl()).toBe('https://staging-api.example.com');
    });

    it('should use fallback API URLs when environment variables not set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VITE_API_URL_DEV;

      const { getCurrentApiUrl } = await import('../config/domains');
      expect(getCurrentApiUrl()).toBe('http://localhost:3000');
    });
  });

  describe('Support Link Generation', () => {
    it('should generate correct support links from environment variables', async () => {
      process.env.SUPPORT_EMAIL = 'custom@support.com';
      process.env.PRIVACY_URL = 'https://example.com/privacy';
      process.env.TERMS_URL = 'https://example.com/terms';
      process.env.APP_URL = 'https://example.com';

      const { domains } = await import('../config/domains');

      expect(domains.supportEmail).toBe('custom@support.com');
      expect(domains.privacyUrl).toBe('https://example.com/privacy');
      expect(domains.termsUrl).toBe('https://example.com/terms');
      expect(domains.appUrl).toBe('https://example.com');
    });

    it('should generate fallback support links when environment variables not set', async () => {
      delete process.env.SUPPORT_EMAIL;
      delete process.env.PRIVACY_URL;
      delete process.env.TERMS_URL;
      delete process.env.APP_URL;

      const { domains } = await import('../config/domains');

      expect(domains.supportEmail).toBe('support@aical.scanitix.com');
      expect(domains.privacyUrl).toBe('https://aicalorietracker.com/privacy');
      expect(domains.termsUrl).toBe('https://aicalorietracker.com/terms');
      expect(domains.appUrl).toBe('https://aicalorietracker.com');
    });
  });

  describe('CORS Origin Validation at Runtime', () => {
    it('should validate allowed origins correctly', async () => {
      process.env.CORS_ORIGINS = 'https://allowed1.com,https://allowed2.com';

      const { isAllowedOrigin } = await import('../config/domains');

      expect(isAllowedOrigin('https://allowed1.com')).toBe(true);
      expect(isAllowedOrigin('https://allowed2.com')).toBe(true);
      expect(isAllowedOrigin('https://notallowed.com')).toBe(false);
    });

    it('should validate environment-specific origins', async () => {
      process.env.NODE_ENV = 'development';

      const { isAllowedOrigin } = await import('../config/domains');

      expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
      expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
      expect(isAllowedOrigin('https://external.com')).toBe(false);
    });
  });

  describe('Domain URL Validation', () => {
    it('should validate well-formed URLs', async () => {
      const { isValidDomain } = await import('../config/domains');

      expect(isValidDomain('https://example.com')).toBe(true);
      expect(isValidDomain('http://example.com')).toBe(true);
      expect(isValidDomain('https://example.com/path')).toBe(true);
      expect(isValidDomain('invalid-url')).toBe(false);
      expect(isValidDomain('ftp://example.com')).toBe(false);
    });
  });

  describe('Configuration Loading Performance', () => {
    it('should load configuration quickly', async () => {
      const startTime = Date.now();

      // Load configuration multiple times to test performance
      for (let i = 0; i < 10; i++) {
        await import('../config/domains');
        jest.resetModules();
      }

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should load in less than 100ms per load (allowing for some variance)
      expect(loadTime).toBeLessThan(1000);
    });
  });

  describe('Environment Variable Precedence', () => {
    it('should respect environment variable precedence over defaults', async () => {
      // Set both CORS_ORIGINS and ALLOWED_ORIGINS
      process.env.CORS_ORIGINS = 'https://cors-origin.com';
      process.env.ALLOWED_ORIGINS = 'https://allowed-origin.com';

      const { domains } = await import('../config/domains');

      // CORS_ORIGINS should take precedence
      expect(domains.corsOrigins).toContain('https://cors-origin.com');
      expect(domains.corsOrigins).not.toContain('https://allowed-origin.com');
    });
  });

  describe('Configuration Consistency', () => {
    it('should maintain configuration consistency across multiple loads', async () => {
      process.env.SUPPORT_EMAIL = 'test@example.com';

      // Load configuration multiple times
      const configs = [];
      for (let i = 0; i < 3; i++) {
        const { domains } = await import('../config/domains');
        configs.push({ ...domains });
        jest.resetModules();
      }

      // All configurations should be identical
      expect(configs[0].supportEmail).toBe(configs[1].supportEmail);
      expect(configs[1].supportEmail).toBe(configs[2].supportEmail);
      expect(configs[0].corsOrigins.length).toBe(configs[1].corsOrigins.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed environment variables gracefully', async () => {
      process.env.CORS_ORIGINS = 'invalid-url,,https://valid.com,';

      const { domains } = await import('../config/domains');

      // Should still contain valid origins and filter empty ones
      expect(domains.corsOrigins).toContain('https://valid.com');
      expect(domains.corsOrigins).toContain('invalid-url'); // Current implementation doesn't validate URLs
      expect(domains.corsOrigins).not.toContain(''); // Should filter empty strings
    });

    it('should handle missing environment variables gracefully', async () => {
      (process.env as any).NODE_ENV = undefined;
      delete process.env.CORS_ORIGINS;

      const { getCurrentApiUrl, domains } = await import('../config/domains');

      // Should use production defaults
      expect(getCurrentApiUrl()).toBe('http://146.190.120.35:3002');
      expect(domains.corsOrigins.length).toBeGreaterThan(0);
    });
  });
});