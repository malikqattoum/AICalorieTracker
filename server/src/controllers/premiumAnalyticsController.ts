import { Request, Response } from 'express';
import { PremiumAnalyticsService } from '../services/premiumAnalyticsService';

// Simple logger implementation
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error || '')
};

// Simple API response implementation
const ApiResponse = {
  success: (res: Response, data: any, message: string) => {
    res.status(200).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  },
  error: (res: Response, message: string, statusCode: number = 500) => {
    res.status(statusCode).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
};

const premiumAnalyticsService = new PremiumAnalyticsService();

export const premiumAnalyticsController = {
  /**
   * Get health scores for a user
   */
  getHealthScores: async (req: Request, res: Response) => {
    try {
      const { userId, scoreTypes, startDate, endDate, limit = 50 } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        scoreTypes: scoreTypes ? (Array.isArray(scoreTypes) ? scoreTypes : [scoreTypes].filter(Boolean)) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const scores = await premiumAnalyticsService.getHealthScores(filters, parseInt(limit as string));
      
      logger.info(`Retrieved ${scores.length} health scores for user ${userIdValue}`);
      ApiResponse.success(res, scores, 'Health scores retrieved successfully');
    } catch (error) {
      logger.error('Error getting health scores:', error);
      ApiResponse.error(res, 'Failed to retrieve health scores', 500);
    }
  },

  /**
   * Calculate health scores for a user
   */
  calculateHealthScores: async (req: Request, res: Response) => {
    try {
      const { userId, calculationDate, includeNutrition, includeFitness, includeRecovery, includeConsistency } = req.body;
      
      const input = {
        userId: parseInt(userId),
        calculationDate: calculationDate ? new Date(calculationDate) : new Date(),
        includeNutrition: includeNutrition !== undefined ? includeNutrition : true,
        includeFitness: includeFitness !== undefined ? includeFitness : true,
        includeRecovery: includeRecovery !== undefined ? includeRecovery : true,
        includeConsistency: includeConsistency !== undefined ? includeConsistency : true
      };

      const scores = await premiumAnalyticsService.calculateHealthScores(input);
      
      logger.info(`Calculated health scores for user ${input.userId}`);
      ApiResponse.success(res, scores, 'Health scores calculated successfully');
    } catch (error) {
      logger.error('Error calculating health scores:', error);
      ApiResponse.error(res, 'Failed to calculate health scores', 500);
    }
  },

  /**
   * Get predictions for a user
   */
  getPredictions: async (req: Request, res: Response) => {
    try {
      const { userId, predictionTypes, isActive, limit = 20 } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        predictionTypes: predictionTypes ? (Array.isArray(predictionTypes) ? predictionTypes : [predictionTypes].filter(Boolean)) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };

      const predictions = await premiumAnalyticsService.getPredictions(filters, parseInt(limit as string));
      
      logger.info(`Retrieved ${predictions.length} predictions for user ${userIdValue}`);
      ApiResponse.success(res, predictions, 'Predictions retrieved successfully');
    } catch (error) {
      logger.error('Error getting predictions:', error);
      ApiResponse.error(res, 'Failed to retrieve predictions', 500);
    }
  },

  /**
   * Generate health prediction for a user
   */
  generateHealthPrediction: async (req: Request, res: Response) => {
    try {
      const { userId, predictionType, targetDate, modelVersion } = req.body;
      
      const input = {
        userId: parseInt(userId),
        predictionType,
        targetDate: new Date(targetDate),
        modelVersion: modelVersion || '1.0.0'
      };

      const prediction = await premiumAnalyticsService.generateHealthPrediction(input);
      
      logger.info(`Generated ${predictionType} prediction for user ${input.userId}`);
      ApiResponse.success(res, prediction, 'Health prediction generated successfully');
    } catch (error) {
      logger.error('Error generating health prediction:', error);
      ApiResponse.error(res, 'Failed to generate health prediction', 500);
    }
  },

  /**
   * Get pattern analysis for a user
   */
  getPatternAnalysis: async (req: Request, res: Response) => {
    try {
      const { userId, patternTypes, analysisPeriod, startDate, endDate } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        patternTypes: patternTypes ? (Array.isArray(patternTypes) ? patternTypes : [patternTypes].filter(Boolean)) : undefined,
        analysisPeriod: analysisPeriod as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const analysis = await premiumAnalyticsService.getPatternAnalysis(filters);
      
      logger.info(`Retrieved pattern analysis for user ${userIdValue}`);
      ApiResponse.success(res, analysis, 'Pattern analysis retrieved successfully');
    } catch (error) {
      logger.error('Error getting pattern analysis:', error);
      ApiResponse.error(res, 'Failed to retrieve pattern analysis', 500);
    }
  },

  /**
   * Analyze patterns for a user
   */
  analyzePatterns: async (req: Request, res: Response) => {
    try {
      const { userId, patternType, analysisPeriod, startDate, endDate } = req.body;
      
      const input = {
        userId: parseInt(userId),
        patternType,
        analysisPeriod,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      };

      const analysis = await premiumAnalyticsService.analyzePatterns(input);
      
      logger.info(`Analyzed ${patternType} patterns for user ${input.userId}`);
      ApiResponse.success(res, analysis, 'Pattern analysis completed successfully');
    } catch (error) {
      logger.error('Error analyzing patterns:', error);
      ApiResponse.error(res, 'Failed to analyze patterns', 500);
    }
  },

  /**
   * Get health reports for a user
   */
  getHealthReports: async (req: Request, res: Response) => {
    try {
      const { userId, reportTypes, startDate, endDate, accessLevel } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        reportTypes: reportTypes ? (Array.isArray(reportTypes) ? reportTypes : [reportTypes].filter(Boolean)) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        accessLevel: accessLevel as string
      };

      const reports = await premiumAnalyticsService.getHealthReports(filters);
      
      logger.info(`Retrieved ${reports.length} health reports for user ${userIdValue}`);
      ApiResponse.success(res, reports, 'Health reports retrieved successfully');
    } catch (error) {
      logger.error('Error getting health reports:', error);
      ApiResponse.error(res, 'Failed to retrieve health reports', 500);
    }
  },

  /**
   * Generate health report for a user
   */
  generateHealthReport: async (req: Request, res: Response) => {
    try {
      const { userId, reportType, reportPeriodStart, reportPeriodEnd, generatedBy } = req.body;
      
      const input = {
        userId: parseInt(userId),
        reportType,
        reportPeriodStart: new Date(reportPeriodStart),
        reportPeriodEnd: new Date(reportPeriodEnd),
        generatedBy: generatedBy || 'user'
      };

      const report = await premiumAnalyticsService.generateHealthReport(input);
      
      logger.info(`Generated ${reportType} report for user ${input.userId}`);
      ApiResponse.success(res, report, 'Health report generated successfully');
    } catch (error) {
      logger.error('Error generating health report:', error);
      ApiResponse.error(res, 'Failed to generate health report', 500);
    }
  },

  /**
   * Get health report by ID
   */
  getHealthReportById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const report = await premiumAnalyticsService.getHealthReportById(
        parseInt(id),
        userIdValue
      );
      
      if (!report.length) {
        return ApiResponse.error(res, 'Health report not found', 404);
      }
      
      logger.info(`Retrieved health report ${id} for user ${userIdValue}`);
      ApiResponse.success(res, report[0], 'Health report retrieved successfully');
    } catch (error) {
      logger.error('Error getting health report:', error);
      ApiResponse.error(res, 'Failed to retrieve health report', 500);
    }
  },

  /**
   * Get live monitoring data for a user
   */
  getLiveMonitoringData: async (req: Request, res: Response) => {
    try {
      const { userId, metricTypes, limit = 100 } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        metricTypes: metricTypes ? (Array.isArray(metricTypes) ? metricTypes : [metricTypes].filter(Boolean)) : undefined
      };

      const monitoringData = await premiumAnalyticsService.getLiveMonitoringData(filters, parseInt(limit as string));
      
      logger.info(`Retrieved ${monitoringData.length} monitoring records for user ${userIdValue}`);
      ApiResponse.success(res, monitoringData, 'Monitoring data retrieved successfully');
    } catch (error) {
      logger.error('Error getting monitoring data:', error);
      ApiResponse.error(res, 'Failed to retrieve monitoring data', 500);
    }
  },

  /**
   * Record monitoring data for a user
   */
  recordMonitoringData: async (req: Request, res: Response) => {
    try {
      const { userId, metricType, metricValue, unit, timestamp, metadata } = req.body;
      
      const input = {
        userId: parseInt(userId),
        metricType,
        metricValue: parseFloat(metricValue),
        unit,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        metadata
      };

      const monitoringRecord = await premiumAnalyticsService.recordMonitoringData(input);
      
      logger.info(`Recorded ${metricType} monitoring data for user ${input.userId}`);
      ApiResponse.success(res, monitoringRecord, 'Monitoring data recorded successfully');
    } catch (error) {
      logger.error('Error recording monitoring data:', error);
      ApiResponse.error(res, 'Failed to record monitoring data', 500);
    }
  },

  /**
   * Get monitoring alerts for a user
   */
  getMonitoringAlerts: async (req: Request, res: Response) => {
    try {
      const { userId, isActive, limit = 50 } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };

      const alerts = await premiumAnalyticsService.getMonitoringAlerts(filters, parseInt(limit as string));
      
      logger.info(`Retrieved ${alerts.length} monitoring alerts for user ${userIdValue}`);
      ApiResponse.success(res, alerts, 'Monitoring alerts retrieved successfully');
    } catch (error) {
      logger.error('Error getting monitoring alerts:', error);
      ApiResponse.error(res, 'Failed to retrieve monitoring alerts', 500);
    }
  },

  /**
   * Get healthcare professionals for a user
   */
  getHealthcareProfessionals: async (req: Request, res: Response) => {
    try {
      const { userId, professionalTypes, status } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        professionalTypes: professionalTypes ? (Array.isArray(professionalTypes) ? professionalTypes : [professionalTypes].filter(Boolean)) : undefined,
        status: status as string
      };

      const professionals = await premiumAnalyticsService.getHealthcareProfessionals(filters);
      
      logger.info(`Retrieved ${professionals.length} healthcare professionals for user ${userIdValue}`);
      ApiResponse.success(res, professionals, 'Healthcare professionals retrieved successfully');
    } catch (error) {
      logger.error('Error getting healthcare professionals:', error);
      ApiResponse.error(res, 'Failed to retrieve healthcare professionals', 500);
    }
  },

  /**
   * Add healthcare professional for a user
   */
  addHealthcareProfessional: async (req: Request, res: Response) => {
    try {
      const { userId, professionalId, professionalType, professionalName, practiceName, accessLevel, dataSharingConsent, dataExpirationDate, sharedData, notes } = req.body;
      
      const input = {
        userId: parseInt(userId),
        professionalId,
        professionalType,
        professionalName,
        practiceName,
        accessLevel,
        dataSharingConsent,
        dataExpirationDate: dataExpirationDate ? new Date(dataExpirationDate) : undefined,
        sharedData,
        notes
      };

      const professional = await premiumAnalyticsService.addHealthcareProfessional(input);
      
      logger.info(`Added healthcare professional ${professionalId} for user ${input.userId}`);
      ApiResponse.success(res, professional, 'Healthcare professional added successfully');
    } catch (error) {
      logger.error('Error adding healthcare professional:', error);
      ApiResponse.error(res, 'Failed to add healthcare professional', 500);
    }
  },

  /**
   * Update healthcare professional for a user
   */
  updateHealthcareProfessional: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, accessLevel, dataSharingConsent, dataExpirationDate, sharedData, notes } = req.body;
      
      const input = {
        id: parseInt(id),
        userId: parseInt(userId),
        accessLevel,
        dataSharingConsent,
        dataExpirationDate: dataExpirationDate ? new Date(dataExpirationDate) : undefined,
        sharedData,
        notes
      };

      const professional = await premiumAnalyticsService.updateHealthcareProfessional(input);
      
      if (!professional) {
        return ApiResponse.error(res, 'Healthcare professional not found', 404);
      }
      
      logger.info(`Updated healthcare professional ${id} for user ${input.userId}`);
      ApiResponse.success(res, professional, 'Healthcare professional updated successfully');
    } catch (error) {
      logger.error('Error updating healthcare professional:', error);
      ApiResponse.error(res, 'Failed to update healthcare professional', 500);
    }
  },

  /**
   * Remove healthcare professional for a user
   */
  removeHealthcareProfessional: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const success = await premiumAnalyticsService.removeHealthcareProfessional(
        parseInt(id),
        userIdValue
      );
      
      if (!success) {
        return ApiResponse.error(res, 'Healthcare professional not found', 404);
      }
      
      logger.info(`Removed healthcare professional ${id} for user ${userIdValue}`);
      ApiResponse.success(res, null, 'Healthcare professional removed successfully');
    } catch (error) {
      logger.error('Error removing healthcare professional:', error);
      ApiResponse.error(res, 'Failed to remove healthcare professional', 500);
    }
  },

  /**
   * Get health goals for a user
   */
  getHealthGoals: async (req: Request, res: Response) => {
    try {
      const { userId, goalTypes, status, priority } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        goalTypes: goalTypes ? (Array.isArray(goalTypes) ? goalTypes : [goalTypes].filter(Boolean)) : undefined,
        status: status as string,
        priority: priority as string
      };

      const goals = await premiumAnalyticsService.getHealthGoals(filters);
      
      logger.info(`Retrieved ${goals.length} health goals for user ${userIdValue}`);
      ApiResponse.success(res, goals, 'Health goals retrieved successfully');
    } catch (error) {
      logger.error('Error getting health goals:', error);
      ApiResponse.error(res, 'Failed to retrieve health goals', 500);
    }
  },

  /**
   * Create health goal for a user
   */
  createHealthGoal: async (req: Request, res: Response) => {
    try {
      const { userId, goalType, goalTitle, goalDescription, targetValue, unit, targetDate, deadlineDate, priority, milestones } = req.body;
      
      const input = {
        userId: parseInt(userId),
        goalType,
        goalTitle,
        goalDescription,
        targetValue: parseFloat(targetValue),
        unit,
        targetDate: new Date(targetDate),
        deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined,
        priority,
        milestones
      };

      const goal = await premiumAnalyticsService.createHealthGoal(input);
      
      logger.info(`Created health goal ${goalTitle} for user ${input.userId}`);
      ApiResponse.success(res, goal, 'Health goal created successfully');
    } catch (error) {
      logger.error('Error creating health goal:', error);
      ApiResponse.error(res, 'Failed to create health goal', 500);
    }
  },

  /**
   * Update health goal for a user
   */
  updateHealthGoal: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, currentValue, progressPercentage, achievementProbability, status, milestones } = req.body;
      
      const input = {
        id: parseInt(id),
        userId: parseInt(userId),
        currentValue: parseFloat(currentValue),
        progressPercentage: parseFloat(progressPercentage),
        achievementProbability: parseFloat(achievementProbability),
        status,
        milestones
      };

      const goal = await premiumAnalyticsService.updateHealthGoal(input);
      
      if (!goal) {
        return ApiResponse.error(res, 'Health goal not found', 404);
      }
      
      logger.info(`Updated health goal ${id} for user ${input.userId}`);
      ApiResponse.success(res, goal, 'Health goal updated successfully');
    } catch (error) {
      logger.error('Error updating health goal:', error);
      ApiResponse.error(res, 'Failed to update health goal', 500);
    }
  },

  /**
   * Delete health goal for a user
   */
  deleteHealthGoal: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const success = await premiumAnalyticsService.deleteHealthGoal(
        parseInt(id),
        userIdValue
      );
      
      if (!success) {
        return ApiResponse.error(res, 'Health goal not found', 404);
      }
      
      logger.info(`Deleted health goal ${id} for user ${userIdValue}`);
      ApiResponse.success(res, null, 'Health goal deleted successfully');
    } catch (error) {
      logger.error('Error deleting health goal:', error);
      ApiResponse.error(res, 'Failed to delete health goal', 500);
    }
  },

  /**
   * Get health insights for a user
   */
  getHealthInsights: async (req: Request, res: Response) => {
    try {
      const { userId, insightTypes, categories, priorities, isRead, isBookmarked, limit = 50 } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const filters: any = {
        userId: userIdValue,
        insightTypes: insightTypes ? (Array.isArray(insightTypes) ? insightTypes : [insightTypes].filter(Boolean)) : undefined,
        categories: categories ? (Array.isArray(categories) ? categories : [categories].filter(Boolean)) : undefined,
        priorities: priorities ? (Array.isArray(priorities) ? priorities : [priorities].filter(Boolean)) : undefined,
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
        isBookmarked: isBookmarked !== undefined ? isBookmarked === 'true' : undefined
      };

      const insights = await premiumAnalyticsService.getHealthInsights(filters, parseInt(limit as string));
      
      logger.info(`Retrieved ${insights.length} health insights for user ${userIdValue}`);
      ApiResponse.success(res, insights, 'Health insights retrieved successfully');
    } catch (error) {
      logger.error('Error getting health insights:', error);
      ApiResponse.error(res, 'Failed to retrieve health insights', 500);
    }
  },

  /**
   * Mark insight as read
   */
  markInsightAsRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const success = await premiumAnalyticsService.markInsightAsRead(
        parseInt(id),
        userIdValue
      );
      
      if (!success) {
        return ApiResponse.error(res, 'Insight not found', 404);
      }
      
      logger.info(`Marked insight ${id} as read for user ${userIdValue}`);
      ApiResponse.success(res, null, 'Insight marked as read successfully');
    } catch (error) {
      logger.error('Error marking insight as read:', error);
      ApiResponse.error(res, 'Failed to mark insight as read', 500);
    }
  },

  /**
   * Toggle insight bookmark
   */
  toggleInsightBookmark: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const success = await premiumAnalyticsService.toggleInsightBookmark(
        parseInt(id),
        userIdValue
      );
      
      if (!success) {
        return ApiResponse.error(res, 'Insight not found', 404);
      }
      
      logger.info(`Toggled bookmark for insight ${id} for user ${userIdValue}`);
      ApiResponse.success(res, null, 'Insight bookmark toggled successfully');
    } catch (error) {
      logger.error('Error toggling insight bookmark:', error);
      ApiResponse.error(res, 'Failed to toggle insight bookmark', 500);
    }
  },

  /**
   * Get dashboard overview for a user
   */
  getDashboardOverview: async (req: Request, res: Response) => {
    try {
      const { userId, dateRange = '30d' } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const overview = await premiumAnalyticsService.getDashboardOverview(
        userIdValue,
        dateRange as string
      );
      
      logger.info(`Retrieved dashboard overview for user ${userIdValue}`);
      ApiResponse.success(res, overview, 'Dashboard overview retrieved successfully');
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      ApiResponse.error(res, 'Failed to retrieve dashboard overview', 500);
    }
  },

  /**
   * Get trend analysis for a user
   */
  getTrendAnalysis: async (req: Request, res: Response) => {
    try {
      const { userId, metrics, dateRange = '30d', aggregation = 'daily' } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const options = {
        userId: userIdValue,
        metrics: metrics ? (Array.isArray(metrics) ? metrics : [metrics].filter(Boolean)) : undefined,
        dateRange: dateRange as string,
        aggregation: aggregation as string
      };

      const trends = await premiumAnalyticsService.getTrendAnalysis(options.userId, options);
      
      logger.info(`Retrieved trend analysis for user ${userIdValue}`);
      ApiResponse.success(res, trends, 'Trend analysis retrieved successfully');
    } catch (error) {
      logger.error('Error getting trend analysis:', error);
      ApiResponse.error(res, 'Failed to retrieve trend analysis', 500);
    }
  },

  /**
   * Get correlation analysis for a user
   */
  getCorrelationAnalysis: async (req: Request, res: Response) => {
    try {
      const { userId, metricPairs, dateRange = '30d' } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const options = {
        userId: userIdValue,
        metricPairs: metricPairs ? (Array.isArray(metricPairs) ? metricPairs : [metricPairs].filter(Boolean)) : undefined,
        dateRange: dateRange as string
      };

      const correlations = await premiumAnalyticsService.getCorrelationAnalysis(options.userId, options);
      
      logger.info(`Retrieved correlation analysis for user ${userIdValue}`);
      ApiResponse.success(res, correlations, 'Correlation analysis retrieved successfully');
    } catch (error) {
      logger.error('Error getting correlation analysis:', error);
      ApiResponse.error(res, 'Failed to retrieve correlation analysis', 500);
    }
  },

  /**
   * Export user data
   */
  exportUserData: async (req: Request, res: Response) => {
    try {
      const { userId, exportType = 'all', format = 'json', startDate, endDate } = req.query;
      
      const userIdValue = userId ? parseInt(userId as string) : req.user?.id;
      if (!userIdValue) {
        return ApiResponse.error(res, 'User ID is required', 400);
      }
      
      const options = {
        userId: userIdValue,
        exportType: exportType as string,
        format: format as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const data = await premiumAnalyticsService.exportUserData(options.userId, options);
      
      // Set appropriate headers for file download
      const filename = `health_data_${exportType}_${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'application/pdf');
      
      logger.info(`Exported ${exportType} data for user ${userIdValue} in ${format} format`);
      ApiResponse.success(res, data, 'Data exported successfully');
    } catch (error) {
      logger.error('Error exporting user data:', error);
      ApiResponse.error(res, 'Failed to export user data', 500);
    }
  }
};