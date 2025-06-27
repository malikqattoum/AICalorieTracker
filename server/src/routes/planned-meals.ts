import { Router } from 'express';
import { db } from '../../db';
import { plannedMeals, InsertPlannedMeal, insertPlannedMealSchema } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';
import ics from 'ics';
import multer from 'multer';
import { promisify } from 'util';
import fs from 'fs';
import ical from 'node-ical'; // Using node-ical for parsing
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

// Middleware to check if user is authenticated (placeholder)
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.user && req.user.id) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Create a new planned meal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const parsedBody = insertPlannedMealSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsedBody.error.errors });
    }

    const result = await db.insert(plannedMeals).values({
      ...parsedBody.data,
      userId,
    });

    // Get the inserted record by ID (MySQL doesn't support returning)
    const insertedId = (result as any).insertId;
    const newPlannedMeal = await db.query.plannedMeals.findFirst({
      where: eq(plannedMeals.id, insertedId)
    });

    res.status(201).json(newPlannedMeal);
  } catch (error) {
    console.error('Error creating planned meal:', error);
    res.status(500).json({ error: 'Failed to create planned meal' });
  }
});

// Get planned meals for a date range (e.g., a week or a month)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      return res.status(400).json({ error: 'startDate and endDate query parameters are required' });
    }

    const meals = await db.select()
      .from(plannedMeals)
      .where(and(
        eq(plannedMeals.userId, userId),
        gte(plannedMeals.date, new Date(startDate)),
        lte(plannedMeals.date, new Date(endDate))
      ))
      .orderBy(desc(plannedMeals.date), plannedMeals.mealType);

    res.json(meals);
  } catch (error) {
    console.error('Error fetching planned meals:', error);
    res.status(500).json({ error: 'Failed to fetch planned meals' });
  }
});

// Update a planned meal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const plannedMealId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (isNaN(plannedMealId)) {
      return res.status(400).json({ error: 'Invalid planned meal ID' });
    }

    const parsedBody = insertPlannedMealSchema.partial().safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsedBody.error.errors });
    }

    await db.update(plannedMeals)
      .set(parsedBody.data)
      .where(and(eq(plannedMeals.id, plannedMealId), eq(plannedMeals.userId, userId)));

    // Get the updated record
    const updatedMeal = await db.query.plannedMeals.findFirst({
      where: and(eq(plannedMeals.id, plannedMealId), eq(plannedMeals.userId, userId))
    });

    if (!updatedMeal) {
      return res.status(404).json({ error: 'Planned meal not found or user not authorized' });
    }

    res.json(updatedMeal);
  } catch (error) {
    console.error('Error updating planned meal:', error);
    res.status(500).json({ error: 'Failed to update planned meal' });
  }
});

// Delete a planned meal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const plannedMealId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (isNaN(plannedMealId)) {
      return res.status(400).json({ error: 'Invalid planned meal ID' });
    }

    // First check if the meal exists and belongs to user
    const existingMeal = await db.query.plannedMeals.findFirst({
      where: and(eq(plannedMeals.id, plannedMealId), eq(plannedMeals.userId, userId))
    });

    if (!existingMeal) {
      return res.status(404).json({ error: 'Planned meal not found or user not authorized' });
    }

    // Delete the meal
    await db.delete(plannedMeals)
      .where(and(eq(plannedMeals.id, plannedMealId), eq(plannedMeals.userId, userId)));

    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting planned meal:', error);
    res.status(500).json({ error: 'Failed to delete planned meal' });
  }
});

// Import planned meals from iCalendar
router.post('/import/ical', isAuthenticated, upload.single('icalFile'), async (req, res) => {
  // @ts-ignore
  const userId = req.user.id;
  // @ts-ignore
  if (!req.file) {
    return res.status(400).json({ error: 'No iCalendar file uploaded.' });
  }

  // @ts-ignore
  const filePath = req.file.path;

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const data = ical.parseICS(fileContent);
    let mealsAddedCount = 0;

    for (const k in data) {
      if (data.hasOwnProperty(k)) {
        const event = data[k];
        if (event.type === 'VEVENT' && event.start && event.summary) {
          // Basic parsing, assuming summary contains meal name and type
          // and description contains nutritional info.
          // This will need to be more robust based on how AICalorieTracker exports data.
          const mealName = event.summary;
          let mealType = 'snack'; // Default
          if (event.summary.toLowerCase().includes('breakfast')) mealType = 'breakfast';
          else if (event.summary.toLowerCase().includes('lunch')) mealType = 'lunch';
          else if (event.summary.toLowerCase().includes('dinner')) mealType = 'dinner';

          // Attempt to parse nutrition from description (very basic)
          let calories = 0, protein = 0, carbs = 0, fat = 0;
          if (event.description) {
            const calMatch = event.description.match(/Calories: (\d+)/i);
            if (calMatch) calories = parseInt(calMatch[1], 10);
            const proMatch = event.description.match(/Protein: (\d+)g/i);
            if (proMatch) protein = parseInt(proMatch[1], 10);
            const carbMatch = event.description.match(/Carbs: (\d+)g/i);
            if (carbMatch) carbs = parseInt(carbMatch[1], 10);
            const fatMatch = event.description.match(/Fat: (\d+)g/i);
            if (fatMatch) fat = parseInt(fatMatch[1], 10);
          }

          const plannedMeal = {
            userId,
            date: new Date(event.start),
            mealType,
            mealName,
            calories,
            protein,
            carbs,
            fat,
            recipe: event.description, // Or a more specific field if available
            notes: event.location || '', // Using location for notes as an example
          };

          await db.insert(plannedMeals).values(plannedMeal);
          mealsAddedCount++;
        }
      }
    }

    await fs.promises.unlink(filePath); // Delete the uploaded file

    res.json({ message: `${mealsAddedCount} meals imported successfully from iCalendar file.` });

  } catch (error) {
    console.error('Error importing iCalendar:', error);
    if (filePath) {
      await fs.promises.unlink(filePath).catch(err => console.error('Failed to delete temp file:', err));
    }
    res.status(500).json({ error: 'Failed to import iCalendar. Please ensure the file is valid.' });
  }
});


export default router;