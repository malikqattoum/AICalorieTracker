import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, createTestAdmin } from './test-utils';

describe('Enhanced Food Recognition Tests', () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user and admin
    userToken = await createTestUser('enhanced-food@test.com', 'password123');
    adminToken = await createTestAdmin();
    
    // Get user ID for test user
    const user = await db.select().from(users).where(eq(users.email, 'enhanced-food@test.com'));
    testUserId = user[0].id;
  });

  describe('Enhanced Food Analysis', () => {
    it('should analyze food with enhanced features', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          includeNutrition: true,
          includeAllergens: true,
          includePortionSize: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodName).toBeDefined();
      expect(response.body.data.nutrition).toBeDefined();
      expect(response.body.data.allergens).toBeDefined();
      expect(response.body.data.portionSize).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
    });

    it('should analyze food with basic features only', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          includeNutrition: false,
          includeAllergens: false,
          includePortionSize: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodName).toBeDefined();
      expect(response.body.data.nutrition).toBeUndefined();
      expect(response.body.data.allergens).toBeUndefined();
      expect(response.body.data.portionSize).toBeUndefined();
    });

    it('should handle missing image data', async () => {
      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({}) // Missing imageData
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate image data format', async () => {
      const invalidImageData = 'invalid-image-data';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: invalidImageData })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Food Allergen Detection', () => {
    it('should detect common allergens', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/food-allergens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.detectedAllergens).toBeDefined();
      expect(Array.isArray(response.body.data.detectedAllergens)).toBe(true);
      expect(response.body.data.riskLevel).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(response.body.data.riskLevel);
    });

    it('should handle user allergies', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/food-allergens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          userAllergies: ['nuts', 'dairy', 'gluten']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userAllergensDetected).toBeDefined();
      expect(Array.isArray(response.body.data.userAllergensDetected)).toBe(true);
    });
  });

  describe('Portion Size Estimation', () => {
    it('should estimate portion size', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/portion-size-estimation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          referenceObject: 'hand' // Common reference object
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.estimatedWeight).toBeDefined();
      expect(response.body.data.referenceObject).toBe('hand');
      expect(response.body.data.confidence).toBeDefined();
    });

    it('should handle different reference objects', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const referenceObjects = ['coin', 'credit_card', 'smartphone'];
      
      for (const referenceObject of referenceObjects) {
        const response = await request(app)
          .post('/api/portion-size-estimation')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ 
            imageData: testImage,
            referenceObject: referenceObject
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.referenceObject).toBe(referenceObject);
      }
    });

    it('should validate reference object', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/portion-size-estimation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          referenceObject: 'invalid_object'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Food Classification', () => {
    it('should classify food into categories', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/food-classification')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.subcategory).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
    });

    it('should handle multiple food items', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/multi-food-classification')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodItems).toBeDefined();
      expect(Array.isArray(response.body.data.foodItems)).toBe(true);
      expect(response.body.data.foodItems.length).toBeGreaterThan(0);
    });
  });

  describe('Nutritional Analysis', () => {
    it('should provide detailed nutritional analysis', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/detailed-nutrition-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          includeMicronutrients: true,
          includeVitamins: true,
          includeMinerals: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.macronutrients).toBeDefined();
      expect(response.body.data.micronutrients).toBeDefined();
      expect(response.body.data.vitamins).toBeDefined();
      expect(response.body.data.minerals).toBeDefined();
      expect(response.body.data.dailyValues).toBeDefined();
    });

    it('should provide basic nutritional analysis', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/detailed-nutrition-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          includeMicronutrients: false,
          includeVitamins: false,
          includeMinerals: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.macronutrients).toBeDefined();
      expect(response.body.data.micronutrients).toBeUndefined();
      expect(response.body.data.vitamins).toBeUndefined();
      expect(response.body.data.minerals).toBeUndefined();
    });
  });

  describe('Food Database Lookup', () => {
    it('should lookup food in database', async () => {
      const foodName = 'apple';

      const response = await request(app)
        .post('/api/food-database-lookup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ foodName })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.results).toBeDefined();
      expect(Array.isArray(response.body.data.results)).toBe(true);
    });

    it('should handle partial food name search', async () => {
      const partialName = 'app';

      const response = await request(app)
        .post('/api/food-database-lookup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ foodName: partialName })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.results).toBeDefined();
    });

    it('should handle empty food name', async () => {
      const response = await request(app)
        .post('/api/food-database-lookup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ foodName: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Food Recognition Performance', () => {
    it('should handle multiple food items in one image', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          detectMultipleItems: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.multipleItems).toBeDefined();
      expect(Array.isArray(response.body.data.multipleItems)).toBe(true);
    });

    it('should handle low confidence results', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          minConfidence: 0.9
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
    });
  });

  describe('Enhanced Food Recognition Error Handling', () => {
    it('should handle invalid image format', async () => {
      const invalidImage = 'not-a-base64-image';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: invalidImage })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle corrupted image data', async () => {
      const corruptedImage = 'data:image/png;base64,corrupted-data';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: corruptedImage })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle timeout scenarios', async () => {
      // This would need to be mocked in a real test environment
      const largeImage = 'data:image/png;base64,' + 'A'.repeat(1000000);

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: largeImage })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle service unavailability', async () => {
      // This would need to be mocked in a real test environment
      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: 'invalid' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Enhanced Food Recognition Integration', () => {
    it('should integrate with meal analysis', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/enhanced-meal-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          includeAllFeatures: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodAnalysis).toBeDefined();
      expect(response.body.data.nutritionAnalysis).toBeDefined();
      expect(response.body.data.allergenAnalysis).toBeDefined();
      expect(response.body.data.portionAnalysis).toBeDefined();
    });

    it('should save enhanced analysis to database', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/enhanced-food-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          saveToDatabase: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.analysisId).toBeDefined();
    });
  });
});