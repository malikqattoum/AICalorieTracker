// Device Types
export type DeviceType = 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'apple_watch';

// Device Connection Status
export type DeviceStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

// Sync Types
export type SyncType = 'pull' | 'push' | 'both';

// Sync Status
export type SyncStatus = 'success' | 'failed' | 'partial' | 'conflict';

// Conflict Types
export type ConflictType = 'timestamp' | 'value' | 'source';

// Resolution Types
export type ResolutionType = 'server_wins' | 'client_wins' | 'merged' | 'manual';

// Source Types
export type DataSource = 'manual' | 'automatic' | 'workout';

// Activity Intensity
export type ActivityIntensity = 'low' | 'medium' | 'high';

// Sleep Types
export type SleepType = 'deep' | 'light' | 'rem' | 'awake';

// Apple Health Data Types (for react-native-health compatibility)
export interface HealthSteps {
  uuid: string;
  value: number;
  date: string;
  metadata?: {
    confidence?: number;
    workoutId?: string;
    device?: string;
  };
  device?: string;
}

export interface HealthSleep {
  uuid: string;
  value: string;
  startDate: string;
  endDate: string;
  metadata?: {
    confidence?: number;
    quality?: number;
    stages?: Record<string, any>;
    device?: string;
  };
  device?: string;
}

export interface HealthWeight {
  uuid: string;
  value: number;
  date: string;
  metadata?: {
    confidence?: number;
    device?: string;
  };
  device?: string;
}

export interface HealthDistance {
  uuid: string;
  value: number;
  date: string;
  metadata?: {
    confidence?: number;
    workoutId?: string;
    device?: string;
  };
  device?: string;
}

export interface HealthCalories {
  uuid: string;
  value: number;
  date: string;
  metadata?: {
    confidence?: number;
    workoutId?: string;
    type?: string;
    device?: string;
  };
  device?: string;
}

export interface HealthWorkout {
  uuid: string;
  activityType: string;
  startDate: string;
  endDate: string;
  energyBurned?: number;
  distance?: number;
  steps?: number;
  heartRateAverage?: number;
  heartRateMax?: number;
  heartRateMin?: number;
  elevationAscended?: number;
  elevationDescended?: number;
  activities?: Record<string, any>;
  exercises?: Record<string, any>;
  metadata?: {
    confidence?: number;
    device?: string;
  };
  device?: string;
}

// Health Permissions Type
export interface HealthPermissions {
  permissions: {
    read: string[];
    write: string[];
  };
}

// Metric Types
export type MetricType = 
  | 'steps'
  | 'distance'
  | 'calories_burned'
  | 'heart_rate'
  | 'sleep_duration'
  | 'sleep_quality'
  | 'activity_minutes'
  | 'resting_heart_rate'
  | 'blood_pressure'
  | 'weight'
  | 'body_fat'
  | 'water_intake'
  | 'workout_duration'
  | 'blood_oxygen'
  | 'respiratory_rate'
  | 'skin_temperature'
  | 'heart_rate_variability'
  | 'vo2_max'
  | 'fitness_age'
  | 'stress_level'
  | 'recovery_score'
  | 'training_load'
  | 'readiness_score'
  | 'sleep_score'
  | 'activity_score'
  | 'move_minutes'
  | 'exercise_minutes'
  | 'stand_hours'
  | 'active_calories'
  | 'resting_calories'
  | 'total_calories'
  | 'basal_metabolic_rate'
  | 'body_mass_index'
  | 'body_water'
  | 'bone_mass'
  | 'muscle_mass'
  | 'visceral_fat'
  | 'waist_circumference'
  | 'hip_circumference'
  | 'waist_to_hip_ratio'
  | 'waist_to_height_ratio'
  | 'blood_glucose'
  | 'insulin_dose'
  | 'carbohydrates';

// Correlation Types
export type CorrelationType = 'sleep_nutrition' | 'heart_rate_nutrition' | 'activity_nutrition';

// Resolved By Types
export type ResolvedBy = 'system' | 'user' | 'manual';

// Base Interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserEntity {
  userId: string;
}

export interface DeviceEntity {
  deviceId: string;
}

