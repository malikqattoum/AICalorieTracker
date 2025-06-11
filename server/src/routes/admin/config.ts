import { Router } from 'express';
import { storage } from '../../../storage-provider'; // Adjust path as needed
import { isAdmin } from '../../middleware/auth'; // Adjust path as needed
import { appConfig, insertAppConfigSchema } from '@shared/schema'; // Adjust path as needed
import { eq } from 'drizzle-orm';

const router = Router();

// Middleware to protect all admin config routes
router.use(isAdmin);

// GET all app configurations
router.get('/', async (req, res) => {
  try {
    const configs = await storage.db.select().from(appConfig);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching app configurations:', error);
    res.status(500).json({ message: 'Failed to fetch app configurations' });
  }
});

// POST create a new app configuration
router.post('/', async (req, res) => {
  try {
    const validatedData = insertAppConfigSchema.parse(req.body);
    const newConfig = await storage.db.insert(appConfig).values(validatedData).returning();
    res.status(201).json(newConfig[0]);
  } catch (error) {
    console.error('Error creating app configuration:', error);
    // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({ message: 'Configuration key already exists.' });
    }
    // @ts-ignore
    if (error.errors) { // Zod validation error
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create app configuration' });
  }
});

// GET a single app configuration by ID (or key, but ID is simpler for now)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    const config = await storage.db.select().from(appConfig).where(eq(appConfig.id, id));
    if (config.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    res.json(config[0]);
  } catch (error) {
    console.error('Error fetching app configuration:', error);
    res.status(500).json({ message: 'Failed to fetch app configuration' });
  }
});

// PUT update an app configuration by ID
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    // For updates, we can be more flexible, not requiring all fields from insertAppConfigSchema
    const { key, value, description, type } = req.body;
    const updateData: Partial<typeof appConfig.$inferInsert> = {};

    if (key !== undefined) updateData.key = key;
    if (value !== undefined) updateData.value = value;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    // updateData.updatedAt = new Date(); // Drizzle might handle this with default(sql`CURRENT_TIMESTAMP`).onUpdateNow()

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    const updatedConfig = await storage.db.update(appConfig)
      .set(updateData)
      .where(eq(appConfig.id, id))
      .returning();

    if (updatedConfig.length === 0) {
      return res.status(404).json({ message: 'Configuration not found or no changes made' });
    }
    res.json(updatedConfig[0]);
  } catch (error) {
    console.error('Error updating app configuration:', error);
     // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({ message: 'Configuration key already exists.' });
    }
    res.status(500).json({ message: 'Failed to update app configuration' });
  }
});

// DELETE an app configuration by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const deletedConfig = await storage.db.delete(appConfig)
      .where(eq(appConfig.id, id))
      .returning();

    if (deletedConfig.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    res.status(200).json({ message: 'App configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting app configuration:', error);
    res.status(500).json({ message: 'Failed to delete app configuration' });
  }
});

export default router;