import { Router } from 'express';
import { isAuthenticated } from '../../middleware/auth';
import { db } from '@server/db';
import { referralCommissions, users } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Middleware to protect all user referral routes
router.use(isAuthenticated);

// Get user's referral commissions
router.get('/commissions', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const commissions = await db.select()
      .from(referralCommissions)
      .where(eq(referralCommissions.referrerId, userId))
      .orderBy(desc(referralCommissions.createdAt));
    
    res.json(commissions.map((commission: any) => ({
      id: commission.id,
      amount: Number(commission.amount),
      status: commission.status,
      created_at: commission.createdAt,
      is_recurring: commission.isRecurring
    })));
  } catch (error) {
    console.error('Error fetching user commissions:', error);
    res.status(500).json({ message: 'Failed to fetch commissions' });
  }
});

// Get user's referral code
router.get('/code', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const [user] = await db.select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ referralCode: user.referralCode });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    res.status(500).json({ message: 'Failed to fetch referral code' });
  }
});

export default router;