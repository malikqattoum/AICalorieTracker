import { GoogleGenerativeAI } from '@google/generative-ai';

export interface NutritionData {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MultiFoodAnalysis {
  foods: NutritionData[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function analyzeWithGemini(
  imageData: string,
  prompt: string,
  modelName: string = 'gemini-1.5-pro-vision-latest'
): Promise<NutritionData> {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please configure API key in admin panel.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Convert base64 image data to the format Gemini expects
    const imageParts = [{
      inlineData: {
        data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
        mimeType: 'image/jpeg'
      }
    }];

    const fullPrompt = `${prompt}

Please analyze this food image and respond with ONLY a JSON object in this exact format:
{
  "foodName": "descriptive name of the food",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number
}

Make sure all nutrition values are realistic numbers. If you can't identify the food clearly, make reasonable estimates based on what you can see.`;

    const result = await model.generateContent([fullPrompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse nutrition data from Gemini response');
    }

    const nutritionData = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!nutritionData.foodName || typeof nutritionData.calories !== 'number') {
      throw new Error('Invalid nutrition data structure from Gemini');
    }

    return {
      foodName: nutritionData.foodName,
      calories: Math.round(nutritionData.calories),
      protein: Math.round(nutritionData.protein || 0),
      carbs: Math.round(nutritionData.carbs || 0),
      fat: Math.round(nutritionData.fat || 0),
      fiber: Math.round(nutritionData.fiber || 0),
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze image with Gemini Vision');
  }
}

export async function analyzeMultiFoodWithGemini(
  imageData: string,
  prompt: string,
  modelName: string = 'gemini-1.5-pro-vision-latest'
): Promise<MultiFoodAnalysis> {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please configure API key in admin panel.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const imageParts = [{
      inlineData: {
        data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
        mimeType: 'image/jpeg'
      }
    }];

    const fullPrompt = `${prompt}

Please analyze this food image and identify all individual food items. Respond with ONLY a JSON object in this exact format:
{
  "foods": [
    {
      "foodName": "name of food item 1",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "totalCalories": sum_of_all_calories,
  "totalProtein": sum_of_all_protein,
  "totalCarbs": sum_of_all_carbs,
  "totalFat": sum_of_all_fat,
  "totalFiber": sum_of_all_fiber
}

Include each distinct food item as a separate object in the foods array. Calculate realistic nutrition values for each portion size visible.`;

    const result = await model.generateContent([fullPrompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse nutrition data from Gemini response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);
    
    if (!analysisData.foods || !Array.isArray(analysisData.foods)) {
      throw new Error('Invalid multi-food analysis structure from Gemini');
    }

    // Ensure all numbers are properly rounded
    analysisData.foods = analysisData.foods.map((food: any) => ({
      foodName: food.foodName,
      calories: Math.round(food.calories || 0),
      protein: Math.round(food.protein || 0),
      carbs: Math.round(food.carbs || 0),
      fat: Math.round(food.fat || 0),
      fiber: Math.round(food.fiber || 0),
    }));

    return {
      foods: analysisData.foods,
      totalCalories: Math.round(analysisData.totalCalories || 0),
      totalProtein: Math.round(analysisData.totalProtein || 0),
      totalCarbs: Math.round(analysisData.totalCarbs || 0),
      totalFat: Math.round(analysisData.totalFat || 0),
      totalFiber: Math.round(analysisData.totalFiber || 0),
    };
  } catch (error) {
    console.error('Gemini multi-food API error:', error);
    throw new Error('Failed to analyze multiple foods with Gemini Vision');
  }
}

export async function generateMealSuggestionsWithGemini(
  userPreferences: any,
  modelName: string = 'gemini-1.5-pro-latest'
): Promise<any> {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Based on the following user preferences, suggest 3 healthy meals for today:
    
User Goals: ${userPreferences.primaryGoal || 'general health'}
Dietary Preferences: ${userPreferences.dietaryPreferences?.join(', ') || 'none'}
Allergies: ${userPreferences.allergies?.join(', ') || 'none'}
Daily Calorie Target: ${userPreferences.dailyCalories || 2000}

Please respond with ONLY a JSON object in this format:
{
  "meals": [
    {
      "name": "meal name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "ingredients": ["ingredient1", "ingredient2"],
      "instructions": "cooking instructions"
    }
  ]
}

Make sure the meals are diverse and align with the user's goals and preferences.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse meal suggestions from Gemini response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini meal suggestions error:', error);
    throw new Error('Failed to generate meal suggestions with Gemini');
  }
}