import { User } from '@shared/schema';
import { getNutritionGoals } from './storage-provider';
import { MealRecommendation } from './types';

interface OptimizationConstraints {
  minProtein: number;
  maxProtein: number;
  minCarbs: number;
  maxCarbs: number;
  minFat: number;
  maxFat: number;
  totalCalories: number;
}

export class MacroOptimizer {
  private user: User;
  
  constructor(user: User) {
    this.user = user;
  }

  async optimizeMeal(meals: MealRecommendation[]): Promise<MealRecommendation[]> {
    const goals = await getNutritionGoals(this.user.id);
    if (!goals) return meals; // Fallback if no goals set
    
    const constraints = this.getConstraints(goals);
    return this.optimizeWithLP(meals, constraints);
  }

  private getConstraints(goals: any): OptimizationConstraints {
    // Allow 10% flexibility around goals
    return {
      minProtein: goals.protein * 0.9,
      maxProtein: goals.protein * 1.1,
      minCarbs: goals.carbs * 0.9,
      maxCarbs: goals.carbs * 1.1,
      minFat: goals.fat * 0.9,
      maxFat: goals.fat * 1.1,
      totalCalories: goals.calories
    };
  }

  private optimizeWithLP(meals: MealRecommendation[], constraints: OptimizationConstraints): MealRecommendation[] {
    // Simplified linear programming approach
    // In production, use a proper LP solver library
    const sortedMeals = meals
      .map(meal => ({
        ...meal,
        score: this.calculateMacroScore(meal, constraints)
      }))
      .sort((a, b) => b.score - a.score);
    
    return sortedMeals.slice(0, 5);
  }

  private calculateMacroScore(meal: MealRecommendation, constraints: OptimizationConstraints): number {
    let score = 0;
    
    // Protein score - higher is better
    if (meal.protein >= constraints.minProtein && meal.protein <= constraints.maxProtein) {
      score += 100;
    } else {
      score -= Math.abs(meal.protein - constraints.minProtein) * 10;
    }
    
    // Carbs score - closer to target is better
    if (meal.carbs >= constraints.minCarbs && meal.carbs <= constraints.maxCarbs) {
      score += 100;
    } else {
      score -= Math.abs(meal.carbs - constraints.minCarbs) * 5;
    }
    
    // Fat score - closer to target is better
    if (meal.fat >= constraints.minFat && meal.fat <= constraints.maxFat) {
      score += 100;
    } else {
      score -= Math.abs(meal.fat - constraints.minFat) * 5;
    }
    
    // Calorie score - exact match is best
    if (meal.calories <= constraints.totalCalories) {
      score += 200 - Math.abs(meal.calories - constraints.totalCalories);
    } else {
      score -= Math.abs(meal.calories - constraints.totalCalories) * 2;
    }
    
    return score;
  }
}