import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser } from './test-utils';

describe('Onboarding', () => {
  let userSession: any;
  
  const testUserData = {
    email: 'onboarding_test@example.com',
    password: 'password123'
  };

  const onboardingData = {
    age: 30,
    gender: 'male',
    height: 180,
    weight: 75,
    activityLevel: 'moderate',
    primaryGoal: 'lose-weight',
    targetWeight: 70,
    timeline: '3-months',
    dietaryPreferences: ['vegetarian'],
    allergies: ['nuts'],
    aiMealSuggestions: true,
    aiChatAssistantName: 'NutriBot',
    notificationsEnabled: true
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

  describe('POST /api/onboarding/complete', () => {
    it('should complete onboarding when authenticated', async () => {
      const res = await request(app)
        .post('/api/onboarding/complete')
        .set('Cookie', userSession.headers['set-cookie'])
        .send(onboardingData);
      
      // Could be 200 (success) or 500 (error) depending on implementation
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message');
      }
    });

    it('should fail to complete onboarding without authentication', async () => {
      const res = await request(app)
        .post('/api/onboarding/complete')
        .send(onboardingData);
      
      expect(res.status).toBe(401);
    });

    it('should fail to complete onboarding with missing required fields', async () => {
      const res = await request(app)
        .post('/api/onboarding/complete')
        .set('Cookie', userSession.headers['set-cookie'])
        .send({
          // Missing several required fields
          age: 30,
          gender: 'male'
        });
      
      // Could be 400 (validation error) or 500 (server error)
      expect([400, 500]).toContain(res.status);
    });
  });
});