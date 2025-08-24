import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import db from '../db';
import { authenticate } from '../middleware/auth';
import {
  wearableDevices,
  healthMetrics,
  syncLogs,
  deviceActivities,
  deviceWorkouts,
  deviceSleepData,
  deviceHeartRateData,
  deviceStepsData,
  deviceCaloriesData,
  deviceWeightData,
  deviceBloodPressureData,
  deviceWaterIntakeData,
  deviceBodyFatData,
  deviceDistanceData,
  deviceActivityMinutesData,
  deviceWorkoutDurationData,
  deviceRestingHeartRateData,
  deviceSleepQualityData,
  deviceSleepDurationData,
  deviceBloodOxygenData,
  deviceRespiratoryRateData,
  deviceSkinTemperatureData,
  deviceHeartRateVariabilityData,
  deviceVo2MaxData,
  deviceFitnessAgeData,
  deviceStressLevelData,
  deviceRecoveryScoreData,
  deviceTrainingLoadData,
  deviceReadinessScoreData,
  deviceSleepScoreData,
  deviceActivityScoreData,
  deviceMoveMinutesData,
  deviceExerciseMinutesData,
  deviceStandHoursData,
  deviceActiveCaloriesData,
  deviceRestingCaloriesData,
  deviceTotalCaloriesData,
  deviceBasalMetabolicRateData,
  deviceBodyMassIndexData,
  deviceBodyWaterData,
  deviceBoneMassData,
  deviceMuscleMassData,
  deviceVisceralFatData,
  deviceWaistCircumferenceData,
  deviceHipCircumferenceData,
  deviceWaistToHipRatioData,
  deviceWaistToHeightRatioData,
  deviceBodyCompositionData,
  devicePhysicalActivityData,
  deviceExerciseData,
  deviceWorkoutData
} from '../models/wearableDevice';

const router = Router();

// Extended schema for wearable data with more fields
const wearableDataSchema = z.object({
  userId: z.number(),
  deviceType: z.string().optional(),
  steps: z.number().int().min(0),
  heartRate: z.number().int().min(0).optional(),
  caloriesBurned: z.number().min(0).optional(),
  sleepHours: z.number().min(0).optional(),
  timestamp: z.date().optional(),
});

// Device management schemas
const deviceSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.enum(['apple_health', 'google_fit', 'fitbit', 'garmin', 'apple_watch']),
  manufacturer: z.string(),
  model: z.string(),
  firmwareVersion: z.string().optional(),
  serialNumber: z.string().optional(),
  isConnected: z.boolean().default(false),
  lastSyncAt: z.date().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

