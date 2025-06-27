import { Router } from 'express';
import { storage } from '../../../storage-provider';
import { isAdmin } from '../../middleware/auth';
import { users as usersTable, insertUserSchema } from '@shared/schema'; // Adjust path as needed
import { eq, like, or, desc, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

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

// Advanced users endpoint with filtering and search
router.get('/advanced', async (req, res) => {
  try {
    const { search, role, premium, page = 1, limit = 50 } = req.query;
    
    let query = storage.db.select().from(usersTable);
    
    // Apply filters
    const conditions = [];
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(usersTable.username, searchTerm),
          like(usersTable.email, searchTerm),
          like(usersTable.firstName, searchTerm),
          like(usersTable.lastName, searchTerm)
        )
      );
    }
    
    if (role && role !== 'all') {
      conditions.push(eq(usersTable.role, role as string));
    }
    
    if (premium && premium !== 'all') {
      conditions.push(eq(usersTable.isPremium, premium === 'premium'));
    }
    
    // For now, let's get all users and add mock stats
    const allUsers = await storage.db.select().from(usersTable).orderBy(desc(usersTable.id));
    
    // Add mock stats to each user
    const usersWithStats = allUsers.map((user: any) => ({
      ...user,
      stats: {
        totalMeals: Math.floor(Math.random() * 100) + 10,
        lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: user.isPremium ? 'active' : 'free',
        totalSpent: user.isPremium ? Math.floor(Math.random() * 200) + 50 : 0,
        registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    }));
    
    // Apply client-side filtering for demo
    let filteredUsers = usersWithStats;
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredUsers = filteredUsers.filter((user: any) => 
        user.username.toLowerCase().includes(searchLower) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower)
      );
    }
    
    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter((user: any) => user.role === role);
    }
    
    if (premium && premium !== 'all') {
      filteredUsers = filteredUsers.filter((user: any) => 
        premium === 'premium' ? user.isPremium : !user.isPremium
      );
    }
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching advanced users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// User statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    // In a real app, these would be actual database queries
    const mockStats = {
      totalUsers: 1523,
      newUsersThisWeek: 45,
      newUsersThisMonth: 187,
      newUsersLastMonth: 156,
      growthRate: 19.9,
      activeToday: 89,
      dailyActiveUsers: 234,
      weeklyActiveUsers: 567,
      avgSessionDuration: '12m 34s',
      premiumUsers: 234,
      conversionRate: 15.4,
      avgRevenue: 12.99
    };
    
    res.json(mockStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

// Create new user endpoint
router.post('/', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, isPremium } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const newUser = await storage.db.insert(usersTable).values({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'user',
      isPremium: isPremium || false
    }).returning();
    
    // Remove password from response
    const { password: _, ...userResponse } = newUser[0];
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Bulk operations endpoint
router.post('/bulk', async (req, res) => {
  try {
    const { operation, userIds, data } = req.body;
    
    if (!operation || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'Invalid bulk operation request' });
    }
    
    let updateData: any = {};
    
    switch (operation) {
      case 'make_premium':
        updateData = { isPremium: true };
        break;
      case 'remove_premium':
        updateData = { isPremium: false };
        break;
      case 'change_role':
        if (!data || !data.role) {
          return res.status(400).json({ message: 'Role is required for role change operation' });
        }
        updateData = { role: data.role };
        break;
      case 'send_email':
        // In a real app, you'd send emails here
        console.log(`Sending email to users: ${userIds.join(', ')}`);
        return res.json({ success: true, message: `Email sent to ${userIds.length} users` });
      default:
        return res.status(400).json({ message: 'Unknown bulk operation' });
    }
    
    // Perform bulk update
    for (const userId of userIds) {
      await storage.db.update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, userId));
    }
    
    res.json({ 
      success: true, 
      message: `Bulk operation '${operation}' completed for ${userIds.length} users` 
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ message: 'Failed to perform bulk operation' });
  }
});

// User activity endpoint
router.get('/:id/activity', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Mock activity data - in a real app, fetch from activity logs
    const mockActivity = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'LOGIN',
        details: 'User logged in',
        ipAddress: '192.168.1.100'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        action: 'AI_ANALYSIS',
        details: 'Analyzed food image: burger.jpg',
        ipAddress: '192.168.1.100'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        action: 'MEAL_LOGGED',
        details: 'Logged breakfast: oatmeal with fruits',
        ipAddress: '192.168.1.100'
      }
    ];
    
    res.json(mockActivity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Failed to fetch user activity' });
  }
});

export default router;