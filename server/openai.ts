import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || "";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

const openai = new OpenAI({ apiKey });

export interface FoodAnalysisResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in analyzing food images. Identify the food and provide detailed nutritional information."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and return nutritional information in JSON format. Include: food name, calories, protein (g), carbs (g), fat (g), and fiber (g). Provide realistic estimates based on what you see. Format as {'foodName': string, 'calories': number, 'protein': number, 'carbs': number, 'fat': number, 'fiber': number}."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}') as FoodAnalysisResult;
    
    // Ensure all values are numbers
    return {
      foodName: result.foodName,
      calories: Math.round(result.calories),
      protein: Math.round(result.protein),
      carbs: Math.round(result.carbs),
      fat: Math.round(result.fat),
      fiber: Math.round(result.fiber)
    };
  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze food image");
  }
}

export async function getNutritionTips(userId: number): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert providing helpful, personalized nutrition tips."
        },
        {
          role: "user",
          content: "Generate 4 concise, practical nutrition tips that would be helpful for someone tracking their food intake. Each tip should be a separate item in a JSON array format. Keep tips short and actionable."
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return result.tips || [];
  } catch (error) {
    console.error("Error getting nutrition tips:", error);
    return [
      "Try to include protein with every meal for better satiety",
      "Aim for at least 5 servings of fruits and vegetables daily",
      "Stay hydrated by drinking water before and during meals",
      "Choose whole grains over refined carbohydrates when possible"
    ];
  }
}
export async function generateMealPlan(goal: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in personalized meal planning."
        },
        {
          role: "user",
          content: `Generate a 7-day meal plan for ${goal} goal. Include breakfast, lunch, dinner, and snacks with nutrition info.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return {
      ...result,
      id: 0,
      userId: 0,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error("Failed to generate meal plan");
  }
}

export async function getSmartMealSuggestions(userId: number): Promise<string[]> {
  // Optionally, fetch recent meal analyses for more context
  // For now, just use userId for personalization
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in personalized meal suggestions. Suggest healthy, practical meal ideas based on a user's recent eating habits."
        },
        {
          role: "user",
          content: "Suggest 3 healthy meal ideas for my next meal. Each suggestion should be a short, practical meal description, suitable for someone tracking calories and macros. Format as a JSON array of strings."
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });
    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return result.suggestions || [];
  } catch (error) {
    console.error("Error getting smart meal suggestions:", error);
    return [
      "Grilled chicken breast with quinoa and steamed broccoli",
      "Salmon salad with mixed greens, cherry tomatoes, and olive oil vinaigrette",
      "Vegetarian stir-fry with tofu, bell peppers, and brown rice"
    ];
  }
}

export interface MultiFoodAnalysisResult {
  foods: Array<{
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }>;
}

export async function analyzeMultiFoodImage(base64Image: string): Promise<MultiFoodAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in analyzing food images. Identify all distinct foods in the image and provide detailed nutritional information for each."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and return nutritional information for each distinct food you see. For each food, include: food name, calories, protein (g), carbs (g), fat (g), and fiber (g). Format as {foods: [{foodName: string, calories: number, protein: number, carbs: number, fat: number, fiber: number}]}"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });
    const result = JSON.parse(response.choices[0].message.content ?? '{}') as MultiFoodAnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing multi-food image:", error);
    throw new Error("Failed to analyze multi-food image");
  }
}
