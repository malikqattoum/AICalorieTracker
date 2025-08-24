export interface Meal {
  id: number;
  user_id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  created_at?: Date;
  updated_at?: Date;
}