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
    // Clear cache before each test
    aiCacheService.clear();
    aiCacheService.resetStats();

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
    // Cleanup
    aiCacheService.cleanup();
  });

  describe('Consecutive Different Images', () => {
    it('should perform fresh AI analysis for different images', async () => {
      // First request with image1
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysisResult1,
        cached: false,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });

      // Reset response mock
      mockResponse.json.mockClear();

      // Second request with different image2
      mockRequest.body = { imageData: testImage2, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysisResult2,
        cached: false,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Identical Image Caching', () => {
    it('should return cached results for identical images instantly', async () => {
      // First request
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysisResult1,
        cached: false,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });

      // Reset response mock
      mockResponse.json.mockClear();

      // Second request with same image (should be cached)
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(1); // Should not call AI service again
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysisResult1,
        cached: true,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
    });

    it('should cache multi-food analysis results', async () => {
      // First request
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze multiple foods' };
      await AIController.analyzeMultiFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeMultiFoodImage).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { foods: [mockAnalysisResult1, mockAnalysisResult2], totalCalories: 200 },
        cached: false,
        provider: 'mock-provider'
      });

      // Reset response mock
      mockResponse.json.mockClear();

      // Second request with same image
      await AIController.analyzeMultiFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeMultiFoodImage).toHaveBeenCalledTimes(1); // Should not call AI service again
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { foods: [mockAnalysisResult1, mockAnalysisResult2], totalCalories: 200 },
        cached: true,
        provider: 'mock-provider'
      });
    });
  });

  describe('Cache Invalidation on Modified Images', () => {
    it('should invalidate cache when image content changes', async () => {
      // First request with original image
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysisResult1,
        cached: false,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });

      // Reset response mock
      mockResponse.json.mockClear();

      // Second request with same image (should be cached)
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysisResult1,
        cached: true,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });

      // Reset response mock
      mockResponse.json.mockClear();

      // Third request with modified image (should invalidate cache)
      mockRequest.body = { imageData: modifiedImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      expect(aiService.analyzeFoodImage).toHaveBeenCalledTimes(2); // Should call AI service again
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysisResult2, // Modified image has same hash as testImage2
        cached: false,
        provider: 'mock-provider',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Cache Statistics and Monitoring', () => {
    it('should track cache statistics correctly', async () => {
      // Clear stats
      aiCacheService.resetStats();

      // First request (miss)
      mockRequest.body = { imageData: testImage1, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      // Second request (hit)
      mockResponse.json.mockClear();
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      // Third request with different image (miss)
      mockResponse.json.mockClear();
      mockRequest.body = { imageData: testImage2, prompt: 'Analyze this food' };
      await AIController.analyzeFoodImage(mockRequest as any, mockResponse as any);

      const stats = aiCacheService.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(33.33, 1); // 1 hit out of 3 requests
      expect(stats.entries).toBeGreaterThan(0);
    });
  });
});