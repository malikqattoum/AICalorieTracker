import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { offlineManager } from './offlineManager';
import { log, logError, APP_CONFIG } from '../config';

export interface ExportData {
  user: any;
  meals: any[];
  mealPlans: any[];
  recipes: any[];
  settings: any;
  nutritionHistory: any[];
  goals: any;
  achievements: any[];
  exportDate: string;
  appVersion: string;
}

export class DataManager {
  static async exportUserData(): Promise<boolean> {
    try {
      log('Starting data export...');
      
      Toast.show({
        type: 'info',
        text1: 'Exporting Data',
        text2: 'Preparing your data for export...',
        position: 'bottom',
      });

      // Gather all user data
      const exportData = await this.gatherUserData();
      
      // Create JSON file
      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `${APP_CONFIG.appName}_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, jsonData);
      
      log(`Data exported to: ${fileUri}`);
      
      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your Data',
        });
        
        Toast.show({
          type: 'success',
          text1: 'Export Complete',
          text2: 'Your data has been exported successfully',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Export Complete',
          text2: `Data saved to: ${fileName}`,
          position: 'bottom',
        });
      }
      
      return true;
    } catch (error) {
      logError('Data export failed:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Unable to export your data. Please try again.',
        position: 'bottom',
      });
      
      return false;
    }
  }

  static async deleteUserData(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete All Data',
        'This will permanently delete all your meals, plans, settings, and progress. This action cannot be undone.\n\nAre you absolutely sure?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Export First',
            style: 'default',
            onPress: async () => {
              const exported = await this.exportUserData();
              if (exported) {
                // Ask again after export
                this.confirmDeleteAfterExport(resolve);
              } else {
                resolve(false);
              }
            },
          },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              const success = await this.performDataDeletion();
              resolve(success);
            },
          },
        ]
      );
    });
  }

  private static confirmDeleteAfterExport(resolve: (value: boolean) => void) {
    Alert.alert(
      'Confirm Deletion',
      'Your data has been exported. Do you still want to delete all data from the app?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            const success = await this.performDataDeletion();
            resolve(success);
          },
        },
      ]
    );
  }

  private static async performDataDeletion(): Promise<boolean> {
    try {
      log('Starting data deletion...');
      
      Toast.show({
        type: 'info',
        text1: 'Deleting Data',
        text2: 'Removing all your data...',
        position: 'bottom',
      });

      // Delete from server (in production)
      try {
        await apiService.delete('/api/user/data');
      } catch (error) {
        logError('Server data deletion failed:', error);
        // Continue with local deletion even if server fails
      }

      // Clear all local storage
      await Promise.all([
        // Clear AsyncStorage
        AsyncStorage.clear(),
        
        // Clear offline manager data
        offlineManager.reset(),
        
        // Clear API cache
        apiService.clearAllCache(),
      ]);

      // Clear any cached files
      await this.clearCachedFiles();

      log('Data deletion completed');
      
      Toast.show({
        type: 'success',
        text1: 'Data Deleted',
        text2: 'All your data has been permanently removed',
        position: 'bottom',
      });

      // Force app restart or logout would happen here
      // For now, we'll show a message
      setTimeout(() => {
        Alert.alert(
          'Deletion Complete',
          'All your data has been deleted. Please restart the app.',
          [{ text: 'OK' }]
        );
      }, 2000);
      
      return true;
    } catch (error) {
      logError('Data deletion failed:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: 'Unable to delete all data. Please try again.',
        position: 'bottom',
      });
      
      return false;
    }
  }

  private static async gatherUserData(): Promise<ExportData> {
    const [
      user,
      meals,
      mealPlans,
      recipes,
      settings,
      nutritionHistory,
      goals,
      achievements,
    ] = await Promise.all([
      this.getUserProfile(),
      this.getMeals(),
      this.getMealPlans(),
      this.getRecipes(),
      this.getSettings(),
      this.getNutritionHistory(),
      this.getGoals(),
      this.getAchievements(),
    ]);

    return {
      user,
      meals,
      mealPlans,
      recipes,
      settings,
      nutritionHistory,
      goals,
      achievements,
      exportDate: new Date().toISOString(),
      appVersion: APP_CONFIG.version,
    };
  }

  private static async getUserProfile(): Promise<any> {
    try {
      const cached = await AsyncStorage.getItem('user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logError('Failed to get user profile for export:', error);
      return null;
    }
  }

  private static async getMeals(): Promise<any[]> {
    try {
      // Get cached meals
      const allKeys = await AsyncStorage.getAllKeys();
      const mealKeys = allKeys.filter(key => key.startsWith('meals_'));
      
      const meals = [];
      for (const key of mealKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          meals.push(...JSON.parse(data));
        }
      }
      
      return meals;
    } catch (error) {
      logError('Failed to get meals for export:', error);
      return [];
    }
  }

  private static async getMealPlans(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('meal_plans');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logError('Failed to get meal plans for export:', error);
      return [];
    }
  }

  private static async getRecipes(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('recipes');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logError('Failed to get recipes for export:', error);
      return [];
    }
  }

  private static async getSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem('user_settings');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      logError('Failed to get settings for export:', error);
      return {};
    }
  }

  private static async getNutritionHistory(): Promise<any[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const historyKeys = allKeys.filter(key => key.startsWith('daily_summary_'));
      
      const history = [];
      for (const key of historyKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          history.push(JSON.parse(data));
        }
      }
      
      return history;
    } catch (error) {
      logError('Failed to get nutrition history for export:', error);
      return [];
    }
  }

  private static async getGoals(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem('user_goals');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      logError('Failed to get goals for export:', error);
      return {};
    }
  }

  private static async getAchievements(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('user_achievements');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logError('Failed to get achievements for export:', error);
      return [];
    }
  }

  private static async clearCachedFiles(): Promise<void> {
    try {
      const documentDirectory = FileSystem.documentDirectory;
      if (!documentDirectory) return;

      const files = await FileSystem.readDirectoryAsync(documentDirectory);
      
      // Clear any app-specific cached files
      const appFiles = files.filter(file => 
        file.includes('calorie') || 
        file.includes('meal') || 
        file.includes('recipe') ||
        file.endsWith('.json')
      );

      for (const file of appFiles) {
        try {
          await FileSystem.deleteAsync(documentDirectory + file);
        } catch (error) {
          // Ignore individual file deletion errors
        }
      }
    } catch (error) {
      logError('Failed to clear cached files:', error);
    }
  }
}

export default DataManager;