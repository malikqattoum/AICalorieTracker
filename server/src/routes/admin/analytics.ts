import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Middleware to protect all admin analytics routes
router.use(isAdmin);

// Main analytics endpoint
router.get('/', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Generate mock analytics data based on time range
    const analyticsData = generateAnalyticsData(timeRange as string);
    
    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// User analytics endpoint
router.get('/users', async (req, res) => {
  try {
    const userAnalytics = {
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

    res.json(userAnalytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Failed to fetch user analytics' });
  }
});

// Revenue analytics endpoint
router.get('/revenue', async (req, res) => {
  try {
    const revenueAnalytics = {
      totalRevenue: 18750.50,
      monthlyRevenue: 2340.25,
      yearlyRevenue: 15200.75,
      averageRevenuePerUser: 12.50,
      lifetimeValue: 89.40,
      churnRate: 5.2,
      monthlyRecurringRevenue: 2340.25,
      yearlyRecurringRevenue: 15200.75
    };

    res.json(revenueAnalytics);
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Failed to fetch revenue analytics' });
  }
});

// Feature usage analytics endpoint
router.get('/features', async (req, res) => {
  try {
    const featureAnalytics = [
      { feature: 'AI Food Analysis', usage: 3456, percentage: 45 },
      { feature: 'Meal Planning', usage: 2134, percentage: 28 },
      { feature: 'Nutrition Tracking', usage: 1567, percentage: 20 },
      { feature: 'Recipe Import', usage: 432, percentage: 6 },
      { feature: 'Goal Setting', usage: 89, percentage: 1 }
    ];

    res.json(featureAnalytics);
  } catch (error) {
    console.error('Error fetching feature analytics:', error);
    res.status(500).json({ message: 'Failed to fetch feature analytics' });
  }
});

// AI performance analytics endpoint
router.get('/ai', async (req, res) => {
  try {
    const aiAnalytics = {
      totalAnalyses: 12456,
      averageResponseTime: 2.3,
      accuracyRate: 95.8,
      uptime: 99.2,
      costAnalysis: {
        totalCost: 234.56,
        costPerAnalysis: 0.0188,
        monthlyBudget: 500.00,
        budgetUsed: 46.9
      },
      providerStats: [
        { provider: 'openai', usage: 8234, cost: 187.23 },
        { provider: 'gemini', usage: 4222, cost: 47.33 }
      ]
    };

    res.json(aiAnalytics);
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    res.status(500).json({ message: 'Failed to fetch AI analytics' });
  }
});

// Generate mock analytics data
function generateAnalyticsData(timeRange: string) {
  const days = getTimeRangeDays(timeRange);
  const now = new Date();
  
  // Generate user growth data
  const userGrowth = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    userGrowth.push({
      date: date.toISOString().split('T')[0],
      users: Math.floor(Math.random() * 50) + 100 + (days - i) * 2,
      premium: Math.floor(Math.random() * 15) + 20 + Math.floor((days - i) * 0.5)
    });
  }

  // Generate meal analytics data
  const mealAnalytics = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    mealAnalytics.push({
      date: date.toISOString().split('T')[0],
      analyses: Math.floor(Math.random() * 100) + 50,
      calories: Math.floor(Math.random() * 50000) + 25000
    });
  }

  // Generate revenue data
  const revenueData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    revenueData.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 500) + 200,
      subscriptions: Math.floor(Math.random() * 20) + 5
    });
  }

  // Feature usage data
  const featureUsage = [
    { feature: 'AI Food Analysis', usage: 3456, percentage: 45 },
    { feature: 'Meal Planning', usage: 2134, percentage: 28 },
    { feature: 'Nutrition Tracking', usage: 1567, percentage: 20 },
    { feature: 'Recipe Import', usage: 432, percentage: 6 },
    { feature: 'Goal Setting', usage: 89, percentage: 1 }
  ];

  // AI provider stats
  const aiProviderStats = [
    { provider: 'openai', usage: 8234, cost: 187.23 },
    { provider: 'gemini', usage: 4222, cost: 47.33 }
  ];

  // Top analyzed foods
  const topFoods = [
    { food: 'Burger', count: 456, calories: 520 },
    { food: 'Pizza', count: 398, calories: 285 },
    { food: 'Salad', count: 342, calories: 150 },
    { food: 'Pasta', count: 298, calories: 220 },
    { food: 'Chicken', count: 267, calories: 165 },
    { food: 'Rice', count: 234, calories: 130 },
    { food: 'Fish', count: 198, calories: 140 },
    { food: 'Vegetables', count: 187, calories: 50 }
  ];

  // User retention data
  const userRetention = [
    { cohort: 'Jan 2024', retention: [100, 85, 72, 65, 58, 52, 48] },
    { cohort: 'Feb 2024', retention: [100, 88, 75, 68, 61, 55, 51] },
    { cohort: 'Mar 2024', retention: [100, 82, 70, 62, 56, 50, 46] },
    { cohort: 'Apr 2024', retention: [100, 90, 78, 71, 64, 58, 54] }
  ];

  return {
    userGrowth,
    mealAnalytics,
    revenueData,
    featureUsage,
    aiProviderStats,
    topFoods,
    userRetention
  };
}

function getTimeRangeDays(timeRange: string): number {
  switch (timeRange) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
}

export default router;