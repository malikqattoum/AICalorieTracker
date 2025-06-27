import { Router } from 'express';
import { db } from '../../db';
import { workouts, insertWorkoutSchema, weeklyStats as weeklyStatsTable } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Get all workouts for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userWorkouts = await db.query.workouts.findMany({
      where: eq(workouts.userId, userId),
      orderBy: (workouts, { desc }) => [desc(workouts.date)],
    });

    res.json(userWorkouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// Add a new workout
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, duration, caloriesBurned, date, notes } = req.body;
    
    // Validate workout data
    if (!name || !duration || !caloriesBurned) {
      return res.status(400).json({ error: 'Missing required workout information' });
    }

    const newWorkout = {
      userId,
      name,
      duration,
      caloriesBurned,
      date: date || new Date().toISOString(),
      notes: notes || null
    };

    const result = await db.insert(workouts).values(newWorkout);
    const [insertedId] = result;
    const insertedWorkout = { ...newWorkout, id: result[0].insertId };
    
    // Update weekly stats with workout calories
    await updateWeeklyStatsWithWorkout(userId, caloriesBurned);

    res.status(201).json(insertedWorkout);
  } catch (error) {
    console.error('Error adding workout:', error);
    res.status(500).json({ error: 'Failed to add workout' });
  }
});

// Delete a workout
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const workoutId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(workoutId)) {
      return res.status(400).json({ error: 'Invalid workout ID' });
    }

    // First, get the workout to check ownership and get calories burned
    const workout = await db.query.workouts.findFirst({
      where: (workouts, { and }) => and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      ),
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found or not owned by user' });
    }

    // Delete the workout
    await db.delete(workouts).where(eq(workouts.id, workoutId));
    
    // Update weekly stats to remove workout calories
    await updateWeeklyStatsWithWorkout(userId, -workout.caloriesBurned);

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// Helper function to update weekly stats with workout calories
async function updateWeeklyStatsWithWorkout(userId: number, caloriesBurned: number) {
  try {
    // Get the current week's stats
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Find or create weekly stats
    let existingWeeklyStats = await db.query.weeklyStats.findFirst({
      where: (weeklyStats, { and }) => and(
        eq(weeklyStats.userId, userId),
        eq(weeklyStats.weekStarting, new Date(startOfWeek.toISOString().split('T')[0]))
      ),
    });

    if (existingWeeklyStats) {
      // Update existing weekly stats with workout calories
      await db
        .update(weeklyStatsTable)
        .set({
          caloriesBurned: (existingWeeklyStats.caloriesBurned || 0) + caloriesBurned,
        })
        .where(eq(weeklyStatsTable.id, existingWeeklyStats.id));
    } else {
      // Create new weekly stats with workout calories
      await db.insert(weeklyStatsTable).values({
        userId,
        weekStarting: startOfWeek,
        averageCalories: 0,
        mealsTracked: 0,
        averageProtein: 0,
        healthiestDay: 'Monday',
        caloriesByDay: {},
        caloriesBurned: caloriesBurned,
      });
    }
  } catch (error) {
    console.error('Error updating weekly stats with workout:', error);
    // Don't throw, just log the error to prevent the main operation from failing
  }
}

export default router;