// Device Interfaces
export interface WearableDevice extends BaseEntity, UserEntity, DeviceEntity {
  deviceType: DeviceType;
  deviceName: string;
  isConnected: boolean;
  lastSyncAt?: Date;
  batteryLevel?: number;
  firmwareVersion?: string;
  signalStrength?: number;
  capabilities: string[];
  settings: Record<string, any>;
  isActive: boolean;
}

// Health Metrics Interfaces
export interface HealthMetric extends BaseEntity, UserEntity, DeviceEntity {
  metricType: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  recordedAt: Date;
  confidence?: number;
  metadata?: Record<string, any>;
  source: DataSource;
  workoutId?: string;
}

// Sync Interfaces
export interface SyncLog extends BaseEntity, UserEntity, DeviceEntity {
  syncType: SyncType;
  status: SyncStatus;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SyncSchedule extends BaseEntity, UserEntity, DeviceEntity {
  syncFrequencyMinutes: number;
  isActive: boolean;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  syncType: SyncType;
}

// Conflict Resolution Interfaces
export interface ConflictResolution extends BaseEntity, UserEntity, DeviceEntity {
  metricId: string;
  conflictType: ConflictType;
  resolution: ResolutionType;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  resolvedAt: Date;
  resolvedBy: ResolvedBy;
}

// Correlation Analysis Interfaces
export interface CorrelationAnalysis extends BaseEntity, UserEntity {
  correlationType: CorrelationType;
  analysisDate: string;
  correlationScore: number;
  confidenceLevel: number;
  insights: Record<string, any>;
  recommendations: Record<string, any>;
}

// User Settings Interfaces
export interface WearableUserSettings extends BaseEntity, UserEntity {
  defaultSyncConfig: Record<string, any>;
  deviceSettings: Record<string, any>;
  privacySettings: Record<string, any>;
  notificationSettings: Record<string, any>;
}

// Device Auth Interfaces
export interface DeviceAuth extends BaseEntity, UserEntity, DeviceEntity {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: Date;
  lastRefreshedAt?: Date;
  scopes: string[];
}

// Activity Data Interfaces
export interface DeviceActivity extends BaseEntity, UserEntity, DeviceEntity {
  activityType: string;
  intensity: ActivityIntensity;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  calories?: number;
  distance?: number;
  steps?: number;
  heartRate?: number;
  metadata?: Record<string, any>;
}

export interface DeviceWorkout extends BaseEntity, UserEntity, DeviceEntity {
  workoutType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  calories?: number;
  distance?: number;
  steps?: number;
  heartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  elevationGain?: number;
  elevationLoss?: number;
  metadata?: Record<string, any>;
}

// Sleep Data Interfaces
export interface DeviceSleepData extends BaseEntity, UserEntity, DeviceEntity {
  sleepType: SleepType;
  startTime: Date;
  endTime: Date;
  duration: number;
  quality?: number;
  confidence?: number;
  stages: Record<string, any>;
  metadata?: Record<string, any>;
}

// Heart Rate Data Interfaces
export interface DeviceHeartRateData extends BaseEntity, UserEntity, DeviceEntity {
  heartRate: number;
  timestamp: Date;
  recordedAt: Date;
  confidence?: number;
  source: DataSource;
  workoutId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

// Steps Data Interfaces
export interface DeviceStepsData extends BaseEntity, UserEntity, DeviceEntity {
  steps: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  workoutId?: string;
  metadata?: Record<string, any>;
}

// Calories Data Interfaces
export interface DeviceCaloriesData extends BaseEntity, UserEntity, DeviceEntity {
  calories: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  workoutId?: string;
  metadata?: Record<string, any>;
}

// Weight Data Interfaces
export interface DeviceWeightData extends BaseEntity, UserEntity, DeviceEntity {
  weight: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Blood Pressure Data Interfaces
export interface DeviceBloodPressureData extends BaseEntity, UserEntity, DeviceEntity {
  systolic: number;
  diastolic: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Water Intake Data Interfaces
export interface DeviceWaterIntakeData extends BaseEntity, UserEntity, DeviceEntity {
  amount: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Body Composition Data Interfaces
export interface DeviceBodyCompositionData extends BaseEntity, UserEntity, DeviceEntity {
  weight: number;
  bodyFat: number;
  muscleMass: number;
  boneMass: number;
  bodyWater: number;
  visceralFat: number;
  bmi: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Physical Activity Data Interfaces
export interface DevicePhysicalActivity extends BaseEntity, UserEntity, DeviceEntity {
  activityType: string;
  intensity: ActivityIntensity;
  duration: number;
  calories?: number;
  distance?: number;
  steps?: number;
  heartRate?: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  workoutId?: string;
  metadata?: Record<string, any>;
}

// Exercise Data Interfaces
export interface DeviceExerciseData extends BaseEntity, UserEntity, DeviceEntity {
  exerciseType: string;
  duration: number;
  calories?: number;
  distance?: number;
  steps?: number;
  heartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  elevationGain?: number;
  elevationLoss?: number;
  metadata?: Record<string, any>;
}

// Workout Data Interfaces
export interface DeviceWorkoutData extends BaseEntity, UserEntity, DeviceEntity {
  workoutType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  calories?: number;
  distance?: number;
  steps?: number;
  heartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  elevationGain?: number;
  elevationLoss?: number;
  activities?: Record<string, any>;
  exercises?: Record<string, any>;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  workoutId?: string;
  metadata?: Record<string, any>;
}

// Distance Data Interface
export interface DeviceDistanceData extends BaseEntity, UserEntity, DeviceEntity {
  distance: number;
  timestamp: Date;
  confidence?: number;
  source: DataSource;
  workoutId?: string;
  metadata?: Record<string, any>;
}

// Blood Oxygen Data Interface
export interface DeviceBloodOxygenData extends BaseEntity, UserEntity, DeviceEntity {
  bloodOxygen: number;
  timestamp: Date;
  recordedAt: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Respiratory Rate Data Interface
export interface DeviceRespiratoryRateData extends BaseEntity, UserEntity, DeviceEntity {
  respiratoryRate: number;
  timestamp: Date;
  recordedAt: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Skin Temperature Data Interface
export interface DeviceSkinTemperatureData extends BaseEntity, UserEntity, DeviceEntity {
  skinTemperature: number;
  timestamp: Date;
  recordedAt: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Heart Rate Variability Data Interface
export interface DeviceHeartRateVariabilityData extends BaseEntity, UserEntity, DeviceEntity {
  heartRateVariability: number;
  timestamp: Date;
  recordedAt: Date;
  confidence?: number;
  source: DataSource;
  metadata?: Record<string, any>;
}

// Configuration Interfaces
export interface DeviceCapabilities {
  heartRate: boolean;
  steps: boolean;
  distance: boolean;
  calories: boolean;
  sleep: boolean;
  bloodPressure: boolean;
  weight: boolean;
  bodyComposition: boolean;
  bloodOxygen: boolean;
  respiratoryRate: boolean;
  skinTemperature: boolean;
  heartRateVariability: boolean;
  vo2Max: boolean;
  fitnessAge: boolean;
  stressLevel: boolean;
  recoveryScore: boolean;
  trainingLoad: boolean;
  readinessScore: boolean;
  sleepScore: boolean;
  activityScore: boolean;
  moveMinutes: boolean;
  exerciseMinutes: boolean;
  standHours: boolean;
  activeCalories: boolean;
  restingCalories: boolean;
  totalCalories: boolean;
  basalMetabolicRate: boolean;
  bodyMassIndex: boolean;
  bodyWater: boolean;
  boneMass: boolean;
  muscleMass: boolean;
  visceralFat: boolean;
  waistCircumference: boolean;
  hipCircumference: boolean;
  waistToHipRatio: boolean;
  waistToHeightRatio: boolean;
}

export interface SyncConfig {
  enabled: boolean;
  frequencyMinutes: number;
  syncType: SyncType;
  metrics: MetricType[];
  conflictResolution: ResolutionType;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
}

export interface DeviceSettings {
  autoSync: boolean;
  syncFrequency: number;
  selectedMetrics: MetricType[];
  privacySettings: {
    shareData: boolean;
    anonymizeData: boolean;
    dataRetention: number; // days
  };
  notificationSettings: {
    syncComplete: boolean;
    lowBattery: boolean;
    syncFailed: boolean;
    insights: boolean;
  };
}

// API Response Interfaces
export interface WearableApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors?: string[];
  duration: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  batteryLevel?: number;
  lastSyncAt?: Date;
  capabilities: DeviceCapabilities;
}

export interface HealthDataQuery {
  userId: string;
  deviceId?: string;
  metricTypes?: MetricType[];
  startDate?: Date;
  endDate?: Date;
  source?: DataSource;
  limit?: number;
  offset?: number;
}

export interface CorrelationQuery {
  userId: string;
  correlationType: CorrelationType;
  startDate?: Date;
  endDate?: Date;
  confidenceThreshold?: number;
}

// Error Types
export class WearableError extends Error {
  code: WearableErrorCode;
  details?: any;
  timestamp: Date;

