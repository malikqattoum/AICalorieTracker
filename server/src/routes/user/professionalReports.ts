import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { 
  healthReports, 
  healthScores,
  healthPredictions,
  healthGoals
} from '../../migrations/002_create_premium_analytics_tables';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { ProfessionalReportsService } from '../../services/professionalReportsService';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
const reportsService = new ProfessionalReportsService();

// Schema for generating report
const generateReportSchema = z.object({
  reportType: z.enum(['weekly_summary', 'monthly_progress', 'quarterly_review', 'annual_journey', 'custom']),
  reportPeriodStart: z.string(),
  reportPeriodEnd: z.string(),
  includeCharts: z.boolean().optional().default(true),
  includePredictions: z.boolean().optional().default(true),
  includeRecommendations: z.boolean().optional().default(true),
  professionalId: z.string().optional(),
  professionalName: z.string().optional(),
  reportFormat: z.enum(['pdf', 'html', 'json']).optional().default('html')
});

// Schema for sharing report
const shareReportSchema = z.object({
  reportId: z.number(),
  professionalId: z.string(),
  professionalName: z.string()
});

// Generate a new professional report
router.post('/generate', authenticate, validateRequest(generateReportSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const reportData = {
      ...req.body,
      userId,
      reportPeriodStart: new Date(req.body.reportPeriodStart),
      reportPeriodEnd: new Date(req.body.reportPeriodEnd)
    };

    const report = await reportsService.generateReport(reportData);

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// Get user's reports
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 50 } = req.query;

    const reports = await reportsService.getUserReports(userId, Number(limit));

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
});

// Get specific report by ID
router.get('/:reportId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const reportId = parseInt(req.params.reportId);

    if (isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await reportsService.getReportById(reportId, userId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ success: false, message: 'Failed to get report' });
  }
});

// Share report with professional
router.post('/share', authenticate, validateRequest(shareReportSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { reportId, professionalId, professionalName } = req.body;

    const report = await reportsService.shareReport(reportId, professionalId, professionalName);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report, message: 'Report shared successfully' });
  } catch (error) {
    console.error('Error sharing report:', error);
    res.status(500).json({ success: false, message: 'Failed to share report' });
  }
});

