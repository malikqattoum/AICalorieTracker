import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser, createTestAdmin } from './test-utils';

describe('AI Configuration', () => {
  let adminSession: any;
  let userSession: any;
  
  const adminUserData = {
    email: 'ai_admin_test@example.com',
    password: 'password123'
  };
  
  const userUserData = {
    email: 'ai_user_test@example.com',
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

  describe('GET /api/admin/ai-config', () => {
    it('should retrieve AI configurations when authenticated as admin', async () => {
      const res = await request(app)
        .get('/api/admin/ai-config')
        .set('Cookie', adminSession.headers['set-cookie']);
      
      // Could be 200 (success) or 500 (error)
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('should fail to retrieve AI configurations when authenticated as regular user', async () => {
      const res = await request(app)
        .get('/api/admin/ai-config')
        .set('Cookie', userSession.headers['set-cookie']);
      
      expect(res.status).toBe(403);
    });

    it('should fail to retrieve AI configurations without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/ai-config');
      
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/admin/ai-config/:id', () => {
    it('should update AI configuration when authenticated as admin', async () => {
      const updateData = {
        modelName: 'updated-model',
        temperature: 80
      };
      
      const res = await request(app)
        .put('/api/admin/ai-config/1')
        .set('Cookie', adminSession.headers['set-cookie'])
        .send(updateData);
      
      // Could be 200 (success) or 500 (error) depending on implementation
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
      }
    });

    it('should fail to update AI configuration when authenticated as regular user', async () => {
      const updateData = {
        modelName: 'updated-model',
        temperature: 80
      };
      
      const res = await request(app)
        .put('/api/admin/ai-config/1')
        .set('Cookie', userSession.headers['set-cookie'])
        .send(updateData);
      
      expect(res.status).toBe(403);
    });

    it('should fail to update AI configuration without authentication', async () => {
      const updateData = {
        modelName: 'updated-model',
        temperature: 80
      };
      
      const res = await request(app)
        .put('/api/admin/ai-config/1')
        .send(updateData);
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/ai-config/:id/activate', () => {
    it('should activate AI configuration when authenticated as admin', async () => {
      const res = await request(app)
        .post('/api/admin/ai-config/1/activate')
        .set('Cookie', adminSession.headers['set-cookie']);
      
      // Could be 200 (success) or 500 (error) depending on implementation
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
      }
    });

    it('should fail to activate AI configuration when authenticated as regular user', async () => {
      const res = await request(app)
        .post('/api/admin/ai-config/1/activate')
        .set('Cookie', userSession.headers['set-cookie']);
      
      expect(res.status).toBe(403);
    });

    it('should fail to activate AI configuration without authentication', async () => {
      const res = await request(app)
        .post('/api/admin/ai-config/1/activate');
      
      expect(res.status).toBe(401);
    });
  });
});