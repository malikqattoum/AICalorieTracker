import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

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
  async (config: AxiosRequestConfig) => {
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

// Response interceptor to handle common errors
apiInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
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
};

export default api;