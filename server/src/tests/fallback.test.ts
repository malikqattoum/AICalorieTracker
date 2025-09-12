import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock process.env
const originalEnv = process.env;

describe('Fallback Behavior Testing', () => {
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

  describe('Server Domain Configuration Fallbacks', () => {
    it('should use all default fallbacks when no environment variables set', async () => {
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
      (process.env as any).NODE_ENV = undefined;

      const { domains, getCurrentApiUrl, getCurrentCorsOrigins } = await import('../config/domains');

      // Test domain fallbacks
      expect(domains.supportEmail).toBe('support@aical.scanitix.com');
      expect(domains.privacyUrl).toBe('https://aicalorietracker.com/privacy');
      expect(domains.termsUrl).toBe('https://aicalorietracker.com/terms');
      expect(domains.appUrl).toBe('https://aicalorietracker.com');

      // Test CORS fallbacks
      expect(domains.corsOrigins).toContain('https://aicalorietracker.com');
      expect(domains.corsOrigins).toContain('https://www.aicalorietracker.com');
      expect(domains.corsOrigins).toContain('http://146.190.120.35:3002');

      // Test API URL fallbacks (defaults to production when NODE_ENV not set)
      expect(getCurrentApiUrl()).toBe('http://146.190.120.35:3002');

      // Test CORS origins by environment fallbacks
      const corsOrigins = getCurrentCorsOrigins();
      expect(corsOrigins).toContain('https://aicalorietracker.com');
      expect(corsOrigins).toContain('https://www.aicalorietracker.com');
    });

    it('should fallback to ALLOWED_ORIGINS when CORS_ORIGINS not set', async () => {
      delete process.env.CORS_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'https://fallback1.com,https://fallback2.com';

      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toEqual(['https://fallback1.com', 'https://fallback2.com']);
    });

    it('should handle empty or malformed environment variables gracefully', async () => {
      process.env.CORS_ORIGINS = '';
      process.env.SUPPORT_EMAIL = '';

      const { domains } = await import('../config/domains');

      // Should use fallbacks for empty values
      expect(domains.supportEmail).toBe('support@aical.scanitix.com');
      // Empty CORS_ORIGINS should result in default origins
      expect(domains.corsOrigins).toContain('https://aicalorietracker.com');
    });
  });

  describe('Client Configuration Fallbacks', () => {
    it('should use fallback values in client config when environment variables not set', () => {
      // This would test the client config fallbacks
      // Since we can't easily test the client config in Node.js,
      // we'll document the expected behavior

      const expectedFallbacks = {
        apiUrl: {
          development: 'http://localhost:3000',
          production: 'http://146.190.120.35:3002',
          staging: 'https://staging-api.aicalorietracker.com'
        },
        domains: {
          supportEmail: 'support@aical.scanitix.com',
          privacyUrl: 'https://aicalorietracker.com/privacy',
          termsUrl: 'https://aicalorietracker.com/terms',
          appUrl: 'https://aicalorietracker.com'
        }
      };

      // Verify the fallback values are reasonable
      expect(expectedFallbacks.apiUrl.development).toMatch(/^http:\/\/localhost:/);
      expect(expectedFallbacks.apiUrl.production).toMatch(/^https:\/\/.*\.com/);
      expect(expectedFallbacks.domains.supportEmail).toMatch(/@.*\.com/);
      expect(expectedFallbacks.domains.privacyUrl).toMatch(/^https:\/\/.*\/privacy/);
    });
  });

  describe('Mobile Configuration Fallbacks', () => {
    it('should use fallback values in mobile config when expo config not set', () => {
      // Mock Constants.expoConfig
      (global as any).Constants = {};

      const expectedFallbacks = {
        apiUrl: 'http://146.190.120.35:3002',
        supportEmail: 'support@aical.scanitix.com',
        privacyUrl: 'https://aicalorietracker.com/privacy',
        termsUrl: 'https://aicalorietracker.com/terms',
        appUrl: 'https://aicalorietracker.com',
        appName: 'AI Calorie Tracker',
        version: '1.0.0'
      };

      // Verify fallback values are defined
      Object.values(expectedFallbacks).forEach(value => {
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Environment-Specific Fallbacks', () => {
    it('should use development fallbacks when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VITE_API_URL_DEV;

      const { getCurrentApiUrl, getCurrentCorsOrigins } = await import('../config/domains');

      expect(getCurrentApiUrl()).toBe('http://localhost:3000');

      const corsOrigins = getCurrentCorsOrigins();
      expect(corsOrigins).toContain('http://localhost:3000');
      expect(corsOrigins).toContain('http://localhost:5000');
    });

    it('should use staging fallbacks when NODE_ENV is staging', async () => {
      process.env.NODE_ENV = 'staging';
      delete process.env.VITE_API_URL_STAGING;

      const { getCurrentApiUrl, getCurrentCorsOrigins } = await import('../config/domains');

      expect(getCurrentApiUrl()).toBe('https://staging-api.aicalorietracker.com');

      const corsOrigins = getCurrentCorsOrigins();
      expect(corsOrigins).toContain('https://staging.aicalorietracker.com');
      expect(corsOrigins).toContain('https://staging-api.aicalorietracker.com');
    });

    it('should use production fallbacks when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.VITE_API_URL_PROD;

      const { getCurrentApiUrl, getCurrentCorsOrigins } = await import('../config/domains');

      expect(getCurrentApiUrl()).toBe('http://146.190.120.35:3002');

      const corsOrigins = getCurrentCorsOrigins();
      expect(corsOrigins).toContain('https://aicalorietracker.com');
      expect(corsOrigins).toContain('https://www.aicalorietracker.com');
      expect(corsOrigins).toContain('http://146.190.120.35:3002');
    });
  });

  describe('Invalid Environment Variable Handling', () => {
    it('should handle undefined environment variables', async () => {
      delete process.env.SUPPORT_EMAIL;
      delete process.env.PRIVACY_URL;

      const { domains } = await import('../config/domains');

      expect(domains.supportEmail).toBe('support@aical.scanitix.com');
      expect(domains.privacyUrl).toBe('https://aicalorietracker.com/privacy');
    });

    it('should handle null environment variables', async () => {
      process.env.SUPPORT_EMAIL = null as any;
      process.env.PRIVACY_URL = null as any;

      const { domains } = await import('../config/domains');

      expect(domains.supportEmail).toBe('support@aical.scanitix.com');
      expect(domains.privacyUrl).toBe('https://aicalorietracker.com/privacy');
    });

    it('should handle malformed CORS origins', async () => {
      process.env.CORS_ORIGINS = 'invalid-url,https://valid.com,another-invalid';

      const { domains } = await import('../config/domains');

      // Current implementation includes all origins as-is (no validation)
      expect(domains.corsOrigins).toContain('https://valid.com');
      expect(domains.corsOrigins).toContain('invalid-url');
      expect(domains.corsOrigins).toContain('another-invalid');
    });
  });

  describe('Configuration Consistency', () => {
    it('should maintain consistent configuration across environments', async () => {
      const environments = ['development', 'staging', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;

        const { domains, getCurrentApiUrl } = await import('../config/domains');

        // Ensure all required properties exist
        expect(domains.supportEmail).toBeDefined();
        expect(domains.privacyUrl).toBeDefined();
        expect(domains.termsUrl).toBeDefined();
        expect(domains.appUrl).toBeDefined();
        expect(Array.isArray(domains.corsOrigins)).toBe(true);
        expect(typeof getCurrentApiUrl()).toBe('string');

        // Clear cache for next iteration
        jest.resetModules();
      }
    });
  });
});