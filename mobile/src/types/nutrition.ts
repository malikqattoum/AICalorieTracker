// Nutrition Types for Advanced AI Service

export interface NutritionInsight {
  id: string;
  userId: string;
  type: 'nutrition' | 'behavior' | 'health' | 'performance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  relatedMetrics: string[];
  timestamp: Date;
}

export interface MealAnalysis {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Date;
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    confidence: number;
  }>;
  totalNutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  mealQuality: number;
  healthScore: number;
  recommendations: string[];
  insights: string[];
}

export interface PersonalizedRecommendation {
  id: string;
  userId: string;
  type: 'nutrition' | 'exercise' | 'lifestyle' | 'supplement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  benefits: string[];
  considerations: string[];
  implementation: string[];
  timeframe: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface HealthTrend {
  id: string;
  userId: string;
  metric: string;
  timeframe: string;
  values: Array<{
    date: Date;
    value: number;
    unit: string;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  rate: number;
  significance: 'high' | 'medium' | 'low';
  factors: string[];
  recommendations: string[];
}

export interface PredictiveInsight {
  id: string;
  userId: string;
  metric: string;
  timeframe: string;
  predictedValue: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  factors: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  opportunityLevel: 'low' | 'medium' | 'high';
}

export interface AIResponse {
  content: string;
  confidence: number;
  processingTime: number;
  model: string;
  suggestions?: string[];
  followUpQuestions?: string[];
}

export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
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
  adherenceScore: number;
  varietyScore: number;
  sustainabilityScore: number;
}

export interface Recipe {
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
  category: string;
  cuisine: string;
  dietaryRestrictions: string[];
  allergies: string[];
}

export interface UserPreferences {
  favoriteCuisines: string[];
  dislikedFoods: string[];
  favoriteIngredients: string[];
  cookingMethods: string[];
  spiceLevel: 'mild' | 'medium' | 'hot' | 'very_hot';
  texturePreferences: string[];
  flavorProfiles: string[];
  mealTiming: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snackTimes: string[];
  };
  budget: 'low' | 'medium' | 'high';
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  timeConstraints: {
    breakfast: number;
    lunch: number;
    dinner: number;
    prepTime: number;
  };
  socialPreferences: {
    eatAlone: boolean;
    eatWithOthers: boolean;
    familyStyle: boolean;
  };
  environmentalConcerns: {
    sustainability: boolean;
    organic: boolean;
    local: boolean;
    seasonal: boolean;
  };
}

export interface HealthGoal {
  id: string;
  userId: string;
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'fat_loss' | 'maintenance' | 'performance' | 'health' | 'longevity';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  timeframe: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  milestones: Array<{
    id: string;
    target: number;
    achieved: boolean;
    achievedAt?: Date;
  }>;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion?: Date;
}

export interface ActivityLevel {
  level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  description: string;
  weeklyActivity: {
    exercise: number; // hours per week
    walking: number; // steps per day
    standing: number; // hours per day
    sleep: number; // hours per night
  };
  metabolicRate: number;
  caloriesMultiplier: number;
}

export interface DietaryRestriction {
  type: 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'mediterranean' | 'dash' | 'low_sodium' | 'low_sugar' | 'gluten_free' | 'dairy_free' | 'nut_free' | 'other';
  name: string;
  description: string;
  severity: 'strict' | 'moderate' | 'flexible';
  medicalReason?: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface Allergy {
  food: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  symptoms: string[];
  reactionTime: string;
  medications: string[];
  emergencyContact?: string;
  createdAt: Date;
}

export interface NutritionGoal {
  dailyCalories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
  water: number; // liters
  micronutrients: Record<string, number>;
  ratios: {
    protein: number; // percentage
    carbohydrates: number; // percentage
    fat: number; // percentage
  };
}

export interface NutritionCoachQuestion {
  id: string;
  userId: string;
  question: string;
  category: 'nutrition' | 'exercise' | 'lifestyle' | 'health' | 'performance';
  context: {
    recentMeals: MealAnalysis[];
    healthMetrics: any[];
    goals: HealthGoal[];
    preferences: UserPreferences;
  };
  response: AIResponse;
  createdAt: Date;
  resolved: boolean;
  rating?: number;
  feedback?: string;
}

export interface NutritionProgress {
  userId: string;
  date: Date;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    water: number;
  };
  goals: NutritionGoal;
  adherence: number;
  quality: number;
  score: number;
  insights: string[];
}

