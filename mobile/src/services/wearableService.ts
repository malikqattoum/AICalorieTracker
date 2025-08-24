import { 
  WearableDevice, 
  HealthMetric, 
  SyncResult, 
  DeviceInfo, 
  HealthDataQuery, 
  CorrelationQuery,
  CorrelationAnalysis,
  DeviceSettings,
  WearableApiResponse,
  SyncType,
  DeviceStatus,
  WearableError,
  WearableErrorCode
} from '../types/wearable';
import api from './api';

export class WearableService {
  private static instance: WearableService;
  private devices: Map<string, WearableDevice> = new Map();
  private syncStatus: Map<string, DeviceStatus> = new Map();

  private constructor() {}

  static getInstance(): WearableService {
    if (!WearableService.instance) {
      WearableService.instance = new WearableService();
    }
    return WearableService.instance;
  }

  // Device Management
  async getDevices(): Promise<WearableDevice[]> {
    try {
      const response = await api.wearable.getDevices();
      if (response.success && response.data) {
        response.data.forEach((device: WearableDevice) => {
          this.devices.set(device.id, device);
        });
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch devices');
    } catch (error) {
      this.handleError(error, 'Failed to fetch devices');
      throw error;
    }
  }

  async connectDevice(device: Partial<WearableDevice>): Promise<WearableDevice> {
    try {
      const response = await api.wearable.connectDevice(device);
      
      if (response.success && response.data) {
        this.devices.set(response.data.id, response.data);
        this.syncStatus.set(response.data.id, 'connected');
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to connect device');
    } catch (error) {
      this.handleError(error, 'Failed to connect device');
      throw error;
    }
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      const response = await api.wearable.disconnectDevice(deviceId);
      
      if (response.success) {
        this.devices.delete(deviceId);
        this.syncStatus.delete(deviceId);
        return true;
      }
      
      throw new Error(response.error || 'Failed to disconnect device');
    } catch (error) {
      this.handleError(error, 'Failed to disconnect device');
      throw error;
    }
  }

  async getDeviceStatus(deviceId: string): Promise<DeviceInfo> {
    try {
      const response = await api.wearable.getDeviceStatus(deviceId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get device status');
    } catch (error) {
      this.handleError(error, 'Failed to get device status');
      throw error;
    }
  }

  // Data Sync
  async syncDevice(deviceId: string, syncType: SyncType = 'both'): Promise<SyncResult> {
    try {
      this.syncStatus.set(deviceId, 'syncing');
      
      const response = await api.wearable.syncDevice(deviceId, syncType);
      
      if (response.success && response.data) {
        this.syncStatus.set(deviceId, 'connected');
        return response.data;
      }
      
      this.syncStatus.set(deviceId, 'error');
      throw new Error(response.error || 'Sync failed');
    } catch (error) {
      this.syncStatus.set(deviceId, 'error');
      this.handleError(error, 'Sync failed');
      throw error;
    }
  }

  async getSyncLogs(deviceId: string): Promise<any[]> {
    try {
      const response = await api.wearable.getSyncLogs(deviceId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch sync logs');
    } catch (error) {
      this.handleError(error, 'Failed to fetch sync logs');
      throw error;
    }
  }

  // Health Data
  async getHealthData(query: HealthDataQuery): Promise<HealthMetric[]> {
    try {
      const response = await api.wearable.getHealthData(query);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch health data');
    } catch (error) {
      this.handleError(error, 'Failed to fetch health data');
      throw error;
    }
  }

  async saveHealthData(metrics: HealthMetric[]): Promise<HealthMetric[]> {
    try {
      const response = await api.wearable.saveHealthData(metrics);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to save health data');
    } catch (error) {
      this.handleError(error, 'Failed to save health data');
      throw error;
    }
  }

  // Analytics
  async getCorrelationAnalysis(query: CorrelationQuery): Promise<CorrelationAnalysis[]> {
    try {
      const response = await api.wearable.getCorrelationAnalysis(query);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch correlation analysis');
    } catch (error) {
      this.handleError(error, 'Failed to fetch correlation analysis');
      throw error;
    }
  }

  // Settings
  async getDeviceSettings(deviceId: string): Promise<DeviceSettings> {
    try {
      const response = await api.wearable.getDeviceSettings(deviceId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch device settings');
    } catch (error) {
      this.handleError(error, 'Failed to fetch device settings');
      throw error;
    }
  }

  async updateDeviceSettings(deviceId: string, settings: DeviceSettings): Promise<boolean> {
    try {
      const response = await api.wearable.updateDeviceSettings(deviceId, settings);
      
      if (response.success) {
        return true;
      }
      
      throw new Error(response.error || 'Failed to update device settings');
    } catch (error) {
      this.handleError(error, 'Failed to update device settings');
      throw error;
    }
  }

  // User Settings
  async getWearableUserSettings(userId: string): Promise<any> {
    try {
      const response = await api.wearable.getWearableUserSettings(userId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch user settings');
    } catch (error) {
      this.handleError(error, 'Failed to fetch user settings');
      throw error;
    }
  }

  async updateWearableUserSettings(settings: any): Promise<boolean> {
    try {
      const response = await api.wearable.updateWearableUserSettings(settings);
      
      if (response.success) {
        return true;
      }
      
      throw new Error(response.error || 'Failed to update user settings');
    } catch (error) {
      this.handleError(error, 'Failed to update user settings');
      throw error;
    }
  }

  // Utility Methods
  getConnectedDevices(): WearableDevice[] {
    return Array.from(this.devices.values()).filter(device => device.isConnected);
  }

  getDeviceSyncStatus(deviceId: string): DeviceStatus {
    return this.syncStatus.get(deviceId) || 'disconnected';
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.devices.has(deviceId) && this.syncStatus.get(deviceId) === 'connected';
  }

  private handleError(error: any, defaultMessage: string): void {
    const wearableError: WearableError = {
      code: WearableErrorCode.UNKNOWN_ERROR,
      name: 'WearableError',
      message: defaultMessage,
      details: error,
      timestamp: new Date()
    };

    if (error.response?.data?.error) {
      wearableError.message = error.response.data.error;
    } else if (error.message) {
      wearableError.message = error.message;
    }

    // Log error for debugging
    console.error('Wearable Service Error:', wearableError);

    // You could also send this to an error tracking service
    // trackError(wearableError);
  }

  // Event Handlers (for real-time updates)
  onDeviceConnected(callback: (device: WearableDevice) => void): () => void {
    // Enhanced mock implementation - simulate device connection events
    const interval = setInterval(() => {
      // Simulate random device connections for demo purposes
      if (Math.random() > 0.8) {
        const mockDevice: WearableDevice = {
          id: `device_${Date.now()}`,
          userId: 'user_1',
          deviceId: `device_${Date.now()}`,
          deviceType: 'apple_watch',
          deviceName: 'Mock Device',
          isConnected: true,
          lastSyncAt: new Date(),
          batteryLevel: Math.floor(Math.random() * 100),
          firmwareVersion: '1.0.0',
          capabilities: ['heart_rate', 'steps', 'distance', 'calories', 'sleep'],
          settings: {},
          isActive: true,
          createdAt: new Date(),
        };
        callback(mockDevice);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }

  onDeviceDisconnected(callback: (deviceId: string) => void): () => void {
    // Enhanced mock implementation - simulate device disconnection events
    const interval = setInterval(() => {
      // Simulate random device disconnections for demo purposes
      if (Math.random() > 0.9) {
        const deviceId = `device_${Date.now()}`;
        callback(deviceId);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }

  onSyncProgress(callback: (deviceId: string, progress: number) => void): () => void {
    // Enhanced mock implementation - simulate sync progress updates
    const interval = setInterval(() => {
      // Simulate sync progress for connected devices
      const connectedDevices = this.getConnectedDevices();
      if (connectedDevices.length > 0) {
        const device = connectedDevices[Math.floor(Math.random() * connectedDevices.length)];
        const progress = Math.floor(Math.random() * 100);
        callback(device.id, progress);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }

  onSyncComplete(callback: (deviceId: string, result: SyncResult) => void): () => void {
    // Enhanced mock implementation - simulate sync completion events
    const interval = setInterval(() => {
      // Simulate sync completion for connected devices
      const connectedDevices = this.getConnectedDevices();
      if (connectedDevices.length > 0 && Math.random() > 0.7) {
        const device = connectedDevices[Math.floor(Math.random() * connectedDevices.length)];
        const mockResult: SyncResult = {
          success: true,
          recordsProcessed: Math.floor(Math.random() * 1000) + 100,
          recordsAdded: Math.floor(Math.random() * 500) + 50,
          recordsUpdated: Math.floor(Math.random() * 300) + 25,
          recordsFailed: 0,
          duration: Math.floor(Math.random() * 30) + 10,
        };
        callback(device.id, mockResult);
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }

  onSyncError(callback: (deviceId: string, error: string) => void): () => void {
    // Enhanced mock implementation - simulate sync error events
    const interval = setInterval(() => {
      // Simulate sync errors occasionally
      if (Math.random() > 0.95) {
        const mockDeviceIds = ['device_1', 'device_2', 'device_3'];
        const deviceId = mockDeviceIds[Math.floor(Math.random() * mockDeviceIds.length)];
        const errors = ['Network timeout', 'Authentication failed', 'Device not responding'];
        const error = errors[Math.floor(Math.random() * errors.length)];
        callback(deviceId, error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }

  // Background Sync
  async startBackgroundSync(): Promise<void> {
    // Enhanced implementation for background data synchronization
    try {
      // Check if background sync is already running
      if (this.backgroundSyncInterval) {
        console.log('Background sync is already running');
        return;
      }

      // Start background sync interval
      this.backgroundSyncInterval = setInterval(async () => {
        try {
          const connectedDevices = this.getConnectedDevices();
          for (const device of connectedDevices) {
            if (device.isConnected) {
              // Perform lightweight sync
              await this.syncDevice(device.id, 'both');
              console.log(`Background sync completed for device: ${device.deviceName}`);
            }
          }
        } catch (error) {
          console.error('Background sync error:', error);
        }
      }, 300000); // Run every 5 minutes

      console.log('Background sync started successfully');
    } catch (error) {
      console.error('Failed to start background sync:', error);
      throw error;
    }
  }

  async stopBackgroundSync(): Promise<void> {
    // Enhanced implementation to stop background sync
    try {
      if (this.backgroundSyncInterval) {
        clearInterval(this.backgroundSyncInterval);
        this.backgroundSyncInterval = null;
        console.log('Background sync stopped successfully');
      } else {
        console.log('No background sync is currently running');
      }
    } catch (error) {
      console.error('Failed to stop background sync:', error);
      throw error;
    }
  }

  private backgroundSyncInterval: NodeJS.Timeout | null = null;

  // Data Export/Import
  async exportData(deviceId: string, startDate: Date, endDate: Date): Promise<Blob> {
    try {
      const response = await api.wearable.exportData({
        deviceId,
        startDate,
        endDate,
        format: 'json'
      });

      return response;
    } catch (error) {
      this.handleError(error, 'Failed to export data');
      throw error;
    }
  }

  async importData(deviceId: string, file: File): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('deviceId', deviceId);

      const response = await api.wearable.importData(formData);

      if (response.success) {
        return true;
      }

      throw new Error(response.error || 'Failed to import data');
    } catch (error) {
      this.handleError(error, 'Failed to import data');
      throw error;
    }
  }

  // Health Data Aggregation
  async getAggregatedHealthData(
    query: HealthDataQuery &
    {
      aggregation: 'hourly' | 'daily' | 'weekly' | 'monthly';
      aggregateFunction: 'avg' | 'sum' | 'min' | 'max' | 'count';
    }
  ): Promise<any[]> {
    try {
      const response = await api.wearable.getAggregatedHealthData(query);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch aggregated health data');
    } catch (error) {
      this.handleError(error, 'Failed to fetch aggregated health data');
      throw error;
    }
  }

  // Health Insights
  async getHealthInsights(userId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const response = await api.wearable.getHealthInsights({ userId, dateRange });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch health insights');
    } catch (error) {
      this.handleError(error, 'Failed to fetch health insights');
      throw error;
    }
  }

  // Device Recommendations
  async getDeviceRecommendations(userId: string): Promise<any[]> {
    try {
      const response = await api.wearable.getDeviceRecommendations(userId);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch device recommendations');
    } catch (error) {
      this.handleError(error, 'Failed to fetch device recommendations');
      throw error;
    }
  }
}

// Export singleton instance
export const wearableService = WearableService.getInstance();
export default wearableService;