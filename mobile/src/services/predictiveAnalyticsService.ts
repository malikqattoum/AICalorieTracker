import { apiService } from './apiService';
import { logError } from '../config';

export interface Prediction {
  id: string;
  type: 'weight_projection' | 'goal_achievement' | 'health_risk' | 'performance_optimization';
  title: string;
  description: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
  recommendations: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface HealthRisk {
  id: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  factors: string[];
  mitigation: string[];
  timeframe: string;
}

export interface GoalProgress {
  id: string;
  title: string;
  type: 'weight_loss' | 'fitness' | 'health' | 'nutrition';
  current: number;
  target: number;
  deadline: string;
  probability: number;
  trend: 'on_track' | 'at_risk' | 'behind';
  recommendations: string[];
}

export interface AIInsight {
  id: string;
  category: 'nutrition' | 'fitness' | 'sleep' | 'stress' | 'recovery';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  steps: string[];
}

export interface PredictiveAnalyticsResponse {
  predictions: Prediction[];
  healthRisks: HealthRisk[];
  goalProgress: GoalProgress[];
  aiInsights: AIInsight[];
}

export class PredictiveAnalyticsService {
  /**
   * Fetch all predictive analytics data from the backend
   */
  async fetchPredictiveAnalytics(): Promise<PredictiveAnalyticsResponse> {
    try {
      const response = await apiService.get<PredictiveAnalyticsResponse>('/api/user/predictive-analytics', {
        requiresAuth: true,
        cache: true,
        cacheKey: 'predictive_analytics',
        cacheDuration: 30 * 60 * 1000, // 30 minutes
      });

      return response.data;
    } catch (error) {
      logError('Failed to fetch predictive analytics:', error);
      throw new Error('Failed to load predictive analytics data');
    }
  }

  /**
   * Fetch specific prediction by ID
   */
  async fetchPredictionById(id: string): Promise<Prediction> {
    try {
      const response = await apiService.get<Prediction>(`/api/user/predictive-analytics/predictions/${id}`, {
        requiresAuth: true,
      });

      return response.data;
    } catch (error) {
      logError(`Failed to fetch prediction ${id}:`, error);
      throw new Error('Failed to load prediction details');
    }
  }

  /**
   * Generate new predictions based on latest data
   */
  async generatePredictions(): Promise<PredictiveAnalyticsResponse> {
    try {
      const response = await apiService.post<PredictiveAnalyticsResponse>('/api/user/predictive-analytics/generate', {}, {
        requiresAuth: true,
      });

      return response.data;
    } catch (error) {
      logError('Failed to generate predictions:', error);
      throw new Error('Failed to generate new predictions');
    }
  }

  /**
   * Fetch AI insights for a specific category
   */
  async fetchAIInsights(category?: string): Promise<AIInsight[]> {
    try {
      const url = category 
        ? `/api/user/predictive-analytics/insights?category=${category}`
        : '/api/user/predictive-analytics/insights';
      
      const response = await apiService.get<AIInsight[]>(url, {
        requiresAuth: true,
        cache: true,
        cacheKey: `ai_insights_${category || 'all'}`,
        cacheDuration: 15 * 60 * 1000, // 15 minutes
      });

      return response.data;
    } catch (error) {
      logError('Failed to fetch AI insights:', error);
      throw new Error('Failed to load AI insights');
    }
  }

  /**
   * Acknowledge a health risk
   */
  async acknowledgeHealthRisk(riskId: string): Promise<void> {
    try {
      await apiService.post(`/api/user/predictive-analytics/risks/${riskId}/acknowledge`, {}, {
        requiresAuth: true,
      });
    } catch (error) {
      logError(`Failed to acknowledge health risk ${riskId}:`, error);
      throw new Error('Failed to acknowledge health risk');
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    try {
      await apiService.put(`/api/user/predictive-analytics/goals/${goalId}/progress`, { progress }, {
        requiresAuth: true,
      });
    } catch (error) {
      logError(`Failed to update goal progress for ${goalId}:`, error);
      throw new Error('Failed to update goal progress');
    }
  }

  /**
   * Implement an AI insight
   */
  async implementInsight(insightId: string): Promise<void> {
    try {
      await apiService.post(`/api/user/predictive-analytics/insights/${insightId}/implement`, {}, {
        requiresAuth: true,
      });
    } catch (error) {
      logError(`Failed to implement insight ${insightId}:`, error);
      throw new Error('Failed to implement insight');
    }
  }

  /**
   * Get prediction history
   */
  async getPredictionHistory(type?: string, limit: number = 10): Promise<Prediction[]> {
    try {
      const url = type 
        ? `/api/user/predictive-analytics/history?type=${type}&limit=${limit}`
        : `/api/user/predictive-analytics/history?limit=${limit}`;
      
      const response = await apiService.get<Prediction[]>(url, {
        requiresAuth: true,
      });

      return response.data;
    } catch (error) {
      logError('Failed to fetch prediction history:', error);
      throw new Error('Failed to load prediction history');
    }
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(): Promise<string[]> {
    try {
      const response = await apiService.get<string[]>('/api/user/predictive-analytics/recommendations', {
        requiresAuth: true,
        cache: true,
        cacheKey: 'personalized_recommendations',
        cacheDuration: 60 * 60 * 1000, // 1 hour
      });

      return response.data;
    } catch (error) {
      logError('Failed to fetch recommendations:', error);
      throw new Error('Failed to load recommendations');
    }
  }
}

// Export service instance
export const predictiveAnalyticsService = new PredictiveAnalyticsService();
export default predictiveAnalyticsService;