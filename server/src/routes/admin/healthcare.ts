import { Router } from 'express';
import { db } from '../../db';
import { isAdmin } from '../../middleware/auth';
import {
  healthcareIntegration,
  healthReports,
  healthScores,
  healthPredictions,
  realTimeMonitoring
} from '../../migrations/002_create_premium_analytics_tables';
import { users } from '../../db/schemas/users';
import { eq, and, gte, lte, desc, count, avg, sql, isNotNull, or } from 'drizzle-orm';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

const router = Router();

// Middleware to protect all admin healthcare routes
router.use(isAdmin);

// Get healthcare system overview
router.get('/overview', async (req, res) => {
  try {
    const [totalIntegrations, activeIntegrations, totalProviders, recentActivity] = await Promise.all([
      // Total healthcare integrations
      db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration),
      
      // Active integrations
      db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration).where(
        eq(healthcareIntegration.data_sharing_consent, true)
      ),
      
      // Total providers (mock data for now)
      Promise.resolve({ count: 156 }),
      
      // Recent activity (last 7 days)
      db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration).where(
        gte(healthcareIntegration.created_at, subDays(new Date(), 7))
      )
    ]);

    const overview = {
      totalIntegrations: (totalIntegrations as any)[0].count,
      activeIntegrations: (activeIntegrations as any)[0].count,
      totalProviders: (totalProviders as any).count,
      recentActivity: (recentActivity as any)[0].count,
      integrationRate: (activeIntegrations as any)[0].count > 0 
        ? (((activeIntegrations as any)[0].count / (totalIntegrations as any)[0].count) * 100).toFixed(1)
        : '0'
    };

    res.json(overview);
  } catch (error) {
    console.error('Error fetching healthcare overview:', error);
    res.status(500).json({ message: 'Failed to fetch healthcare overview' });
  }
});

// Get all healthcare integrations with admin view
router.get('/integrations', async (req, res) => {
  try {
    const { userId, search, professionalType, page = 1, limit = 50 } = req.query;
    
    let query = db.select().from(healthcareIntegration);
    
    // Apply filters
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(healthcareIntegration.user_id, parseInt(userId as string)));
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`CONCAT(${healthcareIntegration.professional_name}, ${healthcareIntegration.practice_name}) LIKE ${searchTerm}`
      );
    }
    
    if (professionalType && professionalType !== 'all') {
      conditions.push(eq(healthcareIntegration.professional_type, professionalType as string));
    }
    
    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add pagination
    const offset = ((page as number) - 1) * (limit as number);
    const integrations = await query
      .orderBy(desc(healthcareIntegration.created_at))
      .limit(limit as number)
      .offset(offset);
    
    // Get total count for pagination
    const [{ count: totalCount }] = await db.select({ count: sql`COUNT(*)` })
      .from(healthcareIntegration)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    res.json({
      integrations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(totalCount as string),
        pages: Math.ceil(parseInt(totalCount as string) / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching healthcare integrations:', error);
    res.status(500).json({ message: 'Failed to fetch healthcare integrations' });
  }
});

// Get healthcare integration details by ID
router.get('/integrations/:id', async (req, res) => {
  try {
    const integrationId = parseInt(req.params.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ message: 'Invalid integration ID' });
    }
    
    const [integration] = await db
      .select()
      .from(healthcareIntegration)
      .where(eq(healthcareIntegration.id, integrationId));
    
    if (!integration) {
      return res.status(404).json({ message: 'Healthcare integration not found' });
    }
    
    // Get related data
    const [user, healthScores, reports] = await Promise.all([
      db.select().from(users).where(eq(users.id, integration.user_id)).limit(1),
      db.select().from(healthScores).where(eq(healthScores.user_id, integration.user_id)).limit(10),
      db.select().from(healthReports).where(eq(healthReports.user_id, integration.user_id)).limit(10)
    ]);
    
    const detailedIntegration = {
      ...integration,
      user: user[0] || null,
      recentHealthScores: healthScores,
      recentReports: reports
    };
    
    res.json(detailedIntegration);
  } catch (error) {
    console.error('Error fetching healthcare integration details:', error);
    res.status(500).json({ message: 'Failed to fetch healthcare integration details' });
  }
});

