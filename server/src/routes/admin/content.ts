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
    const contentEntry = await storage.getSiteContent(key);
    // Ensure a consistent response format, even if content is null
    const value = contentEntry ? contentEntry.value : null;
    res.json({ key, value }); 
  } catch (error) {
    console.error(`Error fetching site content for key ${req.params.key}:`, error);
    res.status(500).json({ message: 'Failed to fetch site content' });
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