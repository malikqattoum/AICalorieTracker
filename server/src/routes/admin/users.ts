import { Router } from 'express';
import { storage } from '../../../storage-provider'; // Adjust path as needed
import { isAdmin } from '../../middleware/auth'; // Adjust path as needed
import { users as usersTable, insertUserSchema } from '@shared/schema'; // Adjust path as needed
import { eq } from 'drizzle-orm';

const router = Router();

// Middleware to protect all admin user routes
router.use(isAdmin);

// GET all users
router.get('/', async (req, res) => {
  try {
    const allUsers = await storage.db.select().from(usersTable);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// PUT update a user by ID
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate request body (subset of InsertUserSchema for updates)
    // For simplicity, allowing direct update. In production, validate fields carefully.
    const { username, email, role, isPremium, firstName, lastName } = req.body;
    const updateData: Partial<typeof usersTable.$inferInsert> = {};

    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role; // Ensure role is one of 'user', 'admin'
    if (isPremium !== undefined) updateData.isPremium = isPremium;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    // Add updatedAt timestamp if your schema supports it automatically or manually add it
    // updateData.updatedAt = new Date(); 

    const updatedUser = await storage.db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY') { // Example: Handle unique constraint violation for username/email
        return res.status(409).json({ message: 'Username or email already exists.' });
    }
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE a user by ID
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent admin from deleting themselves (optional)
    // @ts-ignore
    if (req.user && req.user.id === userId) {
    //   return res.status(403).json({ message: 'Cannot delete your own admin account.' });
    }

    const deletedUser = await storage.db.delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;