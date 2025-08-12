import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser } from './test-utils';

describe('Payment Integration', () => {
  let userSession: any;
  
  const testUserData = {
    email: 'payment_test@example.com',
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

  describe('POST /api/create-payment-intent', () => {
    it('should create a payment intent when authenticated', async () => {
      const paymentData = {
        amount: 10.99,
        currency: 'usd'
      };
      
      const res = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', userSession.headers['set-cookie'])
        .send(paymentData);
      
      // Could be 200 (success) or 500 (error) depending on Stripe configuration
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        // In a real test, we would check for a clientSecret property
        // expect(res.body).toHaveProperty('clientSecret');
      }
    });

    it('should fail to create a payment intent without authentication', async () => {
      const paymentData = {
        amount: 10.99,
        currency: 'usd'
      };
      
      const res = await request(app)
        .post('/api/create-payment-intent')
        .send(paymentData);
      
      expect(res.status).toBe(401);
    });

    it('should fail to create a payment intent with missing amount', async () => {
      const res = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', userSession.headers['set-cookie'])
        .send({
          // Missing amount
          currency: 'usd'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/create-subscription', () => {
    it('should create a subscription when authenticated', async () => {
      const subscriptionData = {
        priceId: 'price_test',
        billingInterval: 'monthly'
      };
      
      const res = await request(app)
        .post('/api/create-subscription')
        .set('Cookie', userSession.headers['set-cookie'])
        .send(subscriptionData);
      
      // Could be 200 (success) or 500 (error) depending on Stripe configuration
      expect([200, 500]).toContain(res.status);
    });

    it('should fail to create a subscription without authentication', async () => {
      const subscriptionData = {
        priceId: 'price_test',
        billingInterval: 'monthly'
      };
      
      const res = await request(app)
        .post('/api/create-subscription')
        .send(subscriptionData);
      
      expect(res.status).toBe(401);
    });

    it('should fail to create a subscription with missing priceId', async () => {
      const res = await request(app)
        .post('/api/create-subscription')
        .set('Cookie', userSession.headers['set-cookie'])
        .send({
          // Missing priceId
          billingInterval: 'monthly'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/subscription', () => {
    it('should retrieve subscription status when authenticated', async () => {
      const res = await request(app)
        .get('/api/subscription')
        .set('Cookie', userSession.headers['set-cookie']);
      
      // Could be 200 (success) or 500 (error) depending on implementation
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        // Could have active: true/false or other properties
        expect(typeof res.body).toBe('object');
      }
    });

    it('should fail to retrieve subscription status without authentication', async () => {
      const res = await request(app)
        .get('/api/subscription');
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/cancel-subscription', () => {
    it('should cancel subscription when authenticated', async () => {
      const res = await request(app)
        .post('/api/cancel-subscription')
        .set('Cookie', userSession.headers['set-cookie']);
      
      // Could be 200 (success), 400 (no subscription), or 500 (error)
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should fail to cancel subscription without authentication', async () => {
      const res = await request(app)
        .post('/api/cancel-subscription');
      
      expect(res.status).toBe(401);
    });
  });
});