import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users, wearableData } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, createTestAdmin } from './test-utils';

describe('Wearable Device Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user and admin
    userToken = await createTestUser('wearable@test.com', 'password123');
    adminToken = await createTestAdmin();
    
    // Get user ID for test user
    const user = await db.select().from(users).where(eq(users.email, 'wearable@test.com'));
    testUserId = user[0].id;
  });

  beforeEach(async () => {
    // Clean up wearable data before each test
    await db.delete(wearableData).where(eq(wearableData.userId, testUserId));
  });

  describe('GET /api/wearable/devices', () => {
    it('should get user devices without authentication', async () => {
      const response = await request(app)
        .get('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/wearable/devices')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('POST /api/wearable/devices', () => {
    it('should create a new device', async () => {
      const deviceData = {
        name: 'Test Fitness Tracker',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'FitPro 1.0',
        firmwareVersion: '1.2.3',
        serialNumber: 'TEST123456',
        metadata: {
          color: 'black',
          features: ['heart_rate', 'sleep_tracking']
        }
      };

      const response = await request(app)
        .post('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deviceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(deviceData.name);
      expect(response.body.data.type).toBe(deviceData.type);
      expect(response.body.data.manufacturer).toBe(deviceData.manufacturer);
      expect(response.body.data.model).toBe(deviceData.model);
      expect(response.body.data.isConnected).toBe(true);
    });

    it('should fail without authentication', async () => {
      const deviceData = {
        name: 'Test Device',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'Test 1.0'
      };

      const response = await request(app)
        .post('/api/wearable/devices')
        .send(deviceData)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('POST /api/wearable/devices/:deviceId/connect', () => {
    it('should connect a device', async () => {
      // First create a device
      const deviceData = {
        name: 'Test Device',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'Test 1.0'
      };

      const createResponse = await request(app)
        .post('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deviceData);

      const deviceId = createResponse.body.data.id;

      // Now connect it
      const response = await request(app)
        .post(`/api/wearable/devices/${deviceId}/connect`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isConnected).toBe(true);
      expect(response.body.data.lastSyncAt).toBeDefined();
    });
  });

  describe('POST /api/wearable/devices/:deviceId/disconnect', () => {
    it('should disconnect a device', async () => {
      // First create and connect a device
      const deviceData = {
        name: 'Test Device',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'Test 1.0'
      };

      const createResponse = await request(app)
        .post('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deviceData);

      const deviceId = createResponse.body.data.id;

      // Connect the device
      await request(app)
        .post(`/api/wearable/devices/${deviceId}/connect`)
        .set('Authorization', `Bearer ${userToken}`);

      // Now disconnect it
      const response = await request(app)
        .post(`/api/wearable/devices/${deviceId}/disconnect`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isConnected).toBe(false);
    });
  });

  describe('GET /api/wearable/devices/:deviceId/status', () => {
    it('should get device status', async () => {
      // First create a device
      const deviceData = {
        name: 'Test Device',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'Test 1.0'
      };

      const createResponse = await request(app)
        .post('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deviceData);

      const deviceId = createResponse.body.data.id;

      // Get device status
      const response = await request(app)
        .get(`/api/wearable/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(deviceId);
    });
  });

  describe('POST /api/wearable/devices/:deviceId/sync', () => {
    it('should sync device data', async () => {
      // First create and connect a device
      const deviceData = {
        name: 'Test Device',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'Test 1.0'
      };

      const createResponse = await request(app)
        .post('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deviceData);

      const deviceId = createResponse.body.data.id;

      // Connect the device
      await request(app)
        .post(`/api/wearable/devices/${deviceId}/connect`)
        .set('Authorization', `Bearer ${userToken}`);

      // Sync device data
      const response = await request(app)
        .post(`/api/wearable/devices/${deviceId}/sync`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.syncedRecords).toBeDefined();
      expect(response.body.data.syncedAt).toBeDefined();
    });
  });

  describe('GET /api/wearable/devices/:deviceId/sync-logs', () => {
    it('should get sync logs', async () => {
      // First create and sync a device
      const deviceData = {
        name: 'Test Device',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'Test 1.0'
      };

      const createResponse = await request(app)
        .post('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deviceData);

      const deviceId = createResponse.body.data.id;

      // Connect and sync the device
      await request(app)
        .post(`/api/wearable/devices/${deviceId}/connect`)
        .set('Authorization', `Bearer ${userToken}`);

      await request(app)
        .post(`/api/wearable/devices/${deviceId}/sync`)
        .set('Authorization', `Bearer ${userToken}`);

      // Get sync logs
      const response = await request(app)
        .get(`/api/wearable/devices/${deviceId}/sync-logs`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/wearable/health-data', () => {
    it('should save health data', async () => {
      const healthData = {
        userId: testUserId,
        deviceType: 'fitness_tracker',
        steps: 8432,
        heartRate: 72,
        caloriesBurned: 342,
        sleepHours: 7.5,
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/wearable/health-data')
        .set('Authorization', `Bearer ${userToken}`)
        .send(healthData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wearable data received and processed successfully');
      expect(response.body.data).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        userId: testUserId,
        // Missing required fields
        deviceType: 'fitness_tracker'
      };

      const response = await request(app)
        .post('/api/wearable/health-data')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/wearable/health-data', () => {
    beforeEach(async () => {
      // Add some test health data
      await db.insert(wearableData).values({
        userId: testUserId,
        deviceType: 'fitness_tracker',
        steps: 8432,
        heartRate: 72,
        caloriesBurned: 342,
        sleepHours: 7.5,
        date: new Date()
      });
    });

    it('should get health data', async () => {
      const response = await request(app)
        .get('/api/wearable/health-data')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter health data by date range', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const response = await request(app)
        .get('/api/wearable/health-data')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ 
          userId: testUserId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/wearable/health-data/aggregated', () => {
    it('should get aggregated health data', async () => {
      const query = {
        userId: testUserId,
        metricTypes: ['steps', 'heart_rate'],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        endDate: new Date().toISOString(),
        aggregation: 'daily' as const,
        aggregateFunction: 'avg' as const
      };

      const response = await request(app)
        .post('/api/wearable/health-data/aggregated')
        .set('Authorization', `Bearer ${userToken}`)
        .send(query)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/wearable/health-insights', () => {
    it('should get health insights', async () => {
      const query = {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          end: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/wearable/health-insights')
        .set('Authorization', `Bearer ${userToken}`)
        .send(query)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/wearable/recommendations/:userId', () => {
    it('should get device recommendations', async () => {
      const response = await request(app)
        .get(`/api/wearable/recommendations/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail for unauthorized user', async () => {
      // Create another user
      const otherUserToken = await createTestUser('other@test.com', 'password123');
      
      const response = await request(app)
        .get(`/api/wearable/recommendations/${testUserId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/wearable/devices/:deviceId/import-data', () => {
    it('should import data from file', async () => {
      // First create a device
      const deviceData = {
        name: 'Test Device',
        type: 'fitness_tracker',
        manufacturer: 'TestCorp',
        model: 'Test 1.0'
      };

      const createResponse = await request(app)
        .post('/api/wearable/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deviceData);

      const deviceId = createResponse.body.data.id;

      // Import data
      const importData = {
        deviceId: deviceId
      };

      const response = await request(app)
        .post(`/api/wearable/devices/${deviceId}/import-data`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(importData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.recordsImported).toBeDefined();
    });
  });

  describe('Legacy endpoint POST /api/wearables', () => {
    it('should handle legacy wearable data submission', async () => {
      const wearableData = {
        userId: testUserId,
        deviceType: 'fitness_tracker',
        steps: 8432,
        heartRate: 72,
        caloriesBurned: 342,
        sleepHours: 7.5,
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/wearables')
        .set('Authorization', `Bearer ${userToken}`)
        .send(wearableData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wearable data received and processed successfully');
    });
  });
});

describe('Wearable Device Integration Error Handling', () => {
  let userToken: string;
  let testUserId: number;

  beforeAll(async () => {
    userToken = await createTestUser('wearable-error@test.com', 'password123');
    
    // Get user ID for test user
    const user = await db.select().from(users).where(eq(users.email, 'wearable-error@test.com'));
    testUserId = user[0].id;
  });

  beforeEach(async () => {
    // Clean up wearable data before each test
    await db.delete(wearableData).where(eq(wearableData.userId, testUserId));
  });

  it('should handle invalid device ID', async () => {
    const response = await request(app)
      .get('/api/wearable/devices/invalid-device-id/status')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(500);

    expect(response.body.success).toBe(false);
  });

  it('should handle sync failure gracefully', async () => {
    // First create a device
    const deviceData = {
      name: 'Test Device',
      type: 'fitness_tracker',
      manufacturer: 'TestCorp',
      model: 'Test 1.0'
    };

    const createResponse = await request(app)
      .post('/api/wearable/devices')
      .set('Authorization', `Bearer ${userToken}`)
      .send(deviceData);

    const deviceId = createResponse.body.data.id;

    // Try to sync without connecting first
    const response = await request(app)
      .post(`/api/wearable/devices/${deviceId}/sync`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(500);

    expect(response.body.success).toBe(false);
  });

  it('should handle invalid health data', async () => {
    const invalidData = {
      userId: testUserId,
      steps: -100, // Invalid negative steps
      heartRate: 300, // Invalid heart rate
      timestamp: new Date().toISOString()
    };

    const response = await request(app)
      .post('/api/wearable/health-data')
      .set('Authorization', `Bearer ${userToken}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});