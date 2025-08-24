import db from '../db';
import { Meal } from '../models/meal';

export default {
  async getUserMeals(userId: number, date?: string, type?: string) {
    let query = 'SELECT * FROM meals WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    const [meals] = await db.execute(query, params);
    return meals;
  },

  async createMeal(userId: number, mealData: Omit<Meal, 'id' | 'user_id'>) {
    const [result] = await db.execute(
      'INSERT INTO meals (user_id, name, calories, protein, carbs, fat, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, mealData.name, mealData.calories, mealData.protein, mealData.carbs, mealData.fat, mealData.date]
    );
    return { id: result.insertId, ...mealData };
  },

  async updateMeal(userId: number, mealId: number, updates: Partial<Meal>) {
    const fields = [];
    const params = [];
    
    for (const [field, value] of Object.entries(updates)) {
      fields.push(`${field} = ?`);
      params.push(value);
    }
    
    params.push(mealId, userId);
    
    await db.execute(
      `UPDATE meals SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    
    return this.getMealById(userId, mealId);
  },

  async deleteMeal(userId: number, mealId: number) {
    await db.execute(
      'DELETE FROM meals WHERE id = ? AND user_id = ?',
      [mealId, userId]
    );
  },

  async getMealById(userId: number, mealId: number) {
    const [meals] = await db.execute(
      'SELECT * FROM meals WHERE id = ? AND user_id = ?',
      [mealId, userId]
    );
    return meals.length ? meals[0] : null;
  },

  async getDailySummary(userId: number, date: string) {
    const [summary] = await db.execute(
      `SELECT 
        SUM(calories) as totalCalories,
        SUM(protein) as totalProtein,
        SUM(carbs) as totalCarbs,
        SUM(fat) as totalFat
       FROM meals 
       WHERE user_id = ? AND date = ?`,
      [userId, date]
    );
    
    return summary.length ? summary[0] : {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    };
  }
};