// Export report in different formats
router.get('/:reportId/export/:format', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const reportId = parseInt(req.params.reportId);
    const format = req.params.format as 'pdf' | 'html' | 'json';

    if (isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    if (!['pdf', 'html', 'json'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Invalid export format' });
    }

    const report = await reportsService.getReportById(reportId, userId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const exportedContent = await reportsService.exportReport(reportId, format);

    // Set appropriate headers for different formats
    switch (format) {
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="health-report-${reportId}.pdf"`);
        break;
      case 'html':
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="health-report-${reportId}.html"`);
        break;
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="health-report-${reportId}.json"`);
        break;
    }

    res.send(exportedContent);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ success: false, message: 'Failed to export report' });
  }
});

// Get report templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    const templates = [
      {
        id: 'weekly_summary',
        name: 'Weekly Health Summary',
        description: 'Comprehensive weekly overview of your health metrics and progress',
        sections: ['Executive Summary', 'Health Scores', 'Nutrition Analysis', 'Fitness Analysis', 'Sleep Analysis', 'Recommendations'],
        estimatedTime: '5-10 minutes'
      },
      {
        id: 'monthly_progress',
        name: 'Monthly Progress Report',
        description: 'Detailed monthly analysis of your health journey and goal achievement',
        sections: ['Executive Summary', 'Health Scores', 'Nutrition Analysis', 'Fitness Analysis', 'Sleep Analysis', 'Goal Progress', 'Predictive Analytics', 'Recommendations'],
        estimatedTime: '10-15 minutes'
      },
      {
        id: 'quarterly_review',
        name: 'Quarterly Health Review',
        description: 'Comprehensive quarterly review with trend analysis and insights',
        sections: ['Executive Summary', 'Health Scores', 'Nutrition Analysis', 'Fitness Analysis', 'Sleep Analysis', 'Goal Progress', 'Predictive Analytics', 'Trend Analysis', 'Recommendations'],
        estimatedTime: '15-20 minutes'
      },
      {
        id: 'annual_journey',
        name: 'Annual Health Journey',
        description: 'Complete annual overview of your health journey and achievements',
        sections: ['Executive Summary', 'Health Scores', 'Nutrition Analysis', 'Fitness Analysis', 'Sleep Analysis', 'Goal Progress', 'Predictive Analytics', 'Trend Analysis', 'Achievements', 'Recommendations'],
        estimatedTime: '20-30 minutes'
      }
    ];

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error getting report templates:', error);
    res.status(500).json({ success: false, message: 'Failed to get report templates' });
  }
});

// Get report statistics
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { timeRange = 'month' } = req.query;

    let startDate: Date;
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [totalReports, recentReports, sharedReports] = await Promise.all([
      // Total reports
      db.select({ count: sql`COUNT(*)` }).from(healthReports).where(eq(healthReports.userId, userId)),
      
      // Recent reports
      db.select({ count: sql`COUNT(*)` }).from(healthReports).where(and(
        eq(healthReports.userId, userId),
        gte(healthReports.generatedAt, startDate)
      )),
      
      // Shared reports
      db.select({ count: sql`COUNT(*)` }).from(healthReports).where(and(
        eq(healthReports.userId, userId),
        gte(healthReports.generatedAt, startDate),
        isNotNull(healthReports.sharedAt)
      ))
    ]);

    const reportStats = {
      total: totalReports[0].count,
      recent: recentReports[0].count,
      shared: sharedReports[0].count,
      timeRange,
      averageReportsPerMonth: Math.round((totalReports[0].count / 12) * 10) / 10
    };

    res.json({ success: true, data: reportStats });
  } catch (error) {
    console.error('Error getting report statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get report statistics' });
  }
});

// Get report insights
router.get('/insights', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { timeRange = 'month' } = req.query;

    let startDate: Date;
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get health scores for the period
    const healthScoresData = await db
      .select()
      .from(healthScores)
      .where(and(
        eq(healthScores.userId, userId),
        gte(healthScores.calculationDate, startDate)
      ))
      .orderBy(healthScores.calculationDate);

    // Get goals for the period
    const goalsData = await db
      .select()
      .from(healthGoals)
      .where(and(
        eq(healthGoals.userId, userId),
        gte(healthGoals.createdAt, startDate)
      ));

    // Calculate insights
    const insights = {
      healthTrends: this.calculateHealthTrends(healthScoresData),
      goalProgress: this.calculateGoalProgress(goalsData),
      recommendations: this.generateInsightRecommendations(healthScoresData, goalsData),
      achievements: this.identifyAchievements(healthScoresData, goalsData)
    };

    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('Error getting report insights:', error);
    res.status(500).json({ success: false, message: 'Failed to get report insights' });
  }
});

// Delete report
router.delete('/:reportId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const reportId = parseInt(req.params.reportId);

    if (isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await db
      .delete(healthReports)
      .where(and(
        eq(healthReports.id, reportId),
        eq(healthReports.userId, userId)
      ))
      .returning();

    if (report.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
});

// Helper functions
function calculateHealthTrends(healthScoresData: any[]) {
  if (healthScoresData.length === 0) return { overall: 'insufficient_data' };

  const overallScores = healthScoresData.filter(s => s.scoreType === 'overall');
  if (overallScores.length < 2) return { overall: 'insufficient_data' };

  const firstScore = overallScores[0].scoreValue;
  const lastScore = overallScores[overallScores.length - 1].scoreValue;
  const change = ((lastScore - firstScore) / firstScore) * 100;

  if (change > 5) return { overall: 'improving', change: change.toFixed(1) };
  if (change < -5) return { overall: 'declining', change: change.toFixed(1) };
  return { overall: 'stable', change: change.toFixed(1) };
}

function calculateGoalProgress(goalsData: any[]) {
  if (goalsData.length === 0) return { total: 0, completed: 0, inProgress: 0 };

  const completed = goalsData.filter(g => g.status === 'completed').length;
  const inProgress = goalsData.filter(g => g.status === 'active').length;

  return {
    total: goalsData.length,
    completed,
    inProgress,
    completionRate: ((completed / goalsData.length) * 100).toFixed(1)
  };
}

function generateInsightRecommendations(healthScoresData: any[], goalsData: any[]) {
  const recommendations = [];

  // Analyze health scores
  const overallScores = healthScoresData.filter(s => s.scoreType === 'overall');
  if (overallScores.length > 0) {
    const avgScore = overallScores.reduce((sum, s) => sum + s.scoreValue, 0) / overallScores.length;
    if (avgScore < 60) {
      recommendations.push('Focus on improving overall health through better nutrition, exercise, and sleep habits.');
    }
  }

  // Analyze goals
  const activeGoals = goalsData.filter(g => g.status === 'active');
  if (activeGoals.length > 0) {
    const avgProgress = activeGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / activeGoals.length;
    if (avgProgress < 30) {
      recommendations.push('Consider adjusting your goals or breaking them into smaller, more manageable steps.');
    }
  }

  return recommendations;
}

function identifyAchievements(healthScoresData: any[], goalsData: any[]) {
  const achievements = [];

  // Health score achievements
  const overallScores = healthScoresData.filter(s => s.scoreType === 'overall');
  if (overallScores.length > 0) {
    const maxScore = Math.max(...overallScores.map(s => s.scoreValue));
    if (maxScore >= 90) {
      achievements.push('Achieved excellent overall health score');
    } else if (maxScore >= 80) {
      achievements.push('Achieved good overall health score');
    }
  }

  // Goal achievements
  const completedGoals = goalsData.filter(g => g.status === 'completed');
  if (completedGoals.length > 0) {
    achievements.push(`Completed ${completedGoals.length} health goals`);
  }

  return achievements;
}

export default router;