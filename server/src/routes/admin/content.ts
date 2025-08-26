import { Router } from 'express';
import { storage } from '../../../storage-provider'; // Adjust path as needed
import { isAdmin } from '../../middleware/auth'; // Adjust path as needed

const router = Router();

// Middleware to protect all admin content routes
router.use(isAdmin);

// GET site content by key
router.get('/:key', async (req, res) => {
  try {
    const key = req.params.key;
    console.log(`[ADMIN CONTENT] Attempting to fetch content for key: ${key}`);
    console.log(`[ADMIN CONTENT] Storage provider:`, storage.constructor.name);
    console.log(`[ADMIN CONTENT] User object:`, req.user);
    
    const value = await storage.getSiteContent(key);
    console.log(`[ADMIN CONTENT] Successfully fetched content for key: ${key}, value:`, value);
    res.json({ key, value });
  } catch (error) {
    console.error(`[ADMIN CONTENT] Error fetching site content for key ${req.params.key}:`, error);
    console.error(`[ADMIN CONTENT] Error stack:`, error instanceof Error ? error.stack : 'No stack');
    console.error(`[ADMIN CONTENT] User object at error:`, req.user);
    res.status(500).json({
      message: 'Failed to fetch site content',
      error: error instanceof Error ? error.message : 'Unknown error',
      key: req.params.key
    });
  }
});

// POST update site content by key
router.post('/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const { value } = req.body;

    if (value === undefined) {
        return res.status(400).json({ message: 'Content value is required' });
    }

    await storage.updateSiteContent(key, value);
    res.json({ success: true, message: `Content for '${key}' updated successfully.` });
  } catch (error) {
    console.error(`Error updating site content for key ${req.params.key}:`, error);
    res.status(500).json({ message: 'Failed to update site content' });
  }
});

export default router;