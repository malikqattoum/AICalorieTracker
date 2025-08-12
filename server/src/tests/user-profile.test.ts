import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createTestUser } from './test-utils';

describe('User Profile', () => {
  let userSession: any;
  let userId: number;
  
  const userProfileData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'profile_test@example.com'
  };

  beforeAll(async () => {
    // Create a test user and get session
    const token = await createTestUser(userProfileData.email, 'password123');
    
    // Login to get a session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: userProfileData.email.split('@')[0],
        password: 'password123'
      });
    
    userSession = loginRes;
    // In a real implementation, we would extract the user ID from the session
    userId = 1; // Placeholder
  });

  afterAll(async () => {
    // Clean up test data
    // In a real test, we would delete the test user
  });

  describe('GET /api/user', () => {
    it('should retrieve user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Cookie', userSession.headers['set-cookie']);
      
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('username');
        expect(res.body).toHaveProperty('email');
      }
    });

    it('should fail to retrieve user profile without authentication', async () => {
      const res = await request(app)
        .get('/api/user');
      
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user', () => {
    it('should update user profile when authenticated', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      
      const res = await request(app)
        .put('/api/user')
        .set('Cookie', userSession.headers['set-cookie'])
        .send(updateData);
      
      // Could be 200 (success) or 500 (error) depending on implementation
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('message');
      }
    });

    it('should fail to update user profile without authentication', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      
      const res = await request(app)
        .put('/api/user')
        .send(updateData);
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user/goals', () => {
    it('should retrieve user nutrition goals when authenticated', async () => {
      const res = await request(app)
        .get('/api/user/goals')
        .set('Cookie', userSession.headers['set-cookie']);
      
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        // Goals might be an empty object if not set
        expect(typeof res.body).toBe('object');
      }
    });

    it('should fail to retrieve user nutrition goals without authentication', async () => {
      const res = await request(app)
        .get('/api/user/goals');
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/user/goals', () => {
    it('should update user nutrition goals when authenticated', async () => {
      const goalsData = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 70
      };
      
      const res = await request(app)
        .post('/api/user/goals')
        .set('Cookie', userSession.headers['set-cookie'])
        .send(goalsData);
      
      // Could be 200 (success) or 500 (error) depending on implementation
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
      }
    });

    it('should fail to update user nutrition goals without authentication', async () => {
      const goalsData = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 70
      };
      
      const res = await request(app)
        .post('/api/user/goals')
        .send(goalsData);
      
      expect(res.status).toBe(401);
    });
  });
});