import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function createTestUser(email: string, password: string): Promise<string> {
  const username = email.split('@')[0];
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.username, username));
  if (existingUser.length > 0) {
    // Login existing user
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password });
    return res.body.token;
  }

  // Register new user
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      username,
      firstName: 'Test',
      lastName: 'User',
      email,
      password
    });
  return res.body.token;
}

export async function createTestAdmin(): Promise<string> {
  const adminEmail = 'admin@test.com';
  const adminUsername = 'admin';
  const adminPassword = 'password';
  
  // Check if admin already exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
  if (existingAdmin.length === 0) {
    // Register admin user through the API to ensure proper password hashing
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: adminUsername,
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: adminPassword
      });
    
    // Update user role to admin through direct database access
    // This simulates the initial admin setup
    if (res.status === 201) {
      await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, res.body.id));
    }
  }

  // Login admin user
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: adminUsername, password: adminPassword });
  
  return res.body.token;
}