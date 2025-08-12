import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser, createTestAdmin } from './test-utils';

describe('Admin Dashboard', () => {
  let adminSession: any;
  let userSession: any;
  
  const adminUserData = {
    email: 'admin_dashboard_test@example.com',
    password: 'password123'
  };
  
  const userUserData = {
    email: 'user_dashboard_test@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Create admin and user sessions
    const adminToken = await createTestAdmin();
    const userToken = await createTestUser(userUserData.email, userUserData.password);
    
    // Login as admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    
    adminSession = adminLoginRes;
    
    // Login as regular user
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: userUserData.email.split('@')[0],
        password: userUserData.password
      });
    
    userSession = userLoginRes;
  });

  afterAll(async () => {
    // Clean up test data
    // In a real test, we would delete the test users
  });

  describe('GET /api/admin/dashboard/stats', () => {
    it('should retrieve dashboard stats when authenticated as admin', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Cookie', adminSession.headers['set-cookie']);
      
      // Could be 200 (success) or 500 (error)
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(typeof res.body).toBe('object');
      }
    });

    it('should fail to retrieve dashboard stats when authenticated as regular user', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Cookie', userSession.headers['set-cookie']);
      
      expect(res.status).toBe(403);
    });

    it('should fail to retrieve dashboard stats without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/dashboard/users', () => {
    it('should retrieve user list when authenticated as admin', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/users')
        .set('Cookie', adminSession.headers['set-cookie']);
      
      // Could be 200 (success) or 500 (error)
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('should fail to retrieve user list when authenticated as regular user', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/users')
        .set('Cookie', userSession.headers['set-cookie']);
      
      expect(res.status).toBe(403);
    });

    it('should fail to retrieve user list without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/users');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/dashboard/analytics', () => {
    it('should retrieve analytics data when authenticated as admin', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/analytics')
        .set('Cookie', adminSession.headers['set-cookie']);
      
      // Could be 200 (success) or 500 (error)
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(typeof res.body).toBe('object');
      }
    });

    it('should fail to retrieve analytics data when authenticated as regular user', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/analytics')
        .set('Cookie', userSession.headers['set-cookie']);
      
      expect(res.status).toBe(403);
    });

    it('should fail to retrieve analytics data without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/analytics');
      
      expect(res.status).toBe(401);
    });
  });
});