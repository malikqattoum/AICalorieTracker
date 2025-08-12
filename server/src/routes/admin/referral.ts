import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';
import { db } from '@server/db';
import { referralSettings, referralCommissions, users } from '@shared/schema';
import { eq, desc, sql, alias } from 'drizzle-orm';

const router = Router();

// Middleware to protect all admin referral routes
router.use(isAdmin);

// Get referral settings
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await db.select()
      .from(referralSettings)
      .orderBy(desc(referralSettings.id))
      .limit(1);
    
    if (!settings) {
      return res.status(404).json({ message: 'Referral settings not found' });
    }
    
    // Convert field names to match expected format
    res.json({
      id: settings.id,
      commission_percent: Number(settings.commissionPercent),
      is_recurring: settings.isRecurring,
      created_at: settings.createdAt,
      updated_at: settings.updatedAt
    });
  } catch (error) {
    console.error('Error fetching referral settings:', error);
    res.status(500).json({ message: 'Failed to fetch referral settings' });
  }
});

// Update referral settings
router.put('/settings', async (req, res) => {
  try {
    const { commission_percent, is_recurring } = req.body;
    
    // Validate input
    if (typeof commission_percent !== 'number' || commission_percent < 0 || commission_percent > 100) {
      return res.status(400).json({ message: 'Invalid commission percentage' });
    }
    
    if (typeof is_recurring !== 'boolean') {
      return res.status(400).json({ message: 'Invalid recurring flag' });
    }

    await db.update(referralSettings)
      .set({
        commissionPercent: commission_percent.toString(),
        isRecurring: is_recurring,
        updatedAt: new Date()
      })
      .where(eq(referralSettings.id,
        sql`(SELECT id FROM referral_settings ORDER BY id DESC LIMIT 1)`
      ));
    
    // Fetch the updated settings
    const [updatedSettings] = await db.select()
      .from(referralSettings)
      .orderBy(desc(referralSettings.id))
      .limit(1);

    if (!updatedSettings) {
      return res.status(404).json({ message: 'Referral settings not found' });
    }

    // Convert field names to match expected format
    res.json({
      id: updatedSettings.id,
      commission_percent: Number(updatedSettings.commissionPercent),
      is_recurring: updatedSettings.isRecurring,
      created_at: updatedSettings.createdAt,
      updated_at: updatedSettings.updatedAt
    });
  } catch (error) {
    console.error('Error updating referral settings:', error);
    res.status(500).json({ message: 'Failed to update referral settings' });
  }
});

// Get referral commissions
router.get('/commissions', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    // Create alias for users table to reference referee
    const refereeUsers = alias(users, 'referee');
    
    const commissions = await db.select({
      id: referralCommissions.id,
      referrerId: referralCommissions.referrerId,
      refereeId: referralCommissions.refereeId,
      subscriptionId: referralCommissions.subscriptionId,
      amount: referralCommissions.amount,
      status: referralCommissions.status,
      isRecurring: referralCommissions.isRecurring,
      createdAt: referralCommissions.createdAt,
      paidAt: referralCommissions.paidAt,
      referrerEmail: users.email,
      refereeEmail: refereeUsers.email
    })
    .from(referralCommissions)
    .leftJoin(users, eq(referralCommissions.referrerId, users.id))
    .leftJoin(refereeUsers, eq(referralCommissions.refereeId, refereeUsers.id))
    .orderBy(desc(referralCommissions.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));
    
    const count = await db.select({ count: sql`COUNT(*)` })
      .from(referralCommissions);

    res.json({
      commissions: commissions.map((commission: any) => ({
        ...commission,
        referrer_email: commission.referrerEmail,
        referee_email: commission.refereeEmail
      })),
      total: Number(count[0].count)
    });
  } catch (error) {
    console.error('Error fetching referral commissions:', error);
    res.status(500).json({ message: 'Failed to fetch referral commissions' });
  }
});

export default router;