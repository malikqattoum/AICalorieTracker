/**
 * Types and interfaces for premium features
 */

// Data Visualization Types
export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: any[];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  insights: string[];
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  progress: number;
  trend: 'improving' | 'declining' | 'stable';
  color: string;
  icon: string;
}

export interface Correlation {
  id: string;
  metric1: string;
  metric2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  insights: string[];
}

// Real-Time Monitoring Types
export interface RealTimeMetric {
  id: number;
  userId: number;
  metricType: 'heart_rate' | 'blood_pressure' | 'blood_oxygen' | 'sleep_quality' | 'stress_level' | 'activity_level';
  metricValue: number;
  unit: string;
  timestamp: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  status?: 'normal' | 'warning' | 'critical';
}

export interface AlertConfig {
  id: number;
  userId: number;
  metricType: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  operator: 'and' | 'or';
  action: 'notification' | 'email' | 'sms' | 'emergency';
  isActive: boolean;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthScore {
  id: number;
  userId: number;
  scoreType: 'nutrition' | 'fitness' | 'recovery' | 'consistency' | 'overall';
  scoreValue: number;
  calculationDate: string;
  scoreDetails: any;
  trendDirection: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface HealthPrediction {
  id: number;
  userId: number;
  predictionType: 'weight_projection' | 'goal_achievement' | 'health_risk' | 'performance_optimization';
  targetDate: string;
  predictionValue: number;
  confidenceScore: number;
  modelVersion: string;
  predictionDetails: any;
  recommendations: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// WebSocket Types
export interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastMessage: any;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  send: (message: any) => void;
  requestRealTimeData: (type: string, params?: any) => void;
  sendUserAction: (action: string, data?: any) => void;
  healthMetrics: RealTimeMetric[];
  realTimeAlerts: AlertConfig[];
  predictions: HealthPrediction[];
  systemStatus: any[];
  userActivities: any[];
}

// Healthcare Integration Types
export interface HealthcareProvider {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'physician' | 'nutritionist';
  connectionStatus: 'connected' | 'pending' | 'disconnected';
  lastSynced: string;
  dataTypes: string[];
}

// Professional Reports Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  content: string;
  dataSources: string[];
}