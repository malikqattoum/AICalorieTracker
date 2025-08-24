import { API_URL } from '../config';
import { logError } from '../config';
import { log } from '../config';
import { apiService } from './apiService';
import * as ImageManipulator from 'expo-image-manipulator';

export interface FoodItem {
  id: string;
  name: string;
  confidence: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  portionSize?: {
    estimatedWeight: number;
    referenceObject: string;
    confidence: number;
  };
  healthScore?: number;
  category: string;
}

export interface MealAnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
  ingredients: string[];
  nutritionalSummary: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence: number;
  processingTime: number;
}

export interface EnhancedFoodRecognitionOptions {
  enablePortionEstimation: boolean;
  enable3DEstimation: boolean;
  confidenceThreshold: number;
  referenceObjects: string[];
  restaurantMode: boolean;
  enableHealthScoring: boolean;
}

export const defaultOptions: EnhancedFoodRecognitionOptions = {
  enablePortionEstimation: true,
  enable3DEstimation: false,
  confidenceThreshold: 0.7,
  referenceObjects: ['hand', 'credit_card', 'smartphone', 'coin'],
  restaurantMode: false,
  enableHealthScoring: true,
};

/**
 * Enhanced meal analysis with AI-powered food recognition
 */
export const analyzeMealImage = async (
  imageUri: string,
  options: Partial<EnhancedFoodRecognitionOptions> = {}
): Promise<MealAnalysisResult> => {
  const startTime = Date.now();
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    log('Starting enhanced meal analysis', { options: finalOptions });

    // Pre-process image for better AI recognition
    const processedImage = await preprocessImageForAI(imageUri, finalOptions);
    
    // Prepare form data for upload
    const formData = new FormData();
    formData.append('image', {
      uri: processedImage.uri,
      name: 'meal.jpg',
      type: 'image/jpeg',
    } as any);

    // Add analysis options
    formData.append('options', JSON.stringify(finalOptions));

    const response = await apiService.post('/api/user/enhanced-food-recognition/analyze', formData, {
      requiresAuth: true,
      showErrorToast: false,
    });

    const result = response.data;
    
    // Post-process the results
    const processedResult = postProcessAnalysisResult(result, finalOptions);
    
    const processingTime = Date.now() - startTime;
    log('Meal analysis completed', {
      foodsCount: processedResult.foods.length,
      totalCalories: processedResult.totalCalories,
      processingTime
    });

    return {
      ...processedResult,
      processingTime,
    };
  } catch (error) {
    logError('Enhanced meal analysis failed', error);
    
    // Fallback to basic analysis if enhanced fails
    try {
      log('Attempting fallback meal analysis');
      return await fallbackMealAnalysis(imageUri);
    } catch (fallbackError) {
      logError('Fallback meal analysis also failed', fallbackError);
      throw error;
    }
  }
};

/**
 * Analyze meal from text description
 */
export const analyzeMealDescription = async (
  description: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch'
): Promise<MealAnalysisResult> => {
  try {
    log('Starting text-based meal analysis', { description, mealType });

    const response = await apiService.post('/api/user/enhanced-food-recognition/analyze-text', {
      description,
      mealType,
      enableHealthScoring: true,
    }, {
      requiresAuth: true,
      showErrorToast: false,
    });

    const result = response.data;
    
    // Calculate totals
    const totals = calculateNutritionalTotals(result.foods || []);
    
    return {
      foods: result.foods || [],
      totalCalories: totals.calories,
      totalProteins: totals.proteins,
      totalCarbs: totals.carbs,
      totalFats: totals.fats,
      ingredients: result.ingredients || [],
      nutritionalSummary: result.nutritionalSummary || 'Meal analyzed successfully',
      mealType,
      confidence: result.confidence || 0.8,
      processingTime: 0,
    };
  } catch (error) {
    logError('Text-based meal analysis failed', error);
    throw error;
  }
};

/**
 * Multi-food analysis for complex meals
 */
export const analyzeMultiFoodImage = async (
  imageUri: string,
  options: Partial<EnhancedFoodRecognitionOptions> = {}
): Promise<MealAnalysisResult> => {
  const finalOptions = { ...defaultOptions, ...options, restaurantMode: true };
  
  try {
    log('Starting multi-food analysis');

    const processedImage = await preprocessImageForAI(imageUri, finalOptions);
    
    const formData = new FormData();
    formData.append('image', {
      uri: processedImage.uri,
      name: 'multi_food.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('options', JSON.stringify(finalOptions));

    const response = await apiService.post('/api/user/enhanced-food-recognition/analyze-multi', formData, {
      requiresAuth: true,
      showErrorToast: false,
    });

    const result = response.data;
    
    // Process multi-food results
    const processedResult = postProcessMultiFoodResult(result, finalOptions);
    
    return {
      ...processedResult,
      mealType: 'lunch', // Default for multi-food
      processingTime: 0,
    };
  } catch (error) {
    logError('Multi-food analysis failed', error);
    throw error;
  }
};

/**
 * Pre-process image for better AI recognition
 */
async function preprocessImageForAI(
  imageUri: string,
  options: EnhancedFoodRecognitionOptions
): Promise<{ uri: string; width: number; height: number }> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: Math.min(1200, options.enable3DEstimation ? 1920 : 800),
            height: Math.min(1200, options.enable3DEstimation ? 1080 : 600),
          },
        },
        {
          compress: 0.8,
        },
      ],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
    };
  } catch (error) {
    logError('Image preprocessing failed', error);
    // Return original image if preprocessing fails
    return { uri: imageUri, width: 800, height: 600 };
  }
}

