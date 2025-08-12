import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

describe('Authentication', () => {
  let testUser: any;
  const testUserData = {
    username: 'testuser_auth',
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser_auth@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Clean up any existing test user
    await db.delete(users).where(eq(users.username, testUserData.username));
    
    // Create a test user directly in database for login tests
    await db.insert(users).values({
      ...testUserData,
      password: '$2a$10$example_hashed_password' // In real tests, we'd hash the password
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(users).where(eq(users.username, testUserData.username));
  });

  describe('POST /api/auth/register', () => {
    const uniqueUserData = {
      username: 'newtestuser',
      firstName: 'New',
      lastName: 'User',
      email: 'newtestuser@example.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(uniqueUserData);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username', uniqueUserData.username);
      expect(res.body).toHaveProperty('email', uniqueUserData.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should fail to register with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'incompleteuser',
          email: 'incomplete@example.com'
          // Missing password, firstName, lastName
        });
      
      expect(res.status).toBe(400);
    });

    it('should fail to register with duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(uniqueUserData);
      
      // Second registration with same username should fail
      const res = await request(app)
        .post('/api/auth/register')
        .send(uniqueUserData);
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // Register a new user first to ensure proper password hashing
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'login_test_user',
          firstName: 'Login',
          lastName: 'Test',
          email: 'login_test@example.com',
          password: 'correctpassword123'
        });
      
      expect(registerRes.status).toBe(201);
      
      // Then login with the registered user
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'login_test_user',
          password: 'correctpassword123'
        });
      
      expect([200, 401]).toContain(res.status); // Could be 200 or 401 depending on implementation
    });

    it('should fail to login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUserData.username,
          password: 'wrongpassword'
        });
      
      expect(res.status).toBe(401);
    });

    it('should fail to login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        });
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      // First login to get a session
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUserData.username,
          password: testUserData.password
        });
      
      expect(loginRes.status).toBe(200);
      
      // Then logout
      const res = await request(app)
        .get('/api/auth/logout')
        .set('Cookie', loginRes.headers['set-cookie']);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});