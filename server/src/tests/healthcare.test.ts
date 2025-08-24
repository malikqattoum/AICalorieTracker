import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, createTestAdmin } from './test-utils';

describe('Healthcare Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user and admin
    userToken = await createTestUser('healthcare@test.com', 'password123');
    adminToken = await createTestAdmin();
    
    // Get user ID for test user
    const user = await db.select().from(users).where(eq(users.email, 'healthcare@test.com'));
    testUserId = user[0].id;
  });

  describe('GET /api/user/healthcare/integrations', () => {
    it('should get user healthcare integrations', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/integrations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/integrations')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('POST /api/user/healthcare/integrations', () => {
    it('should create healthcare integration', async () => {
      const integrationData = {
        provider: 'apple_health',
        providerId: 'test_apple_health_id',
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        scopes: ['health', 'fitness', 'workout'],
        settings: {
          autoSync: true,
          syncFrequency: 60,
          selectedMetrics: ['steps', 'heart_rate', 'sleep_duration'],
          privacySettings: {
            shareData: false,
            anonymizeData: true,
            dataRetention: 365
          },
          notificationSettings: {
            syncComplete: true,
            lowBattery: false,
            syncFailed: true,
            insights: true
          }
        }
      };

      const response = await request(app)
        .post('/api/user/healthcare/integrations')
        .set('Authorization', `Bearer ${userToken}`)
        .send(integrationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.provider).toBe('apple_health');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        provider: 'invalid_provider',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/user/healthcare/integrations')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user/healthcare/integrations/:integrationId', () => {
    let integrationId: string;

    beforeAll(async () => {
      // Create a healthcare integration first
      const integrationData = {
        provider: 'apple_health',
        providerId: 'test_apple_health_id_2',
        accessToken: 'mock_access_token_2',
        refreshToken: 'mock_refresh_token_2',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        scopes: ['health', 'fitness', 'workout'],
        settings: {
          autoSync: true,
          syncFrequency: 60,
          selectedMetrics: ['steps', 'heart_rate', 'sleep_duration'],
          privacySettings: {
            shareData: false,
            anonymizeData: true,
            dataRetention: 365
          },
          notificationSettings: {
            syncComplete: true,
            lowBattery: false,
            syncFailed: true,
            insights: true
          }
        }
      };

      const response = await request(app)
        .post('/api/user/healthcare/integrations')
        .set('Authorization', `Bearer ${userToken}`)
        .send(integrationData);

      integrationId = response.body.data.id;
    });

    it('should get healthcare integration by ID', async () => {
      const response = await request(app)
        .get(`/api/user/healthcare/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(integrationId);
    });

    it('should fail for non-existent integration', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/integrations/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/user/healthcare/integrations/:integrationId', () => {
    let integrationId: string;

    beforeAll(async () => {
      // Create a healthcare integration first
      const integrationData = {
        provider: 'google_fit',
        providerId: 'test_google_fit_id',
        accessToken: 'mock_access_token_3',
        refreshToken: 'mock_refresh_token_3',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        scopes: ['health', 'fitness', 'workout'],
        settings: {
          autoSync: true,
          syncFrequency: 60,
          selectedMetrics: ['steps', 'heart_rate', 'sleep_duration'],
          privacySettings: {
            shareData: false,
            anonymizeData: true,
            dataRetention: 365
          },
          notificationSettings: {
            syncComplete: true,
            lowBattery: false,
            syncFailed: true,
            insights: true
          }
        }
      };

      const response = await request(app)
        .post('/api/user/healthcare/integrations')
        .set('Authorization', `Bearer ${userToken}`)
        .send(integrationData);

      integrationId = response.body.data.id;
    });

    it('should update healthcare integration', async () => {
      const updateData = {
        settings: {
          autoSync: false,
          syncFrequency: 120,
          selectedMetrics: ['steps', 'heart_rate'],
          privacySettings: {
            shareData: true,
            anonymizeData: false,
            dataRetention: 180
          },
          notificationSettings: {
            syncComplete: false,
            lowBattery: true,
            syncFailed: true,
            insights: false
          }
        }
      };

      const response = await request(app)
        .put(`/api/user/healthcare/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.settings.autoSync).toBe(false);
      expect(response.body.data.settings.syncFrequency).toBe(120);
    });
  });

  describe('DELETE /api/user/healthcare/integrations/:integrationId', () => {
    let integrationId: string;

    beforeAll(async () => {
      // Create a healthcare integration first
      const integrationData = {
        provider: 'fitbit',
        providerId: 'test_fitbit_id',
        accessToken: 'mock_access_token_4',
        refreshToken: 'mock_refresh_token_4',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        scopes: ['health', 'fitness', 'workout'],
        settings: {
          autoSync: true,
          syncFrequency: 60,
          selectedMetrics: ['steps', 'heart_rate', 'sleep_duration'],
          privacySettings: {
            shareData: false,
            anonymizeData: true,
            dataRetention: 365
          },
          notificationSettings: {
            syncComplete: true,
            lowBattery: false,
            syncFailed: true,
            insights: true
          }
        }
      };

      const response = await request(app)
        .post('/api/user/healthcare/integrations')
        .set('Authorization', `Bearer ${userToken}`)
        .send(integrationData);

      integrationId = response.body.data.id;
    });

    it('should delete healthcare integration', async () => {
      const response = await request(app)
        .delete(`/api/user/healthcare/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Healthcare integration deleted successfully');
    });
  });

  describe('POST /api/user/healthcare/sessions', () => {
    it('should create healthcare session', async () => {
      const sessionData = {
        type: 'consultation',
        title: 'Nutrition Consultation',
        description: 'Discussion about nutrition goals',
        duration: 60,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        provider: 'nutritionist',
        status: 'scheduled'
      };

      const response = await request(app)
        .post('/api/user/healthcare/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sessionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('consultation');
      expect(response.body.data.title).toBe('Nutrition Consultation');
    });
  });

  describe('GET /api/user/healthcare/sessions', () => {
    let sessionId: string;

    beforeAll(async () => {
      // Create a healthcare session first
      const sessionData = {
        type: 'consultation',
        title: 'Follow-up Consultation',
        description: 'Follow-up discussion about progress',
        duration: 45,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        provider: 'nutritionist',
        status: 'scheduled'
      };

      const response = await request(app)
        .post('/api/user/healthcare/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sessionData);

      sessionId = response.body.data.id;
    });

    it('should get healthcare sessions', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter sessions by status', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ status: 'scheduled' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/user/healthcare/alerts', () => {
    it('should create healthcare alert', async () => {
      const alertData = {
        type: 'warning',
        title: 'High Heart Rate Alert',
        message: 'Your heart rate has been elevated for the past hour',
        priority: 'high',
        metricType: 'heart_rate',
        value: 120,
        threshold: 100,
        recommendation: 'Consider resting and monitoring your heart rate'
      };

      const response = await request(app)
        .post('/api/user/healthcare/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(alertData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('warning');
      expect(response.body.data.title).toBe('High Heart Rate Alert');
      expect(response.body.data.acknowledged).toBe(false);
    });
  });

  describe('GET /api/user/healthcare/alerts', () => {
    let alertId: string;

    beforeAll(async () => {
      // Create a healthcare alert first
      const alertData = {
        type: 'recommendation',
        title: 'Low Step Count',
        message: 'Your average daily steps is lower than recommended',
        priority: 'medium',
        metricType: 'steps',
        value: 3000,
        threshold: 8000,
        recommendation: 'Try to increase your daily step count'
      };

      const response = await request(app)
        .post('/api/user/healthcare/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(alertData);

      alertId = response.body.data.id;
    });

    it('should get healthcare alerts', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter alerts by type', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ type: 'recommendation' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/user/healthcare/alerts/:alertId/acknowledge', () => {
    let alertId: string;

    beforeAll(async () => {
      // Create a healthcare alert first
      const alertData = {
        type: 'warning',
        title: 'Sleep Alert',
        message: 'Your sleep duration is below recommended levels',
        priority: 'high',
        metricType: 'sleep_duration',
        value: 5,
        threshold: 7,
        recommendation: 'Try to maintain a consistent sleep schedule'
      };

      const response = await request(app)
        .post('/api/user/healthcare/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(alertData);

      alertId = response.body.data.id;
    });

    it('should acknowledge healthcare alert', async () => {
      const response = await request(app)
        .put(`/api/user/healthcare/alerts/${alertId}/acknowledge`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.acknowledged).toBe(true);
    });
  });

  describe('GET /api/user/healthcare/reports', () => {
    it('should generate healthcare report', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ type: 'weekly' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('weekly');
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.insights).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });

    it('should generate monthly report', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ type: 'monthly' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('monthly');
    });
  });

  describe('GET /api/user/healthcare/statistics', () => {
    it('should get healthcare statistics', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/statistics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalIntegrations).toBeDefined();
      expect(response.body.data.totalSessions).toBeDefined();
      expect(response.body.data.totalAlerts).toBeDefined();
      expect(response.body.data.activeIntegrations).toBeDefined();
    });
  });

  describe('GET /api/user/healthcare/export', () => {
    it('should export healthcare data', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/export')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ format: 'json' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data).toBe('string');
    });

    it('should export as CSV', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/export')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ format: 'csv' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data).toBe('string');
    });
  });

  describe('Healthcare Provider Configuration', () => {
    it('should list available healthcare providers', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/providers')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get provider details', async () => {
      const response = await request(app)
        .get('/api/user/healthcare/providers/apple_health')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Apple Health');
      expect(response.body.data.type).toBe('apple_health');
      expect(response.body.data.supportedMetrics).toBeDefined();
    });
  });
});

describe('Healthcare Integration Error Handling', () => {
  let userToken: string;
  let testUserId: number;

  beforeAll(async () => {
    userToken = await createTestUser('healthcare-error@test.com', 'password123');
    
    // Get user ID for test user
    const user = await db.select().from(users).where(eq(users.email, 'healthcare-error@test.com'));
    testUserId = user[0].id;
  });

  it('should handle invalid provider', async () => {
    const integrationData = {
      provider: 'invalid_provider',
      providerId: 'test_id',
      accessToken: 'mock_token',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: ['health'],
      settings: {
        autoSync: true,
        syncFrequency: 60,
        selectedMetrics: ['steps'],
        privacySettings: {
          shareData: false,
          anonymizeData: true,
          dataRetention: 365
        },
        notificationSettings: {
          syncComplete: true,
          lowBattery: false,
          syncFailed: true,
          insights: true
        }
      }
    };

    const response = await request(app)
      .post('/api/user/healthcare/integrations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(integrationData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should handle missing required fields', async () => {
    const incompleteData = {
      provider: 'apple_health'
      // Missing required fields like providerId, accessToken, etc.
    };

    const response = await request(app)
      .post('/api/user/healthcare/integrations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(incompleteData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should handle non-existent integration', async () => {
    const response = await request(app)
      .get('/api/user/healthcare/integrations/non-existent-id')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  it('should handle invalid alert data', async () => {
    const invalidAlertData = {
      type: 'invalid_type',
      title: '',
      message: 'Test message',
      priority: 'invalid_priority'
    };

    const response = await request(app)
      .post('/api/user/healthcare/alerts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(invalidAlertData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should handle invalid report type', async () => {
    const response = await request(app)
      .get('/api/user/healthcare/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ type: 'invalid_type' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should handle invalid export format', async () => {
    const response = await request(app)
      .get('/api/user/healthcare/export')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ format: 'invalid_format' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});