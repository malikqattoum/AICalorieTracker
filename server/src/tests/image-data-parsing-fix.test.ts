import request from 'supertest';
import { app } from '@server/index';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, createTestAdmin } from './test-utils';

describe('Image Data Parsing Fix Tests', () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user and admin
    userToken = await createTestUser('image-data-fix@test.com', 'password123');
    adminToken = await createTestAdmin();
    
    // Get user ID for test user
    const user = await db.select().from(users).where(eq(users.email, 'image-data-fix@test.com'));
    testUserId = user[0].id;
  });

  describe('Main Food Analysis Endpoint (/api/analyze-food)', () => {
    it('should analyze food with valid PNG image data', async () => {
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
      expect(response.body.data.confidence).toBeDefined();
    });

    it('should analyze food with valid JPEG image data', async () => {
      const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodName).toBeDefined();
    });

    it('should handle base64 data without data URL prefix', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: base64Data })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle empty image data', async () => {
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle null image data', async () => {
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle malformed base64 data', async () => {
      const malformedData = 'this-is-not-valid-base64-data!@#$%';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: malformedData })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle very small image data', async () => {
      const tinyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: tinyImage })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Enhanced Food Recognition Endpoints (/api/user/enhanced-food-recognition/*)', () => {
    it('should analyze single food with enhanced features', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/user/enhanced-food-recognition/analyze-single')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          options: { includeAlternatives: true }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodName).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
    });

    it('should analyze multiple food items', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/user/enhanced-food-recognition/analyze-multi')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should analyze restaurant menu', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/user/enhanced-food-recognition/analyze-restaurant-menu')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          restaurantName: 'Test Restaurant'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.restaurantInfo).toBeDefined();
    });

    it('should get enhanced food recognition status', async () => {
      const response = await request(app)
        .get('/api/user/enhanced-food-recognition/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.availableProviders).toBeDefined();
      expect(Array.isArray(response.body.data.availableProviders)).toBe(true);
    });

    it('should handle invalid image data in enhanced endpoints', async () => {
      const response = await request(app)
        .post('/api/user/enhanced-food-recognition/analyze-single')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Meal Analysis Endpoint (/api/meals/analyze)', () => {
    it('should analyze meal image with base64 data', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/user/meals/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodName).toBeDefined();
      expect(response.body.data.estimatedCalories).toBeDefined();
    });

    it('should handle missing imageData in meal analysis', async () => {
      const response = await request(app)
        .post('/api/user/meals/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large base64 strings efficiently', async () => {
      // Create a large base64 string (simulating a larger image)
      const largeBase64 = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='.repeat(1000);

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: largeBase64 })
        .expect(200);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle various image format prefixes', async () => {
      const testCases = [
        {
          name: 'PNG with prefix',
          image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          name: 'JPEG with prefix',
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/analyze-food')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ imageData: testCase.image })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should handle base64 data with newlines and spaces', async () => {
      const base64WithNewlines = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==\n';
      
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: base64WithNewlines })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Client-Server Flow Integration', () => {
    it('should handle camera capture simulation', async () => {
      // Simulate what the camera component would send
      const cameraCapture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: cameraCapture })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foodName).toBeDefined();
    });

    it('should handle file upload simulation', async () => {
      // Simulate what file upload would send
      const fileUpload = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: fileUpload })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foodName).toBeDefined();
    });

    it('should handle multi-food analysis flow', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/user/enhanced-food-recognition/analyze-multi')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          imageData: testImage,
          options: { detectMultiple: true }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Error Handling Verification', () => {
    it('should return proper error messages for invalid inputs', async () => {
      const testCases = [
        { 
          name: 'Invalid image data type',
          data: { imageData: 12345 },
          expectedError: 'Invalid image data format'
        },
        { 
          name: 'Missing imageData field',
          data: { otherField: 'value' },
          expectedError: 'Missing or invalid image data'
        },
        { 
          name: 'Null imageData',
          data: { imageData: null },
          expectedError: 'Missing or invalid image data'
        },
        { 
          name: 'Undefined imageData',
          data: { imageData: undefined },
          expectedError: 'Missing or invalid image data'
        }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/analyze-food')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testCase.data)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
    });

    it('should handle authentication errors gracefully', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/analyze-food')
        .send({ imageData: testImage })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Base64 Data Processing Verification', () => {
    it('should correctly parse base64 data with proper padding', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: base64Data })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle base64 data with different padding', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=';
      
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: base64Data })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject base64 data with invalid characters', async () => {
      const invalidBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==@#$';
      
      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: invalidBase64 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Regression Tests for Previous Issues', () => {
    it('should resolve the "Normalized image data type: object" error', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      // The previous error was related to image data being an object instead of string
      // This test ensures the image data is properly handled as a string
      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('object');
      expect(response.body.data.foodName).toBeDefined();
    });

    it('should resolve the "Normalized image data length: 0" error', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const response = await request(app)
        .post('/api/analyze-food')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageData: testImage })
        .expect(200);

      // The previous error indicated that the image data length was 0
      // This test ensures the image data has proper length
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foodName).toBeDefined();
    });

    it('should handle all endpoints without the previous parsing errors', async () => {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const endpoints = [
        { path: '/api/analyze-food', method: 'post', data: { imageData: testImage } },
        { path: '/api/user/enhanced-food-recognition/analyze-single', method: 'post', data: { imageData: testImage } },
        { path: '/api/user/enhanced-food-recognition/analyze-multi', method: 'post', data: { imageData: testImage } },
        { path: '/api/user/meals/analyze', method: 'post', data: { imageData: testImage } }
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app) as any)[endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`)
          .send(endpoint.data)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    // Clean up test user
    await db.delete(users).where(eq(users.email, 'image-data-fix@test.com'));
  });
});