import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';
import cacheService from './cacheService';

// Types
export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

// Create API instance
const apiInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and JSON parsing
apiInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle empty or invalid JSON responses
    if (response.data === null || response.data === undefined) {
      response.data = {};
    } else if (typeof response.data === 'string' && response.data.trim() === '') {
      response.data = {};
    } else if (typeof response.data === 'string') {
      try {
        // Try to parse string responses
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        // If parsing fails, use empty object as fallback
        console.warn('JSON Parse Error in response:', parseError);
        response.data = {};
      }
    }
    
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;
    
    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await apiInstance.post('/api/auth/refresh-token', {
            refreshToken,
          });
          
          const { token } = response.data;
          await SecureStore.setItemAsync('token', token);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, logout user
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
        
        // You might want to trigger a logout action here
        // or redirect to login screen
      }
    }
    
    return Promise.reject(error);
  }
);

// API service
const api = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiInstance.post('/api/auth/login', { email, password });
      return response.data;
    },
    register: async (userData: any) => {
      const response = await apiInstance.post('/api/auth/register', userData);
      return response.data;
    },
    forgotPassword: async (email: string) => {
      const response = await apiInstance.post('/api/auth/forgot-password', { email });
      return response.data;
    },
    resetPassword: async (token: string, password: string) => {
      const response = await apiInstance.post('/api/auth/reset-password', { token, password });
      return response.data;
    },
    logout: async () => {
      const response = await apiInstance.post('/api/auth/logout');
      return response.data;
    },
    me: async () => {
      const response = await apiInstance.get('/api/auth/me');
      return response.data;
    },
  },
  
  // User endpoints
  user: {
    updateProfile: async (userData: any) => {
      const response = await apiInstance.put('/api/user/profile', userData);
      return response.data;
    },
    updateSettings: async (settings: any) => {
      const response = await apiInstance.put('/api/user/settings', settings);
      return response.data;
    },
    getSettings: async () => {
      const response = await apiInstance.get('/api/user/settings');
      return response.data;
    },
    completeOnboarding: async () => {
      const response = await apiInstance.post('/api/user/onboarding-completed');
      return response.data;
    },
  },
  
  // Meal endpoints
  meals: {
    getMeals: async (params?: any) => {
      const response = await apiInstance.get('/api/meals', { params });
      return response.data;
    },
    getMeal: async (id: string) => {
      const response = await apiInstance.get(`/api/meals/${id}`);
      return response.data;
    },
    createMeal: async (mealData: any) => {
      const response = await apiInstance.post('/api/meals', mealData);
      return response.data;
    },
    updateMeal: async (id: string, mealData: any) => {
      const response = await apiInstance.put(`/api/meals/${id}`, mealData);
      return response.data;
    },
    deleteMeal: async (id: string) => {
      const response = await apiInstance.delete(`/api/meals/${id}`);
      return response.data;
    },
    analyzeMealImage: async (formData: FormData) => {
      const response = await apiInstance.post('/api/meals/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  },
  
  // Recipe endpoints
  recipes: {
    importRecipe: async (url: string) => {
      const response = await apiInstance.post('/api/recipes/import', { url });
      return response.data;
    },
    saveRecipe: async (recipeData: any) => {
      const response = await apiInstance.post('/api/recipes/save', recipeData);
      return response.data;
    },
  },
  
  // Nutrition coach endpoints
  nutritionCoach: {
    askQuestion: async (question: string) => {
      const response = await apiInstance.post('/api/nutrition-coach/ask', { question });
      return response.data;
    },
    getHistory: async () => {
      const response = await apiInstance.get('/api/nutrition-coach/history');
      return response.data;
    },
  },
  
  // Meal plan endpoints
  mealPlans: {
    generatePlan: async (preferences: any) => {
      const response = await apiInstance.post('/api/meal-plans/generate', preferences);
      return response.data;
    },
    savePlan: async (planData: any) => {
      const response = await apiInstance.post('/api/meal-plans/save', planData);
      return response.data;
    },
    getPlans: async () => {
      const response = await apiInstance.get('/api/meal-plans');
      return response.data;
    },
  },
  
  // Calendar endpoints
  calendar: {
    getDailyStats: async (date: string) => {
      const response = await apiInstance.get(`/api/daily-stats?date=${date}`);
      return response.data;
    },
    getCalendarData: async (month?: string) => {
      const params = month ? { month } : undefined;
      const response = await apiInstance.get('/api/meal-calendar', { params });
      return response.data;
    },
  },
  
  // Wearable endpoints
  wearable: {
    // Device Management
    getDevices: async () => {
      const response = await apiInstance.get('/api/wearable/devices');
      return response.data;
    },
    connectDevice: async (deviceData: any) => {
      const response = await apiInstance.post('/api/wearable/devices/connect', deviceData);
      return response.data;
    },
    disconnectDevice: async (deviceId: string) => {
      const response = await apiInstance.post(`/api/wearable/devices/${deviceId}/disconnect`);
      return response.data;
    },
    getDeviceStatus: async (deviceId: string) => {
      const response = await apiInstance.get(`/api/wearable/devices/${deviceId}/status`);
      return response.data;
    },
    
    // Data Sync
    syncDevice: async (deviceId: string, syncType: string) => {
      const response = await apiInstance.post(`/api/wearable/devices/${deviceId}/sync`, { syncType });
      return response.data;
    },
    getSyncLogs: async (deviceId: string) => {
      const response = await apiInstance.get(`/api/wearable/devices/${deviceId}/sync-logs`);
      return response.data;
    },
    
    // Health Data
    getHealthData: async (query: any) => {
      const response = await apiInstance.post('/api/wearable/health-data', query);
      return response.data;
    },
    saveHealthData: async (metrics: any[]) => {
      const response = await apiInstance.post('/api/wearable/health-data/save', metrics);
      return response.data;
    },
    
    // Analytics
    getCorrelationAnalysis: async (query: any) => {
      const response = await apiInstance.post('/api/wearable/correlation-analysis', query);
      return response.data;
    },
    
    // Settings
    getDeviceSettings: async (deviceId: string) => {
      const response = await apiInstance.get(`/api/wearable/devices/${deviceId}/settings`);
      return response.data;
    },
    updateDeviceSettings: async (deviceId: string, settings: any) => {
      const response = await apiInstance.put(`/api/wearable/devices/${deviceId}/settings`, settings);
      return response.data;
    },
    
    // User Settings
    getWearableUserSettings: async (userId: string) => {
      const response = await apiInstance.get(`/api/wearable/user-settings/${userId}`);
      return response.data;
    },
    updateWearableUserSettings: async (settings: any) => {
      const response = await apiInstance.put('/api/wearable/user-settings', settings);
      return response.data;
    },
    
    // Export/Import
    exportData: async (exportData: any) => {
      const response = await apiInstance.post('/api/wearable/export', exportData, {
        responseType: 'blob'
      });
      return response.data;
    },
    importData: async (formData: FormData) => {
      const response = await apiInstance.post('/api/wearable/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    
    // Aggregated Data
    getAggregatedHealthData: async (query: any) => {
      const response = await apiInstance.post('/api/wearable/health-data/aggregated', query);
      return response.data;
    },
    
    // Insights
    getHealthInsights: async (insightsData: any) => {
      const response = await apiInstance.post('/api/wearable/health-insights', insightsData);
      return response.data;
    },
    
    // Recommendations
    getDeviceRecommendations: async (userId: string) => {
      const response = await apiInstance.get(`/api/wearable/recommendations/${userId}`);
      return response.data;
    },
  },

  // Premium analytics endpoints
  premium: {
    getDashboard: async () => {
      // Try to get cached data first
      const cachedData = await cacheService.getCachedPremiumData();
      if (cachedData) {
        return cachedData;
      }

      const response = await apiInstance.get('/api/premium/dashboard');
      const data = response.data;
      
      // Cache the response
      await cacheService.cachePremiumData(data);
      
      return data;
    },
    getHealthScore: async () => {
      // Try to get cached data first
      const cachedData = await cacheService.getCachedHealthData();
      if (cachedData) {
        return cachedData;
      }

      const response = await apiInstance.get('/api/premium/health-score');
      const data = response.data;
      
      // Cache the response
      await cacheService.cacheHealthData(data);
      
      return data;
    },
    getPremiumStatus: async () => {
      const response = await apiInstance.get('/api/premium/status');
      return response.data;
    },
    getRealTimeMetrics: async () => {
      // Try to get cached data first
      const cachedData = await cacheService.getCachedRealTimeData();
      if (cachedData) {
        return cachedData;
      }

      const response = await apiInstance.get('/api/premium/real-time-metrics');
      const data = response.data;
      
      // Cache the response with short TTL
      await cacheService.cacheRealTimeData(data);
      
      return data;
    },
    getHealthScores: async () => {
      const response = await apiInstance.get('/api/premium/health-scores');
      return response.data;
    },
    getHealthPredictions: async () => {
      const response = await apiInstance.get('/api/premium/health-predictions');
      return response.data;
    },
    getAlerts: async () => {
      const response = await apiInstance.get('/api/premium/alerts');
      return response.data;
    },
    getPredictiveAnalytics: async () => {
      const response = await apiInstance.get('/api/premium/predictive-analytics');
      return response.data;
    },
    generatePredictions: async () => {
      const response = await apiInstance.post('/api/premium/generate-predictions');
      return response.data;
    },
    getProfessionalReports: async () => {
      const response = await apiInstance.get('/api/premium/reports');
      return response.data;
    },
    generateReport: async (reportData: any) => {
      const response = await apiInstance.post('/api/premium/generate-report', reportData);
      return response.data;
    },
    getReportTemplates: async () => {
      const response = await apiInstance.get('/api/premium/report-templates');
      return response.data;
    },
    getAdvancedAnalytics: async (params: any) => {
      const response = await apiInstance.get('/api/premium/advanced-analytics', { params });
      return response.data;
    },
    
    getTrendAnalysis: async (params: any) => {
      const response = await apiInstance.get('/api/premium/trend-analysis', { params });
      return response.data;
    },
    
    getHealthInsights: async (params: any) => {
      const response = await apiInstance.get('/api/premium/health-insights', { params });
      return response.data;
    },
    
    getCorrelationMatrix: async (params: any) => {
      const response = await apiInstance.get('/api/premium/correlation-matrix', { params });
      return response.data;
    },
    
    getAnomalyDetection: async (params: any) => {
      const response = await apiInstance.get('/api/premium/anomaly-detection', { params });
      return response.data;
    },
    
    getPersonalizedRecommendations: async (params: any) => {
      const response = await apiInstance.get('/api/premium/recommendations', { params });
      return response.data;
    },
    
    getGoalProgress: async (params: any) => {
      const response = await apiInstance.get('/api/premium/goal-progress', { params });
      return response.data;
    },
    
    getPerformanceMetrics: async (params: any) => {
      const response = await apiInstance.get('/api/premium/performance-metrics', { params });
      return response.data;
    },
    
    getRiskAssessment: async (params: any) => {
      const response = await apiInstance.get('/api/premium/risk-assessment', { params });
      return response.data;
    },
    
    getCustomMetrics: async () => {
      const response = await apiInstance.get('/api/premium/custom-metrics');
      return response.data;
    },
    
    createCustomMetric: async (metricData: any) => {
      const response = await apiInstance.post('/api/premium/custom-metrics', metricData);
      return response.data;
    },
    
    updateCustomMetric: async (metricId: string, metricData: any) => {
      const response = await apiInstance.put(`/api/premium/custom-metrics/${metricId}`, metricData);
      return response.data;
    },
    
    deleteCustomMetric: async (metricId: string) => {
      const response = await apiInstance.delete(`/api/premium/custom-metrics/${metricId}`);
      return response.data;
    },
    
    getPremiumFeatures: async () => {
      const response = await apiInstance.get('/api/premium/features');
      return response.data;
    },
    
    getUsageAnalytics: async (params: any) => {
      const response = await apiInstance.get('/api/premium/usage-analytics', { params });
      return response.data;
    },
    
    getPersonalizedInsights: async (params: any) => {
      const response = await apiInstance.get('/api/premium/personalized-insights', { params });
      return response.data;
    },
    
    getHealthTrends: async (params: any) => {
      const response = await apiInstance.get('/api/premium/health-trends', { params });
      return response.data;
    },
    
    getWellnessScore: async (params: any) => {
      const response = await apiInstance.get('/api/premium/wellness-score', { params });
      return response.data;
    },
    
    getNutritionAnalysis: async (params: any) => {
      const response = await apiInstance.get('/api/premium/nutrition-analysis', { params });
      return response.data;
    },
    
    getFitnessProgress: async (params: any) => {
      const response = await apiInstance.get('/api/premium/fitness-progress', { params });
      return response.data;
    },
    
    getSleepAnalysis: async (params: any) => {
      const response = await apiInstance.get('/api/premium/sleep-analysis', { params });
      return response.data;
    },
    
    getStressAnalysis: async (params: any) => {
      const response = await apiInstance.get('/api/premium/stress-analysis', { params });
      return response.data;
    },
    
    getMentalHealthMetrics: async (params: any) => {
      const response = await apiInstance.get('/api/premium/mental-health', { params });
      return response.data;
    },
    
    exportPremiumData: async (exportParams: any) => {
      const response = await apiInstance.post('/api/premium/export', exportParams, {
        responseType: 'blob'
      });
      return response.data;
    },
    
    getPremiumNotifications: async () => {
      const response = await apiInstance.get('/api/premium/notifications');
      return response.data;
    },
    
    markNotificationAsRead: async (notificationId: string) => {
      const response = await apiInstance.put(`/api/premium/notifications/${notificationId}/read`);
      return response.data;
    },
    
    getPremiumSettings: async () => {
      const response = await apiInstance.get('/api/premium/settings');
      return response.data;
    },
    
    updatePremiumSettings: async (settings: any) => {
      const response = await apiInstance.put('/api/premium/settings', settings);
      return response.data;
    },
  },

  // Healthcare provider endpoints
  healthcare: {
    connectProvider: async (providerData: any) => {
      const response = await apiInstance.post('/api/healthcare/connect', providerData);
      return response.data;
    },
    disconnectProvider: async (providerData: any) => {
      const response = await apiInstance.post('/api/healthcare/disconnect', providerData);
      return response.data;
    },
    getProviders: async () => {
      const response = await apiInstance.get('/api/healthcare/providers');
      return response.data;
    },
    shareData: async (shareData: any) => {
      const response = await apiInstance.post('/api/healthcare/share', shareData);
      return response.data;
    },
    generateReport: async (reportData: any) => {
      const response = await apiInstance.post('/api/healthcare/generate-report', reportData, {
        responseType: 'blob'
      });
      return response.data;
    },
    getInsights: async (insightsData: any) => {
      const response = await apiInstance.post('/api/healthcare/insights', insightsData);
      return response.data;
    },
  },
};

export default api;