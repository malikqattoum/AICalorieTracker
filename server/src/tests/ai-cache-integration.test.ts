import { describe, it, beforeAll, afterAll, expect, beforeEach, jest } from '@jest/globals';
import { AIController } from '../controllers/aiController';
import { aiCacheService } from '../services/aiCacheService';

// Mock the AI service
jest.mock('../../ai-service', () => ({
  aiService: {
    analyzeFoodImage: jest.fn(),
    analyzeMultiFoodImage: jest.fn(),
    isConfigured: jest.fn().mockReturnValue(true),
    getCurrentProvider: jest.fn().mockReturnValue('mock-provider')
  }
}));

// Import after mocking
import { aiService } from '../../ai-service';

describe('AI Cache Integration Tests', () => {
  // Mock request/response objects
  let mockRequest: any;
  let mockResponse: any;

  // Test images with different content (different base64 to simulate different images)
  const testImage1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const testImage2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const modifiedImage1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==modified';

  // Mock AI analysis results
  const mockAnalysisResult1 = {
    foodName: 'Apple',
    calories: 95,
    confidence: 0.95,
    nutrients: { protein: 0.5, carbs: 25, fat: 0.3 }
  };

  const mockAnalysisResult2 = {
    foodName: 'Banana',
    calories: 105,
    confidence: 0.92,
    nutrients: { protein: 1.3, carbs: 27, fat: 0.4 }
  };

  beforeAll(() => {
    // Setup mock AI service responses
    (aiService.analyzeFoodImage as jest.Mock).mockImplementation((...args: any[]) => {
      const imageData = args[0] as string;
      // Return different results based on image content
      if (imageData.includes('+M9QDwADhgGAWjR9aw')) {
        return Promise.resolve(mockAnalysisResult2);
      }
      if (imageData.includes('modified')) {
        // Modified image should return different result to simulate cache invalidation
        return Promise.resolve({
          foodName: 'Modified Apple',
          calories: 100,
          confidence: 0.90,
          nutrients: { protein: 0.6, carbs: 26, fat: 0.4 }
        });
      }
      return Promise.resolve(mockAnalysisResult1);
    });

    (aiService.analyzeMultiFoodImage as jest.Mock).mockReturnValue(Promise.resolve({
      foods: [mockAnalysisResult1, mockAnalysisResult2],
      totalCalories: 200
    }));
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request/response
    mockRequest = {
      body: {},
      user: { id: 1 }
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterAll(() => {
    // No cleanup needed since caching has been removed
  });

  describe('Fresh AI Analysis', () => {
    it('should perform fresh AI analysis for every request', async () => {
      // First request with image1
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(1);
      const response1 = mockResponse.json.mock.calls[0][0];
      expect(response1).toEqual({
        success: true,
        data: mockAnalysisResult1,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
      // Verify no cached field in response
      expect(response1).not.toHaveProperty('cached');
      expect(response1).not.toHaveProperty('cacheHit');
      expect(response1).not.toHaveProperty('fromCache');

      // Second request with same image (should still perform fresh analysis)
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(2); // Called again for fresh analysis
      const response2 = mockResponse.json.mock.calls[1][0];
      expect(response2).toEqual({
        success: true,
        data: mockAnalysisResult1,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
      // Verify no cached field in response
      expect(response2).not.toHaveProperty('cached');
      expect(response2).not.toHaveProperty('cacheHit');
      expect(response2).not.toHaveProperty('fromCache');

      // Third request with different image2
      mockRequest.body = { imageData: testImage2, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(3);
      const response3 = mockResponse.json.mock.calls[2][0];
      expect(response3).toEqual({
        success: true,
        data: mockAnalysisResult2,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
      // Verify no cached field in response
      expect(response3).not.toHaveProperty('cached');
      expect(response3).not.toHaveProperty('cacheHit');
      expect(response3).not.toHaveProperty('fromCache');
    });
  });

  describe('Fresh Multi-Food Analysis', () => {
    it('should perform fresh multi-food analysis for every request', async () => {
      // First request
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze multiple foods' };
      await AIController.analyzeMultiFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeMultiFoodImage).toHaveBeenCalledTimes(1);
      const multiResponse1 = mockResponse.json.mock.calls[0][0];
      expect(multiResponse1).toEqual({
        success: true,
        data: { foods: [mockAnalysisResult1, mockAnalysisResult2], totalCalories: 200 },
        provider: 'mock-provider'
      });
      // Verify no cached field in response
      expect(multiResponse1).not.toHaveProperty('cached');
      expect(multiResponse1).not.toHaveProperty('cacheHit');
      expect(multiResponse1).not.toHaveProperty('fromCache');

      // Second request with same image (should still perform fresh analysis)
      await AIController.analyzeMultiFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeMultiFoodImage).toHaveBeenCalledTimes(2); // Called again for fresh analysis
      const multiResponse2 = mockResponse.json.mock.calls[1][0];
      expect(multiResponse2).toEqual({
        success: true,
        data: { foods: [mockAnalysisResult1, mockAnalysisResult2], totalCalories: 200 },
        provider: 'mock-provider'
      });
      // Verify no cached field in response
      expect(multiResponse2).not.toHaveProperty('cached');
      expect(multiResponse2).not.toHaveProperty('cacheHit');
      expect(multiResponse2).not.toHaveProperty('fromCache');
    });
  });

  describe('Consecutive Requests', () => {
    it('should perform fresh AI processing for multiple consecutive image uploads', async () => {
      const consecutiveImages = [testImage1, testImage2, modifiedImage1, testImage1];

      for (let i = 0; i < consecutiveImages.length; i++) {
        mockResponse.json.mockClear();

        mockRequest.body = { imageData: consecutiveImages[i], prompt: 'Analyze this food' };
        await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

        // Each request should call AI service
        expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(i + 1);

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response).toHaveProperty('data');
        expect(response).toHaveProperty('provider', 'mock-provider');
        expect(response).toHaveProperty('timestamp');

        // Verify no cached fields in response
        expect(response).not.toHaveProperty('cached');
        expect(response).not.toHaveProperty('cacheHit');
        expect(response).not.toHaveProperty('fromCache');
      }

      // Total calls should equal number of requests
      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(consecutiveImages.length);
    });
  });

  describe('Modified Image Analysis', () => {
    it('should perform fresh analysis for modified images', async () => {
      // First request with original image
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(1);
      const modifiedResponse1 = mockResponse.json.mock.calls[0][0];
      expect(modifiedResponse1).toEqual({
        success: true,
        data: mockAnalysisResult1,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
      // Verify no cached field in response
      expect(modifiedResponse1).not.toHaveProperty('cached');
      expect(modifiedResponse1).not.toHaveProperty('cacheHit');
      expect(modifiedResponse1).not.toHaveProperty('fromCache');

      // Second request with same image (should still perform fresh analysis)
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(2);
      const modifiedResponse2 = mockResponse.json.mock.calls[1][0];
      expect(modifiedResponse2).toEqual({
        success: true,
        data: mockAnalysisResult1,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
      // Verify no cached field in response
      expect(modifiedResponse2).not.toHaveProperty('cached');
      expect(modifiedResponse2).not.toHaveProperty('cacheHit');
      expect(modifiedResponse2).not.toHaveProperty('fromCache');

      // Third request with modified image (should perform fresh analysis)
      mockRequest.body = { imageData: modifiedImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(3); // Should call AI service again
      const modifiedResponse3 = mockResponse.json.mock.calls[2][0];
      expect(modifiedResponse3).toEqual({
        success: true,
        data: mockAnalysisResult2, // Modified image returns different result
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
      // Verify no cached field in response
      expect(modifiedResponse3).not.toHaveProperty('cached');
      expect(modifiedResponse3).not.toHaveProperty('cacheHit');
      expect(modifiedResponse3).not.toHaveProperty('fromCache');
    });
  });

});