import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../index';

describe('CORS Functionality', () => {
  describe('CORS Headers', () => {
    it('should allow requests from allowed origins', async () => {
      const allowedOrigins = [
        'https://aicalorietracker.com',
        'https://www.aicalorietracker.com',
        'http://146.190.120.35:3002',
        'https://www.aical.scanitix.com'
      ];

      for (const origin of allowedOrigins) {
        const res = await request(app)
          .options('/api/test')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET');

        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-methods']).toContain('GET');
        expect(res.headers['access-control-allow-methods']).toContain('POST');
        expect(res.headers['access-control-allow-headers']).toBeDefined();
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      }
    });

    it('should allow requests from development origins when in development', async () => {
      // Set NODE_ENV to development for this test
      process.env.NODE_ENV = 'development';

      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173'
      ];

      for (const origin of devOrigins) {
        const res = await request(app)
          .options('/api/test')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET');

        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
      }
    });

    it('should reject requests from disallowed origins', async () => {
      const disallowedOrigins = [
        'https://malicious.com',
        'http://evil-site.com',
        'https://phishing-attempt.com'
      ];

      for (const origin of disallowedOrigins) {
        const res = await request(app)
          .options('/api/test')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET');

        expect(res.status).toBe(200);
        // Should not set Access-Control-Allow-Origin for disallowed origins
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
      }
    });

    it('should handle requests without origin header', async () => {
      const res = await request(app)
        .options('/api/test')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(200);
      // Should not set Access-Control-Allow-Origin when no origin is provided
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should include all required CORS headers', async () => {
      const res = await request(app)
        .options('/api/test')
        .set('Origin', 'https://aicalorietracker.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://aicalorietracker.com');
      expect(res.headers['access-control-allow-methods']).toContain('GET');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-methods']).toContain('PUT');
      expect(res.headers['access-control-allow-methods']).toContain('DELETE');
      expect(res.headers['access-control-allow-methods']).toContain('OPTIONS');
      expect(res.headers['access-control-allow-methods']).toContain('PATCH');
      expect(res.headers['access-control-allow-headers']).toBeDefined();
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-max-age']).toBe('86400');
    });
  });

  describe('CORS with Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      jest.resetModules();
    });

    afterEach(() => {
      process.env = originalEnv;
      jest.resetModules();
    });

    it('should use CORS_ORIGINS from environment variables', async () => {
      process.env.CORS_ORIGINS = 'https://custom1.com,https://custom2.com';

      // Restart the server with new environment
      // Note: In a real test, you'd need to restart the server
      // For this test, we'll verify the configuration logic

      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toEqual(['https://custom1.com', 'https://custom2.com']);
    });

    it('should fallback to ALLOWED_ORIGINS when CORS_ORIGINS not set', async () => {
      delete process.env.CORS_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'https://fallback1.com,https://fallback2.com';

      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toEqual(['https://fallback1.com', 'https://fallback2.com']);
    });

    it('should use default origins when no environment variables set', async () => {
      delete process.env.CORS_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;

      const { domains } = await import('../config/domains');
      expect(domains.corsOrigins).toContain('https://aicalorietracker.com');
      expect(domains.corsOrigins).toContain('https://www.aicalorietracker.com');
    });
  });

  describe('Actual API Requests', () => {
    it('should handle GET requests with CORS', async () => {
      const res = await request(app)
        .get('/api/test')
        .set('Origin', 'https://aicalorietracker.com');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://aicalorietracker.com');
      expect(res.body.success).toBe(true);
    });

    it('should handle POST requests with CORS', async () => {
      const res = await request(app)
        .post('/api/test-form-data')
        .set('Origin', 'https://aicalorietracker.com')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://aicalorietracker.com');
      expect(res.body.success).toBe(true);
    });

    it('should handle preflight OPTIONS requests', async () => {
      const res = await request(app)
        .options('/api/test')
        .set('Origin', 'https://aicalorietracker.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://aicalorietracker.com');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('CORS Security', () => {
    it('should not allow credentials for disallowed origins', async () => {
      const res = await request(app)
        .options('/api/test')
        .set('Origin', 'https://malicious.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(200);
      // Should not set Access-Control-Allow-Origin for disallowed origins
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      // Should not allow credentials
      expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('should include credentials only for allowed origins', async () => {
      const res = await request(app)
        .options('/api/test')
        .set('Origin', 'https://aicalorietracker.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://aicalorietracker.com');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});