import { 
  NutritionInsight, 
  MealAnalysis, 
  PersonalizedRecommendation,
  HealthTrend,
  PredictiveInsight,
  AIResponse,
  MealPlan,
  Recipe,
  UserPreferences,
  HealthGoal,
  ActivityLevel,
  DietaryRestriction,
  Allergy,
  NutritionGoal
} from '../types';

// Advanced AI Service Types
export type AIFeature = 'meal_analysis' | 'nutrition_coaching' | 'meal_planning' | 'recipe_generation' | 'health_prediction' | 'personalized_insights';

export type AIRequest = {
  feature: AIFeature;
  userId: string;
  data: any;
  context?: any;
  preferences?: UserPreferences;
};

export type AIResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  confidence: number;
  processingTime: number;
  metadata?: {
    model: string;
    version: string;
    tokens?: number;
    cost?: number;
  };
};

export type MealAnalysisRequest = {
  mealData: {
    foods: Array<{
      name: string;
      quantity: number;
      unit: string;
      portionSize?: number;
      confidence?: number;
    }>;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    timestamp: Date;
    location?: string;
    mood?: string;
    activity?: string;
  };
  userContext: {
    userId: string;
    healthGoals: HealthGoal[];
    dietaryRestrictions: DietaryRestriction[];
    allergies: Allergy[];
    nutritionGoals: NutritionGoal;
    activityLevel: ActivityLevel;
    preferences: UserPreferences;
  };
};

export type MealAnalysisResponse = {
  analysis: {
    totalCalories: number;
    macronutrients: {
      protein: number;
      carbohydrates: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
    };
    micronutrients: Record<string, number>;
    mealQuality: number;
    healthScore: number;
    recommendations: string[];
  };
  insights: {
    nutritionBalance: string;
    portionSize: string;
    timing: string;
    alternatives: Array<{
      food: string;
      reason: string;
      impact: string;
    }>;
  };
  predictions: {
    energyLevel: 'high' | 'medium' | 'low';
    digestion: 'good' | 'fair' | 'poor';
    satiety: 'high' | 'medium' | 'low';
    bloodSugar: 'stable' | 'rise' | 'drop';
  };
  metadata: {
    processingTime: number;
    confidence: number;
    modelVersion: string;
  };
};

export type MealPlanRequest = {
  userId: string;
  duration: number; // days
  goals: HealthGoal[];
  preferences: UserPreferences;
  restrictions: DietaryRestriction[];
  allergies: Allergy[];
  nutritionGoals: NutritionGoal;
  activityLevel: ActivityLevel;
  currentWeight?: number;
  targetWeight?: number;
  timeline?: string;
  budget?: 'low' | 'medium' | 'high';
  cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
  timeConstraints?: {
    breakfast: number;
    lunch: number;
    dinner: number;
    prepTime: number;
  };
};

export type MealPlanResponse = {
  plan: {
    startDate: Date;
    endDate: Date;
    dailyCalories: number;
    macronutrientRatios: {
      protein: number;
      carbohydrates: number;
      fat: number;
    };
    meals: Array<{
      day: number;
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      recipe: Recipe;
      nutrition: {
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber: number;
      };
      prepTime: number;
      cookTime: number;
      difficulty: 'easy' | 'medium' | 'hard';
      cost: number;
    }>;
    shoppingList: Array<{
      ingredient: string;
      quantity: number;
      unit: string;
      category: string;
      estimatedCost: number;
    }>;
  };
  insights: {
    nutritionBalance: string;
    varietyScore: number;
    adherenceScore: number;
    sustainabilityScore: number;
  };
  recommendations: {
    adjustments: string[];
    alternatives: Array<{
      meal: string;
      reason: string;
      alternative: string;
    }>;
    tips: string[];
  };
  metadata: {
    processingTime: number;
    confidence: number;
    modelVersion: string;
  };
};

export type RecipeGenerationRequest = {
  ingredients: string[];
  cuisine: string;
  dietaryRestrictions: DietaryRestriction[];
  allergies: Allergy[];
  preferences: UserPreferences;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  nutritionGoals: NutritionGoal;
};