const connectDeviceSchema = z.object({
  name: z.string(),
  type: z.enum(['fitness_tracker', 'smartwatch', 'heart_rate_monitor', 'scale', 'blood_pressure_monitor', 'glucose_monitor', 'other']),
  manufacturer: z.string(),
  model: z.string(),
  firmwareVersion: z.string().optional(),
  serialNumber: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const deviceSettingsSchema = z.object({
  autoSync: z.boolean().default(true),
  syncFrequency: z.number().min(1).default(60), // minutes
  selectedMetrics: z.array(z.string()).default(['steps', 'heart_rate', 'calories_burned', 'sleep_hours']),
  privacySettings: z.object({
    shareData: z.boolean().default(false),
    anonymizeData: z.boolean().default(true),
    dataRetention: z.number().min(1).default(365), // days
  }).default({}),
  notificationSettings: z.object({
    syncComplete: z.boolean().default(true),
    lowBattery: z.boolean().default(true),
    syncFailed: z.boolean().default(true),
    insights: z.boolean().default(true),
  }).default({}),
});

const syncTypeSchema = z.enum(['health_data', 'device_settings', 'both']).default('both');

const healthDataQuerySchema = z.object({
  userId: z.number(),
  metricTypes: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  source: z.string().optional(),
  offset: z.number().min(0).optional(),
  limit: z.number().min(1).max(1000).optional(),
});

const correlationQuerySchema = z.object({
  userId: z.number(),
  metricTypes: z.array(z.string()).min(2),
  startDate: z.date(),
  endDate: z.date(),
  correlationThreshold: z.number().min(-1).max(1).optional(),
});

const exportDataSchema = z.object({
  deviceId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  format: z.enum(['json', 'csv']).default('json'),
});

const aggregatedQuerySchema = z.object({
  userId: z.number(),
  metricTypes: z.array(z.string()).min(1),
  startDate: z.date(),
  endDate: z.date(),
  aggregation: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  aggregateFunction: z.enum(['avg', 'sum', 'min', 'max', 'count']).default('avg'),
});

const insightsQuerySchema = z.object({
  userId: z.number(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
});

// Device Management Endpoints

// GET /api/wearable/devices - Get all user's devices
router.get('/devices', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const devices = await db.db.select()
      .from(wearableDevices)
      .where(eq(wearableDevices.userId, userId))
      .where(eq(wearableDevices.isActive, true));

    // Get data count for each device
    const devicesWithStats = await Promise.all(
      devices.map(async (device: any) => {
        const [dataCount] = await db.execute(
          'SELECT COUNT(*) as count FROM health_metrics WHERE user_id = ? AND device_id = ?',
          [userId, device.id]
        );
        
        return {
          ...device,
          metadata: {
            totalDataPoints: dataCount[0]?.count || 0,
          }
        };
      })
    );

    res.json({
      success: true,
      data: devicesWithStats,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch devices' });
  }
});

// POST /api/wearable/devices - Create new device
router.post('/devices', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deviceData = req.body;

    // Validate input
    const validatedData = deviceSchema.parse(deviceData);

    const newDevice = await db.db.insert(wearableDevices).values({
      userId,
      deviceType: validatedData.type,
      deviceName: validatedData.name,
      deviceId: `device_${Date.now()}`,
      isConnected: validatedData.isConnected,
      lastSyncAt: new Date(),
      batteryLevel: validatedData.batteryLevel || 100,
      signalStrength: -60,
      capabilities: {
        heartRate: true,
        steps: true,
        calories: true,
        sleep: true,
        distance: true,
        floors: true,
        gps: false,
        bloodPressure: false,
        bloodOxygen: false,
        stress: false,
        ...validatedData.metadata?.capabilities,
      },
      settings: {
        autoSync: true,
        syncFrequency: 60,
        selectedMetrics: ['steps', 'heart_rate', 'calories_burned', 'sleep_hours'],
        privacySettings: {
          shareData: false,
          anonymizeData: true,
          dataRetention: 365,
        },
        notificationSettings: {
          syncComplete: true,
          lowBattery: true,
          syncFailed: true,
          insights: true,
        },
        ...validatedData.metadata?.settings,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        id: newDevice.insertId,
        userId,
        deviceType: validatedData.type,
        deviceName: validatedData.name,
        deviceId: `device_${Date.now()}`,
        isConnected: validatedData.isConnected,
        lastSyncAt: new Date(),
        batteryLevel: validatedData.batteryLevel || 100,
        signalStrength: -60,
        capabilities: {
          heartRate: true,
          steps: true,
          calories: true,
          sleep: true,
          distance: true,
          floors: true,
          gps: false,
          bloodPressure: false,
          bloodOxygen: false,
          stress: false,
          ...validatedData.metadata?.capabilities,
        },
        settings: {
          autoSync: true,
          syncFrequency: 60,
          selectedMetrics: ['steps', 'heart_rate', 'calories_burned', 'sleep_hours'],
          privacySettings: {
            shareData: false,
            anonymizeData: true,
            dataRetention: 365,
          },
          notificationSettings: {
            syncComplete: true,
            lowBattery: true,
            syncFailed: true,
            insights: true,
          },
          ...validatedData.metadata?.settings,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ success: false, error: 'Failed to create device' });
  }
});

// POST /api/wearable/devices/:deviceId/connect - Connect device
router.post('/devices/:deviceId/connect', authenticate, async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = (req as any).user.id;

    // Simulate device connection
    const connectedDevice = {
      id: deviceId,
      isConnected: true,
      lastSyncAt: new Date(),
    };

    res.json({
      success: true,
      data: connectedDevice,
    });
  } catch (error) {
    console.error('Error connecting device:', error);
    res.status(500).json({ success: false, error: 'Failed to connect device' });
  }
});

// POST /api/wearable/devices/:deviceId/disconnect - Disconnect device
router.post('/devices/:deviceId/disconnect', authenticate, async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = (req as any).user.id;

    // Simulate device disconnection
    const disconnectedDevice = {
      id: deviceId,
      isConnected: false,
      lastSyncAt: null,
    };

    res.json({
      success: true,
      data: disconnectedDevice,
    });
  } catch (error) {
    console.error('Error disconnecting device:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect device' });
  }
});

