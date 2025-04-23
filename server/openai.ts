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

    const result = JSON.parse(response.choices[0].message.content) as FoodAnalysisResult;
    
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

    const result = JSON.parse(response.choices[0].message.content);
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
