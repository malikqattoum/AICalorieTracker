import { promises as fs } from 'fs';
import path from 'path';
import { log } from '../../vite';

export interface PortionSizeOptions {
  referenceObjects?: string[];
  enable3DEstimation?: boolean;
  confidenceThreshold?: number;
}

export interface PortionSizeResult {
  foodItem: string;
  estimatedWeight: number;
  confidence: number;
  referenceObjects: Array<{
    type: string;
    confidence: number;
    dimensions: { width: number; height: number };
  }>;
  suggestedPortion: {
    weight: number;
    description: string;
  };
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReferenceObject {
  type: string;
  averageDimensions: {
    width: number;
    height: number;
    depth?: number;
  };
  commonSizes: {
    small: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
  };
}

/**
 * Portion Size Estimation Service
 * 
 * This service provides AI-powered portion size calculation using reference objects
 * and advanced computer vision techniques to estimate food weight and volume.
 */
export class PortionSizeService {
  private referenceObjects: Map<string, ReferenceObject>;
  private modelCache: Map<string, any>;
  private cacheDir: string;

  constructor(cacheDir: string = 'cache/portion-size') {
    this.referenceObjects = new Map();
    this.modelCache = new Map();
    this.cacheDir = cacheDir;
    this.initializeReferenceObjects();
  }

  /**
   * Initialize reference objects library
   */
  private async initializeReferenceObjects(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      // Define common reference objects with their average dimensions
      const referenceObjectsData: ReferenceObject[] = [
        {
          type: 'credit_card',
          averageDimensions: { width: 85.6, height: 53.98 },
          commonSizes: {
            small: { width: 80, height: 50 },
            medium: { width: 85.6, height: 53.98 },
            large: { width: 90, height: 58 }
          }
        },
        {
          type: 'hand',
          averageDimensions: { width: 19, height: 29, depth: 2.5 },
          commonSizes: {
            small: { width: 16, height: 24 },
            medium: { width: 19, height: 29 },
            large: { width: 22, height: 34 }
          }
        },
        {
          type: 'smartphone',
          averageDimensions: { width: 67.3, height: 150.9 },
          commonSizes: {
            small: { width: 60, height: 130 },
            medium: { width: 67.3, height: 150.9 },
            large: { width: 75, height: 170 }
          }
        },
        {
          type: 'coin',
          averageDimensions: { width: 24.26, height: 2.4 }, // US Quarter
          commonSizes: {
            small: { width: 20, height: 2 },
            medium: { width: 24.26, height: 2.4 },
            large: { width: 28, height: 3 }
          }
        },
        {
          type: 'banana',
          averageDimensions: { width: 3.3, height: 18, depth: 2.5 },
          commonSizes: {
            small: { width: 2.8, height: 15 },
            medium: { width: 3.3, height: 18 },
            large: { width: 3.8, height: 21 }
          }
        },
        {
          type: 'baseball',
          averageDimensions: { width: 2.86, height: 2.86 },
          commonSizes: {
            small: { width: 2.7, height: 2.7 },
            medium: { width: 2.86, height: 2.86 },
            large: { width: 3.0, height: 3.0 }
          }
        },
        {
          type: 'tennis_ball',
          averageDimensions: { width: 6.7, height: 6.7 },
          commonSizes: {
            small: { width: 6.3, height: 6.3 },
            medium: { width: 6.7, height: 6.7 },
            large: { width: 7.1, height: 7.1 }
          }
        },
        {
          type: 'mouse',
          averageDimensions: { width: 12.7, height: 7.6, depth: 4.4 },
          commonSizes: {
            small: { width: 11, height: 6.5 },
            medium: { width: 12.7, height: 7.6 },
            large: { width: 14.5, height: 8.8 }
          }
        },
        {
          type: 'keyboard_key',
          averageDimensions: { width: 1.5, height: 1.5 },
          commonSizes: {
            small: { width: 1.2, height: 1.2 },
            medium: { width: 1.5, height: 1.5 },
            large: { width: 1.8, height: 1.8 }
          }
        },
        {
          type: 'coffee_mug',
          averageDimensions: { width: 8.3, height: 9.5 },
          commonSizes: {
            small: { width: 7.5, height: 8.5 },
            medium: { width: 8.3, height: 9.5 },
            large: { width: 9.2, height: 10.5 }
          }
        }
      ];

      // Store reference objects
      referenceObjectsData.forEach(obj => {
        this.referenceObjects.set(obj.type, obj);
      });

      log(`Initialized ${referenceObjectsData.length} reference objects for portion size estimation`);
    } catch (error) {
      console.error('Failed to initialize reference objects:', error);
    }
  }