export interface NutritionTrend {
  userId: string;
  metric: string;
  timeframe: string;
  values: Array<{
    date: Date;
    value: number;
    unit: string;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  rate: number;
  significance: 'high' | 'medium' | 'low';
  factors: string[];
  recommendations: string[];
}

export interface NutritionInsight {
  id: string;
  userId: string;
  type: 'nutrition' | 'behavior' | 'health' | 'performance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  relatedMetrics: string[];
  timestamp: Date;
}

export interface MealAnalysis {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Date;
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    confidence: number;
  }>;
  totalNutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  mealQuality: number;
  healthScore: number;
  recommendations: string[];
  insights: string[];
}

export interface PersonalizedRecommendation {
  id: string;
  userId: string;
  type: 'nutrition' | 'exercise' | 'lifestyle' | 'supplement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  benefits: string[];
  considerations: string[];
  implementation: string[];
  timeframe: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface HealthTrend {
  id: string;
  userId: string;
  metric: string;
  timeframe: string;
  values: Array<{
    date: Date;
    value: number;
    unit: string;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  rate: number;
  significance: 'high' | 'medium' | 'low';
  factors: string[];
  recommendations: string[];
}

export interface PredictiveInsight {
  id: string;
  userId: string;
  metric: string;
  timeframe: string;
  predictedValue: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  factors: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  opportunityLevel: 'low' | 'medium' | 'high';
}

export interface AIResponse {
  content: string;
  confidence: number;
  processingTime: number;
  model: string;
  suggestions?: string[];
  followUpQuestions?: string[];
}

export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
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
  adherenceScore: number;
  varietyScore: number;
  sustainabilityScore: number;
}

export interface Recipe {
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
  category: string;
  cuisine: string;
  dietaryRestrictions: string[];
  allergies: string[];
}

export interface UserPreferences {
  favoriteCuisines: string[];
  dislikedFoods: string[];
  favoriteIngredients: string[];
  cookingMethods: string[];
  spiceLevel: 'mild' | 'medium' | 'hot' | 'very_hot';
  texturePreferences: string[];
  flavorProfiles: string[];
  mealTiming: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snackTimes: string[];
  };
  budget: 'low' | 'medium' | 'high';
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  timeConstraints: {
    breakfast: number;
    lunch: number;
    dinner: number;
    prepTime: number;
  };
  socialPreferences: {
    eatAlone: boolean;
    eatWithOthers: boolean;
    familyStyle: boolean;
  };
  environmentalConcerns: {
    sustainability: boolean;
    organic: boolean;
    local: boolean;
    seasonal: boolean;
  };
}

export interface HealthGoal {
  id: string;
  userId: string;
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'fat_loss' | 'maintenance' | 'performance' | 'health' | 'longevity';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  timeframe: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  milestones: Array<{
    id: string;
    target: number;
    achieved: boolean;
    achievedAt?: Date;
  }>;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion?: Date;
}

export interface ActivityLevel {
  level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  description: string;
  weeklyActivity: {
    exercise: number; // hours per week
    walking: number; // steps per day
    standing: number; // hours per day
    sleep: number; // hours per night
  };
  metabolicRate: number;
  caloriesMultiplier: number;
}

export interface DietaryRestriction {
  type: 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'mediterranean' | 'dash' | 'low_sodium' | 'low_sugar' | 'gluten_free' | 'dairy_free' | 'nut_free' | 'other';
  name: string;
  description: string;
  severity: 'strict' | 'moderate' | 'flexible';
  medicalReason?: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface Allergy {
  food: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  symptoms: string[];
  reactionTime: string;
  medications: string[];
  emergencyContact?: string;
  createdAt: Date;
}

export interface NutritionGoal {
  dailyCalories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
  water: number; // liters
  micronutrients: Record<string, number>;
  ratios: {
    protein: number; // percentage
    carbohydrates: number; // percentage
    fat: number; // percentage
  };
}

export interface NutritionCoachQuestion {
  id: string;
  userId: string;
  question: string;
  category: 'nutrition' | 'exercise' | 'lifestyle' | 'health' | 'performance';
  context: {
    recentMeals: MealAnalysis[];
    healthMetrics: any[];
    goals: HealthGoal[];
    preferences: UserPreferences;
  };
  response: AIResponse;
  createdAt: Date;
  resolved: boolean;
  rating?: number;
  feedback?: string;
}

export interface NutritionProgress {
  userId: string;
  date: Date;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    water: number;
  };
  goals: NutritionGoal;
  adherence: number;
  quality: number;
  score: number;
  insights: string[];
}

export interface NutritionTrend {
  userId: string;
  metric: string;
  timeframe: string;
  values: Array<{
    date: Date;
    value: number;
    unit: string;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  rate: number;
  significance: 'high' | 'medium' | 'low';
  factors: string[];
  recommendations: string[];
}