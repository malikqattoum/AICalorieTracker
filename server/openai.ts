import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/index.js";

// Load env here as a safety net (in case index.ts ran before env load after bundling)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
for (const envPath of [
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(process.cwd(), '.env')
]) {
  dotenv.config({ path: envPath });
}

const rawKey = process.env.OPENAI_API_KEY || "";
const apiKey = rawKey.trim();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

if (!apiKey || !apiKey.startsWith('sk-')) {
  console.warn('[OpenAI] OPENAI_API_KEY is missing or malformed. Please set a valid key in server/.env or root .env');
}

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
    // Normalize possible URL-encoded/base64 anomalies from form submissions
    let b64 = (base64Image || '').trim();
    // If spaces exist (common from x-www-form-urlencoded where '+' -> ' '), revert them to '+'
    if (b64.includes(' ')) b64 = b64.replace(/ /g, '+');
    // Remove line breaks
    b64 = b64.replace(/\r?\n|\r/g, '');
    // Pad to multiple of 4
    const pad = b64.length % 4;
    if (pad) b64 = b64 + '='.repeat(4 - pad);

    // Quick validation
    try {
      const buf = Buffer.from(b64, 'base64');
      if (!buf || buf.length === 0) throw new Error('Empty buffer after base64 decode');
    } catch (e) {
      throw new Error('Invalid base64 image data after normalization');
    }

    // Detect MIME by magic header
    const mime = b64.startsWith('/9j/')
      ? 'image/jpeg'
      : b64.startsWith('iVBORw0KGgo')
        ? 'image/png'
        : b64.startsWith('R0lGOD')
          ? 'image/gif'
          : b64.startsWith('UklGR')
            ? 'image/webp'
            : 'image/jpeg'; // default

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
                url: `data:${mime};base64,${b64}`
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

    const rawContent = response.choices[0].message.content ?? '{}';
    console.log('[NUTRITION TIPS] Raw OpenAI response:', rawContent);

    const result = JSON.parse(rawContent);
    console.log('[NUTRITION TIPS] Parsed result:', result);

    // Normalize the response to ensure we always return string[]
    let tips = result.tips || [];

    // Ensure tips is an array
    if (!Array.isArray(tips)) {
      console.warn('[NUTRITION TIPS] Tips is not an array, converting to array');
      tips = [String(tips)];
    }

    // Handle mixed types and objects with 'tip' key
    tips = tips.map((item: any, index: number) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null && 'tip' in item) {
        console.log(`[NUTRITION TIPS] Converting object at index ${index} to string`);
        return String(item.tip || '');
      } else {
        console.warn(`[NUTRITION TIPS] Unexpected item type at index ${index}, converting to string:`, item);
        return String(item || '');
      }
    }).filter((tip: string) => tip.trim().length > 0); // Filter out empty tips

    console.log('[NUTRITION TIPS] Final normalized tips array:', tips);
    return tips;
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

export async function getNutritionCoachReply(messages: {role: string, content: string | {image_url: string}}[], userId: number): Promise<string> {
  // Compose system prompt
  const systemPrompt =
    "You are a friendly, expert nutrition coach. Answer user questions about their meals, nutrition, and healthy eating. " +
    "If the user asks about a specific meal (e.g. 'Was my breakfast healthy?'), give a short, actionable analysis. " +
    "If the user asks for a meal suggestion, provide a specific, practical answer with calories and macros if possible. " +
    "Be concise, supportive, and evidence-based.";

  // Compose OpenAI chat messages
  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m): ChatCompletionMessageParam => {
      if (typeof m.content === 'string') {
        return { role: m.role as "user" | "assistant", content: m.content };
      } else {
        // Handle image content - only user messages can contain images
        if (m.role === 'assistant') {
          // Fallback for assistant messages with image content (shouldn't happen)
          return { role: "assistant", content: "I received an image but cannot process it in this context." };
        }
        return {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: m.content.image_url
              }
            }
          ]
        };
      }
    })
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: chatMessages,
    max_tokens: 300,
    temperature: 0.7,
  });
  return response.choices[0].message.content?.trim() || "Sorry, I couldn't process your request.";
}

// Export the OpenAI client for admin routes
export function getOpenAIClient() {
  return openai;
}