  /**
   * Estimate portion size using reference objects
   */
  async estimatePortionSize(
    foodItem: string,
    foodDimensions: { width: number; height: number },
    imageDimensions: { width: number; height: number },
    options: PortionSizeOptions = {}
  ): Promise<PortionSizeResult> {
    try {
      const {
        referenceObjects = ['credit_card', 'hand', 'smartphone'],
        enable3DEstimation = false,
        confidenceThreshold = 0.7
      } = options;

      log(`Starting portion size estimation for ${foodItem}`);

      // Find the best reference object match
      const bestReference = await this.findBestReferenceObject(
        foodDimensions,
        imageDimensions,
        referenceObjects
      );

      if (!bestReference) {
        throw new Error('No suitable reference object found');
      }

      // Calculate estimated weight
      const estimatedWeight = await this.calculateEstimatedWeight(
        foodItem,
        foodDimensions,
        bestReference,
        enable3DEstimation
      );

      // Generate suggested portion
      const suggestedPortion = this.generateSuggestedPortion(foodItem, estimatedWeight);

      // Calculate confidence score
      const confidence = this.calculateConfidence(
        foodDimensions,
        bestReference.dimensions,
        estimatedWeight
      );

      const result: PortionSizeResult = {
        foodItem,
        estimatedWeight: Math.round(estimatedWeight),
        confidence: Math.min(confidence, 1.0),
        referenceObjects: [bestReference],
        suggestedPortion,
        boundingBox: {
          x: 0,
          y: 0,
          width: foodDimensions.width,
          height: foodDimensions.height
        }
      };

      log(`Portion size estimation completed for ${foodItem}: ${result.estimatedWeight}g`);
      return result;
    } catch (error) {
      console.error('Portion size estimation failed:', error);
      throw error;
    }
  }