  constructor(params: {
    code: WearableErrorCode;
    message: string;
    details?: any;
    timestamp?: Date;
  }) {
    super(params.message);
    this.name = 'WearableError';
    this.code = params.code;
    this.details = params.details;
    this.timestamp = params.timestamp || new Date();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WearableError);
    }
  }
}

export enum WearableErrorCode {
  DEVICE_NOT_CONNECTED = 'DEVICE_NOT_CONNECTED',
  AUTH_FAILED = 'AUTH_FAILED',
  SYNC_FAILED = 'SYNC_FAILED',
  DATA_INVALID = 'DATA_INVALID',
  RATE_LIMITED = 'RATE_LIMITED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Mobile Specific Interfaces
export interface WearablePermission {
  type: 'apple_health' | 'google_fit' | 'fitness' | 'health';
  status: 'granted' | 'denied' | 'not_determined';
  scopes: string[];
}

export interface WearableSyncEvent {
  type: 'sync_start' | 'sync_progress' | 'sync_complete' | 'sync_error';
  deviceId: string;
  progress: number;
  message?: string;
  error?: string;
}

export interface WearableNotification {
  id: string;
  type: 'sync_complete' | 'low_battery' | 'insight' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  deviceId?: string;
  read: boolean;
}

// React Native Health Types
export interface AppleHealthPermission {
  read: string[];
  write: string[];
}

export interface AppleHealthOptions {
  permissions: AppleHealthPermission;
  animations: {
    read: boolean;
    write: boolean;
  };
  debounce: number;
}

// Google Fit Types
export interface GoogleFitPermission {
  scopes: string[];
}

export interface GoogleFitOptions {
  permissions: GoogleFitPermission;
  autoSync: boolean;
  debounce: number;
}

// Device Manager Types
export interface DeviceManager {
  connectDevice(deviceType: DeviceType, options?: any): Promise<WearableDevice>;
  disconnectDevice(deviceId: string): Promise<boolean>;
  getConnectedDevices(): Promise<WearableDevice[]>;
  getDeviceStatus(deviceId: string): Promise<DeviceInfo>;
  syncDevice(deviceId: string, syncType: SyncType): Promise<SyncResult>;
  updateDeviceSettings(deviceId: string, settings: DeviceSettings): Promise<boolean>;
}

// Service Interfaces
export interface IWearableService {
  connectDevice(device: Partial<WearableDevice>): Promise<WearableDevice>;
  disconnectDevice(deviceId: string): Promise<boolean>;
  syncDevice(deviceId: string, syncType: SyncType): Promise<SyncResult>;
  getDeviceStatus(deviceId: string): Promise<DeviceInfo>;
  getHealthData(query: HealthDataQuery): Promise<HealthMetric[]>;
  saveHealthData(metrics: HealthMetric[]): Promise<HealthMetric[]>;
  getCorrelationAnalysis(query: CorrelationQuery): Promise<CorrelationAnalysis>;
  updateDeviceSettings(deviceId: string, settings: DeviceSettings): Promise<boolean>;
}

export interface IAppleHealthService {
  requestPermissions(): Promise<boolean>;
  isAuthorized(): Promise<boolean>;
  getHeartRateData(startDate: Date, endDate: Date): Promise<DeviceHeartRateData[]>;
  getStepsData(startDate: Date, endDate: Date): Promise<DeviceStepsData[]>;
  getSleepData(startDate: Date, endDate: Date): Promise<DeviceSleepData[]>;
  getWeightData(startDate: Date, endDate: Date): Promise<DeviceWeightData[]>;
  saveWeightData(weight: number, date: Date): Promise<boolean>;
  saveWorkoutData(workout: DeviceWorkoutData): Promise<boolean>;
}

export interface IGoogleFitService {
  isAuthorized(): Promise<boolean>;
  authorize(): Promise<boolean>;
  getHeartRateData(startDate: Date, endDate: Date): Promise<DeviceHeartRateData[]>;
  getStepsData(startDate: Date, endDate: Date): Promise<DeviceStepsData[]>;
  getCaloriesData(startDate: Date, endDate: Date): Promise<DeviceCaloriesData[]>;
  getDistanceData(startDate: Date, endDate: Date): Promise<DeviceDistanceData[]>;
  saveActivityData(activity: DevicePhysicalActivity): Promise<boolean>;
}

export interface IFitbitService {
  connect(authCode: string): Promise<WearableDevice>;
  syncData(deviceId: string): Promise<SyncResult>;
  getHeartRateData(startDate: Date, endDate: Date): Promise<DeviceHeartRateData[]>;
  getSleepData(startDate: Date, endDate: Date): Promise<DeviceSleepData[]>;
  getActivityData(startDate: Date, endDate: Date): Promise<DeviceActivity[]>;
}

export interface IGarminService {
  connect(authCode: string): Promise<WearableDevice>;
  syncData(deviceId: string): Promise<SyncResult>;
  getWorkoutData(startDate: Date, endDate: Date): Promise<DeviceWorkoutData[]>;
  getHealthMetrics(startDate: Date, endDate: Date): Promise<HealthMetric[]>;
}

// Context Types
export interface WearableContextType {
  connectedDevices: WearableDevice[];
  isLoading: boolean;
  error: string | null;
  permissions: WearablePermission[];
  syncStatus: Record<string, SyncStatus>;
  
