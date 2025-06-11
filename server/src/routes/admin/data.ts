import { Router } from 'express';
import { storage } from '../../../storage-provider'; // Adjust path as needed
import { isAdmin } from '../../middleware/auth'; // Adjust path as needed
import { mealAnalyses, weeklyStats, plannedMeals, importedRecipes } from '@shared/schema'; // Adjust path as needed
import { eq } from 'drizzle-orm';

const router = Router();

// Middleware to protect all admin data routes
router.use(isAdmin);

// --- Meal Analyses --- 
router.get('/meal-analyses', async (req, res) => {
  try {
    // Add pagination / filtering as needed
    const analyses = await storage.db.select().from(mealAnalyses).limit(100); // Example limit
    res.json(analyses);
  } catch (error) {
    console.error('Error fetching meal analyses:', error);
    res.status(500).json({ message: 'Failed to fetch meal analyses' });
  }
});

router.delete('/meal-analyses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    await storage.db.delete(mealAnalyses).where(eq(mealAnalyses.id, id));
    res.status(200).json({ message: 'Meal analysis deleted' });
  } catch (error) {
    console.error('Error deleting meal analysis:', error);
    res.status(500).json({ message: 'Failed to delete meal analysis' });
  }
});

// --- Weekly Stats --- 
router.get('/weekly-stats', async (req, res) => {
  try {
    const stats = await storage.db.select().from(weeklyStats).limit(100);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({ message: 'Failed to fetch weekly stats' });
  }
});

router.delete('/weekly-stats/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    await storage.db.delete(weeklyStats).where(eq(weeklyStats.id, id));
    res.status(200).json({ message: 'Weekly stat deleted' });
  } catch (error) {
    console.error('Error deleting weekly stat:', error);
    res.status(500).json({ message: 'Failed to delete weekly stat' });
  }
});

// --- Planned Meals --- 
router.get('/planned-meals', async (req, res) => {
  try {
    const meals = await storage.db.select().from(plannedMeals).limit(100);
    res.json(meals);
  } catch (error) {
    console.error('Error fetching planned meals:', error);
    res.status(500).json({ message: 'Failed to fetch planned meals' });
  }
});

router.delete('/planned-meals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    await storage.db.delete(plannedMeals).where(eq(plannedMeals.id, id));
    res.status(200).json({ message: 'Planned meal deleted' });
  } catch (error) {
    console.error('Error deleting planned meal:', error);
    res.status(500).json({ message: 'Failed to delete planned meal' });
  }
});

// --- Imported Recipes --- 
router.get('/imported-recipes', async (req, res) => {
  try {
    const recipes = await storage.db.select().from(importedRecipes).limit(100);
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching imported recipes:', error);
    res.status(500).json({ message: 'Failed to fetch imported recipes' });
  }
});

router.delete('/imported-recipes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    await storage.db.delete(importedRecipes).where(eq(importedRecipes.id, id));
    res.status(200).json({ message: 'Imported recipe deleted' });
  } catch (error) {
    console.error('Error deleting imported recipe:', error);
    res.status(500).json({ message: 'Failed to delete imported recipe' });
  }
});

export default router;