  /**
   * Find the best reference object for size comparison
   */
  private async findBestReferenceObject(
    foodDimensions: { width: number; height: number },
    imageDimensions: { width: number; height: number },
    referenceTypes: string[]
  ): Promise<{ type: string; confidence: number; dimensions: { width: number; height: number } } | null> {
    let bestMatch: { type: string; confidence: number; dimensions: { width: number; height: number } } | null = null;
    let bestConfidence = 0;

    for (const refType of referenceTypes) {
      const referenceObj = this.referenceObjects.get(refType);
      if (!referenceObj) continue;

      // Use medium size as default
      const refDimensions = referenceObj.commonSizes.medium;

      // Calculate size ratio
      const widthRatio = foodDimensions.width / refDimensions.width;
      const heightRatio = foodDimensions.height / refDimensions.height;
      const avgRatio = (widthRatio + heightRatio) / 2;

      // Calculate confidence based on size similarity
      const sizeDifference = Math.abs(widthRatio - heightRatio);
      const confidence = 1 - Math.min(sizeDifference, 1);

      // Prefer objects that are closer in size to the food item
      const sizeScore = 1 - Math.min(Math.abs(avgRatio - 1), 1);
      const finalConfidence = confidence * sizeScore;

      if (finalConfidence > bestConfidence && finalConfidence > 0.5) {
        bestConfidence = finalConfidence;
        bestMatch = {
          type: refType,
          confidence: finalConfidence,
          dimensions: refDimensions
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate estimated weight based on dimensions and reference object
   */
  private async calculateEstimatedWeight(
    foodItem: string,
    foodDimensions: { width: number; height: number },
    referenceObject: { type: string; confidence: number; dimensions: { width: number; height: number } },
    enable3DEstimation: boolean
  ): Promise<number> {
    // Get food-specific density information (simplified for now)
    const foodDensity = this.getFoodDensity(foodItem);
    
    // Calculate area in pixels
    const foodArea = foodDimensions.width * foodDimensions.height;
    const referenceArea = referenceObject.dimensions.width * referenceObject.dimensions.height;

    // Calculate area ratio
    const areaRatio = foodArea / referenceArea;

    // Convert reference object dimensions to real-world units (simplified)
    const referenceRealArea = this.convertToRealArea(referenceObject.type, referenceObject.dimensions);

    // Calculate real food area
    const foodRealArea = referenceRealArea * areaRatio;

    // Calculate volume (assuming 2.5D for most foods)
    const estimatedVolume = foodRealArea * (foodDimensions.width / Math.max(foodDimensions.width, foodDimensions.height)) * 2.5;

    // Calculate weight using density
    const estimatedWeight = estimatedVolume * foodDensity;

    // Apply confidence-based adjustment
    const confidenceAdjustment = 0.8 + (referenceObject.confidence * 0.2);
    
    return estimatedWeight * confidenceAdjustment;
  }

  /**
   * Get food density for weight calculation
   */
  private getFoodDensity(foodItem: string): number {
    // Simplified density values (g/cm³)
    const densityMap: Record<string, number> = {
      'apple': 0.73,
      'banana': 0.94,
      'bread': 0.2,
      'cheese': 1.04,
      'chicken': 1.04,
      'rice': 0.68,
      'pasta': 0.38,
      'salad': 0.25,
      'soup': 1.0,
      'steak': 1.05,
      'fish': 1.04,
      'potato': 1.02,
      'default': 0.8
    };

    // Simple food type detection
    const lowerFoodItem = foodItem.toLowerCase();
    for (const [foodType, density] of Object.entries(densityMap)) {
      if (lowerFoodItem.includes(foodType) && foodType !== 'default') {
        return density;
      }
    }

    return densityMap.default;
  }

  /**
   * Convert reference object dimensions to real-world area
   */
  private convertToRealArea(referenceType: string, dimensions: { width: number; height: number }): number {
    const conversionMap: Record<string, number> = {
      'credit_card': 4.6, // cm²
      'hand': 552, // cm² (palm area)
      'smartphone': 1016, // cm²
      'coin': 4.63, // cm²
      'banana': 23.4, // cm² (cross-section)
      'baseball': 6.43, // cm²
      'tennis_ball': 35.3, // cm²
      'mouse': 96.5, // cm²
      'keyboard_key': 2.25, // cm²
      'coffee_mug': 78.8 // cm²
    };

    return conversionMap[referenceType] || 100; // Default 100 cm²
  }

  /**
   * Generate suggested portion description
   */
  private generateSuggestedPortion(foodItem: string, weight: number): { weight: number; description: string } {
    const weightInGrams = Math.round(weight);
    
    // Generate portion description based on weight and food type
    let description = '';
    
    if (weightInGrams < 50) {
      description = 'Small portion';
    } else if (weightInGrams < 150) {
      description = 'Medium portion';
    } else if (weightInGrams < 300) {
      description = 'Large portion';
    } else {
      description = 'Extra large portion';
    }

    // Add food-specific descriptions
    const lowerFoodItem = foodItem.toLowerCase();
    if (lowerFoodItem.includes('rice') || lowerFoodItem.includes('pasta')) {
      description += ' (about 1 cup)';
    } else if (lowerFoodItem.includes('salad')) {
      description += ' (about 2 cups)';
    } else if (lowerFoodItem.includes('meat') || lowerFoodItem.includes('chicken')) {
      description += ' (palm-sized)';
    }

    return {
      weight: weightInGrams,
      description
    };
  }

  /**
   * Calculate confidence score for portion estimation
   */
  private calculateConfidence(
    foodDimensions: { width: number; height: number },
    referenceDimensions: { width: number; height: number },
    estimatedWeight: number
  ): number {
    // Calculate size similarity
    const widthRatio = Math.min(foodDimensions.width, referenceDimensions.width) / 
                      Math.max(foodDimensions.width, referenceDimensions.width);
    const heightRatio = Math.min(foodDimensions.height, referenceDimensions.height) / 
                        Math.max(foodDimensions.height, referenceDimensions.height);
    
    const sizeSimilarity = (widthRatio + heightRatio) / 2;

    // Calculate weight confidence (simplified)
    const weightConfidence = Math.min(estimatedWeight / 500, 1.0); // Assume max 500g for confidence

    // Combine factors
    const confidence = (sizeSimilarity * 0.7) + (weightConfidence * 0.3);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Get all available reference objects
   */
  getAvailableReferenceObjects(): ReferenceObject[] {
    return Array.from(this.referenceObjects.values());
  }

  /**
   * Add custom reference object
   */
  async addCustomReferenceObject(obj: ReferenceObject): Promise<void> {
    try {
      this.referenceObjects.set(obj.type, obj);
      log(`Added custom reference object: ${obj.type}`);
    } catch (error) {
      console.error('Failed to add custom reference object:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    referenceObjectCount: number;
    cacheSize: number;
    lastUpdated: Date;
  } {
    return {
      referenceObjectCount: this.referenceObjects.size,
      cacheSize: this.modelCache.size,
      lastUpdated: new Date()
    };
  }
}

// Export singleton instance
export const portionSizeService = new PortionSizeService();
export default portionSizeService;