  connectDevice: (deviceType: DeviceType, options?: any) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  syncDevice: (deviceId: string, syncType?: SyncType) => Promise<void>;
  updateDeviceSettings: (deviceId: string, settings: DeviceSettings) => Promise<void>;
  requestPermissions: (deviceType: DeviceType) => Promise<void>;
  clearError: () => void;
}

// Hook Types
export interface UseWearableDeviceReturn {
  device: WearableDevice | null;
  status: DeviceStatus;
  isLoading: boolean;
  error: string | null;
  sync: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateSettings: (settings: DeviceSettings) => Promise<void>;
}

export interface UseHealthDataReturn {
  data: HealthMetric[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseCorrelationAnalysisReturn {
  analysis: CorrelationAnalysis | null;
  isLoading: boolean;
  error: string | null;
  generate: (query: CorrelationQuery) => Promise<void>;
}

// Screen Props Types
export interface WearableDeviceListScreenProps {
  navigation: any;
  route: {
    params?: {
      onSelectDevice?: (device: WearableDevice) => void;
    };
  };
}

export interface WearableDeviceSetupScreenProps {
  navigation: any;
  route: {
    params?: {
      deviceType: DeviceType;
      onSuccess?: (device: WearableDevice) => void;
    };
  };
}

export interface WearableSyncScreenProps {
  navigation: any;
  route: {
    params?: {
      deviceId: string;
      syncType?: SyncType;
    };
  };
}

export interface WearableAnalyticsScreenProps {
  navigation: any;
  route: {
    params?: {
      correlationType?: CorrelationType;
    };
  };
}

// Component Props Types
export interface WearableDeviceCardProps {
  device: WearableDevice;
  onSync: () => void;
  onSettings: () => void;
  onDisconnect: () => void;
}

export interface WearablePermissionRequestProps {
  deviceType: DeviceType;
  permissions: string[];
  onGranted: () => void;
  onDenied: () => void;
}

export interface WearableSyncProgressProps {
  deviceId: string;
  progress: number;
  status: SyncStatus;
  message?: string;
  onCancel: () => void;
}

export interface WearableChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area';
  metric: MetricType;
  color?: string;
  height?: number;
}

// Utility Types
export type WearableEvent = 
  | { type: 'DEVICE_CONNECTED'; payload: WearableDevice }
  | { type: 'DEVICE_DISCONNECTED'; payload: string }
  | { type: 'SYNC_START'; payload: string }
  | { type: 'SYNC_PROGRESS'; payload: { deviceId: string; progress: number } }
  | { type: 'SYNC_COMPLETE'; payload: { deviceId: string; result: SyncResult } }
  | { type: 'SYNC_ERROR'; payload: { deviceId: string; error: string } }
  | { type: 'PERMISSION_GRANTED'; payload: WearablePermission }
  | { type: 'PERMISSION_DENIED'; payload: WearablePermission }
  | { type: 'DATA_UPDATED'; payload: HealthMetric[] };

// Action Types
export interface WearableAction {
  type: string;
  payload?: any;
}

export interface WearableState {
  devices: WearableDevice[];
  permissions: WearablePermission[];
  syncStatus: Record<string, SyncStatus>;
  healthData: HealthMetric[];
  correlationAnalysis: CorrelationAnalysis[];
  error: string | null;
  isLoading: boolean;
}

// Reducer Types
export type WearableReducer = (state: WearableState, action: WearableAction) => WearableState;

// API Service Types
export interface IWearableApiService {
  // Device Management
  getDevices(): Promise<WearableApiResponse<WearableDevice[]>>;
  connectDevice(device: Partial<WearableDevice>): Promise<WearableApiResponse<WearableDevice>>;
  disconnectDevice(deviceId: string): Promise<WearableApiResponse<boolean>>;
  