export type RecipeGenerationResponse = {
  recipes: Array<{
    id: string;
    name: string;
    description: string;
    prepTime: number;
    cookTime: number;
    totalTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    servings: number;
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      notes?: string;
    }>;
    instructions: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
    };
    cost: number;
    rating: number;
    tags: string[];
    imageUrl?: string;
  }>;
  insights: {
    nutritionBalance: string;
    costEfficiency: string;
    timeEfficiency: string;
    healthScore: number;
  };
  metadata: {
    processingTime: number;
    confidence: number;
    modelVersion: string;
  };
};

export type HealthPredictionRequest = {
  userId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  healthMetrics: Array<{
    metric: string;
    value: number;
    timestamp: Date;
    unit: string;
  }>;
  lifestyleFactors: {
    diet: number; // 1-10 scale
    exercise: number; // 1-10 scale
    sleep: number; // 1-10 scale
    stress: number; // 1-10 scale
    hydration: number; // 1-10 scale
  };
  goals: HealthGoal[];
  medicalHistory?: string[];
  medications?: string[];
};

export type HealthPredictionResponse = {
  predictions: Array<{
    metric: string;
    timeframe: string;
    predictedValue: number;
    confidence: number;
    trend: 'improving' | 'stable' | 'declining';
    factors: string[];
    recommendations: string[];
  }>;
  insights: {
    overallHealthTrend: 'improving' | 'stable' | 'declining';
    riskFactors: Array<{
      factor: string;
      level: 'low' | 'medium' | 'high';
      description: string;
    }>;
    opportunities: Array<{
      area: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
    }>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  metadata: {
    processingTime: number;
    confidence: number;
    modelVersion: string;
  };
};

export type PersonalizedInsightsRequest = {
  userId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  data: {
    nutrition: NutritionInsight[];
    activity: any[];
    sleep: any[];
    health: any[];
    goals: HealthGoal[];
  };
  preferences: UserPreferences;
};

export type PersonalizedInsightsResponse = {
  insights: Array<{
    type: 'nutrition' | 'activity' | 'sleep' | 'health' | 'behavior';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    actionable: boolean;
    recommendations: string[];
    relatedMetrics: string[];
  }>;
  patterns: Array<{
    pattern: string;
    frequency: number;
    correlation: number;
    significance: 'high' | 'medium' | 'low';
    description: string;
  }>;
  trends: Array<{
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    significance: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  recommendations: {
    nutrition: string[];
    activity: string[];
    sleep: string[];
    health: string[];
    lifestyle: string[];
  };
  metadata: {
    processingTime: number;
    confidence: number;
    modelVersion: string;
  };
};

export class AdvancedAIService {
  private isInitialized: boolean = false;
  private apiEndpoint: string;
  private apiKey: string;
  private modelVersion: string = 'gpt-4-turbo';
  private maxTokens: number = 4000;
  private temperature: number = 0.7;

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Initialize the AI service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate configuration
      if (!this.apiEndpoint || !this.apiKey) {
        throw new Error('AI service configuration is incomplete');
      }

      // Test connection
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('Advanced AI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  /**
   * Test connection to AI service
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`AI service health check failed: ${response.status}`);
      }

      const health = await response.json();
      console.log('AI service health:', health);
    } catch (error) {
      throw new Error(`Failed to connect to AI service: ${error}`);
    }
  }

  /**
   * Analyze a meal with advanced AI
   */
  async analyzeMeal(request: MealAnalysisRequest): Promise<AIResponse<MealAnalysisResponse>> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.apiEndpoint}/ai/meal-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          model: this.modelVersion,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Meal analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: data.analysis,
        confidence: data.confidence || 0.85,
        processingTime,
        metadata: {
          model: this.modelVersion,
          version: '1.0.0',
          tokens: data.tokens,
          cost: data.cost,
        },
      };
    } catch (error) {
      console.error('Meal analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  /**
   * Generate a personalized meal plan
   */
  async generateMealPlan(request: MealPlanRequest): Promise<AIResponse<MealPlanResponse>> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.apiEndpoint}/ai/meal-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          model: this.modelVersion,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Meal plan generation failed: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: data.plan,
        confidence: data.confidence || 0.80,
        processingTime,
        metadata: {
          model: this.modelVersion,
          version: '1.0.0',
          tokens: data.tokens,
          cost: data.cost,
        },
      };
    } catch (error) {
      console.error('Meal plan generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  /**
   * Generate recipes based on ingredients and preferences
   */
  async generateRecipes(request: RecipeGenerationRequest): Promise<AIResponse<RecipeGenerationResponse>> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.apiEndpoint}/ai/recipe-generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          model: this.modelVersion,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Recipe generation failed: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: data.recipes,
        confidence: data.confidence || 0.75,
        processingTime,
        metadata: {
          model: this.modelVersion,
          version: '1.0.0',
          tokens: data.tokens,
          cost: data.cost,
        },
      };
    } catch (error) {
      console.error('Recipe generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  /**
   * Predict health outcomes based on current data
   */
  async predictHealth(request: HealthPredictionRequest): Promise<AIResponse<HealthPredictionResponse>> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.apiEndpoint}/ai/health-prediction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          model: this.modelVersion,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Health prediction failed: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: data.predictions,
        confidence: data.confidence || 0.70,
        processingTime,
        metadata: {
          model: this.modelVersion,
          version: '1.0.0',
          tokens: data.tokens,
          cost: data.cost,
        },
      };
    } catch (error) {
      console.error('Health prediction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  /**
   * Generate personalized insights
   */
  async generateInsights(request: PersonalizedInsightsRequest): Promise<AIResponse<PersonalizedInsightsResponse>> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.apiEndpoint}/ai/personalized-insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          model: this.modelVersion,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Insights generation failed: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: data.insights,
        confidence: data.confidence || 0.85,
        processingTime,
        metadata: {
          model: this.modelVersion,
          version: '1.0.0',
          tokens: data.tokens,
          cost: data.cost,
        },
      };
    } catch (error) {
      console.error('Insights generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  /**
   * Get AI-powered nutrition coaching
   */
  async getNutritionCoaching(userId: string, question: string, context?: any): Promise<AIResponse<AIResponse>> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.apiEndpoint}/ai/nutrition-coaching`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          question,
          context,
          model: this.modelVersion,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Nutrition coaching failed: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: data.response,
        confidence: data.confidence || 0.90,
        processingTime,
        metadata: {
          model: this.modelVersion,
          version: '1.0.0',
          tokens: data.tokens,
          cost: data.cost,
        },
      };
    } catch (error) {
      console.error('Nutrition coaching error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  /**
   * Get AI feature availability
   */
  getFeatureAvailability(): Record<AIFeature, boolean> {
    return {
      meal_analysis: true,
      nutrition_coaching: true,
      meal_planning: true,
      recipe_generation: true,
      health_prediction: true,
      personalized_insights: true,
    };
  }

  /**
   * Get AI service status
   */
  async getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastChecked: Date;
  }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const status = await response.json();
      return {
        status: status.status,
        uptime: status.uptime,
        responseTime: status.responseTime,
        errorRate: status.errorRate,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: 0,
        responseTime: 0,
        errorRate: 100,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Update AI service configuration
   */
  updateConfiguration(config: {
    modelVersion?: string;
    maxTokens?: number;
    temperature?: number;
    apiEndpoint?: string;
    apiKey?: string;
  }): void {
    if (config.modelVersion) this.modelVersion = config.modelVersion;
    if (config.maxTokens) this.maxTokens = config.maxTokens;
    if (config.temperature) this.temperature = config.temperature;
    if (config.apiEndpoint) this.apiEndpoint = config.apiEndpoint;
    if (config.apiKey) this.apiKey = config.apiKey;
  }

  /**
   * Cleanup AI service
   */
  async cleanup(): Promise<void> {
    try {
      // Clear any cached data
      this.isInitialized = false;
      console.log('AI service cleaned up');
    } catch (error) {
      console.error('Error cleaning up AI service:', error);
    }
  }
}

// Export singleton instance
export const advancedAIService = new AdvancedAIService(
  process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1',
  process.env.AI_API_KEY || ''
);
export default advancedAIService;