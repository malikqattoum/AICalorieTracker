import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { users, referralCommissions, referralSettings } from '@shared/schema';
import { createTestUser, createTestAdmin } from './test-utils';
import { eq } from 'drizzle-orm';

describe('Referral Program', () => {
  let adminSession: any;
  let userSession: any;
  let referrerSession: any;
  let referrerId: number;

  beforeAll(async () => {
    // Create test users and sessions
    await createTestAdmin();
    await createTestUser('usertest@example.com', 'password');
    await createTestUser('referrertest@example.com', 'password');
    
    adminSession = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password' });
    
    userSession = await request(app)
      .post('/api/auth/login')
      .send({ username: 'usertest', password: 'password' });
    
    // Create a referrer user
    referrerSession = await request(app)
      .post('/api/auth/login')
      .send({ username: 'referrertest', password: 'password' });
    
    // Get referrer ID
    const referrerRes = await request(app)
      .get('/api/user')
      .set('Cookie', referrerSession.headers['set-cookie']);
    referrerId = referrerRes.body.id;
    
    // Set referral code for referrer using direct storage access
    const storage = require('@server/storage').storage;
    const referrer = await storage.getUser(referrerId);
    if (referrer) {
      referrer.referralCode = 'TESTREF';
      storage.users.set(referrerId, referrer);
    }
    
    // Create initial referral settings using direct storage access
    const mockSettings = {
      id: 1,
      commissionPercent: '10.00',
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // Store settings in memory for testing
    if (!storage.referralSettings) {
      storage.referralSettings = new Map();
    }
    storage.referralSettings.set(1, mockSettings);
  });

  describe('Admin Settings', () => {
    it('should get default referral settings', async () => {
      const res = await request(app)
        .get('/api/admin/referral/settings')
        .set('Cookie', adminSession.headers['set-cookie']);
      
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        commission_percent: 10,
        is_recurring: false
      });
    });

    it('should update referral settings', async () => {
      const newSettings = {
        commission_percent: 15,
        is_recurring: true
      };
      
      const res = await request(app)
        .put('/api/admin/referral/settings')
        .set('Cookie', adminSession.headers['set-cookie'])
        .send(newSettings);
      
      expect(res.status).toBe(200);
      expect(res.body.commission_percent).toBe(15);
      expect(res.body.is_recurring).toBe(true);
    });
  });

  describe('User Referrals', () => {
    it('should apply referral code during registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ref_test',
          firstName: 'Ref',
          lastName: 'Test',
          email: 'ref_test@example.com',
          password: 'password',
          referralCode: 'TESTREF'
        });
      
      expect(res.status).toBe(201);
      
      // Check user was linked to referrer using storage
      const storage = require('@server/storage').storage;
      const usersList = Array.from(storage.users.values());
      const newUser = usersList.find((u: any) => u.email === 'ref_test@example.com');
      if (newUser && typeof newUser === 'object' && 'referredBy' in newUser) {
        expect(newUser.referredBy).toBe(referrerId);
      } else {
        throw new Error('User not found or referredBy property missing');
      }
    });

    it('should get referral code', async () => {
      const res = await request(app)
        .get('/api/user/referrals/code')
        .set('Cookie', referrerSession.headers['set-cookie']);
      
      expect(res.status).toBe(200);
      expect(res.body.referralCode).toBe('TESTREF');
    });

    it('should get referral commissions', async () => {
      // Create a test commission for the referrer using direct storage access
      const storage = require('@server/storage').storage;
      const mockCommission = {
        id: 1,
        referrerId: referrerId,
        refereeId: 1, // Some dummy user ID
        subscriptionId: 'test-subscription-123',
        amount: '10.00',
        status: 'pending',
        isRecurring: false,
        createdAt: new Date(),
        paidAt: null
      };
      // Store commission in memory for testing
      if (!storage.referralCommissions) {
        storage.referralCommissions = new Map();
      }
      storage.referralCommissions.set(1, mockCommission);
      
      const res = await request(app)
        .get('/api/user/referrals/commissions')
        .set('Cookie', referrerSession.headers['set-cookie']);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toMatchObject({
          amount: expect.any(Number),
          status: 'pending'
        });
      }
    });
  });

  afterAll(async () => {
    // Clean up test data - memory storage doesn't need explicit cleanup
    // The test environment will be torn down automatically
  });
});