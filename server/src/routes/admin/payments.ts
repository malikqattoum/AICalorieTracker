import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Middleware to protect all admin payment routes
router.use(isAdmin);

// Revenue metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      totalRevenue: 24560.75,
      monthlyRevenue: 3240.50,
      yearlyRevenue: 18750.25,
      totalSubscriptions: 234,
      activeSubscriptions: 198,
      canceledSubscriptions: 36,
      churnRate: 5.2,
      averageRevenuePerUser: 12.50,
      lifetimeValue: 89.40
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching payment metrics:', error);
    res.status(500).json({ message: 'Failed to fetch payment metrics' });
  }
});

// Subscriptions endpoint with filtering
router.get('/subscriptions', async (req, res) => {
  try {
    const { search, status } = req.query;
    
    // Mock subscription data - in real app, fetch from Stripe/database
    let subscriptions = [
      {
        id: 'sub_1ABC123',
        userId: 123,
        username: 'john_doe',
        email: 'john@example.com',
        status: 'active',
        planId: 'plan_monthly',
        planName: 'Monthly Premium',
        amount: 9.99,
        currency: 'usd',
        interval: 'monthly',
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sub_2DEF456',
        userId: 456,
        username: 'jane_smith',
        email: 'jane@example.com',
        status: 'canceled',
        planId: 'plan_yearly',
        planName: 'Yearly Premium',
        amount: 99.99,
        currency: 'usd',
        interval: 'yearly',
        currentPeriodStart: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAt: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sub_3GHI789',
        userId: 789,
        username: 'bob_wilson',
        email: 'bob@example.com',
        status: 'past_due',
        planId: 'plan_monthly',
        planName: 'Monthly Premium',
        amount: 9.99,
        currency: 'usd',
        interval: 'monthly',
        currentPeriodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Apply filters
    if (search) {
      const searchLower = (search as string).toLowerCase();
      subscriptions = subscriptions.filter(sub => 
        sub.username.toLowerCase().includes(searchLower) ||
        sub.email.toLowerCase().includes(searchLower)
      );
    }

    if (status && status !== 'all') {
      subscriptions = subscriptions.filter(sub => sub.status === status);
    }

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
});

// Cancel subscription endpoint
router.post('/subscriptions/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, you'd cancel the subscription in Stripe
    console.log(`Canceling subscription: ${id}`);
    
    // Mock successful cancellation
    res.json({ 
      success: true, 
      message: 'Subscription canceled successfully',
      canceledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Transactions endpoint
router.get('/transactions', async (req, res) => {
  try {
    // Mock transaction data - in real app, fetch from Stripe/database
    const transactions = [
      {
        id: 'pi_1ABC123',
        userId: 123,
        username: 'john_doe',
        amount: 9.99,
        currency: 'usd',
        status: 'succeeded',
        description: 'Monthly Premium Subscription',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionId: 'sub_1ABC123'
      },
      {
        id: 'pi_2DEF456',
        userId: 456,
        username: 'jane_smith',
        amount: 99.99,
        currency: 'usd',
        status: 'succeeded',
        description: 'Yearly Premium Subscription',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionId: 'sub_2DEF456'
      },
      {
        id: 'pi_3GHI789',
        userId: 789,
        username: 'bob_wilson',
        amount: 9.99,
        currency: 'usd',
        status: 'failed',
        description: 'Monthly Premium Subscription',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionId: 'sub_3GHI789'
      },
      {
        id: 'pi_4JKL012',
        userId: 321,
        username: 'alice_brown',
        amount: 9.99,
        currency: 'usd',
        status: 'pending',
        description: 'Monthly Premium Subscription',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Refund endpoint
router.post('/refund', async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    
    if (!transactionId || !amount || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // In a real app, you'd process the refund through Stripe
    console.log(`Processing refund for transaction ${transactionId}: $${amount} - ${reason}`);
    
    // Mock successful refund
    res.json({ 
      success: true, 
      message: 'Refund processed successfully',
      refundId: `re_${Date.now()}`,
      amount,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Failed to process refund' });
  }
});

// Payment methods endpoint
router.get('/methods', async (req, res) => {
  try {
    // Mock payment methods data - in real app, fetch from Stripe
    const paymentMethods = [
      {
        id: 'pm_1ABC123',
        userId: 123,
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      },
      {
        id: 'pm_2DEF456',
        userId: 456,
        type: 'card',
        brand: 'mastercard',
        last4: '8888',
        expMonth: 8,
        expYear: 2026,
        isDefault: true
      },
      {
        id: 'pm_3GHI789',
        userId: 789,
        type: 'card',
        brand: 'amex',
        last4: '0005',
        expMonth: 3,
        expYear: 2025,
        isDefault: false
      }
    ];

    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
});

// Revenue reports endpoint
router.get('/reports/revenue', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Generate mock revenue report
    const report = generateRevenueReport(period as string);
    
    res.json(report);
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ message: 'Failed to generate revenue report' });
  }
});

// Churn analysis endpoint
router.get('/analysis/churn', async (req, res) => {
  try {
    const churnAnalysis = {
      overallChurnRate: 5.2,
      monthlyChurnRate: 4.8,
      churnReasons: [
        { reason: 'Price too high', percentage: 35 },
        { reason: 'Not using enough', percentage: 28 },
        { reason: 'Found alternative', percentage: 18 },
        { reason: 'Technical issues', percentage: 12 },
        { reason: 'Other', percentage: 7 }
      ],
      churnPrevention: {
        at_risk_users: 23,
        retention_campaigns: 5,
        win_back_rate: 15.3
      }
    };

    res.json(churnAnalysis);
  } catch (error) {
    console.error('Error fetching churn analysis:', error);
    res.status(500).json({ message: 'Failed to fetch churn analysis' });
  }
});

// Generate mock revenue report
function generateRevenueReport(period: string) {
  const now = new Date();
  const data = [];
  
  const periods = period === 'weekly' ? 12 : period === 'yearly' ? 5 : 12;
  const timeUnit = period === 'weekly' ? 7 : period === 'yearly' ? 365 : 30;
  
  for (let i = periods - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * timeUnit * 24 * 60 * 60 * 1000);
    const revenue = Math.floor(Math.random() * 5000) + 2000;
    const subscriptions = Math.floor(Math.random() * 50) + 20;
    
    data.push({
      period: formatPeriod(date, period),
      revenue,
      subscriptions,
      averageRevenuePerUser: Math.round((revenue / subscriptions) * 100) / 100
    });
  }
  
  return {
    period,
    data,
    totalRevenue: data.reduce((sum, item) => sum + item.revenue, 0),
    totalSubscriptions: data.reduce((sum, item) => sum + item.subscriptions, 0)
  };
}

function formatPeriod(date: Date, period: string): string {
  if (period === 'weekly') {
    return `Week of ${date.toISOString().split('T')[0]}`;
  } else if (period === 'yearly') {
    return date.getFullYear().toString();
  } else {
    return date.toISOString().slice(0, 7); // YYYY-MM format
  }
}

export default router;