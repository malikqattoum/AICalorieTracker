import { Router } from 'express';
import { db } from '../../db'; // Assuming db connection is in ../db
import { importedRecipes, insertImportedRecipeSchema } from '@shared/schema';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth'; // Assuming auth middleware
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client if needed for parsing, though might be separate service
const apiKey = process.env.OPENAI_API_KEY || "";
const MODEL = "gpt-4o"; // Or your preferred model for text/recipe parsing
const openai = new OpenAI({ apiKey });

// --- Helper function to parse recipe from URL (conceptual) ---
async function parseRecipeFromUrl(url: string): Promise<Partial<typeof insertImportedRecipeSchema._type>> {
  // In a real scenario, this would involve fetching the URL content,
  // then using a robust HTML parsing library (like Cheerio) and potentially AI to extract details.
  // For now, this is a placeholder.
  console.log(`Attempting to parse recipe from URL: ${url}`);
  // Example: Use OpenAI to extract structured data from recipe text (if you fetched it)
  // This is a simplified example. A real implementation would be more complex.
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a recipe parsing expert. Given the text content of a recipe webpage, extract the recipe name, ingredients (name, quantity, unit), and instructions. Return as JSON: { recipeName: string, ingredients: [{name: string, quantity: string, unit: string}], instructions: string }"
        },
        {
          role: "user",
          content: `Parse the recipe from the content of the URL: ${url}.`
        }
      ],
      response_format: { type: "json_object" },
    });
    if (response.choices[0].message.content) {
      const parsed = JSON.parse(response.choices[0].message.content);
      return {
        recipeName: parsed.recipeName || 'Unknown Recipe',
        ingredients: parsed.ingredients || [],
        instructions: parsed.instructions || '',
        // Nutritional data would ideally come from a dedicated API or further AI analysis
        parsedNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }, 
      };
    }
  } catch (error) {
    console.error('Error parsing recipe with OpenAI:', error);
  }
  return {
    recipeName: 'Failed to parse recipe',
    ingredients: [],
    instructions: 'Could not extract instructions.',
    parsedNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };
}

// --- Helper function to parse recipe from Image (conceptual) ---
async function parseRecipeFromImage(imageData: string): Promise<Partial<typeof insertImportedRecipeSchema._type>> {
  // This would use OpenAI Vision or a similar OCR + NLP pipeline.
  console.log('Attempting to parse recipe from image data...');
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Ensure this model supports vision
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting recipe details (name, ingredients, instructions) from images of recipes. Return as JSON: { recipeName: string, ingredients: [{name: string, quantity: string, unit: string}], instructions: string }"
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the recipe details from this image." },
            {
              type: "image_url",
              image_url: { url: imageData }, // imageData should be base64 string: "data:image/jpeg;base64,..."
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });
    if (response.choices[0].message.content) {
      const parsed = JSON.parse(response.choices[0].message.content);
      return {
        recipeName: parsed.recipeName || 'Unknown Recipe from Image',
        ingredients: parsed.ingredients || [],
        instructions: parsed.instructions || '',
        parsedNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }, 
      };
    }
  } catch (error) {
    console.error('Error parsing recipe image with OpenAI:', error);
  }
  return {
    recipeName: 'Failed to parse recipe image',
    ingredients: [],
    instructions: 'Could not extract instructions from image.',
    parsedNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };
}

// POST /api/imported-recipes/from-url - Import a recipe from a URL
router.post('/from-url', authenticate, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Placeholder: In a real app, fetch content from URL and parse it
    // For now, we'll simulate parsing or use a simplified AI call
    const parsedData = await parseRecipeFromUrl(url);

    const newRecipeData: Omit<typeof insertImportedRecipeSchema._type, 'userId'> = {
      sourceUrl: url,
      recipeName: parsedData.recipeName || 'Imported Recipe',
      ingredients: parsedData.ingredients || [],
      instructions: parsedData.instructions || '',
      parsedNutrition: parsedData.parsedNutrition || { calories: 0 },
      notes: '', // User can add notes later
    };
    
    const validatedData = insertImportedRecipeSchema.parse({
        ...newRecipeData,
        userId: userId,
    });

    const result = await db.insert(importedRecipes).values(validatedData);
    const [newRecipe] = await db.select().from(importedRecipes).where(eq(importedRecipes.id, result[0].insertId));
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Error importing recipe from URL:', error);
    if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data format', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to import recipe from URL' });
  }
});

