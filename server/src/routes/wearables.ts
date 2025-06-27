import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { weeklyStats, users, wearableData } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// Schema for incoming wearable data
const wearableDataSchema = z.object({
  userId: z.number(),
  deviceType: z.string().optional(),
  steps: z.number().int().min(0),
  heartRate: z.number().int().min(0).optional(),
  caloriesBurned: z.number().min(0).optional(),
  sleepHours: z.number().min(0).optional(),
  // Add more fields as needed for wearable data
});

app.post(
  '/wearables',
  zValidator('json', wearableDataSchema),
  async (c) => {
    const data = c.req.valid('json');

    try {
      // For now, let's just log the incoming data and return a success message.
      // In a real application, you would store this data in the database.
      console.log('Received wearable data:', data);

      // Example: Update weeklyStats or create a new table for wearable data
      // This is a placeholder. Actual implementation would involve more complex logic
      // to store historical data or aggregate it.

      // Insert the wearable data into the new wearableData table
      await db.insert(wearableData).values({
        userId: data.userId,
        deviceType: data.deviceType || 'Unknown',
        steps: data.steps,
        heartRate: data.heartRate,
        caloriesBurned: data.caloriesBurned,
        sleepHours: data.sleepHours,
        date: new Date(),
      });

      return c.json({ message: 'Wearable data received and processed successfully', data });
    } catch (error) {
      console.error('Error processing wearable data:', error);
      return c.json({ error: 'Failed to process wearable data' }, 500);
    }
  }
);

export default app;