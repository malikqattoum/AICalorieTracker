import api from './api';

// Types
export type MealPlanPreferences = {
  dietType: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  calorieTarget: number;
  excludeIngredients: string[];
  goal: 'weightLoss' | 'maintenance' | 'muscleGain';
};

export type MealPlanItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
};

export type MealPlan = {
  id: string;
  userId: string;
  date: string;
  preferences: MealPlanPreferences;
  meals: {
    breakfast: MealPlanItem;
    lunch: MealPlanItem;
    dinner: MealPlanItem;
    snacks: MealPlanItem[];
  };
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
};

// Generate mock meal plan
const generateMockMealPlan = (preferences: MealPlanPreferences): MealPlan => {
  // Adjust calorie distribution based on goal
  let breakfastCalories, lunchCalories, dinnerCalories, snackCalories;
  
  switch (preferences.goal) {
    case 'weightLoss':
      breakfastCalories = Math.round(preferences.calorieTarget * 0.25);
      lunchCalories = Math.round(preferences.calorieTarget * 0.35);
      dinnerCalories = Math.round(preferences.calorieTarget * 0.3);
      snackCalories = Math.round(preferences.calorieTarget * 0.1);
      break;
    case 'maintenance':
      breakfastCalories = Math.round(preferences.calorieTarget * 0.3);
      lunchCalories = Math.round(preferences.calorieTarget * 0.3);
      dinnerCalories = Math.round(preferences.calorieTarget * 0.3);
      snackCalories = Math.round(preferences.calorieTarget * 0.1);
      break;
    case 'muscleGain':
      breakfastCalories = Math.round(preferences.calorieTarget * 0.3);
      lunchCalories = Math.round(preferences.calorieTarget * 0.25);
      dinnerCalories = Math.round(preferences.calorieTarget * 0.25);
      snackCalories = Math.round(preferences.calorieTarget * 0.2);
      break;
    default:
      breakfastCalories = Math.round(preferences.calorieTarget * 0.3);
      lunchCalories = Math.round(preferences.calorieTarget * 0.3);
      dinnerCalories = Math.round(preferences.calorieTarget * 0.3);
      snackCalories = Math.round(preferences.calorieTarget * 0.1);
  }
  
  // Generate meals based on diet type
  const breakfast = generateMockMeal('breakfast', breakfastCalories, preferences.dietType);
  const lunch = generateMockMeal('lunch', lunchCalories, preferences.dietType);
  const dinner = generateMockMeal('dinner', dinnerCalories, preferences.dietType);
  const snack = generateMockMeal('snack', snackCalories, preferences.dietType);
  
  // Calculate totals
  const totalCalories = breakfast.calories + lunch.calories + dinner.calories + snack.calories;
  const totalProtein = breakfast.protein + lunch.protein + dinner.protein + snack.protein;
  const totalCarbs = breakfast.carbs + lunch.carbs + dinner.carbs + snack.carbs;
  const totalFat = breakfast.fat + lunch.fat + dinner.fat + snack.fat;
  
  return {
    id: `plan-${Date.now()}`,
    userId: 'user-1',
    date: new Date().toISOString().split('T')[0],
    preferences,
    meals: {
      breakfast,
      lunch,
      dinner,
      snacks: [snack],
    },
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    createdAt: new Date().toISOString(),
  };
};

