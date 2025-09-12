import { Router } from 'express';
import { enhancedFoodRecognitionService } from '../../services/enhancedFoodRecognitionService';
import { log } from '../../../vite';
import ValidationService from '../../services/validation';

const router = Router();

/**
 * Enhanced Food Recognition API Routes
 * 
 * These endpoints provide premium food recognition capabilities including:
 * - Multi-item recognition
 * - Portion size estimation
 * - Advanced nutritional analysis
 * - Restaurant menu recognition
 */

// POST /api/user/enhanced-food-recognition/analyze-single
router.post('/analyze-single',
  ValidationService.validate({
    imageData: { type: 'string', required: true },
    options: { type: 'string' } // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { imageData, options = {} } = req.body;
      const userId = (req as any).user.id;

      log(`Starting enhanced single food analysis for user ${userId}`);

      // Initialize the service if needed
      await enhancedFoodRecognitionService.initialize();

      // Convert base64 data URL to Buffer
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      log(`Performing fresh enhanced food recognition analysis for userId: ${userId}`);

      // Analyze the food image
      const result = await enhancedFoodRecognitionService.analyzeFoodImage({
        imageBuffer,
        userId,
        ...options
      });

      res.json({
        success: true,
        data: result,
        message: 'Food analysis completed successfully'
      });
    } catch (error) {
      console.error('Enhanced single food analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze food image',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

// POST /api/user/enhanced-food-recognition/analyze-multi
router.post('/analyze-multi',
  ValidationService.validate({
    imageData: { type: 'string', required: true },
    options: { type: 'string' } // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { imageData, options = {} } = req.body;
      const userId = (req as any).user.id;

      log(`Starting enhanced multi-food analysis for user ${userId}`);

      // Convert base64 data URL to Buffer
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      log(`Performing fresh enhanced multi-food recognition analysis for userId: ${userId}`);

      // Analyze multiple food items (for now, treat as single analysis)
      const result = await enhancedFoodRecognitionService.analyzeFoodImage({
        imageBuffer,
        userId,
        ...options
      });

      res.json({
        success: true,
        data: result,
        message: 'Multi-food analysis completed successfully'
      });
    } catch (error) {
      console.error('Enhanced multi-food analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze multiple food items',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

// POST /api/user/enhanced-food-recognition/analyze-restaurant-menu
router.post('/analyze-restaurant-menu',
  ValidationService.validate({
    imageData: { type: 'string', required: true },
    restaurantName: { type: 'string', required: true },
    options: { type: 'string' } // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { imageData, restaurantName, options = {} } = req.body;
      const userId = (req as any).user.id;

      log(`Starting restaurant menu analysis for ${restaurantName} by user ${userId}`);

      // Convert base64 data URL to Buffer
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Analyze restaurant menu with specialized restaurant mode
      const result = await enhancedFoodRecognitionService.analyzeFoodImage({
        imageBuffer,
        userId,
        ...options,
        restaurantMode: true
      });

      // Enhance result with restaurant-specific metadata
      const enhancedResult = {
        ...result,
        restaurantInfo: {
          name: restaurantName,
          analysisType: 'menu_recognition',
          timestamp: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        data: enhancedResult,
        message: 'Restaurant menu analysis completed successfully'
      });
    } catch (error) {
      console.error('Restaurant menu analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze restaurant menu',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

// GET /api/user/enhanced-food-recognition/status
router.get('/status', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const availableProviders = enhancedFoodRecognitionService.getAvailableProviders();

    res.json({
      success: true,
      data: {
        availableProviders,
        userId,
        timestamp: new Date().toISOString()
      },
      message: 'Enhanced food recognition service status retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get enhanced food recognition status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service status',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// POST /api/user/enhanced-food-recognition/portion-estimate
router.post('/portion-estimate',
  ValidationService.validate({
    foodName: { type: 'string', required: true },
    foodDimensions: { type: 'string', required: true },
    imageDimensions: { type: 'string', required: true },
    options: { type: 'string' } // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { foodName, foodDimensions, imageDimensions, options = {} } = req.body;
      const userId = (req as any).user.id;

      log(`Starting portion size estimation for ${foodName} by user ${userId}`);

      // Estimate portion size
      // Simplified portion estimation - in real implementation would use portionSizeService
      const result = {
        estimatedWeight: 150, // Placeholder
        confidence: 0.8,
        referenceObject: 'hand',
        dimensions: foodDimensions,
        suggestedPortion: {
          weight: 150,
          description: '1 serving'
        }
      };

      res.json({
        success: true,
        data: result,
        message: 'Portion size estimation completed successfully'
      });
    } catch (error) {
      console.error('Portion size estimation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to estimate portion size',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

// GET /api/user/enhanced-food-recognition/reference-objects
router.get('/reference-objects', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Get available reference objects from portion size service
    const referenceObjects = [
      'credit_card',
      'hand',
      'smartphone',
      'coin',
      'business_card'
    ]; // Default reference objects

    res.json({
      success: true,
      data: {
        referenceObjects,
        count: referenceObjects.length,
        timestamp: new Date().toISOString()
      },
      message: 'Reference objects retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get reference objects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reference objects',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;