// GET /api/wearable/devices/:deviceId/status - Get device status
router.get('/devices/:deviceId/status', authenticate, async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = (req as any).user.id;

    // Simulate device status
    const deviceStatus = {
      id: deviceId,
      isConnected: true,
      batteryLevel: 85,
      lastSyncAt: new Date(),
      firmwareVersion: '1.2.3',
      signalStrength: -45,
      storageUsed: 75,
      storageTotal: 100,
    };

    res.json({
      success: true,
      data: deviceStatus,
    });
  } catch (error) {
    console.error('Error getting device status:', error);
    res.status(500).json({ success: false, error: 'Failed to get device status' });
  }
});

// GET /api/wearable/devices/:deviceId/settings - Get device settings
router.get('/devices/:deviceId/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = (req as any).user.id;

    const settings = {
      autoSync: true,
      syncFrequency: 60,
      selectedMetrics: ['steps', 'heart_rate', 'calories_burned', 'sleep_hours'],
      privacySettings: {
        shareData: false,
        anonymizeData: true,
        dataRetention: 365,
      },
      notificationSettings: {
        syncComplete: true,
        lowBattery: true,
        syncFailed: true,
        insights: true,
      },
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error getting device settings:', error);
    res.status(500).json({ success: false, error: 'Failed to get device settings' });
  }
});

// PUT /api/wearable/devices/:deviceId/settings - Update device settings
router.put('/devices/:deviceId/settings', authenticate, (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = (req as any).user.id;
    const settings = req.body;

    // Simulate settings update
    const updatedSettings = {
      ...settings,
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating device settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update device settings' });
  }
});

// Data Sync Endpoints

// POST /api/wearable/devices/:deviceId/sync - Sync device data
router.post('/devices/:deviceId/sync', authenticate, (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = (req as any).user.id;
    const { syncType } = req.body;

    // Simulate sync process
    const syncResult = {
      deviceId,
      syncType,
      status: 'completed',
      syncedAt: new Date(),
      recordsSynced: Math.floor(Math.random() * 100) + 10,
      duration: Math.floor(Math.random() * 30) + 5, // seconds
      errors: [],
    };

    res.json({
      success: true,
      data: syncResult,
    });
  } catch (error) {
    console.error('Error syncing device:', error);
    res.status(500).json({ success: false, error: 'Failed to sync device' });
  }
});

// GET /api/wearable/devices/:deviceId/sync-logs - Get sync logs
router.get('/devices/:deviceId/sync-logs', authenticate, async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = (req as any).user.id;

    // Simulate sync logs
    const syncLogs = [
      {
        id: `log_${Date.now()}`,
        deviceId,
        timestamp: new Date(Date.now() - 3600000),
        status: 'completed',
        recordsSynced: 45,
        duration: 12,
        errors: [],
      },
      {
        id: `log_${Date.now() - 7200000}`,
        deviceId,
        timestamp: new Date(Date.now() - 7200000),
        status: 'completed',
        recordsSynced: 32,
        duration: 8,
        errors: [],
      },
    ];

    res.json({
      success: true,
      data: syncLogs,
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sync logs' });
  }
});

// Health Data Endpoints

// POST /api/wearable/health-data - Get health data
router.post('/health-data', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = req.body;

    // Build query conditions
    let sqlQuery = 'SELECT * FROM wearable_data WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (query.startDate) {
      sqlQuery += ' AND date >= ?';
      params.push(query.startDate.toISOString().split('T')[0]);
    }
    
    if (query.endDate) {
      sqlQuery += ' AND date <= ?';
      params.push(query.endDate.toISOString().split('T')[0]);
    }

    sqlQuery += ' ORDER BY date DESC';
    
    if (query.limit) {
      sqlQuery += ' LIMIT ?';
      params.push(query.limit);
    }
    
    if (query.offset) {
      sqlQuery += ' OFFSET ?';
      params.push(query.offset);
    }

    const [healthData] = await db.execute(sqlQuery, params);

    res.json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch health data' });
  }
});