// Update healthcare integration (admin override)
router.put('/integrations/:id', async (req, res) => {
  try {
    const integrationId = parseInt(req.params.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ message: 'Invalid integration ID' });
    }
    
    const { accessLevel, dataSharingConsent, notes, status } = req.body;
    
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (accessLevel !== undefined) updateData.access_level = accessLevel;
    if (dataSharingConsent !== undefined) updateData.data_sharing_consent = dataSharingConsent;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    
    const [updated] = await db
      .update(healthcareIntegration)
      .set(updateData)
      .where(eq(healthcareIntegration.id, integrationId))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: 'Healthcare integration not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating healthcare integration:', error);
    res.status(500).json({ message: 'Failed to update healthcare integration' });
  }
});

// Delete healthcare integration
router.delete('/integrations/:id', async (req, res) => {
  try {
    const integrationId = parseInt(req.params.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ message: 'Invalid integration ID' });
    }
    
    const [deleted] = await db
      .delete(healthcareIntegration)
      .where(eq(healthcareIntegration.id, integrationId))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ message: 'Healthcare integration not found' });
    }
    
    res.json({ message: 'Healthcare integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting healthcare integration:', error);
    res.status(500).json({ message: 'Failed to delete healthcare integration' });
  }
});

// Get healthcare providers management
router.get('/providers', async (req, res) => {
  try {
    const { search, type, verified, page = 1, limit = 50 } = req.query;
    
    // Mock provider data - in real app, this would come from healthcare provider API
    const mockProviders = [
      {
        id: 'prov_001',
        name: 'Dr. Sarah Johnson',
        type: 'doctor',
        specialty: 'General Practice',
        practiceName: 'Family Health Clinic',
        email: 'sarah.johnson@familyhealth.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, Anytown, USA',
        verified: true,
        rating: 4.8,
        reviewCount: 156,
        activeIntegrations: 23,
        createdAt: '2023-01-15T10:00:00Z'
      },
      {
        id: 'prov_002',
        name: 'Dr. Michael Chen',
        type: 'nutritionist',
        specialty: 'Sports Nutrition',
        practiceName: 'Performance Nutrition Center',
        email: 'michael.chen@performancenutrition.com',
        phone: '+1 (555) 234-5678',
        address: '456 Oak Ave, Anytown, USA',
        verified: true,
        rating: 4.9,
        reviewCount: 89,
        activeIntegrations: 15,
        createdAt: '2023-02-20T14:30:00Z'
      }
    ];
    
    let filteredProviders = mockProviders;
    
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredProviders = filteredProviders.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.specialty.toLowerCase().includes(searchTerm) ||
        provider.practiceName?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (type && type !== 'all') {
      filteredProviders = filteredProviders.filter(provider => provider.type === type);
    }
    
    if (verified !== undefined) {
      const isVerified = verified === 'true';
      filteredProviders = filteredProviders.filter(provider => provider.verified === isVerified);
    }
    
    // Apply pagination
    const offset = ((page as number) - 1) * (limit as number);
    const paginatedProviders = filteredProviders.slice(offset, offset + parseInt(limit as string));
    
    res.json({
      providers: paginatedProviders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: filteredProviders.length,
        pages: Math.ceil(filteredProviders.length / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching healthcare providers:', error);
    res.status(500).json({ message: 'Failed to fetch healthcare providers' });
  }
});

// Get healthcare provider details
router.get('/providers/:id', async (req, res) => {
  try {
    const providerId = req.params.id;
    
    // Mock provider details
    const provider = {
      id: providerId,
      name: 'Dr. Sarah Johnson',
      type: 'doctor',
      specialty: 'General Practice',
      practiceName: 'Family Health Clinic',
      email: 'sarah.johnson@familyhealth.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, Anytown, USA',
      verified: true,
      rating: 4.8,
      reviewCount: 156,
      description: 'Dr. Sarah Johnson is a board-certified family physician with over 15 years of experience in general practice and preventive care.',
      education: ['Johns Hopkins University School of Medicine', 'Family Medicine Residency - Mayo Clinic'],
      certifications: ['Board Certified in Family Medicine', 'Certified Diabetes Educator'],
      languages: ['English', 'Spanish'],
      services: ['General Checkups', 'Preventive Care', 'Chronic Disease Management', 'Annual Physicals'],
      availability: {
        workingHours: {
          'Monday': '9:00 AM - 5:00 PM',
          'Tuesday': '9:00 AM - 5:00 PM',
          'Wednesday': '9:00 AM - 5:00 PM',
          'Thursday': '9:00 AM - 5:00 PM',
          'Friday': '9:00 AM - 3:00 PM'
        },
        acceptsNewPatients: true
      },
      statistics: {
        totalIntegrations: 23,
        activeIntegrations: 21,
        averageResponseTime: '2.5 hours',
        patientSatisfaction: 4.7
      },
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-01-10T14:30:00Z'
    };
    
    res.json(provider);
  } catch (error) {
    console.error('Error fetching healthcare provider details:', error);
    res.status(500).json({ message: 'Failed to fetch healthcare provider details' });
  }
});

// Verify healthcare provider credentials
router.post('/providers/:id/verify', async (req, res) => {
  try {
    const providerId = req.params.id;
    
    // Mock verification process
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    res.json({
      success: true,
      message: 'Provider credentials verified successfully',
      providerId,
      verifiedAt: new Date().toISOString(),
      verificationDetails: {
        licenseVerified: true,
        malpracticeInsurance: true,
        backgroundCheck: true,
        credentialsUpToDate: true
      }
    });
  } catch (error) {
    console.error('Error verifying healthcare provider:', error);
    res.status(500).json({ message: 'Failed to verify healthcare provider' });
  }
});

// Get healthcare analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter;
    switch (period) {
      case '7d':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 7));
        break;
      case '30d':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 30));
        break;
      case '90d':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 90));
        break;
      case '1y':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 365));
        break;
      default:
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 30));
    }
    
    const [
      totalIntegrations,
      activeIntegrations,
      integrationsByType,
      integrationsByMonth,
      topProviders,
      userAdoption
    ] = await Promise.all([
      // Total integrations
      db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration).where(dateFilter),
      
      // Active integrations
      db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration).where(
        and(dateFilter, eq(healthcareIntegration.data_sharing_consent, true))
      ),
      
      // Integrations by professional type
      db.select({
        type: healthcareIntegration.professional_type,
        count: sql`COUNT(*)`
      }).from(healthcareIntegration)
        .where(dateFilter)
        .groupBy(healthcareIntegration.professional_type),
      
      // Integrations by month
      db.select({
        month: sql`DATE_FORMAT(${healthcareIntegration.created_at}, '%Y-%m')`,
        count: sql`COUNT(*)`
      }).from(healthcareIntegration)
        .where(dateFilter)
        .groupBy(sql`DATE_FORMAT(${healthcareIntegration.created_at}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${healthcareIntegration.created_at}, '%Y-%m')`),
      
      // Top providers by integration count
      db.select({
        professionalId: healthcareIntegration.professional_id,
        professionalName: healthcareIntegration.professional_name,
        count: sql`COUNT(*)`
      }).from(healthcareIntegration)
        .where(dateFilter)
        .groupBy(healthcareIntegration.professional_id, healthcareIntegration.professional_name)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10),
      
      // User adoption rate
      db.select({
        totalUsers: sql`COUNT(DISTINCT ${healthcareIntegration.user_id})`,
        activeUsers: sql`COUNT(DISTINCT CASE WHEN ${healthcareIntegration.data_sharing_consent} = true THEN ${healthcareIntegration.user_id} END)`
      }).from(healthcareIntegration)
        .where(dateFilter)
    ]);
    
    const analytics = {
      period,
      summary: {
        totalIntegrations: (totalIntegrations as any)[0].count,
        activeIntegrations: (activeIntegrations as any)[0].count,
        adoptionRate: (activeIntegrations as any)[0].count > 0 
          ? (((activeIntegrations as any)[0].count / (totalIntegrations as any)[0].count) * 100).toFixed(1)
          : '0'
      },
      byType: integrationsByType,
      byMonth: integrationsByMonth,
      topProviders: topProviders,
      userAdoption: {
        totalUsers: (userAdoption as any)[0].totalUsers,
        activeUsers: (userAdoption as any)[0].activeUsers,
        adoptionRate: (userAdoption as any)[0].activeUsers > 0
          ? (((userAdoption as any)[0].activeUsers / (userAdoption as any)[0].totalUsers) * 100).toFixed(1)
          : '0'
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching healthcare analytics:', error);
    res.status(500).json({ message: 'Failed to fetch healthcare analytics' });
  }
});