// Generate mock meal
const generateMockMeal = (
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  targetCalories: number,
  dietType: string
): MealPlanItem => {
  // Define meal options based on diet type and meal type
  const mealOptions: Record<string, Record<string, any>> = {
    standard: {
      breakfast: [
        {
          name: 'Scrambled Eggs with Toast',
          caloriesPerServing: 350,
          proteinPercentage: 0.25,
          carbsPercentage: 0.4,
          fatPercentage: 0.35,
          ingredients: [
            '3 large eggs',
            '1 tablespoon butter',
            '2 slices whole grain bread',
            'Salt and pepper to taste',
          ],
          instructions: [
            'Whisk eggs in a bowl with salt and pepper',
            'Melt butter in a non-stick pan over medium heat',
            'Add eggs and stir until scrambled',
            'Toast bread and serve with eggs',
          ],
        },
        {
          name: 'Greek Yogurt with Berries and Granola',
          caloriesPerServing: 400,
          proteinPercentage: 0.2,
          carbsPercentage: 0.5,
          fatPercentage: 0.3,
          ingredients: [
            '1 cup Greek yogurt',
            '1/2 cup mixed berries',
            '1/4 cup granola',
            '1 tablespoon honey',
          ],
          instructions: [
            'Add yogurt to a bowl',
            'Top with berries and granola',
            'Drizzle with honey',
          ],
        },
      ],
      lunch: [
        {
          name: 'Grilled Chicken Salad',
          caloriesPerServing: 450,
          proteinPercentage: 0.35,
          carbsPercentage: 0.3,
          fatPercentage: 0.35,
          ingredients: [
            '4 oz grilled chicken breast',
            '2 cups mixed greens',
            '1/4 cup cherry tomatoes',
            '1/4 cup cucumber',
            '2 tablespoons olive oil dressing',
          ],
          instructions: [
            'Grill chicken until cooked through',
            'Combine greens, tomatoes, and cucumber in a bowl',
            'Slice chicken and add to salad',
            'Drizzle with dressing',
          ],
        },
        {
          name: 'Turkey and Avocado Wrap',
          caloriesPerServing: 500,
          proteinPercentage: 0.25,
          carbsPercentage: 0.4,
          fatPercentage: 0.35,
          ingredients: [
            '1 whole wheat tortilla',
            '4 oz sliced turkey',
            '1/2 avocado, sliced',
            '1 slice cheese',
            'Lettuce and tomato',
          ],
          instructions: [
            'Lay tortilla flat',
            'Layer turkey, avocado, cheese, lettuce, and tomato',
            'Roll up tightly',
            'Cut in half and serve',
          ],
        },
      ],
      dinner: [
        {
          name: 'Salmon with Roasted Vegetables',
          caloriesPerServing: 550,
          proteinPercentage: 0.3,
          carbsPercentage: 0.3,
          fatPercentage: 0.4,
          ingredients: [
            '6 oz salmon fillet',
            '1 cup broccoli',
            '1 cup bell peppers',
            '1 tablespoon olive oil',
            'Salt, pepper, and herbs to taste',
          ],
          instructions: [
            'Preheat oven to 400°F',
            'Toss vegetables with olive oil, salt, and pepper',
            'Place salmon and vegetables on a baking sheet',
            'Roast for 15-20 minutes until salmon is cooked through',
          ],
        },
        {
          name: 'Spaghetti Bolognese',
          caloriesPerServing: 600,
          proteinPercentage: 0.25,
          carbsPercentage: 0.5,
          fatPercentage: 0.25,
          ingredients: [
            '2 oz whole wheat spaghetti',
            '4 oz ground beef',
            '1/2 cup tomato sauce',
            '1/4 onion, diced',
            '1 clove garlic, minced',
            'Italian herbs and spices',
          ],
          instructions: [
            'Cook spaghetti according to package instructions',
            'Brown beef in a pan with onion and garlic',
            'Add tomato sauce and herbs, simmer for 10 minutes',
            'Serve sauce over spaghetti',
          ],
        },
      ],
      snack: [
        {
          name: 'Apple with Almond Butter',
          caloriesPerServing: 200,
          proteinPercentage: 0.1,
          carbsPercentage: 0.6,
          fatPercentage: 0.3,
          ingredients: [
            '1 medium apple',
            '1 tablespoon almond butter',
          ],
          instructions: [
            'Slice apple',
            'Serve with almond butter for dipping',
          ],
        },
        {
          name: 'Greek Yogurt with Honey',
          caloriesPerServing: 150,
          proteinPercentage: 0.4,
          carbsPercentage: 0.4,
          fatPercentage: 0.2,
          ingredients: [
            '1/2 cup Greek yogurt',
            '1 teaspoon honey',
          ],
          instructions: [
            'Mix honey into yogurt',
            'Enjoy!',
          ],
        },
      ],
    },
    vegetarian: {
      breakfast: [
        {
          name: 'Vegetarian Omelette',
          caloriesPerServing: 350,
          proteinPercentage: 0.2,
          carbsPercentage: 0.3,
          fatPercentage: 0.5,
          ingredients: [
            '3 large eggs',
            '1/4 cup spinach',
            '1/4 cup bell peppers',
            '1/4 cup mushrooms',
            '1 oz cheese',
          ],
          instructions: [
            'Whisk eggs in a bowl',
            'Sauté vegetables until soft',
            'Pour eggs over vegetables and cook until set',
            'Sprinkle cheese on top and fold omelette',
          ],
        },
      ],
      lunch: [
        {
          name: 'Quinoa Bowl with Roasted Vegetables',
          caloriesPerServing: 450,
          proteinPercentage: 0.15,
          carbsPercentage: 0.6,
          fatPercentage: 0.25,
          ingredients: [
            '1/2 cup cooked quinoa',
            '1 cup roasted vegetables (bell peppers, zucchini, onions)',
            '1/4 cup chickpeas',
            '1 tablespoon tahini dressing',
          ],
          instructions: [
            'Combine quinoa, roasted vegetables, and chickpeas in a bowl',
            'Drizzle with tahini dressing',
            'Garnish with fresh herbs if desired',
          ],
        },
      ],
      dinner: [
        {
          name: 'Vegetable Stir-Fry with Tofu',
          caloriesPerServing: 500,
          proteinPercentage: 0.2,
          carbsPercentage: 0.5,
          fatPercentage: 0.3,
          ingredients: [
            '4 oz firm tofu, cubed',
            '2 cups mixed vegetables (broccoli, carrots, snap peas)',
            '1/2 cup brown rice',
            '2 tablespoons stir-fry sauce',
          ],
          instructions: [
            'Press tofu to remove excess water, then cube',
            'Stir-fry tofu until golden',
            'Add vegetables and cook until tender-crisp',
            'Add sauce and serve over brown rice',
          ],
        },
      ],
      snack: [
        {
          name: 'Hummus with Vegetable Sticks',
          caloriesPerServing: 200,
          proteinPercentage: 0.15,
          carbsPercentage: 0.5,
          fatPercentage: 0.35,
          ingredients: [
            '1/4 cup hummus',
            '1 cup vegetable sticks (carrots, celery, bell peppers)',
          ],
          instructions: [
            'Serve hummus with vegetable sticks for dipping',
          ],
        },
      ],
    },
    // Add more diet types as needed
  };
  
  // Default to standard if diet type not found
  const dietOptions = mealOptions[dietType] || mealOptions.standard;
  const mealChoices = dietOptions[mealType];
  const selectedMeal = mealChoices[Math.floor(Math.random() * mealChoices.length)];
  
  // Scale calories to target
  const scaleFactor = targetCalories / selectedMeal.caloriesPerServing;
  
  return {
    id: `meal-${Date.now()}-${mealType}`,
    name: selectedMeal.name,
    calories: Math.round(selectedMeal.caloriesPerServing * scaleFactor),
    protein: Math.round(selectedMeal.caloriesPerServing * selectedMeal.proteinPercentage * scaleFactor / 4), // 4 calories per gram of protein
    carbs: Math.round(selectedMeal.caloriesPerServing * selectedMeal.carbsPercentage * scaleFactor / 4), // 4 calories per gram of carbs
    fat: Math.round(selectedMeal.caloriesPerServing * selectedMeal.fatPercentage * scaleFactor / 9), // 9 calories per gram of fat
    ingredients: selectedMeal.ingredients,
    instructions: selectedMeal.instructions,
    mealType,
  };
};

// Meal plan service
const mealPlanService = {
  // Generate meal plan
  generateMealPlan: async (preferences: MealPlanPreferences): Promise<MealPlan> => {
    try {
      // In production, this would call the API
      // return await api.mealPlans.generatePlan(preferences);
      
      // For development, generate mock data
      
      // Simulate network delay (longer to simulate AI processing)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return generateMockMealPlan(preferences);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw new Error('Failed to generate meal plan. Please try again.');
    }
  },
  
  // Save meal plan
  saveMealPlan: async (plan: MealPlan): Promise<MealPlan> => {
    try {
      // In production, this would call the API
      // return await api.mealPlans.savePlan(plan);
      
      // For development, return the same plan
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return plan;
    } catch (error) {
      console.error('Error saving meal plan:', error);
      throw new Error('Failed to save meal plan. Please try again.');
    }
  },
  
  // Get meal plans
  getMealPlans: async (): Promise<MealPlan[]> => {
    try {
      // In production, this would call the API
      // return await api.mealPlans.getPlans();
      
      // For development, return empty array
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return [];
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      throw new Error('Failed to fetch meal plans. Please try again.');
    }
  },
};

export default mealPlanService;