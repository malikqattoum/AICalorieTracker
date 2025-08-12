import { apiService, ApiResponse } from './apiService';
import { USE_MOCK_DATA, CACHE_KEYS, log } from '../config';

// Types
export type Meal = {
  id: string;
  userId: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

export type MealAnalysis = {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  confidence: number;
  alternatives: {
    foodName: string;
    confidence: number;
  }[];
  portionSize?: string;
  suggestions?: string[];
};

export type DailySummary = {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  meals: Meal[];
  date: string;
  goalProgress: {
    calories: number; // percentage
    protein: number;
    carbs: number;
    fat: number;
  };
};

// Mock data generator
class MockMealService {
  private generateMockMeals(count: number): Meal[] {
    const meals: Meal[] = [];
    const mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    for (let i = 0; i < count; i++) {
      const mealType = mealTypes[i % 4];
      const date = new Date();
      date.setHours(mealType === 'breakfast' ? 8 : mealType === 'lunch' ? 13 : mealType === 'dinner' ? 19 : 16);
      date.setDate(date.getDate() - Math.floor(i / 4));
      
      meals.push({
        id: `meal-${i}`,
        userId: 'user-1',
        foodName: this.getMockFoodName(mealType),
        calories: Math.floor(Math.random() * 400) + 200,
        protein: Math.floor(Math.random() * 30) + 10,
        carbs: Math.floor(Math.random() * 50) + 20,
        fat: Math.floor(Math.random() * 20) + 5,
        fiber: Math.floor(Math.random() * 10) + 1,
        sugar: Math.floor(Math.random() * 15) + 1,
        sodium: Math.floor(Math.random() * 500) + 100,
        mealType,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }
    
    return meals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private getMockFoodName(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string {
    const breakfastOptions = [
      'Oatmeal with Berries',
      'Avocado Toast',
      'Greek Yogurt with Granola',
      'Scrambled Eggs with Spinach',
      'Protein Pancakes',
      'Smoothie Bowl',
      'Chia Pudding',
      'Whole Grain Toast with Peanut Butter',
    ];
    
    const lunchOptions = [
      'Grilled Chicken Salad',
      'Turkey Sandwich',
      'Quinoa Bowl',
      'Vegetable Soup with Bread',
      'Tuna Wrap',
      'Buddha Bowl',
      'Lentil Curry',
      'Chicken Caesar Salad',
    ];
    
    const dinnerOptions = [
      'Salmon with Roasted Vegetables',
      'Steak with Sweet Potato',
      'Pasta with Tomato Sauce',
      'Stir-Fry with Rice',
      'Grilled Fish Tacos',
      'Vegetable Curry with Rice',
      'Chicken Teriyaki with Broccoli',
      'Mediterranean Bowl',
    ];
    
    const snackOptions = [
      'Apple with Almond Butter',
      'Protein Bar',
      'Greek Yogurt',
      'Trail Mix',
      'Hummus with Carrots',
      'Banana with Peanut Butter',
      'Cottage Cheese with Berries',
      'Dark Chocolate',
    ];
    
    const options = mealType === 'breakfast' ? breakfastOptions :
                    mealType === 'lunch' ? lunchOptions :
                    mealType === 'dinner' ? dinnerOptions :
                    snackOptions;
    
    return options[Math.floor(Math.random() * options.length)];
  }

  async getMeals(params?: { date?: string; mealType?: string }): Promise<Meal[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    let meals = this.generateMockMeals(20);
    
    // Filter by date if provided
    if (params?.date) {
      const dateStart = new Date(params.date);
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(params.date);
      dateEnd.setHours(23, 59, 59, 999);
      
      meals = meals.filter(meal => {
        const mealDate = new Date(meal.createdAt);
        return mealDate >= dateStart && mealDate <= dateEnd;
      });
    }
    
    // Filter by meal type if provided
    if (params?.mealType) {
      meals = meals.filter(meal => meal.mealType === params.mealType);
    }
    
    return meals;
  }

  async getMeal(id: string): Promise<Meal> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const meals = this.generateMockMeals(20);
    const meal = meals.find(m => m.id === id);
    
    if (!meal) {
      throw new Error('Meal not found');
    }
    
    return meal;
  }

  async createMeal(mealData: Omit<Meal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Meal> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));
    
    return {
      id: `meal-${Date.now()}`,
      userId: 'user-1',
      ...mealData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async updateMeal(id: string, mealData: Partial<Meal>): Promise<Meal> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));
    
    return {
      id,
      userId: 'user-1',
      foodName: mealData.foodName || 'Updated Meal',
      calories: mealData.calories || 300,
      protein: mealData.protein || 20,
      carbs: mealData.carbs || 30,
      fat: mealData.fat || 10,
      fiber: mealData.fiber || 5,
      sugar: mealData.sugar || 5,
      sodium: mealData.sodium || 300,
      mealType: mealData.mealType || 'lunch',
      imageUrl: mealData.imageUrl,
      createdAt: mealData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteMeal(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock deletion - no actual operation needed
  }

  async analyzeMealImage(imageUri: string): Promise<MealAnalysis> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 2000));
    
    const foodOptions = [
      { name: 'Grilled Chicken Salad', calories: 350, protein: 30, carbs: 15, fat: 20, fiber: 5, sugar: 3, sodium: 400 },
      { name: 'Salmon with Vegetables', calories: 450, protein: 35, carbs: 20, fat: 25, fiber: 6, sugar: 4, sodium: 350 },
      { name: 'Pasta with Tomato Sauce', calories: 550, protein: 15, carbs: 90, fat: 10, fiber: 4, sugar: 8, sodium: 600 },
      { name: 'Steak with Potatoes', calories: 650, protein: 40, carbs: 45, fat: 35, fiber: 3, sugar: 2, sodium: 700 },
      { name: 'Vegetable Stir Fry', calories: 300, protein: 10, carbs: 40, fat: 12, fiber: 8, sugar: 6, sodium: 500 },
      { name: 'Burger with Fries', calories: 850, protein: 35, carbs: 80, fat: 45, fiber: 3, sugar: 10, sodium: 1200 },
      { name: 'Pizza Slice', calories: 300, protein: 12, carbs: 35, fat: 12, fiber: 2, sugar: 4, sodium: 600 },
    ];
    
    const selectedFood = foodOptions[Math.floor(Math.random() * foodOptions.length)];
    const alternatives = foodOptions
      .filter(food => food !== selectedFood)
      .slice(0, 3)
      .map(food => ({
        foodName: food.name,
        confidence: Math.floor(Math.random() * 30) + 10,
      }));
    
    return {
      foodName: selectedFood.name,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
      fiber: selectedFood.fiber,
      sugar: selectedFood.sugar,
      sodium: selectedFood.sodium,
      confidence: Math.floor(Math.random() * 30) + 70,
      alternatives,
      portionSize: 'Medium serving',
      suggestions: [
        'Consider adding more vegetables for extra nutrients',
        'This meal provides good protein content',
        'Watch the sodium levels in processed foods',
      ],
    };
  }

  async getDailySummary(date: string): Promise<DailySummary> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const meals = await this.getMeals({ date });
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
    const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);
    const totalFiber = meals.reduce((sum, meal) => sum + meal.fiber, 0);
    const totalSugar = meals.reduce((sum, meal) => sum + meal.sugar, 0);
    const totalSodium = meals.reduce((sum, meal) => sum + meal.sodium, 0);
    
    // Mock goals for progress calculation
    const goals = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    
    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSugar,
      totalSodium,
      meals,
      date,
      goalProgress: {
        calories: Math.min((totalCalories / goals.calories) * 100, 100),
        protein: Math.min((totalProtein / goals.protein) * 100, 100),
        carbs: Math.min((totalCarbs / goals.carbs) * 100, 100),
        fat: Math.min((totalFat / goals.fat) * 100, 100),
      },
    };
  }
}

