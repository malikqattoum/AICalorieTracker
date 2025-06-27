import { Router } from 'express';
import { db } from '../../db';
import { mealAnalyses, nutritionGoals, favoriteMeals } from '@shared/schema';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY || "";
const MODEL = "gpt-4o";
const openai = new OpenAI({ apiKey });

// Get meal recommendations based on meal type and preferences
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get query parameters
    const type = (req.query.type as string) || 'lunch';
    const preferences = ((req.query.preferences as string) || '').split(',').filter(Boolean);

    // Validate meal type
    if (!['breakfast', 'lunch', 'dinner'].includes(type)) {
      return res.status(400).json({ error: 'Invalid meal type' });
    }

    // Get user's nutrition goals if available
    const userGoals = await db.query.nutritionGoals.findFirst({
      where: eq(nutritionGoals.userId, userId),
    });

    // Get recent meal analyses to understand user's eating patterns
    const recentMeals = await db.query.mealAnalyses.findMany({
      where: eq(mealAnalyses.userId, userId),
      orderBy: (mealAnalyses, { desc }) => [desc(mealAnalyses.timestamp)],
      limit: 10,
    });

    // Generate personalized meal recommendations using OpenAI
    const recommendations = await generateMealRecommendations(type, preferences, userGoals, recentMeals);

    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching meal recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch meal recommendations' });
  }
});

// Save a meal to favorites
router.post('/favorite-meals', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { mealId, mealName, mealType, calories, protein, carbs, fat, description, tags } = req.body;
    
    if (!mealId || !mealName || !mealType) {
      return res.status(400).json({ error: 'Missing required meal information' });
    }

    // Check if meal is already in favorites
    const existingFavorite = await db.query.favoriteMeals.findFirst({
      where: and(
        eq(favoriteMeals.userId, userId),
        eq(favoriteMeals.mealId, parseInt(mealId, 10))
      ),
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Meal already in favorites' });
    }

    // Add meal to favorites
    await db.insert(favoriteMeals).values({
      userId,
      mealId: parseInt(mealId, 10),
      mealName,
      mealType,
      nutrition: {
        calories,
        protein,
        carbs,
        fat,
        description
      },
    });

    res.json({ success: true, message: 'Meal saved to favorites' });
  } catch (error) {
    console.error('Error saving meal to favorites:', error);
    res.status(500).json({ error: 'Failed to save meal to favorites' });
  }
});

// Get user's favorite meals
router.get('/favorite-meals', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get query parameters
    const type = req.query.type as string;

    // Build query
    const conditions: (SQL<unknown> | undefined)[] = [eq(favoriteMeals.userId, userId)];

    if (type && ['breakfast', 'lunch', 'dinner'].includes(type)) {
      conditions.push(eq(favoriteMeals.mealType, type));
    }

    const queryCondition = and(...conditions.filter(Boolean) as SQL<unknown>[]);

    // Get favorite meals
    const favorites = await db.query.favoriteMeals.findMany({
      where: queryCondition,
      orderBy: (favoriteMeals, { desc }) => [desc(favoriteMeals.createdAt)],
    });

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorite meals:', error);
    res.status(500).json({ error: 'Failed to fetch favorite meals' });
  }
});

// Remove a meal from favorites
router.delete('/favorite-meals/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const mealId = req.params.id;
    if (!mealId) {
      return res.status(400).json({ error: 'Missing meal ID' });
    }

    // Remove meal from favorites
    await db.delete(favoriteMeals).where(
      and(
        eq(favoriteMeals.userId, userId),
        eq(favoriteMeals.mealId, parseInt(mealId, 10))
      )
    );

    res.json({ success: true, message: 'Meal removed from favorites' });
  } catch (error) {
    console.error('Error removing meal from favorites:', error);
    res.status(500).json({ error: 'Failed to remove meal from favorites' });
  }
});

// Get a full daily meal plan
router.post('/daily-plan', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { targetCalories, preferences } = req.body;

    if (!targetCalories || typeof targetCalories !== 'number' || targetCalories <= 0) {
      return res.status(400).json({ error: 'Invalid targetCalories' });
    }

    // Get user's nutrition goals if available (optional, could refine plan)
    const userGoals = await db.query.nutritionGoals.findFirst({
      where: eq(nutritionGoals.userId, userId),
    });

    // Get recent meal analyses to understand user's eating patterns (optional, could refine plan)
    const recentMeals = await db.query.mealAnalyses.findMany({
      where: eq(mealAnalyses.userId, userId),
      orderBy: (mealAnalyses, { desc }) => [desc(mealAnalyses.timestamp)],
      limit: 5, // Limit to a few recent meals for context
    });

    const dailyPlan = await generateDailyMealPlan(targetCalories, preferences || [], userGoals, recentMeals);

    res.json(dailyPlan);
  } catch (error) {
    console.error('Error fetching daily meal plan:', error);
    res.status(500).json({ error: 'Failed to fetch daily meal plan' });
  }
});