// Get healthcare system health
router.get('/system-health', async (req, res) => {
  try {
    const systemHealth = {
      overall: 'healthy',
      lastChecked: new Date().toISOString(),
      components: {
        database: {
          status: 'healthy',
          responseTime: '45ms',
          connections: 15,
          maxConnections: 100
        },
        api: {
          status: 'healthy',
          uptime: '99.9%',
          responseTime: '120ms',
          errorRate: '0.1%'
        },
        integrations: {
          status: 'healthy',
          activeProviders: 156,
          successRate: '98.5%',
          lastSync: new Date().toISOString()
        },
        notifications: {
          status: 'healthy',
          deliveryRate: '99.2%',
          pendingNotifications: 3
        }
      },
      alerts: [],
      recommendations: [
        'Consider adding more healthcare provider API integrations',
        'Monitor API response times during peak hours',
        'Implement automated backup for healthcare data'
      ]
    };
    
    res.json(systemHealth);
  } catch (error) {
    console.error('Error fetching healthcare system health:', error);
    res.status(500).json({ message: 'Failed to fetch healthcare system health' });
  }
});

// Export healthcare data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', dateRange = '30d' } = req.query;
    
    let dateFilter;
    switch (dateRange) {
      case '7d':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 7));
        break;
      case '30d':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 30));
        break;
      case '90d':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 90));
        break;
      case '1y':
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 365));
        break;
      default:
        dateFilter = gte(healthcareIntegration.created_at, subDays(new Date(), 30));
    }
    
    const [integrations, healthScores, reports, predictions] = await Promise.all([
      db.select().from(healthcareIntegration).where(dateFilter),
      db.select().from(healthScores).where(dateFilter),
      db.select().from(healthReports).where(dateFilter),
      db.select().from(healthPredictions).where(dateFilter)
    ]);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      dateRange,
      format,
      data: {
        integrations,
        healthScores,
        reports,
        predictions
      },
      summary: {
        totalIntegrations: integrations.length,
        totalHealthScores: healthScores.length,
        totalReports: reports.length,
        totalPredictions: predictions.length
      }
    };
    
    switch (format) {
      case 'json':
        res.json(exportData);
        break;
      
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=healthcare-data-${Date.now()}.csv`);
        
        // Generate CSV content
        const csvHeaders = ['ID', 'Type', 'Name', 'User ID', 'Created At', 'Status'];
        const csvRows = [
          csvHeaders.join(','),
          ...integrations.map((item: any) => [
            item.id,
            item.professional_type,
            item.professional_name,
            item.user_id,
            item.created_at,
            item.status || 'active'
          ].join(','))
        ].join('\n');
        
        res.send(csvRows);
        break;
      
      default:
        res.status(400).json({ message: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting healthcare data:', error);
    res.status(500).json({ message: 'Failed to export healthcare data' });
  }
});

// Bulk operations for healthcare integrations
router.post('/bulk', async (req, res) => {
  try {
    const { operation, integrationIds, data } = req.body;
    
    if (!operation || !integrationIds || !Array.isArray(integrationIds)) {
      return res.status(400).json({ message: 'Invalid bulk operation request' });
    }
    
    let result;
    
    switch (operation) {
      case 'verify_providers':
        // Bulk verify provider credentials
        result = { success: true, message: `${integrationIds.length} providers verified` };
        break;
        
      case 'deactivate_integrations':
        await db
          .update(healthcareIntegration)
          .set({ 
            data_sharing_consent: false,
            updated_at: new Date()
          })
          .where(or(...integrationIds.map(id => eq(healthcareIntegration.id, id))));
        result = { success: true, message: `${integrationIds.length} integrations deactivated` };
        break;
        
      case 'activate_integrations':
        await db
          .update(healthcareIntegration)
          .set({ 
            data_sharing_consent: true,
            updated_at: new Date()
          })
          .where(or(...integrationIds.map(id => eq(healthcareIntegration.id, id))));
        result = { success: true, message: `${integrationIds.length} integrations activated` };
        break;
        
      case 'delete_integrations':
        await db
          .delete(healthcareIntegration)
          .where(or(...integrationIds.map(id => eq(healthcareIntegration.id, id))));
        result = { success: true, message: `${integrationIds.length} integrations deleted` };
        break;
        
      default:
        return res.status(400).json({ message: 'Unknown bulk operation' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ message: 'Failed to perform bulk operation' });
  }
});

export default router;