/**
 * Post-process analysis results
 */
function postProcessAnalysisResult(
  result: any,
  options: EnhancedFoodRecognitionOptions
): Partial<MealAnalysisResult> {
  const foods = Array.isArray(result.foods) ? result.foods : [];
  
  // Filter by confidence threshold
  const filteredFoods = foods.filter((food: any) =>
    food.confidence >= options.confidenceThreshold
  );

  // Calculate totals
  const totals = calculateNutritionalTotals(filteredFoods);

  // Generate ingredients list
  const ingredients = filteredFoods.map((food: any) => food.name);

  // Generate nutritional summary
  const nutritionalSummary = generateNutritionalSummary(filteredFoods, totals);

  return {
    foods: filteredFoods,
    totalCalories: totals.calories,
    totalProteins: totals.proteins,
    totalCarbs: totals.carbs,
    totalFats: totals.fats,
    ingredients,
    nutritionalSummary,
    confidence: calculateOverallConfidence(filteredFoods),
  };
}

/**
 * Post-process multi-food results
 */
function postProcessMultiFoodResult(
  result: any,
  options: EnhancedFoodRecognitionOptions
): Partial<MealAnalysisResult> {
  const foods = Array.isArray(result.foods) ? result.foods : [];
  
  // Add health scores if enabled
  const foodsWithHealthScores = options.enableHealthScoring
    ? foods.map((food: any) => ({
        ...food,
        healthScore: calculateHealthScore(food),
      }))
    : foods;

  // Calculate totals
  const totals = calculateNutritionalTotals(foodsWithHealthScores);

  return {
    foods: foodsWithHealthScores,
    totalCalories: totals.calories,
    totalProteins: totals.proteins,
    totalCarbs: totals.carbs,
    totalFoods: totals.fats,
    ingredients: foodsWithHealthScores.map((food: any) => food.name),
    nutritionalSummary: `Multi-food meal with ${foodsWithHealthScores.length} items`,
    confidence: calculateOverallConfidence(foodsWithHealthScores),
  };
}

/**
 * Fallback meal analysis for when enhanced analysis fails
 */
async function fallbackMealAnalysis(imageUri: string): Promise<MealAnalysisResult> {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'meal_fallback.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await apiService.post('/api/user/meal-analysis/fallback', formData, {
      requiresAuth: true,
      showErrorToast: false,
    });

    const result = response.data;
    
    return {
      foods: result.foods || [],
      totalCalories: result.totalCalories || 0,
      totalProteins: result.totalProteins || 0,
      totalCarbs: result.totalCarbs || 0,
      totalFats: result.totalFats || 0,
      ingredients: result.ingredients || [],
      nutritionalSummary: result.nutritionalSummary || 'Basic meal analysis completed',
      mealType: 'lunch',
      confidence: 0.6, // Lower confidence for fallback
      processingTime: 0,
    };
  } catch (error) {
    logError('Fallback meal analysis failed', error);
    throw new Error('Unable to analyze meal. Please try again or describe your meal manually.');
  }
}

/**
 * Calculate nutritional totals
 */
function calculateNutritionalTotals(foods: any[]): {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
} {
  return foods.reduce((totals, food) => ({
    calories: totals.calories + (food.calories || 0),
    proteins: totals.proteins + (food.proteins || 0),
    carbs: totals.carbs + (food.carbs || 0),
    fats: totals.fats + (food.fats || 0),
  }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });
}

/**
 * Calculate overall confidence
 */
function calculateOverallConfidence(foods: any[]): number {
  if (foods.length === 0) return 0;
  
  const avgConfidence = foods.reduce((sum, food) => sum + (food.confidence || 0), 0) / foods.length;
  return Math.round(avgConfidence * 100) / 100;
}

/**
 * Generate nutritional summary
 */
function generateNutritionalSummary(foods: any[], totals: any): string {
  if (foods.length === 0) return 'No foods detected';
  
  const avgCalories = foods.length > 0 ? Math.round(totals.calories / foods.length) : 0;
  
  return `Detected ${foods.length} food items averaging ${avgCalories} calories each. Total: ${totals.calories} calories, ${totals.proteins}g protein, ${totals.carbs}g carbs, ${totals.fats}g fat.`;
}

/**
 * Calculate health score for a food item
 */
function calculateHealthScore(food: any): number {
  // Simple health scoring algorithm
  let score = 50; // Base score
  
  // Adjust based on nutritional content
  if (food.proteins && food.proteins > 10) score += 10;
  if (food.fats && food.fats < 5) score += 10;
  if (food.carbs && food.carbs < 30) score += 5;
  
  // Adjust based on food category
  const healthyCategories = ['vegetable', 'fruit', 'lean_protein', 'whole_grain'];
  if (healthyCategories.includes(food.category?.toLowerCase())) {
    score += 15;
  }
  
  return Math.min(100, Math.max(0, score));
}

// Export convenience functions
export const mealAnalysisService = {
  analyzeMealImage,
  analyzeMealDescription,
  analyzeMultiFoodImage,
  defaultOptions,
};

export default mealAnalysisService;