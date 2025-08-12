import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { log, logError, CACHE_KEYS } from '../config';
import { apiService } from '../services/apiService';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingActions: number;
  failedActions: number;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private pendingActions: OfflineAction[] = [];

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load pending actions from storage
      await this.loadPendingActions();

      // Set up network monitoring
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;

        if (!wasOnline && this.isOnline) {
          log('Network restored, starting sync...');
          this.syncPendingActions();
        }

        this.notifyListeners();
      });

      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;

      // Sync if online and has pending actions
      if (this.isOnline && this.pendingActions.length > 0) {
        this.syncPendingActions();
      }

      log('OfflineManager initialized');
    } catch (error) {
      logError('Failed to initialize OfflineManager:', error);
    }
  }

  // Add action to offline queue
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const offlineAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.pendingActions.push(offlineAction);
    await this.savePendingActions();
    
    log('Action queued for offline sync:', offlineAction.id);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingActions();
    }

    this.notifyListeners();
    return offlineAction.id;
  }

  // Sync all pending actions
  async syncPendingActions(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.pendingActions.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    log(`Starting sync of ${this.pendingActions.length} pending actions`);

    const actionsToProcess = [...this.pendingActions];
    const failedActions: OfflineAction[] = [];
    const completedActionIds: string[] = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeAction(action);
        completedActionIds.push(action.id);
        log(`Successfully synced action: ${action.id}`);
      } catch (error) {
        logError(`Failed to sync action ${action.id}:`, error);
        
        action.retryCount++;
        
        if (action.retryCount < action.maxRetries) {
          failedActions.push(action);
        } else {
          logError(`Action ${action.id} exceeded max retries, dropping`);
        }
      }
    }

    // Update pending actions
    this.pendingActions = failedActions;
    await this.savePendingActions();

    // Update last sync time if we completed any actions
    if (completedActionIds.length > 0) {
      await AsyncStorage.setItem('lastSyncTime', Date.now().toString());
    }

    this.isSyncing = false;
    this.notifyListeners();

    log(`Sync completed. ${completedActionIds.length} successful, ${failedActions.length} failed`);
  }

  // Execute a single offline action
  private async executeAction(action: OfflineAction): Promise<void> {
    const { method, endpoint, data } = action;

    switch (method) {
      case 'POST':
        await apiService.post(endpoint, data);
        break;
      case 'PUT':
        await apiService.put(endpoint, data);
        break;
      case 'DELETE':
        await apiService.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // Storage management
  private async loadPendingActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('pendingOfflineActions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
        log(`Loaded ${this.pendingActions.length} pending offline actions`);
      }
    } catch (error) {
      logError('Failed to load pending actions:', error);
      this.pendingActions = [];
    }
  }

  private async savePendingActions(): Promise<void> {
    try {
      await AsyncStorage.setItem('pendingOfflineActions', JSON.stringify(this.pendingActions));
    } catch (error) {
      logError('Failed to save pending actions:', error);
    }
  }

  // Data persistence for offline use
  async storeOfflineData<T>(key: string, data: T): Promise<void> {
    try {
      const offlineKey = `offline_${key}`;
      await AsyncStorage.setItem(offlineKey, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      logError(`Failed to store offline data for ${key}:`, error);
    }
  }

  async getOfflineData<T>(key: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<T | null> {
    try {
      const offlineKey = `offline_${key}`;
      const stored = await AsyncStorage.getItem(offlineKey);
      
      if (!stored) return null;
      
      const { data, timestamp } = JSON.parse(stored);
      
      // Check if data is too old
      if (Date.now() - timestamp > maxAge) {
        await AsyncStorage.removeItem(offlineKey);
        return null;
      }
      
      return data;
    } catch (error) {
      logError(`Failed to get offline data for ${key}:`, error);
      return null;
    }
  }

  async clearOfflineData(pattern?: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => 
        key.startsWith('offline_') && 
        (!pattern || key.includes(pattern))
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        log(`Cleared ${keysToRemove.length} offline data entries`);
      }
    } catch (error) {
      logError('Failed to clear offline data:', error);
    }
  }

  // Listener management
  addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const status = this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        logError('Error in sync listener:', error);
      }
    });
  }

  // Status methods
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.getLastSyncTime(),
      pendingActions: this.pendingActions.length,
      failedActions: this.pendingActions.filter(a => a.retryCount > 0).length,
    };
  }

  private getLastSyncTime(): number | null {
    try {
      const stored = AsyncStorage.getItem('lastSyncTime');
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  }

  isOfflineMode(): boolean {
    return !this.isOnline;
  }

  hasPendingActions(): boolean {
    return this.pendingActions.length > 0;
  }

  // Force sync (for manual refresh)
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncPendingActions();
  }

  // Clear all offline data and pending actions
  async reset(): Promise<void> {
    this.pendingActions = [];
    await AsyncStorage.multiRemove([
      'pendingOfflineActions',
      'lastSyncTime',
    ]);
    await this.clearOfflineData();
    this.notifyListeners();
    log('OfflineManager reset');
  }
}

// Singleton instance
export const offlineManager = OfflineManager.getInstance();
export default offlineManager;