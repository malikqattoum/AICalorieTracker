import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, createTestAdmin } from './test-utils';

describe('AI Service Tests', () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user and admin
    userToken = await createTestUser('ai-service@test.com', 'password123');
    adminToken = await createTestAdmin();
    
    // Get user ID for test user
    const user = await db.select().from(users).where(eq(users.email, 'ai-service@test.com'));
    testUserId = user[0].id;
  });

  describe('AI Configuration Management', () => {
    it('should get AI configurations', async () => {
      const response = await request(app)
        .get('/api/admin/ai-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail to get AI configs without admin access', async () => {
      const response = await request(app)
        .get('/api/admin/ai-config')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toBe('Admin access required');
    });

    it('should update AI configuration', async () => {
      // First get existing configs to find one to update
      const getConfigResponse = await request(app)
        .get('/api/admin/ai-config')
        .set('Authorization', `Bearer ${adminToken}`);

      const configId = getConfigResponse.body.data[0]?.id;
      
      if (configId) {
        const updateData = {
          temperature: 75, // 0.75
          maxTokens: 1500,
          promptTemplate: 'Updated prompt template for food analysis',
          isActive: true
        };

        const response = await request(app)
          .put(`/api/admin/ai-config/${configId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('AI configuration updated successfully');
      }
    });

    it('should activate AI configuration', async () => {
      // First get existing configs to find one to activate
      const getConfigResponse = await request(app)
        .get('/api/admin/ai-config')
        .set('Authorization', `Bearer ${adminToken}`);

      const configId = getConfigResponse.body.data[0]?.id;
      
      if (configId) {
        const response = await request(app)
          .post(`/api/admin/ai-config/${configId}/activate`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('AI provider activated successfully');
      }
    });
  });

  describe('AI Food Analysis', () => {
    it('should analyze food image', async () => {
      // Create a base64 test image (simple 1x1 pixel white image)
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodName).toBeDefined();
      expect(response.body.data.calories).toBeDefined();
      expect(response.body.data.protein).toBeDefined();
      expect(response.body.data.carbs).toBeDefined();
      expect(response.body.data.fat).toBeDefined();
    });

    it('should handle demo analysis without authentication', async () => {
      // Create a base64 test image
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/demo-analyze')
        .send({ imageData: testImage })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.foodName).toBeDefined();
      expect(response.body.calories).toBeDefined();
    });

    it('should analyze complex meal with multiple images', async () => {
      // Create multiple base64 test images
      const testImages = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      ];

      const response = await request(app)
        .post('/api/analyze-complex-meal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ images: testImages })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foods).toBeDefined();
      expect(Array.isArray(response.body.data.foods)).toBe(true);
      expect(response.body.data.foods.length).toBe(2);
      expect(response.body.data.totalCalories).toBeDefined();
      expect(response.body.data.mealScore).toBeDefined();
      expect(response.body.data.nutritionalBalance).toBeDefined();
    });

    it('should validate image data format', async () => {
      const invalidImageData = 'invalid-image-data';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: invalidImageData })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing image data', async () => {
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({}) // Missing imageData
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('AI Meal Planning', () => {
    it('should generate meal plan', async () => {
      const mealPlanData = {
        goal: 'weight_loss',
        medicalCondition: 'diabetes'
      };

      const response = await request(app)
        .post('/api/meal-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mealPlanData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.plan).toBeDefined();
    });

    it('should require goal parameter', async () => {
      const response = await request(app)
        .post('/api/meal-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({}) // Missing goal
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('AI Nutrition Tips', () => {
    it('should get nutrition tips', async () => {
      const response = await request(app)
        .get('/api/nutrition-tips')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.tips).toBeDefined();
      expect(Array.isArray(response.body.data.tips)).toBe(true);
    });
  });

  describe('AI Smart Meal Suggestions', () => {
    it('should get smart meal suggestions', async () => {
      const response = await request(app)
        .get('/api/smart-meal-suggestions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });
  });

  describe('AI Nutrition Coach Chat', () => {
    it('should handle nutrition coach chat', async () => {
      const chatData = {
        messages: [
          {
            role: 'user',
            content: 'I want to lose weight, what should I eat?'
          }
        ]
      };

      const response = await request(app)
        .post('/api/nutrition-coach-chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send(chatData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reply).toBeDefined();
      expect(typeof response.body.data.reply).toBe('string');
    });

    it('should handle empty messages array', async () => {
      const chatData = {
        messages: []
      };

      const response = await request(app)
        .post('/api/nutrition-coach-chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send(chatData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing messages', async () => {
      const response = await request(app)
        .post('/api/nutrition-coach-chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({}) // Missing messages
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('AI Cache Management', () => {
    it('should cache analysis results', async () => {
      // Create a base64 test image
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      // First analysis
      const response1 = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      // Second analysis with same image (should be cached)
      const response2 = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      // Both should return similar results (cached)
      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      expect(response1.body.data.foodName).toBe(response2.body.data.foodName);
    });
  });

  describe('AI Service Error Handling', () => {
    it('should handle invalid image data', async () => {
      const invalidImage = 'not-a-base64-image';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: invalidImage })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle AI service timeout', async () => {
      // This test would need to mock a timeout scenario
      // For now, we'll test with a very large image that might cause timeout
      const largeImage = 'data:image/png;base64,' + 'A'.repeat(1000000);

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: largeImage })
        .expect(500);

      // The response might timeout or fail depending on the AI service
      expect(response.body.success).toBe(false);
    });

    it('should handle AI service unavailability', async () => {
      // This test would need to mock AI service unavailability
      // For now, we'll test with a malformed request
      const malformedImage = 'data:image/png;base64,invalid';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: malformedImage })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('AI Service Performance', () => {
    it('should handle concurrent requests', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      // Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/analyze-food')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ imageData: testImage })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle large batch processing', async () => {
      const testImages = Array.from({ length: 10 }, () =>
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      );

      const response = await request(app)
        .post('/api/analyze-complex-meal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ images: testImages })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foods.length).toBe(10);
    });
  });
});