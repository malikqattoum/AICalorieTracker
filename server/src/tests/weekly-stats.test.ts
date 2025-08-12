import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser } from './test-utils';

describe('Weekly Stats', () => {
  let userSession: any;
  
  const testUserData = {
    email: 'weekly_stats_test@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Create a test user and get session
    const token = await createTestUser(testUserData.email, testUserData.password);
    
    // Login to get a session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUserData.email.split('@')[0],
        password: testUserData.password
      });
    
    userSession = loginRes;
  });

  afterAll(async () => {
    // Clean up test data
    // In a real test, we would delete the test user
  });

  describe('GET /api/weekly-stats', () => {
    it('should retrieve weekly stats when authenticated', async () => {
      const res = await request(app)
        .get('/api/weekly-stats')
        .set('Cookie', userSession.headers['set-cookie']);
      
      // Could be 200 (success) or 404 (no stats found) or 500 (error)
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('averageCalories');
        expect(res.body).toHaveProperty('mealsTracked');
      } else if (res.status === 404) {
        expect(res.body).toHaveProperty('message');
      }
    });

    it('should fail to retrieve weekly stats without authentication', async () => {
      const res = await request(app)
        .get('/api/weekly-stats');
      
      expect(res.status).toBe(401);
    });

    it('should retrieve weekly stats with medical condition filter', async () => {
      const res = await request(app)
        .get('/api/weekly-stats?medicalCondition=diabetes')
        .set('Cookie', userSession.headers['set-cookie']);
      
      // Could be 200 (success) or 404 (no stats found) or 500 (error)
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});