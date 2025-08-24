import api from './api';
import { ErrorHandler } from '../utils/errorHandler';

// Types
export type ProfileStats = {
  totalMeals: number;
  streakDays: number;
  perfectDays: number;
  favoriteFoods: string[];
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extremelyActive';
  isPremium: boolean;
  createdAt: string;
};

export type UserSettings = {
  notifications: {
    mealReminders: boolean;
    weeklyReports: boolean;
    tips: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    storeImages: boolean;
  };
  goals: {
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
  };
};

// Generate mock profile stats
const generateMockProfileStats = (): ProfileStats => {
  return {
    totalMeals: Math.floor(Math.random() * 50) + 10,
    streakDays: Math.floor(Math.random() * 10) + 1,
    perfectDays: Math.floor(Math.random() * 5) + 1,
    favoriteFoods: ['Chicken Salad', 'Oatmeal', 'Greek Yogurt', 'Salmon'],
  };
};

// Profile service
const profileService = {
  // Get profile stats
  getProfileStats: async (): Promise<ProfileStats> => {
    try {
      // In production, this would call the API
      // return await api.user.getProfileStats();
      
      // For development, generate mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return generateMockProfileStats();
    } catch (error) {
      throw new Error('Failed to fetch profile stats. Please try again.');
    }
  },
  
  // Get user profile
  getUserProfile: async (): Promise<UserProfile> => {
    try {
      // In production, this would call the API
      // return await api.user.getProfile();
      
      // For development, return mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        weight: 75,
        height: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'moderatelyActive',
        isPremium: false,
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    } catch (error) {
      ErrorHandler.handleError(error, 'profileService.getUserProfile');
      
      // Return mock data as fallback
      return {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        weight: 75,
        height: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'moderatelyActive',
        isPremium: false,
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    }
  },
  
  // Update user profile
  updateUserProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      // In production, this would call the API
      // return await api.user.updateProfile(profile);
      
      // For development, return mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        firstName: profile.firstName || 'John',
        lastName: profile.lastName || 'Doe',
        email: profile.email || 'john.doe@example.com',
        weight: profile.weight || 75,
        height: profile.height || 180,
        age: profile.age || 30,
        gender: profile.gender || 'male',
        activityLevel: profile.activityLevel || 'moderatelyActive',
        isPremium: false,
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    } catch (error) {
      throw new Error('Failed to update user profile. Please try again.');
    }
  },
  
  // Get user settings
  getUserSettings: async (): Promise<UserSettings> => {
    try {
      // In production, this would call the API
      // return await api.user.getSettings();
      
      // For development, return mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
        privacy: {
          shareAnalytics: true,
          storeImages: false,
        },
        goals: {
          calorieGoal: 2000,
          proteinGoal: 150,
          carbsGoal: 200,
          fatGoal: 65,
        },
      };
    } catch (error) {
      throw new Error('Failed to fetch user settings. Please try again.');
    }
  },
  
  // Update user settings
  updateUserSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
      // In production, this would call the API
      // return await api.user.updateSettings(settings);
      
      // For development, return mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        notifications: {
          mealReminders: settings.notifications?.mealReminders ?? true,
          weeklyReports: settings.notifications?.weeklyReports ?? true,
          tips: settings.notifications?.tips ?? true,
        },
        privacy: {
          shareAnalytics: settings.privacy?.shareAnalytics ?? true,
          storeImages: settings.privacy?.storeImages ?? false,
        },
        goals: {
          calorieGoal: settings.goals?.calorieGoal ?? 2000,
          proteinGoal: settings.goals?.proteinGoal ?? 150,
          carbsGoal: settings.goals?.carbsGoal ?? 200,
          fatGoal: settings.goals?.fatGoal ?? 65,
        },
      };
    } catch (error) {
      throw new Error('Failed to update user settings. Please try again.');
    }
  },
  
  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      // In production, this would call the API
      // return await api.user.changePassword(currentPassword, newPassword);
      
      // For development, simulate success
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate current password (mock validation)
      if (currentPassword !== 'password') {
        throw new Error('Current password is incorrect');
      }
      
      return;
    } catch (error) {
      throw error;
    }
  },
};

export default profileService;