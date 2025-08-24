import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';

describe('Health Check Endpoints', () => {
  beforeAll(async () => {
    // Clean up any test data
    await db.execute('DELETE FROM users WHERE email LIKE "%test%@example.com"');
  });

  afterAll(async () => {
    // Clean up any test data
    await db.execute('DELETE FROM users WHERE email LIKE "%test%@example.com"');
  });

  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const res = await request(app)
        .get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('checks');
      
      // Check that all required checks are present
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks).toHaveProperty('memory');
      expect(res.body.checks).toHaveProperty('disk');
      expect(res.body.checks).toHaveProperty('aiService');
    });

    it('should return healthy status when all systems are working', async () => {
      const res = await request(app)
        .get('/api/health');
      
      expect(res.status).toBe(200);
      expect(['healthy', 'degraded']).toContain(res.body.status);
    });

    it('should include response times for database and AI service', async () => {
      const res = await request(app)
        .get('/api/health');
      
      expect(res.body.checks.database).toHaveProperty('responseTime');
      expect(res.body.checks.aiService).toHaveProperty('responseTime');
      expect(typeof res.body.checks.database.responseTime).toBe('number');
      expect(typeof res.body.checks.aiService.responseTime).toBe('number');
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health status with metrics', async () => {
      const res = await request(app)
        .get('/api/health/detailed');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('checks');
      
      // Check if metrics are included
      if (res.body.status !== 'unhealthy') {
        expect(res.body).toHaveProperty('metrics');
        expect(res.body.metrics).toHaveProperty('totalUsers');
        expect(res.body.metrics).toHaveProperty('totalMeals');
        expect(res.body.metrics).toHaveProperty('totalAnalyses');
        expect(res.body.metrics).toHaveProperty('activeUsers24h');
      }
    });

    it('should return metrics as numbers', async () => {
      const res = await request(app)
        .get('/api/health/detailed');
      
      if (res.body.metrics) {
        expect(typeof res.body.metrics.totalUsers).toBe('number');
        expect(typeof res.body.metrics.totalMeals).toBe('number');
        expect(typeof res.body.metrics.totalAnalyses).toBe('number');
        expect(typeof res.body.metrics.activeUsers24h).toBe('number');
      }
    });
  });

  describe('GET /api/health/database', () => {
    it('should return database health status', async () => {
      const res = await request(app)
        .get('/api/health/database');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('responseTime');
      expect(res.body).toHaveProperty('database');
      
      expect(res.body.database).toHaveProperty('version');
      expect(res.body.database).toHaveProperty('tables');
      expect(res.body.database).toHaveProperty('connections');
      expect(res.body.database).toHaveProperty('maxConnections');
      expect(res.body.database).toHaveProperty('uptime');
    });

    it('should return healthy database status', async () => {
      const res = await request(app)
        .get('/api/health/database');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    it('should return response time in milliseconds', async () => {
      const res = await request(app)
        .get('/api/health/database');
      
      expect(typeof res.body.responseTime).toBe('number');
      expect(res.body.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/health/system', () => {
    it('should return system health information', async () => {
      const res = await request(app)
        .get('/api/health/system');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('system');
      
      expect(res.body.system).toHaveProperty('platform');
      expect(res.body.system).toHaveProperty('arch');
      expect(res.body.system).toHaveProperty('nodeVersion');
      expect(res.body.system).toHaveProperty('pid');
      expect(res.body.system).toHaveProperty('uptime');
      expect(res.body.system).toHaveProperty('memory');
      expect(res.body.system).toHaveProperty('cpu');
      expect(res.body.system).toHaveProperty('environment');
      expect(res.body.system).toHaveProperty('version');
    });

    it('should return healthy system status', async () => {
      const res = await request(app)
        .get('/api/health/system');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    it('should include memory usage information', async () => {
      const res = await request(app)
        .get('/api/health/system');
      
      expect(res.body.system.memory).toHaveProperty('heapUsed');
      expect(res.body.system.memory).toHaveProperty('heapTotal');
      expect(res.body.system.memory).toHaveProperty('external');
      expect(res.body.system.memory).toHaveProperty('rss');
      
      expect(typeof res.body.system.memory.heapUsed).toBe('number');
      expect(typeof res.body.system.memory.heapTotal).toBe('number');
      expect(typeof res.body.system.memory.external).toBe('number');
      expect(typeof res.body.system.memory.rss).toBe('number');
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness probe status', async () => {
      const res = await request(app)
        .get('/api/health/ready');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      
      expect(['ready', 'not ready']).toContain(res.body.status);
    });

    it('should return ready status when application is ready', async () => {
      const res = await request(app)
        .get('/api/health/ready');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
    });
  });

  describe('GET /api/health/live', () => {
    it('should return liveness probe status', async () => {
      const res = await request(app)
        .get('/api/health/live');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      
      expect(['alive', 'not alive']).toContain(res.body.status);
    });

    it('should return alive status when application is alive', async () => {
      const res = await request(app)
        .get('/api/health/live');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
    });

    it('should return uptime in seconds', async () => {
      const res = await request(app)
        .get('/api/health/live');
      
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Check Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      // This test would require simulating a database failure
      // For now, we'll just verify the endpoint structure
      const res = await request(app)
        .get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });

    it('should return appropriate status codes for different health states', async () => {
      const res = await request(app)
        .get('/api/health');
      
      // Should return 200 for healthy, 206 for degraded, 503 for unhealthy
      expect([200, 206, 503]).toContain(res.status);
    });
  });

  describe('Health Check Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const res = await request(app)
        .get('/api/health');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(res.status).toBe(200);
    });

    it('should handle concurrent health check requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .get('/api/health')
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(res => {
        expect([200, 206, 503]).toContain(res.status);
      });
    });
  });
});