  // Data Sync
  syncDevice(deviceId: string, syncType: SyncType): Promise<WearableApiResponse<SyncResult>>;
  getSyncLogs(deviceId: string): Promise<WearableApiResponse<SyncLog[]>>;
  
  // Health Data
  getHealthData(query: HealthDataQuery): Promise<WearableApiResponse<HealthMetric[]>>;
  saveHealthData(metrics: HealthMetric[]): Promise<WearableApiResponse<HealthMetric[]>>;
  
  // Analytics
  getCorrelationAnalysis(query: CorrelationQuery): Promise<WearableApiResponse<CorrelationAnalysis[]>>;
  
  // Settings
  getDeviceSettings(deviceId: string): Promise<WearableApiResponse<DeviceSettings>>;
  updateDeviceSettings(deviceId: string, settings: DeviceSettings): Promise<WearableApiResponse<boolean>>;
  
  // User Settings
  getWearableUserSettings(userId: string): Promise<WearableApiResponse<WearableUserSettings>>;
  updateWearableUserSettings(settings: WearableUserSettings): Promise<WearableApiResponse<WearableUserSettings>>;
}

// Mock Data Types (for development)
export interface MockWearableData {
  devices: WearableDevice[];
  healthData: HealthMetric[];
  syncLogs: SyncLog[];
  correlationAnalysis: CorrelationAnalysis[];
}

// Constants
export const WEARABLE_PERMISSIONS = {
  APPLE_HEALTH: {
    read: [
      'HeartRate',
      'StepCount',
      'DistanceWalkingRunning',
      'SleepAnalysis',
      'BodyMass',
      'ActiveEnergyBurned',
      'BasalEnergyBurned',
      'FlightsClimbed',
      'AppleExerciseTime',
      'AppleStandTime',
    ],
    write: [
      'BodyMass',
      'ActiveEnergyBurned',
      'Workout',
    ],
  },
  GOOGLE_FIT: {
    scopes: [
      'activity.read',
      'activity.write',
      'fitness.activity.read',
      'fitness.activity.write',
      'fitness.body.read',
      'fitness.body.write',
    ],
  },
  FITBIT: [
    'activity',
    'heartrate',
    'sleep',
    'weight',
    'food-log',
    'profile',
    'settings',
  ],
  GARMIN: [
    'user:read',
    'user:write',
    'activity:read',
    'activity:write',
    'sleep:read',
    'sleep:write',
    'weight:read',
    'weight:write',
  ],
};

export const WEARABLE_METRICS = {
  STEPS: { unit: 'steps', icon: '👟' },
  DISTANCE: { unit: 'km', icon: '📍' },
  CALORIES: { unit: 'kcal', icon: '🔥' },
  HEART_RATE: { unit: 'bpm', icon: '❤️' },
  SLEEP_DURATION: { unit: 'hours', icon: '😴' },
  WEIGHT: { unit: 'kg', icon: '⚖️' },
  BODY_FAT: { unit: '%', icon: '📊' },
  BLOOD_PRESSURE: { unit: 'mmHg', icon: '🩸' },
  BLOOD_OXYGEN: { unit: '%', icon: '💨' },
} as const;