// POST /api/wearable/health-data/save - Save health data
router.post('/health-data/save', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const metrics = req.body;

    const [result] = await db.execute(
      `INSERT INTO wearable_data 
      (user_id, device_type, steps, heart_rate, calories_burned, sleep_hours, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        metrics.userId,
        metrics.deviceType || 'Unknown',
        metrics.steps,
        metrics.heartRate,
        metrics.caloriesBurned,
        metrics.sleepHours,
        metrics.timestamp ? metrics.timestamp.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      ]
    );

    res.json({
      success: true,
      data: { saved: true, id: result.insertId },
    });
  } catch (error) {
    console.error('Error saving health data:', error);
    res.status(500).json({ success: false, error: 'Failed to save health data' });
  }
});

// Analytics Endpoints

// POST /api/wearable/correlation-analysis - Get correlation analysis
router.post('/correlation-analysis', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = req.body;

    // Simulate correlation analysis
    const correlations = [
      {
        id: `corr_${Date.now()}`,
        metric1: query.metricTypes[0],
        metric2: query.metricTypes[1],
        correlationCoefficient: 0.75,
        pValue: 0.001,
        significance: 'high',
        description: 'Strong positive correlation between steps and heart rate',
      },
      {
        id: `corr_${Date.now() + 1}`,
        metric1: query.metricTypes[0],
        metric2: query.metricTypes[2] || 'sleep_hours',
        correlationCoefficient: -0.45,
        pValue: 0.01,
        significance: 'medium',
        description: 'Moderate negative correlation between steps and sleep hours',
      },
    ];

    res.json({
      success: true,
      data: correlations,
    });
  } catch (error) {
    console.error('Error fetching correlation analysis:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch correlation analysis' });
  }
});

// User Settings Endpoints

// GET /api/wearable/user-settings/:userId - Get user wearable settings
router.get('/user-settings/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = (req as any).user.id;

    // Only allow users to access their own settings
    if (userId !== requestingUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const [userSettings] = await db.execute(
      'SELECT COUNT(*) as device_count, MAX(date) as last_sync FROM wearable_data WHERE user_id = ?',
      [userId]
    );

    const settings = {
      userId,
      autoSync: true,
      syncFrequency: 60,
      selectedMetrics: ['steps', 'heart_rate', 'calories_burned', 'sleep_hours'],
      privacySettings: {
        shareData: false,
        anonymizeData: true,
        dataRetention: 365,
      },
      notificationSettings: {
        syncComplete: true,
        lowBattery: true,
        syncFailed: true,
        insights: true,
      },
      connectedDevices: userSettings[0].device_count || 0,
      lastSyncAt: userSettings[0].last_sync ? new Date(userSettings[0].last_sync) : null,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user settings' });
  }
});

// PUT /api/wearable/user-settings - Update user wearable settings
router.put('/user-settings', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const settings = req.body;

    const updatedSettings = {
      ...settings,
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update user settings' });
  }
});

// Export/Import Endpoints

// POST /api/wearable/export - Export wearable data
router.post('/export', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const exportData = req.body;

    // Build query for export
    let sqlQuery = 'SELECT * FROM wearable_data WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (exportData.startDate) {
      sqlQuery += ' AND date >= ?';
      params.push(exportData.startDate.toISOString().split('T')[0]);
    }
    
    if (exportData.endDate) {
      sqlQuery += ' AND date <= ?';
      params.push(exportData.endDate.toISOString().split('T')[0]);
    }

    const [data] = await db.execute(sqlQuery, params);

    let exportContent;
    if (exportData.format === 'json') {
      exportContent = JSON.stringify(data, null, 2);
    } else {
      // CSV format
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map((row: any) => 
          headers.map(header => row[header]).join(',')
        );
        exportContent = [csvHeaders, ...csvRows].join('\n');
      } else {
        exportContent = 'No data to export';
      }
    }

    res.json({
      success: true,
      data: {
        content: exportContent,
        format: exportData.format,
        recordCount: data.length,
        exportedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

// POST /api/wearable/import - Import wearable data
router.post('/import', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { deviceId } = req.body;

    // Simulate file processing
    const importResult = {
      success: true,
      recordsImported: Math.floor(Math.random() * 100) + 10,
      deviceId,
      importedAt: new Date(),
      errors: [],
    };

    res.json({
      success: true,
      data: importResult,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ success: false, error: 'Failed to import data' });
  }
});

// Aggregated Data Endpoint

// POST /api/wearable/health-data/aggregated - Get aggregated health data
router.post('/health-data/aggregated', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = req.body;

    // Simulate aggregated data
    const aggregatedData = [
      {
        period: '2024-01-01',
        metric: 'steps',
        value: 8432,
        aggregate: 'avg',
      },
      {
        period: '2024-01-02',
        metric: 'steps',
        value: 9123,
        aggregate: 'avg',
      },
      {
        period: '2024-01-01',
        metric: 'heart_rate',
        value: 72,
        aggregate: 'avg',
      },
      {
        period: '2024-01-02',
        metric: 'heart_rate',
        value: 75,
        aggregate: 'avg',
      },
    ];

    res.json({
      success: true,
      data: aggregatedData,
    });
  } catch (error) {
    console.error('Error fetching aggregated health data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch aggregated health data' });
  }
});

// Insights Endpoint

// POST /api/wearable/health-insights - Get health insights
router.post('/health-insights', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { dateRange } = req.body;

    // Simulate health insights
    const insights = [
      {
        id: `insight_${Date.now()}_1`,
        type: 'recommendation',
        title: 'Low Step Count',
        message: 'Your average daily steps is 6,234. Try to increase to at least 8,000 steps for better health.',
        priority: 'medium',
        metricType: 'steps',
        value: 6234,
        threshold: 8000,
        recommendation: 'Take short walks throughout the day and consider using stairs instead of elevators.',
        createdAt: new Date(),
        acknowledged: false,
      },
      {
        id: `insight_${Date.now()}_2`,
        type: 'warning',
        title: 'Elevated Heart Rate',
        message: 'Your average heart rate is 95 bpm, which is higher than normal.',
        priority: 'high',
        metricType: 'heart_rate',
        value: 95,
        threshold: 90,
        recommendation: 'Consider consulting a healthcare professional if this persists.',
        createdAt: new Date(),
        acknowledged: false,
      },
    ];

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error fetching health insights:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch health insights' });
  }
});

// Recommendations Endpoint

// GET /api/wearable/recommendations/:userId - Get device recommendations
router.get('/recommendations/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = (req as any).user.id;

    // Only allow users to access their own recommendations
    if (userId !== requestingUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Simulate device recommendations
    const recommendations = [
      {
        id: `rec_${Date.now()}_1`,
        type: 'device',
        title: 'Consider upgrading your fitness tracker',
        description: 'Based on your activity level, a more advanced fitness tracker with heart rate variability monitoring would be beneficial.',
        priority: 'medium',
        deviceType: 'smartwatch',
        estimatedCost: 299,
        benefits: ['Better sleep tracking', 'Heart rate variability monitoring', 'GPS built-in'],
      },
      {
        id: `rec_${Date.now()}_2`,
        type: 'feature',
        title: 'Enable automatic workout detection',
        description: 'Your current device supports automatic workout detection. Enable this feature to better track your exercise sessions.',
        priority: 'low',
        deviceType: 'current_device',
        estimatedCost: 0,
        benefits: ['Better workout tracking', 'Automatic exercise detection'],
      },
    ];

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error fetching device recommendations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch device recommendations' });
  }
});

// Legacy endpoint for backward compatibility
router.post('/wearables', authenticate, async (req: Request, res: Response) => {
  try {
    const data = req.body;

    console.log('Received wearable data:', data);

    const [result] = await db.execute(
      `INSERT INTO wearable_data 
      (user_id, device_type, steps, heart_rate, calories_burned, sleep_hours, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.deviceType || 'Unknown',
        data.steps,
        data.heartRate,
        data.caloriesBurned,
        data.sleepHours,
        data.timestamp ? data.timestamp.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      ]
    );

    res.json({ success: true, message: 'Wearable data received and processed successfully', data });
  } catch (error) {
    console.error('Error processing wearable data:', error);
    res.status(500).json({ success: false, error: 'Failed to process wearable data' });
  }
});

export default router;