// POST /api/imported-recipes/from-image - Import a recipe from an image
router.post('/from-image', authenticate, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });

  const { imageData } = req.body; // Expecting base64 encoded image string
  if (!imageData || typeof imageData !== 'string') {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    const parsedData = await parseRecipeFromImage(imageData);

    const newRecipeData: Omit<typeof insertImportedRecipeSchema._type, 'userId'> = {
      rawImageData: imageData, // Or store a URL if uploaded to S3, etc.
      recipeName: parsedData.recipeName || 'Imported Recipe from Image',
      ingredients: parsedData.ingredients || [],
      instructions: parsedData.instructions || '',
      parsedNutrition: parsedData.parsedNutrition || { calories: 0 },
      notes: '',
    };

    const validatedData = insertImportedRecipeSchema.parse({
        ...newRecipeData,
        userId: userId,
    });

const result = await db.insert(importedRecipes).values(validatedData);
const [newRecipe] = await db.select().from(importedRecipes).where(eq(importedRecipes.id, result[0].insertId));
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Error importing recipe from image:', error);
    if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data format', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to import recipe from image' });
  }
});

// GET /api/imported-recipes - Get all imported recipes for the user
router.get('/', authenticate, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });

  try {
    const recipes = await db.select().from(importedRecipes).where(eq(importedRecipes.userId, userId)).orderBy(desc(importedRecipes.createdAt));
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching imported recipes:', error);
    res.status(500).json({ error: 'Failed to fetch imported recipes' });
  }
});

// GET /api/imported-recipes/:id - Get a specific imported recipe
router.get('/:id', authenticate, async (req, res) => {
  const userId = req.user?.id;
  const recipeId = parseInt(req.params.id, 10);
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });
  if (isNaN(recipeId)) return res.status(400).json({ error: 'Invalid recipe ID' });

  try {
    const [recipe] = await db.select().from(importedRecipes).where(and(eq(importedRecipes.id, recipeId), eq(importedRecipes.userId, userId)));
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// PUT /api/imported-recipes/:id - Update an imported recipe (e.g., notes, or manually corrected parsed data)
router.put('/:id', authenticate, async (req, res) => {
  const userId = req.user?.id;
  const recipeId = parseInt(req.params.id, 10);
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });
  if (isNaN(recipeId)) return res.status(400).json({ error: 'Invalid recipe ID' });

  // Only allow updating certain fields, e.g., notes, or re-parsed data
  const { recipeName, ingredients, instructions, parsedNutrition, notes } = req.body;

  const updateData: Partial<typeof insertImportedRecipeSchema._type> = {};
  if (recipeName !== undefined) updateData.recipeName = recipeName;
  if (ingredients !== undefined) updateData.ingredients = ingredients;
  if (instructions !== undefined) updateData.instructions = instructions;
  if (parsedNutrition !== undefined) updateData.parsedNutrition = parsedNutrition;
  if (notes !== undefined) updateData.notes = notes;
  
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No update data provided' });
  }

  try {
    // Ensure the recipe belongs to the user before updating
    const [existingRecipe] = await db.select({ id: importedRecipes.id }).from(importedRecipes)
      .where(and(eq(importedRecipes.id, recipeId), eq(importedRecipes.userId, userId)));

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found or not authorized to update' });
    }

    await db.update(importedRecipes)
      .set(updateData)
      .where(eq(importedRecipes.id, recipeId))
;
const [updatedRecipe] = await db.select().from(importedRecipes).where(eq(importedRecipes.id, recipeId));
      
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data format', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE /api/imported-recipes/:id - Delete an imported recipe
router.delete('/:id', authenticate, async (req, res) => {
  const userId = req.user?.id;
  const recipeId = parseInt(req.params.id, 10);
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });
  if (isNaN(recipeId)) return res.status(400).json({ error: 'Invalid recipe ID' });

  try {
    // Ensure the recipe belongs to the user before deleting
    const [existingRecipe] = await db.select({ id: importedRecipes.id }).from(importedRecipes)
      .where(and(eq(importedRecipes.id, recipeId), eq(importedRecipes.userId, userId)));

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found or not authorized to delete' });
    }

    await db.delete(importedRecipes).where(eq(importedRecipes.id, recipeId));
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export default router;