// Production meal service
class ProductionMealService {
  async getMeals(params?: { date?: string; mealType?: string }): Promise<Meal[]> {
    const cacheKey = `meals_${params?.date || 'all'}_${params?.mealType || 'all'}`;
    
    const response = await apiService.get<Meal[]>('/api/meals', {
      params,
      cache: true,
      cacheKey,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    });
    
    return response.data;
  }

  async getMeal(id: string): Promise<Meal> {
    const response = await apiService.get<Meal>(`/api/meals/${id}`, {
      cache: true,
      cacheKey: `meal_${id}`,
    });
    
    return response.data;
  }

  async createMeal(mealData: Omit<Meal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Meal> {
    const response = await apiService.post<Meal>('/api/meals', mealData);
    
    // Clear related cache
    await apiService.clearCachePattern('meals_');
    await apiService.clearCachePattern('daily_summary_');
    
    return response.data;
  }

  async updateMeal(id: string, mealData: Partial<Meal>): Promise<Meal> {
    const response = await apiService.put<Meal>(`/api/meals/${id}`, mealData);
    
    // Clear related cache
    await apiService.clearCachePattern('meals_');
    await apiService.clearCachePattern(`meal_${id}`);
    await apiService.clearCachePattern('daily_summary_');
    
    return response.data;
  }

  async deleteMeal(id: string): Promise<void> {
    await apiService.delete(`/api/meals/${id}`);
    
    // Clear related cache
    await apiService.clearCachePattern('meals_');
    await apiService.clearCachePattern(`meal_${id}`);
    await apiService.clearCachePattern('daily_summary_');
  }

  async analyzeMealImage(imageUri: string): Promise<MealAnalysis> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'meal.jpg',
    } as any);

    const response = await apiService.post<MealAnalysis>('/api/meals/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      showErrorToast: true,
    });

    return response.data;
  }

  async getDailySummary(date: string): Promise<DailySummary> {
    const response = await apiService.get<DailySummary>(`/api/meals/daily-summary`, {
      params: { date },
      cache: true,
      cacheKey: `daily_summary_${date}`,
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    });

    return response.data;
  }
}

// Service factory
const createMealService = () => {
  if (USE_MOCK_DATA) {
    log('Using mock meal service');
    return new MockMealService();
  } else {
    log('Using production meal service');
    return new ProductionMealService();
  }
};

// Export service instance
export const mealService = createMealService();
export default mealService;