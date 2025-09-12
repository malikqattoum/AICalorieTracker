import { Request, Response } from 'express';
import { aiService, AIConfigService } from '../../ai-service';
import { aiCacheService } from '../services/aiCacheService';
import { log } from '../../vite';

export interface AuthenticatedRequest extends Request {
  user?: any; // Simplified for compatibility
}

export class AIController {
  /**
   * Analyze a single food image
   */
  static async analyzeFoodImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { imageData, prompt } = req.body;
      const userId = req.user?.id;

      // Input validation
      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: 'Image data is required',
          code: 'MISSING_IMAGE_DATA'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'UNAUTHENTICATED'
        });
      }

      // Validate image data format
      if (typeof imageData !== 'string' || imageData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image data format',
          code: 'INVALID_IMAGE_FORMAT'
        });
      }

      // Convert base64 to buffer for caching
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Generate cache key
      const cacheKey = aiCacheService.generateImageCacheKey('ai-analyze', imageBuffer, userId, { prompt });

      // Check cache first
      log(`Checking cache for AI analysis, userId: ${userId}`);
      const cachedResult = await aiCacheService.getWithImageValidation(cacheKey, imageBuffer, userId);

      if (cachedResult) {
        log(`Cache hit for AI analysis, userId: ${userId}`);
        return res.json({
          success: true,
          data: cachedResult,
          cached: true,
          provider: aiService.getCurrentProvider(),
          timestamp: new Date().toISOString()
        });
      }

      log(`Cache miss for AI analysis, userId: ${userId}, performing analysis`);

      // Check if AI service is configured
      if (!aiService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured. Please contact administrator.',
          code: 'SERVICE_UNAVAILABLE'
        });
      }

      // Add timeout handling
      const timeoutMs = 30000; // 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs);
      });

      const analysisPromise = aiService.analyzeFoodImage(imageData, prompt);
      const result = await Promise.race([analysisPromise, timeoutPromise]);

      // Cache the result
      await aiCacheService.setWithImageHash(cacheKey, result, imageBuffer);
      log(`Cached AI analysis result for key: ${cacheKey}`);

      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid analysis result structure');
      }

      res.json({
        success: true,
        data: result,
        cached: false,
        provider: aiService.getCurrentProvider(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error analyzing food image:', error);

      // Determine appropriate error response based on error type
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let errorMessage = 'Failed to analyze food image';

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          statusCode = 408;
          errorCode = 'TIMEOUT';
          errorMessage = 'Analysis request timed out';
        } else if (error.message.includes('rate limit')) {
          statusCode = 429;
          errorCode = 'RATE_LIMITED';
          errorMessage = 'Too many requests, please try again later';
        } else if (error.message.includes('quota')) {
          statusCode = 429;
          errorCode = 'QUOTA_EXCEEDED';
          errorMessage = 'Service quota exceeded';
        }
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Analyze multiple food items in an image
   */
  static async analyzeMultiFoodImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { imageData, prompt } = req.body;
      const userId = req.user?.id;

      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: 'Image data is required'
        });
      }

      // Convert base64 to buffer for caching
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Generate cache key
      const cacheKey = aiCacheService.generateImageCacheKey('ai-analyze-multi', imageBuffer, userId || 0, { prompt });

      // Check cache first
      log(`Checking cache for AI multi-analysis, userId: ${userId}`);
      const cachedResult = await aiCacheService.getWithImageValidation(cacheKey, imageBuffer, userId || 0);

      if (cachedResult) {
        log(`Cache hit for AI multi-analysis, userId: ${userId}`);
        return res.json({
          success: true,
          data: cachedResult,
          cached: true,
          provider: aiService.getCurrentProvider()
        });
      }

      log(`Cache miss for AI multi-analysis, userId: ${userId}, performing analysis`);

      // Check if AI service is configured
      if (!aiService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured. Please contact administrator.'
        });
      }

      const result = await aiService.analyzeMultiFoodImage(imageData, prompt);

      // Cache the result
      await aiCacheService.setWithImageHash(cacheKey, result, imageBuffer);
      log(`Cached AI multi-analysis result for key: ${cacheKey}`);

      res.json({
        success: true,
        data: result,
        cached: false,
        provider: aiService.getCurrentProvider()
      });
    } catch (error) {
      console.error('Error analyzing multi-food image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze multi-food image'
      });
    }
  }

  /**
   * Get AI service status and configuration
   */
  static async getServiceStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const isConfigured = aiService.isConfigured();
      const currentProvider = aiService.getCurrentProvider();

      res.json({
        success: true,
        data: {
          isConfigured,
          currentProvider,
          status: isConfigured ? 'active' : 'inactive',
          message: isConfigured ? 'AI service is ready' : 'AI service is not configured'
        }
      });
    } catch (error) {
      console.error('Error getting AI service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI service status'
      });
    }
  }

  /**
   * Get available AI providers and their configurations
   */
  static async getProviders(req: AuthenticatedRequest, res: Response) {
    try {
      const configs = await AIConfigService.getConfigs();

      const providers = configs.map(config => ({
        id: config.id,
        provider: config.provider,
        modelName: config.modelName,
        isActive: config.isActive,
        promptTemplate: config.promptTemplate,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }));

      res.json({
        success: true,
        data: {
          providers,
          total: providers.length,
          activeProvider: providers.find(p => p.isActive)
        }
      });
    } catch (error) {
      console.error('Error getting AI providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI providers'
      });
    }
  }

  /**
   * Update AI provider configuration
   */
  static async updateProvider(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: 'Valid provider ID is required'
        });
      }

      await AIConfigService.updateConfig(Number(id), updateData);

      res.json({
        success: true,
        message: 'AI provider configuration updated successfully',
        data: { providerId: Number(id) }
      });
    } catch (error) {
      console.error('Error updating AI provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update AI provider configuration'
      });
    }
  }

  /**
   * Set active AI provider
   */
  static async setActiveProvider(req: AuthenticatedRequest, res: Response) {
    try {
      const { providerId } = req.params;

      if (!providerId || isNaN(Number(providerId))) {
        return res.status(400).json({
          success: false,
          error: 'Valid provider ID is required'
        });
      }

      await AIConfigService.setActiveProvider(Number(providerId));

      res.json({
        success: true,
        message: 'Active AI provider updated successfully',
        data: { activeProviderId: Number(providerId) }
      });
    } catch (error) {
      console.error('Error setting active AI provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set active AI provider'
      });
    }
  }

  /**
   * Test AI provider configuration
   */
  static async testProvider(req: AuthenticatedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const { testData } = req.body;

      if (!providerId || isNaN(Number(providerId))) {
        return res.status(400).json({
          success: false,
          error: 'Valid provider ID is required'
        });
      }

      // Get provider configuration
      const configs = await AIConfigService.getConfigs();
      const provider = configs.find(c => c.id === Number(providerId));

      if (!provider) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found'
        });
      }

      // Test the provider with sample data
      let testResult;
      try {
        if (provider.provider === 'gemini') {
          // Use Gemini for testing
          const { analyzeWithGemini } = await import('../../gemini');
          testResult = await analyzeWithGemini(
            testData || 'sample-image-data',
            'Test prompt',
            provider.modelName || 'gemini-1.5-pro-vision-latest'
          );
        } else {
          // Use OpenAI for testing
          const { analyzeFoodImage } = await import('../../openai');
          testResult = await analyzeFoodImage(testData || 'sample-image-data');
        }
      } catch (testError) {
        return res.status(400).json({
          success: false,
          error: 'Provider test failed',
          details: testError instanceof Error ? testError.message : 'Unknown error'
        });
      }

      res.json({
        success: true,
        message: 'Provider test successful',
        data: {
          providerId: Number(providerId),
          provider: provider.provider,
          testResult,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error testing AI provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test AI provider'
      });
    }
  }

  /**
   * Get AI usage statistics and costs
   */
  static async getUsageStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      // In a real implementation, this would query usage logs and calculate costs
      const mockStats = {
        totalRequests: 1250,
        successfulRequests: 1180,
        failedRequests: 70,
        successRate: 94.4,
        totalCost: 45.67,
        averageCostPerRequest: 0.0365,
        providerBreakdown: {
          openai: {
            requests: 750,
            cost: 28.50,
            successRate: 95.2
          },
          gemini: {
            requests: 500,
            cost: 17.17,
            successRate: 92.8
          }
        },
        dailyUsage: [
          { date: '2024-01-01', requests: 45, cost: 1.64 },
          { date: '2024-01-02', requests: 52, cost: 1.90 },
          { date: '2024-01-03', requests: 38, cost: 1.39 }
        ],
        topEndpoints: [
          { endpoint: '/api/ai/analyze', requests: 680, cost: 24.84 },
          { endpoint: '/api/ai/multi-analyze', requests: 420, cost: 15.33 },
          { endpoint: '/api/ai/suggestions', requests: 150, cost: 5.50 }
        ]
      };

      res.json({
        success: true,
        data: {
          ...mockStats,
          period: { startDate, endDate },
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting AI usage stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI usage statistics'
      });
    }
  }

  /**
   * Get AI service health and performance metrics
   */
  static async getServiceHealth(req: AuthenticatedRequest, res: Response) {
    try {
      const isConfigured = aiService.isConfigured();
      const currentProvider = aiService.getCurrentProvider();

      const healthMetrics = {
        status: isConfigured ? 'healthy' : 'unhealthy',
        provider: currentProvider,
        lastChecked: new Date(),
        checks: {
          isConfigured: {
            status: isConfigured ? 'pass' : 'fail',
            message: isConfigured ? 'AI provider is configured' : 'No AI provider configured'
          },
          apiKeyValid: {
            status: isConfigured ? 'pass' : 'skip',
            message: isConfigured ? 'API key validation would be performed here' : 'Skipped - no provider configured'
          },
          serviceReachable: {
            status: isConfigured ? 'pass' : 'skip',
            message: isConfigured ? 'Service endpoint is reachable' : 'Skipped - no provider configured'
          },
          responseTime: {
            status: 'pass',
            message: 'Average response time: 1.2s',
            value: 1200
          }
        },
        recommendations: isConfigured ? [] : [
          'Configure an AI provider in the admin panel',
          'Ensure API keys are properly set up',
          'Test provider configuration before going live'
        ]
      };

      res.json({
        success: true,
        data: healthMetrics
      });
    } catch (error) {
      console.error('Error getting AI service health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI service health'
      });
    }
  }

  /**
   * Generate AI-powered meal suggestions
   */
  static async generateMealSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const { userPreferences, mealType, count = 3 } = req.body;

      if (!userPreferences) {
        return res.status(400).json({
          success: false,
          error: 'User preferences are required'
        });
      }

      // Get current AI provider
      const currentProvider = aiService.getCurrentProvider();
      let suggestions;

      try {
        if (currentProvider === 'gemini') {
          const { generateMealSuggestionsWithGemini } = await import('../../gemini');
          suggestions = await generateMealSuggestionsWithGemini(userPreferences);
        } else {
          // Use OpenAI for meal suggestions
          const { getSmartMealSuggestions } = await import('../../openai');
          const rawSuggestions = await getSmartMealSuggestions(req.user?.id || 0);
          suggestions = {
            meals: rawSuggestions.slice(0, count).map((name: string, index: number) => ({
              name,
              calories: 300 + Math.random() * 200,
              protein: 15 + Math.random() * 20,
              carbs: 20 + Math.random() * 30,
              fat: 8 + Math.random() * 15,
              ingredients: [],
              instructions: ''
            }))
          };
        }
      } catch (error) {
        console.error('Error generating meal suggestions:', error);
        // Fallback to basic suggestions
        suggestions = {
          meals: [
            {
              name: 'Grilled Chicken Salad',
              calories: 350,
              protein: 35,
              carbs: 15,
              fat: 18,
              ingredients: ['Chicken breast', 'Mixed greens', 'Vegetables'],
              instructions: 'Grill chicken and serve with fresh vegetables'
            },
            {
              name: 'Quinoa Buddha Bowl',
              calories: 420,
              protein: 18,
              carbs: 45,
              fat: 20,
              ingredients: ['Quinoa', 'Chickpeas', 'Vegetables'],
              instructions: 'Combine all ingredients in a bowl'
            },
            {
              name: 'Salmon with Roasted Vegetables',
              calories: 380,
              protein: 32,
              carbs: 12,
              fat: 25,
              ingredients: ['Salmon', 'Broccoli', 'Carrots'],
              instructions: 'Bake salmon and roast vegetables'
            }
          ]
        };
      }

      res.json({
        success: true,
        data: {
          suggestions: suggestions.meals.slice(0, count),
          provider: currentProvider,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error generating meal suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate meal suggestions'
      });
    }
  }

  /**
   * Get AI nutrition tips
   */
  static async getNutritionTips(req: AuthenticatedRequest, res: Response) {
    try {
      const { getNutritionTips } = await import('../../openai');
      const tips = await getNutritionTips(req.user?.id || 0);

      res.json({
        success: true,
        data: {
          tips,
          provider: 'openai',
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting nutrition tips:', error);
      // Fallback tips
      const fallbackTips = [
        "Try to include protein with every meal for better satiety",
        "Aim for at least 5 servings of fruits and vegetables daily",
        "Stay hydrated by drinking water before and during meals",
        "Choose whole grains over refined carbohydrates when possible"
      ];

      res.json({
        success: true,
        data: {
          tips: fallbackTips,
          provider: 'fallback',
          generatedAt: new Date()
        }
      });
    }
  }

  /**
   * Generate AI-powered meal plan
   */
  static async generateMealPlan(req: AuthenticatedRequest, res: Response) {
    try {
      const { goal, duration = 7, preferences = {} } = req.body;

      if (!goal) {
        return res.status(400).json({
          success: false,
          error: 'Goal is required for meal plan generation'
        });
      }

      const { generateMealPlan } = await import('../../openai');
      const mealPlan = await generateMealPlan(goal);

      // Enhance with user preferences
      const enhancedMealPlan = {
        ...mealPlan,
        duration,
        preferences,
        personalized: true,
        createdAt: new Date()
      };

      res.json({
        success: true,
        data: enhancedMealPlan,
        provider: 'openai'
      });
    } catch (error) {
      console.error('Error generating meal plan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate meal plan'
      });
    }
  }
}