// Helper function to generate meal recommendations using OpenAI
async function generateMealRecommendations(type: string, preferences: string[], userGoals: any, recentMeals: any[]) {
  try {
    // Prepare user data for context
    const userContext = {
      nutritionGoals: userGoals ? {
        dailyCalories: userGoals.dailyCalories,
        dailyProtein: userGoals.dailyProtein,
        dailyCarbs: userGoals.dailyCarbs,
        dailyFat: userGoals.dailyFat,
      } : null,
      recentMeals: recentMeals.map(meal => ({
        foodName: meal.foodName,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      })),
      preferences: preferences,
      mealType: type,
    };

    // Call OpenAI API to generate recommendations
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in personalized meal recommendations. Generate meal ideas based on user preferences, nutrition goals, and recent eating patterns."
        },
        {
          role: "user",
          content: `Generate 3 personalized ${type} meal recommendations for a user with the following context: ${JSON.stringify(userContext)}. Each recommendation should include: id, name, description, calories, protein, carbs, fat, prepTime (in minutes), difficulty (easy, medium, or hard), and tags (array of dietary preferences). Format as a JSON array.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.recommendations || [];
  } catch (error) {
    console.error("Error generating meal recommendations:", error);
    
    // Fallback to basic recommendations if OpenAI fails
    return [
      {
        id: `${type}-1`,
        name: type === 'breakfast' ? 'Greek Yogurt Parfait' : type === 'lunch' ? 'Mediterranean Quinoa Bowl' : 'Baked Salmon with Vegetables',
        description: 'A balanced meal with protein, healthy fats, and complex carbs.',
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 15,
        prepTime: 15,
        difficulty: 'medium',
        tags: preferences.length > 0 ? preferences : ['balanced', 'healthy'],
      },
      {
        id: `${type}-2`,
        name: type === 'breakfast' ? 'Avocado Toast with Egg' : type === 'lunch' ? 'Grilled Chicken Salad' : 'Vegetarian Chili',
        description: 'A nutritious option that is quick to prepare.',
        calories: 400,
        protein: 20,
        carbs: 35,
        fat: 18,
        prepTime: 10,
        difficulty: 'easy',
        tags: preferences.length > 0 ? preferences : ['quick', 'nutritious'],
      },
      {
        id: `${type}-3`,
        name: type === 'breakfast' ? 'Protein Smoothie Bowl' : type === 'lunch' ? 'Turkey and Avocado Wrap' : 'Stir-Fried Tofu with Vegetables',
        description: 'A flavorful meal with balanced macronutrients.',
        calories: 380,
        protein: 22,
        carbs: 40,
        fat: 14,
        prepTime: 20,
        difficulty: 'medium',
        tags: preferences.length > 0 ? preferences : ['balanced', 'flavorful'],
      },
    ];
  }
}

// Helper function to generate a daily meal plan using OpenAI
async function generateDailyMealPlan(targetCalories: number, preferences: string[], userGoals: any, recentMeals: any[]) {
  try {
    const userContext = {
      targetDailyCalories: targetCalories,
      preferences: preferences,
      nutritionGoals: userGoals ? {
        dailyCalories: userGoals.dailyCalories,
        dailyProtein: userGoals.dailyProtein,
        dailyCarbs: userGoals.dailyCarbs,
        dailyFat: userGoals.dailyFat,
      } : null,
      recentMeals: recentMeals.map(meal => ({
        foodName: meal.foodName,
        calories: meal.calories,
        // protein: meal.protein, // Can be added if needed for more context
        // carbs: meal.carbs,
        // fat: meal.fat,
      })),
    };

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in creating personalized daily meal plans. Generate a full day's meal plan (breakfast, lunch, dinner) based on the user's target calories, preferences, and optionally their nutrition goals and recent eating patterns. Each meal should include: name, description, estimated calories, protein, carbs, and fat."
        },
        {
          role: "user",
          content: `Generate a daily meal plan for a user with the following context: ${JSON.stringify(userContext)}. The plan should aim for approximately ${targetCalories} total calories for the day. Format the response as a JSON object with keys 'breakfast', 'lunch', and 'dinner'. Each key should have an object as its value containing: name, description, calories, protein, carbs, fat. Ensure the sum of calories for all meals is close to the targetDailyCalories.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500, // Increased token limit for a full day plan
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    // Basic validation for the plan structure
    if (result.breakfast && result.lunch && result.dinner) {
      return result;
    } else {
      console.error('OpenAI response for daily plan is not in the expected format:', result);
      throw new Error('Failed to generate a valid daily meal plan structure.');
    }

  } catch (error) {
    console.error('Error generating daily meal plan:', error);
    // Fallback to a generic plan if OpenAI fails or returns an unexpected format
    return {
      breakfast: {
        name: 'Oatmeal with Berries and Nuts',
        description: 'A hearty and nutritious start to your day.',
        calories: Math.round(targetCalories * 0.3),
        protein: 15,
        carbs: 50,
        fat: 10
      },
      lunch: {
        name: 'Chicken Salad Sandwich on Whole Wheat',
        description: 'A balanced lunch providing protein and fiber.',
        calories: Math.round(targetCalories * 0.35),
        protein: 25,
        carbs: 45,
        fat: 15
      },
      dinner: {
        name: 'Baked Salmon with Roasted Vegetables',
        description: 'A light yet satisfying dinner rich in omega-3s.',
        calories: Math.round(targetCalories * 0.35),
        protein: 30,
        carbs: 40,
        fat: 20
      }
    };
  }
}

export default router;