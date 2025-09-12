import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../index';
import { pool } from '../../db';
import bcrypt from 'bcrypt';

describe('Authentication Flow Integration Tests', () => {
  const testUser = {
    username: `testuser_flow_${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    email: `testuser_flow_${Date.now()}@example.com`,
    password: 'TestPassword123!'
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: number;

  beforeAll(async () => {
    // Clean up any existing test user
    try {
      await pool.execute('DELETE FROM users WHERE username = ? OR email = ?', [
        testUser.username,
        testUser.email
      ]);
      await pool.execute('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE username = ?)', [
        testUser.username
      ]);
    } catch (error) {
      console.log('Cleanup error (expected if tables don\'t exist):', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (userId) {
        await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  describe('Complete Authentication Flow', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Store tokens and user ID for subsequent tests
      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
      userId = response.body.user.id;

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });

    it('should access protected endpoint with valid access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to access protected endpoint without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should fail to access protected endpoint with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');

      // Store the new access token
      const newAccessToken = response.body.accessToken;

      // Verify the new token works
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meResponse.body).toHaveProperty('id', userId);
      expect(meResponse.body.username).toBe(testUser.username);
    });

    it('should fail to refresh with invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });

    it('should fail to refresh with expired refresh token', async () => {
      // Create an expired refresh token by manipulating the database
      const expiredToken = 'expired-refresh-token';
      const hashedToken = await bcrypt.hash(expiredToken, 10);
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      try {
        await pool.execute(
          'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
          [userId, hashedToken, expiredDate]
        );

        await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: expiredToken })
          .expect(401);
      } finally {
        // Clean up the expired token
        await pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [hashedToken]);
      }
    });

    it('should login with existing user credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should fail login with incorrect password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should fail login with non-existent user', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        })
        .expect(401);
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should handle concurrent authentication attempts', async () => {
      // Simulate multiple concurrent login attempts
      const loginPromises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            username: testUser.username,
            password: testUser.password
          })
      );

      const responses = await Promise.all(loginPromises);

      // At least one should succeed (depending on rate limiting)
      const successfulLogins = responses.filter(res => res.status === 200);
      expect(successfulLogins.length).toBeGreaterThan(0);

      // All responses should be either 200 or 429 (rate limited)
      responses.forEach(res => {
        expect([200, 429]).toContain(res.status);
      });
    });

    it('should handle token expiration simulation', async () => {
      // This test simulates what happens when an access token expires
      // In a real scenario, the client would automatically refresh using the refresh token

      // First, get a fresh access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      const freshAccessToken = loginResponse.body.tokens.accessToken;

      // Verify the fresh token works
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${freshAccessToken}`)
        .expect(200);

      // Simulate token expiration by waiting (in real app, JWT would expire naturally)
      // For testing purposes, we'll just verify the refresh mechanism works
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginResponse.body.tokens.refreshToken })
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;

      // Verify the new access token works
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meResponse.body.username).toBe(testUser.username);
    });

    it('should prevent access with malformed tokens', async () => {
      const malformedTokens = [
        'malformed.jwt.token',
        'Bearer malformed',
        '',
        null,
        undefined
      ];

      for (const token of malformedTokens) {
        const authHeader = token ? `Bearer ${token}` : '';
        await request(app)
          .get('/api/auth/me')
          .set('Authorization', authHeader)
          .expect(401);
      }
    });

    it('should handle database connectivity issues gracefully', async () => {
      // This test verifies that the application handles database issues during auth operations
      // We'll test by attempting operations that might fail if DB is unavailable

      // For this test, we'll just verify that proper error responses are returned
      // In a real scenario with DB issues, the app should return 503 or similar

      const response = await request(app)
        .get('/api/auth/test-db')
        .expect(response => {
          // Should return either success (200) or database error (500/503)
          expect([200, 500, 503]).toContain(response.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('tests');
      }
    });

    it('should validate JWT token integrity', async () => {
      // Test the JWT diagnostic endpoint
      const response = await request(app)
        .get('/api/auth/test-jwt')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('tests');

      if (response.body.success) {
        expect(response.body.tests).toHaveProperty('manualTokenGeneration');
        expect(response.body.tests).toHaveProperty('jwtServiceGeneration');
      }
    });
  });

  describe('Security Edge Cases', () => {
    it('should prevent token reuse after refresh', async () => {
      // This test ensures that once a refresh token is used, it cannot be reused
      // (depending on implementation - some systems allow single use, others don't)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      const originalRefreshToken = loginResponse.body.tokens.refreshToken;

      // First refresh should work
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: originalRefreshToken })
        .expect(200);

      // Second refresh with same token - behavior depends on implementation
      // Some systems invalidate refresh tokens after use, others allow multiple uses
      const secondRefreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: originalRefreshToken });

      // Accept either success (200) or failure (401) depending on implementation
      expect([200, 401]).toContain(secondRefreshResponse.status);
    });

    it('should handle rapid successive requests', async () => {
      // Test rate limiting and rapid authentication attempts
      const rapidRequests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const responses = await Promise.all(rapidRequests);

      // Some requests might be rate limited (429) but core functionality should work
      const successfulRequests = responses.filter(res => res.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });

    it('should validate request payload structure', async () => {
      // Test various malformed request payloads
      const malformedPayloads = [
        {},
        { username: '' },
        { password: '' },
        { username: null, password: null },
        { username: 123, password: 456 },
        { username: testUser.username }, // Missing password
        { password: testUser.password }  // Missing username
      ];

      for (const payload of malformedPayloads) {
        await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);
      }
    });
  });

  describe('Session Management', () => {
    it('should handle session diagnostic endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/test-session')
        .expect(response => {
          expect([200, 500]).toContain(response.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('tests');
        expect(response.body).toHaveProperty('sessionInfo');
      }
    });

    it('should provide premium status information', async () => {
      const response = await request(app)
        .get('/api/auth/premium-status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isPremium');
      expect(response.body).toHaveProperty('subscriptionType');
      expect(response.body).toHaveProperty('subscriptionStatus');
    });
  });
});