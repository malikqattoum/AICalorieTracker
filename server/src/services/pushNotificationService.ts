import { db } from '../db';
import { log, logError } from '../config';

// Push notification configuration
const PUSH_CONFIG = {
  // Firebase Cloud Messaging configuration
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null,
    serverKey: process.env.FIREBASE_SERVER_KEY || '',
    senderId: process.env.FIREBASE_SENDER_ID || '',
  },
  // Apple Push Notification Service configuration
  apns: {
    certPath: process.env.APNS_CERT_PATH || '',
    keyPath: process.env.APNS_KEY_PATH || '',
    keyId: process.env.APNS_KEY_ID || '',
    teamId: process.env.APNS_TEAM_ID || '',
    bundleId: process.env.APNS_BUNDLE_ID || '',
  },
  // Default notification settings
  defaults: {
    badge: 1,
    sound: 'default',
    priority: 'high',
    contentAvailable: true,
    mutableContent: true,
  }
};

export interface PushNotification {
  id: string;
  userId: number;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'meal_reminder' | 'goal_achievement' | 'health_alert' | 'system' | 'marketing';
  priority: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  platform?: 'ios' | 'android' | 'web';
  retryCount: number;
  maxRetries: number;
}

export interface DeviceToken {
  id: string;
  userId: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
}

class PushNotificationService {
  private initialized = false;
  private notificationQueue: PushNotification[] = [];
  private isProcessing = false;

