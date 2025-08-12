import api from './api';

// Types
export type Meal = {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: string;
};

export type DailyStats = {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieGoal: number;
  meals: Meal[];
};

export type CalendarData = {
  markedDates: Record<string, { marked: boolean; dotColor: string }>;
};

// Generate mock data for a month
const generateMockCalendarData = (month: string): CalendarData => {
  const markedDates: Record<string, { marked: boolean; dotColor: string }> = {};
  
  // Parse the month string (format: 'YYYY-MM')
  const [year, monthNum] = month.split('-').map(Number);
  
  // Get the number of days in the month
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  
  // Mark random days (about 60% of days)
  for (let day = 1; day <= daysInMonth; day++) {
    if (Math.random() > 0.4) {
      const dateString = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      markedDates[dateString] = { marked: true, dotColor: '#4F46E5' };
    }
  }
  
  return { markedDates };
};

// Generate mock daily stats for a date
const generateMockDailyStats = (date: string): DailyStats => {
  // Generate random values for daily totals
  const totalCalories = Math.floor(Math.random() * 1000) + 1000; // 1000-2000 calories
  const totalProtein = Math.floor(Math.random() * 50) + 50; // 50-100g protein
  const totalCarbs = Math.floor(Math.random() * 100) + 100; // 100-200g carbs
  const totalFat = Math.floor(Math.random() * 30) + 40; // 40-70g fat
  
  // Generate random number of meals (1-4)
  const numMeals = Math.floor(Math.random() * 4) + 1;
  
  // Meal types based on time of day
  const mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  // Generate meals
  const meals: Meal[] = [];
  for (let i = 0; i < numMeals; i++) {
    const mealType = mealTypes[i % 4];
    const hour = mealType === 'breakfast' ? 8 : mealType === 'lunch' ? 13 : mealType === 'dinner' ? 19 : 16;
    
    meals.push({
      id: `meal-${date}-${i}`,
      foodName: getMockFoodName(mealType),
      calories: Math.floor(totalCalories / numMeals),
      protein: Math.floor(totalProtein / numMeals),
      carbs: Math.floor(totalCarbs / numMeals),
      fat: Math.floor(totalFat / numMeals),
      mealType,
      createdAt: `${date}T${hour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00.000Z`,
    });
  }
  
  return {
    date,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    calorieGoal: 2000,
    meals,
  };
};

// Helper function to get mock food names
const getMockFoodName = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string => {
  const breakfastOptions = [
    'Oatmeal with Berries',
    'Avocado Toast',
    'Greek Yogurt with Granola',
    'Scrambled Eggs with Spinach',
    'Protein Pancakes',
    'Smoothie Bowl',
  ];
  
  const lunchOptions = [
    'Grilled Chicken Salad',
    'Turkey Sandwich',
    'Quinoa Bowl',
    'Vegetable Soup with Bread',
    'Tuna Wrap',
    'Buddha Bowl',
  ];
  
  const dinnerOptions = [
    'Salmon with Roasted Vegetables',
    'Steak with Sweet Potato',
    'Pasta with Tomato Sauce',
    'Stir-Fry with Rice',
    'Grilled Fish Tacos',
    'Vegetable Curry with Rice',
  ];
  
  const snackOptions = [
    'Apple with Almond Butter',
    'Protein Bar',
    'Greek Yogurt',
    'Trail Mix',
    'Hummus with Carrots',
    'Banana with Peanut Butter',
  ];
  
  const options = mealType === 'breakfast' ? breakfastOptions :
                  mealType === 'lunch' ? lunchOptions :
                  mealType === 'dinner' ? dinnerOptions :
                  snackOptions;
  
  return options[Math.floor(Math.random() * options.length)];
};

// Calendar service
const calendarService = {
  // Get calendar data for a month
  getCalendarData: async (month?: string): Promise<CalendarData> => {
    try {
      // In production, this would call the API
      // return await api.calendar.getCalendarData(month);
      
      // For development, generate mock data
      const currentMonth = month || new Date().toISOString().slice(0, 7); // Format: 'YYYY-MM'
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return generateMockCalendarData(currentMonth);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      throw new Error('Failed to fetch calendar data. Please try again.');
    }
  },
  
  // Get daily stats for a date
  getDailyStats: async (date: string): Promise<DailyStats> => {
    try {
      // In production, this would call the API
      // return await api.calendar.getDailyStats(date);
      
      // For development, generate mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return generateMockDailyStats(date);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw new Error('Failed to fetch daily stats. Please try again.');
    }
  },
};

export default calendarService;