  /**
   * Initialize the push notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify configuration
      if (!PUSH_CONFIG.firebase.serverKey && !PUSH_CONFIG.apns.certPath) {
        throw new Error('No push notification service configured');
      }

      this.initialized = true;
      log('Push notification service initialized successfully');

      // Start processing queue
      this.startQueueProcessor();
    } catch (error) {
      logError('Failed to initialize push notification service:', error);
      throw error;
    }
  }

  /**
   * Register device token
   */
  async registerDeviceToken(userId: number, token: string, platform: 'ios' | 'android' | 'web'): Promise<DeviceToken> {
    try {
      await this.initialize();

      // Check if token already exists
      const [existingTokens] = await db.execute(
        `SELECT * FROM device_tokens WHERE token = '${token}' AND user_id = ${userId}`
      );

      if (existingTokens.length > 0) {
        // Update existing token
        await db.execute(
          `UPDATE device_tokens 
           SET is_active = true, last_used = '${new Date().toISOString()}'
           WHERE token = '${token}' AND user_id = ${userId}`
        );

        return {
          id: existingTokens[0].id,
          userId,
          token,
          platform,
          isActive: true,
          lastUsed: new Date(existingTokens[0].last_used),
          createdAt: new Date(existingTokens[0].created_at),
        };
      }

      // Create new token
      const tokenId = `token_${Date.now()}`;
      await db.execute(
        `INSERT INTO device_tokens 
         (id, user_id, token, platform, is_active, last_used, created_at)
         VALUES ('${tokenId}', ${userId}, '${token}', '${platform}', true, '${new Date().toISOString()}', '${new Date().toISOString()}')`
      );

      return {
        id: tokenId,
        userId,
        token,
        platform,
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date(),
      };
    } catch (error) {
      logError('Failed to register device token:', error);
      throw new Error(`Failed to register device token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(userId: number, token: string): Promise<void> {
    try {
      await db.execute(
        `UPDATE device_tokens SET is_active = false WHERE token = '${token}' AND user_id = ${userId}`
      );
    } catch (error) {
      logError('Failed to unregister device token:', error);
      throw new Error(`Failed to unregister device token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send push notification
   */
  async sendNotification(
    userId: number,
    title: string,
    body: string,
    options: {
      data?: Record<string, any>;
      type?: PushNotification['type'];
      priority?: PushNotification['priority'];
      scheduledFor?: Date;
      platform?: PushNotification['platform'];
      maxRetries?: number;
    } = {}
  ): Promise<PushNotification> {
    try {
      await this.initialize();

      const notification: PushNotification = {
        id: `notif_${Date.now()}`,
        userId,
        title,
        body,
        data: options.data || {},
        type: options.type || 'system',
        priority: options.priority || 'normal',
        scheduledFor: options.scheduledFor,
        status: 'pending',
        platform: options.platform,
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
      };

      // Add to queue
      this.notificationQueue.push(notification);

      // If immediate send is requested and no scheduled time
      if (!options.scheduledFor) {
        await this.processNotification(notification);
      }

      return notification;
    } catch (error) {
      logError('Failed to send push notification:', error);
      throw new Error(`Failed to send push notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(
    userIds: number[],
    title: string,
    body: string,
    options: {
      data?: Record<string, any>;
      type?: PushNotification['type'];
      priority?: PushNotification['priority'];
      platform?: PushNotification['platform'];
      maxRetries?: number;
    } = {}
  ): Promise<PushNotification[]> {
    try {
      await this.initialize();

      const notifications: PushNotification[] = [];

      for (const userId of userIds) {
        const notification = await this.sendNotification(userId, title, body, options);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      logError('Failed to send bulk push notification:', error);
      throw new Error(`Failed to send bulk push notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a single notification
   */
  private async processNotification(notification: PushNotification): Promise<void> {
    try {
      // Get user's device tokens
      const [deviceTokens] = await db.execute(
        `SELECT * FROM device_tokens WHERE user_id = ${notification.userId} AND is_active = true`
      );

      if (deviceTokens.length === 0) {
        await this.updateNotificationStatus(notification.id, 'failed', 'No active device tokens found');
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      // Send to each device token
      for (const deviceToken of deviceTokens) {
        try {
          const result = await this.sendToDeviceToken(deviceToken, notification);
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
            // Mark token as inactive if it failed
            if (result.shouldDeactivate) {
              await db.execute(
                `UPDATE device_tokens SET is_active = false WHERE id = '${deviceToken.id}'`
              );
            }
          }
        } catch (error) {
          failureCount++;
          logError(`Failed to send notification to device ${deviceToken.id}:`, error);
        }
      }

      // Update notification status
      if (successCount > 0) {
        await this.updateNotificationStatus(notification.id, 'sent', `Sent to ${successCount} devices`);
      } else if (failureCount > 0) {
        await this.updateNotificationStatus(notification.id, 'failed', `Failed to send to all ${failureCount} devices`);
      }

      log(`Notification ${notification.id} processed: ${successCount} success, ${failureCount} failures`);
    } catch (error) {
      logError(`Failed to process notification ${notification.id}:`, error);
      await this.updateNotificationStatus(notification.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Send notification to a specific device token
   */
  private async sendToDeviceToken(deviceToken: DeviceToken, notification: PushNotification): Promise<{ success: boolean; shouldDeactivate: boolean }> {
    try {
      if (deviceToken.platform === 'ios') {
        return await this.sendToIOS(deviceToken.token, notification);
      } else if (deviceToken.platform === 'android') {
        return await this.sendToAndroid(deviceToken.token, notification);
      } else {
        return { success: false, shouldDeactivate: false };
      }
    } catch (error) {
      logError(`Failed to send to ${deviceToken.platform} device:`, error);
      return { success: false, shouldDeactivate: true };
    }
  }

  /**
   * Send notification to iOS device
   */
  private async sendToIOS(deviceToken: string, notification: PushNotification): Promise<{ success: boolean; shouldDeactivate: boolean }> {
    try {
      if (!PUSH_CONFIG.apns.certPath) {
        throw new Error('APNS configuration not available');
      }

      const apns = require('apn');
      const apnsProvider = new apns.Provider({
        cert: PUSH_CONFIG.apns.certPath,
        key: PUSH_CONFIG.apns.keyPath,
        production: process.env.NODE_ENV === 'production',
      });

      const note = new apns.Notification({
        alert: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        sound: 'default',
        badge: PUSH_CONFIG.defaults.badge,
        priority: PUSH_CONFIG.defaults.priority,
        contentAvailable: PUSH_CONFIG.defaults.contentAvailable,
        mutableContent: PUSH_CONFIG.defaults.mutableContent,
        topic: PUSH_CONFIG.apns.bundleId,
        expiration: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      });

      const response = await apnsProvider.send(note, deviceToken);
      await apnsProvider.shutdown();

      if (response.failed.length > 0) {
        const failed = response.failed[0];
        if (failed.status === 410 || failed.status === 404) {
          // Token is invalid, should deactivate
          return { success: false, shouldDeactivate: true };
        }
        return { success: false, shouldDeactivate: false };
      }

      return { success: true, shouldDeactivate: false };
    } catch (error) {
      logError('Failed to send iOS notification:', error);
      return { success: false, shouldDeactivate: true };
    }
  }

  /**
   * Send notification to Android device
   */
  private async sendToAndroid(deviceToken: string, notification: PushNotification): Promise<{ success: boolean; shouldDeactivate: boolean }> {
    try {
      if (!PUSH_CONFIG.firebase.serverKey) {
        throw new Error('Firebase configuration not available');
      }

      const fcm = require('fcm-node');
      const serverKey = PUSH_CONFIG.firebase.serverKey;
      const fcmServer = new fcm(serverKey);

      const message = {
        to: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
          badge: PUSH_CONFIG.defaults.badge,
        },
        data: notification.data,
        android: {
          priority: notification.priority === 'high' ? 'high' : 'normal',
          ttl: 3600 * 1000, // 1 hour
          notification: {
            sound: 'default',
            priority: notification.priority === 'high' ? 'high' : 'PRIORITY_HIGH',
            default_vibrate_timings: true,
            default_light_settings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: PUSH_CONFIG.defaults.contentAvailable,
              mutableContent: PUSH_CONFIG.defaults.mutableContent,
            },
          },
        },
      };

      return new Promise((resolve) => {
        fcmServer.send(message, (err, response) => {
          if (err) {
            logError('Failed to send Android notification:', err);
            // Check if it's an invalid token error
            if (err.code === 'invalid_registration' || err.code === 'not_registered') {
              resolve({ success: false, shouldDeactivate: true });
            } else {
              resolve({ success: false, shouldDeactivate: false });
            }
          } else {
            resolve({ success: true, shouldDeactivate: false });
          }
        });
      });
    } catch (error) {
      logError('Failed to send Android notification:', error);
      return { success: false, shouldDeactivate: true };
    }
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(notificationId: string, status: PushNotification['status'], message?: string): Promise<void> {
    try {
      const updateFields = ['status', 'updated_at'];
      const updateValues = [`'${status}'`, `'${new Date().toISOString()}'`];

      if (status === 'sent') {
        updateFields.push('sent_at');
        updateValues.push(`'${new Date().toISOString()}'`);
      }

      await db.execute(
        `UPDATE push_notifications 
         SET ${updateFields.join(' = ')} 
         WHERE id = '${notificationId}'`
      );
    } catch (error) {
      logError(`Failed to update notification status for ${notificationId}:`, error);
    }
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;

    const processQueue = async () => {
      try {
        // Process scheduled notifications
        const now = new Date();
        const [scheduledNotifications] = await db.execute(
          `SELECT * FROM push_notifications 
           WHERE status = 'pending' AND (scheduled_for IS NULL OR scheduled_for <= '${now.toISOString()}')
           ORDER BY created_at ASC
           LIMIT 10`
        );

        for (const notification of scheduledNotifications) {
          const notif: PushNotification = {
            id: notification.id,
            userId: notification.user_id,
            title: notification.title,
            body: notification.body,
            data: notification.data ? JSON.parse(notification.data) : {},
            type: notification.type,
            priority: notification.priority,
            scheduledFor: notification.scheduled_for ? new Date(notification.scheduled_for) : undefined,
            sentAt: notification.sent_at ? new Date(notification.sent_at) : undefined,
            status: notification.status,
            platform: notification.platform,
            retryCount: notification.retry_count,
            maxRetries: notification.max_retries,
          };

          await this.processNotification(notif);
        }

        // Process queue items
        while (this.notificationQueue.length > 0) {
          const notification = this.notificationQueue.shift();
          if (notification) {
            await this.processNotification(notification);
          }
        }
      } catch (error) {
        logError('Error in queue processor:', error);
      } finally {
        // Schedule next run
        setTimeout(processQueue, 5000); // Run every 5 seconds
      }
    };

    processQueue();
  }

  /**
   * Get user's notification history
   */
  async getUserNotificationHistory(userId: number, limit: number = 50): Promise<PushNotification[]> {
    try {
      const [notifications] = await db.execute(
        `SELECT * FROM push_notifications 
         WHERE user_id = ${userId} 
         ORDER BY created_at DESC 
         LIMIT ${limit}`
      );

      return notifications.map((notif: any) => ({
        id: notif.id,
        userId: notif.user_id,
        title: notif.title,
        body: notif.body,
        data: notif.data ? JSON.parse(notif.data) : {},
        type: notif.type,
        priority: notif.priority,
        scheduledFor: notif.scheduled_for ? new Date(notif.scheduled_for) : undefined,
        sentAt: notif.sent_at ? new Date(notif.sent_at) : undefined,
        status: notif.status,
        platform: notif.platform,
        retryCount: notif.retry_count,
        maxRetries: notif.max_retries,
      }));
    } catch (error) {
      logError('Failed to get user notification history:', error);
      throw new Error(`Failed to get user notification history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalSent: number;
    totalPending: number;
    totalFailed: number;
    successRate: number;
  }> {
    try {
      const [stats] = await db.execute(
        `SELECT 
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as totalSent,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as totalPending,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as totalFailed,
          COUNT(*) as total
         FROM push_notifications`
      );

      const totalSent = Number(stats[0]?.totalSent || 0);
      const totalPending = Number(stats[0]?.totalPending || 0);
      const totalFailed = Number(stats[0]?.totalFailed || 0);
      const total = Number(stats[0]?.total || 1);

      return {
        totalSent,
        totalPending,
        totalFailed,
        successRate: total > 0 ? ((totalSent / total) * 100).toFixed(2) : '0',
      };
    } catch (error) {
      logError('Failed to get notification stats:', error);
      throw new Error(`Failed to get notification stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;