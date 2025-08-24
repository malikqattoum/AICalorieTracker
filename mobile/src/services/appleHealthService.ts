import HealthData from 'react-native-health';
import {
  DeviceHeartRateData,
  DeviceSleepData,
  DeviceWeightData,
  DeviceStepsData,
  DeviceDistanceData,
  DeviceCaloriesData,
  DeviceBodyCompositionData,
  DeviceBloodPressureData,
  DeviceBloodOxygenData,
  DeviceRespiratoryRateData,
  DeviceSkinTemperatureData,
  DeviceHeartRateVariabilityData,
  DeviceWorkoutData,
  DeviceActivity,
  DataSource,
  SleepType,
  ActivityIntensity,
  WearableError,
  WearableErrorCode,
  HealthPermissions,
  HealthSteps,
  HealthSleep,
  HealthWeight,
  HealthDistance,
  HealthCalories,
  HealthWorkout
} from '../types/wearable';

export class AppleHealthService {
  private health: any;
  private isInitialized: boolean = false;
  private permissions: HealthPermissions = {
    permissions: {
      read: [],
      write: [],
    },
  };

  constructor() {
    // HealthData is a singleton, so we don't need to instantiate it
    this.health = HealthData;
  }

  /**
   * Initialize Apple Health service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.health.initialize();
      this.isInitialized = true;
      console.log('Apple Health service initialized successfully');
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.UNKNOWN_ERROR,
        message: 'Failed to initialize Apple Health service',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Request permissions for Apple Health data access
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const readPermissions = [
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
        'BloodPressureSystolic',
        'BloodPressureDiastolic',
        'BodyFatPercentage',
        'LeanBodyMass',
        'OxygenSaturation',
        'RespiratoryRate',
        'SkinTemperature',
        'HeartRateVariabilitySDNN',
        'RestingHeartRate',
        'WalkingHeartRateAverage',
        'EnvironmentalAudioExposure',
        'HeadphoneAudioExposure',
        'AppleStandHour',
        'AppleExerciseMinute',
        'AppleMoveMinute',
        'SleepAnalysis',
        'MindfulSession',
        'MenstrualCycle',
        'Electrocardiogram',
        'WaistCircumference',
        'HipCircumference',
        'WaistToHipRatio',
        'WaistToHeightRatio',
        'BodyMassIndex',
        'BodyWater',
        'BoneMass',
        'MuscleMass',
        'VisceralFat',
        'Protein',
        'Carbohydrates',
        'Fat',
        'Cholesterol',
        'BloodGlucose',
        'BloodAlcoholContent',
        'BloodUreaNitrogen',
        'Calcium',
        'Chloride',
        'Creatinine',
        'Iron',
        'Potassium',
        'Sodium',
        'Thyroxine',
        'UricAcid',
        'VitaminB12',
        'VitaminD',
        'Zinc',
      ];

      const writePermissions = [
        'BodyMass',
        'ActiveEnergyBurned',
        'Workout',
        'SleepAnalysis',
        'MindfulSession',
        'WaistCircumference',
        'HipCircumference',
        'BodyMassIndex',
        'BodyWater',
        'BoneMass',
        'MuscleMass',
        'VisceralFat',
        'Protein',
        'Carbohydrates',
        'Fat',
        'Cholesterol',
        'BloodGlucose',
        'BloodAlcoholContent',
        'BloodUreaNitrogen',
        'Calcium',
        'Chloride',
        'Creatinine',
        'Iron',
        'Potassium',
        'Sodium',
        'Thyroxine',
        'UricAcid',
        'VitaminB12',
        'VitaminD',
        'Zinc',
      ];

      this.permissions = {
        permissions: {
          read: readPermissions,
          write: writePermissions,
        },
      };

      const granted = await this.health.requestAuthorization(this.permissions);
      
      if (granted) {
        console.log('Apple Health permissions granted');
        return true;
      } else {
        console.log('Apple Health permissions denied');
        return false;
      }
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.PERMISSION_DENIED,
        message: 'Failed to request Apple Health permissions',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if Apple Health is authorized
   */
  async isAuthorized(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const authorized = await this.health.isAuthorized();
      return authorized;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.AUTH_FAILED,
        message: 'Failed to check Apple Health authorization',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get heart rate data
   */
  async getHeartRateData(startDate: Date, endDate: Date): Promise<DeviceHeartRateData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const heartRateData = await this.health.getHeartRateData({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return heartRateData.map((data: any) => ({
        id: `hr_${data.uuid}`,
        userId: 'current_user', // Will be populated from auth context
        deviceId: 'apple_health',
        heartRate: data.value,
        timestamp: new Date(data.startDate),
        recordedAt: new Date(data.endDate),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        workoutId: data.metadata?.workout,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch heart rate data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get steps data
   */
  async getStepsData(startDate: Date, endDate: Date): Promise<DeviceStepsData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const stepsData = await this.health.getStepsData({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return stepsData.map((data: HealthSteps) => ({
        id: `steps_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        steps: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        workoutId: data.metadata?.workoutId,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch steps data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get sleep data
   */
  async getSleepData(startDate: Date, endDate: Date): Promise<DeviceSleepData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const sleepData = await this.health.getSleepData({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return sleepData.map((data: HealthSleep) => {
        let sleepType: SleepType;
        switch (data.value) {
          case 'Awake':
            sleepType = 'awake';
            break;
          case 'REM':
            sleepType = 'rem';
            break;
          case 'Core':
            sleepType = 'light';
            break;
          case 'Deep':
            sleepType = 'deep';
            break;
          default:
            sleepType = 'light';
        }

        return {
          id: `sleep_${data.uuid}`,
          userId: 'current_user',
          deviceId: 'apple_health',
          sleepType,
          startTime: new Date(data.startDate),
          endTime: new Date(data.endDate),
          duration: new Date(data.endDate).getTime() - new Date(data.startDate).getTime(),
          quality: data.metadata?.quality || 0.8,
          confidence: data.metadata?.confidence || 0.95,
          stages: data.metadata?.stages || {},
          metadata: {
            source: 'Apple Health',
            uuid: data.uuid,
            device: data.device,
            metadata: data.metadata,
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch sleep data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get weight data
   */
  async getWeightData(startDate: Date, endDate: Date): Promise<DeviceWeightData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const weightData = await this.health.getWeightData({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return weightData.map((data: HealthWeight) => ({
        id: `weight_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        weight: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch weight data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get distance data
   */
  async getDistanceData(startDate: Date, endDate: Date): Promise<DeviceDistanceData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const distanceData = await this.health.getDistanceData({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return distanceData.map((data: HealthDistance) => ({
        id: `distance_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        distance: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        workoutId: data.metadata?.workoutId,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch distance data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get calories data
   */
  async getCaloriesData(startDate: Date, endDate: Date): Promise<DeviceCaloriesData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const activeCaloriesData = await this.health.getActiveEnergyBurned({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const basalCaloriesData = await this.health.getBasalEnergyBurned({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const totalCaloriesData = [...activeCaloriesData, ...basalCaloriesData].map((data: HealthCalories) => ({
        id: `calories_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        calories: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        workoutId: data.metadata?.workoutId,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
          type: data.metadata?.type || 'active',
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      return totalCaloriesData;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch calories data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Save weight data
   */
  async saveWeightData(weight: number, date: Date): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const result = await this.health.saveWeight({
        weight,
        date: date.toISOString(),
        unit: 'kg',
      });

      return result;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to save weight data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Save workout data
   */
  async saveWorkoutData(workout: DeviceWorkoutData): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const result = await this.health.saveWorkout({
        activityType: workout.workoutType,
        startDate: workout.startTime.toISOString(),
        endDate: workout.endTime?.toISOString(),
        duration: workout.duration,
        energyBurned: workout.calories,
        distance: workout.distance,
        metadata: workout.metadata,
      });

      return result;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to save workout data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get body composition data
   */
  async getBodyCompositionData(startDate: Date, endDate: Date): Promise<DeviceBodyCompositionData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const bodyFatData = await this.health.getBodyFatPercentage({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const leanBodyMassData = await this.health.getLeanBodyMass({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const bodyWaterData = await this.health.getBodyWaterPercentage({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const boneMassData = await this.health.getBoneMass({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const muscleMassData = await this.health.getMuscleMass({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const visceralFatData = await this.health.getVisceralFat({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const bmiData = await this.health.getBodyMassIndex({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      // Combine all body composition data
      const allData = [
        ...bodyFatData.map((data: any) => ({ ...data, type: 'bodyFat' })),
        ...leanBodyMassData.map((data: any) => ({ ...data, type: 'leanBodyMass' })),
        ...bodyWaterData.map((data: any) => ({ ...data, type: 'bodyWater' })),
        ...boneMassData.map((data: any) => ({ ...data, type: 'boneMass' })),
        ...muscleMassData.map((data: any) => ({ ...data, type: 'muscleMass' })),
        ...visceralFatData.map((data: any) => ({ ...data, type: 'visceralFat' })),
        ...bmiData.map((data: any) => ({ ...data, type: 'bmi' })),
      ];

      return allData.map((data: any) => {
        let weight = 0;
        let bodyFat = 0;
        let muscleMass = 0;
        let boneMass = 0;
        let bodyWater = 0;
        let visceralFat = 0;
        let bmi = 0;

        switch (data.type) {
          case 'bodyFat':
            bodyFat = data.value;
            break;
          case 'leanBodyMass':
            muscleMass = data.value;
            break;
          case 'bodyWater':
            bodyWater = data.value;
            break;
          case 'boneMass':
            boneMass = data.value;
            break;
          case 'muscleMass':
            muscleMass = data.value;
            break;
          case 'visceralFat':
            visceralFat = data.value;
            break;
          case 'bmi':
            bmi = data.value;
            break;
        }

        return {
          id: `body_comp_${data.uuid}`,
          userId: 'current_user',
          deviceId: 'apple_health',
          weight: weight,
          bodyFat: bodyFat,
          muscleMass: muscleMass,
          boneMass: boneMass,
          bodyWater: bodyWater,
          visceralFat: visceralFat,
          bmi: bmi,
          timestamp: new Date(data.date),
          recordedAt: new Date(data.date),
          confidence: data.metadata?.confidence || 0.95,
          source: 'automatic' as DataSource,
          metadata: {
            source: 'Apple Health',
            uuid: data.uuid,
            device: data.device,
            metadata: data.metadata,
            type: data.type,
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch body composition data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get blood pressure data
   */
  async getBloodPressureData(startDate: Date, endDate: Date): Promise<DeviceBloodPressureData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const systolicData = await this.health.getBloodPressureSystolic({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      const diastolicData = await this.health.getBloodPressureDiastolic({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      // Combine systolic and diastolic data
      const combinedData = systolicData.map((systolic: any, index: number) => {
        const diastolic = diastolicData[index];
        return {
          ...systolic,
          diastolic: diastolic?.value || 0,
        };
      });

      return combinedData.map((data: any) => ({
        id: `bp_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        systolic: data.value,
        diastolic: data.diastolic,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch blood pressure data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get blood oxygen data
   */
  async getBloodOxygenData(startDate: Date, endDate: Date): Promise<DeviceBloodOxygenData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const bloodOxygenData = await this.health.getOxygenSaturation({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return bloodOxygenData.map((data: any) => ({
        id: `spo2_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        bloodOxygen: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch blood oxygen data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get respiratory rate data
   */
  async getRespiratoryRateData(startDate: Date, endDate: Date): Promise<DeviceRespiratoryRateData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const respiratoryRateData = await this.health.getRespiratoryRate({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return respiratoryRateData.map((data: any) => ({
        id: `rr_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        respiratoryRate: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch respiratory rate data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get skin temperature data
   */
  async getSkinTemperatureData(startDate: Date, endDate: Date): Promise<DeviceSkinTemperatureData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const skinTemperatureData = await this.health.getSkinTemperature({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return skinTemperatureData.map((data: any) => ({
        id: `skin_temp_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        skinTemperature: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch skin temperature data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get heart rate variability data
   */
  async getHeartRateVariabilityData(startDate: Date, endDate: Date): Promise<DeviceHeartRateVariabilityData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const hrvData = await this.health.getHeartRateVariabilitySDNN({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return hrvData.map((data: any) => ({
        id: `hrv_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        heartRateVariability: data.value,
        timestamp: new Date(data.date),
        recordedAt: new Date(data.date),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch heart rate variability data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get workout data
   */
  async getWorkoutData(startDate: Date, endDate: Date): Promise<DeviceWorkoutData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const workoutData = await this.health.getWorkoutData({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      });

      return workoutData.map((data: HealthWorkout) => ({
        id: `workout_${data.uuid}`,
        userId: 'current_user',
        deviceId: 'apple_health',
        workoutType: data.activityType,
        startTime: new Date(data.startDate),
        endTime: new Date(data.endDate),
        duration: new Date(data.endDate).getTime() - new Date(data.startDate).getTime(),
        calories: data.energyBurned,
        distance: data.distance,
        steps: data.steps,
        heartRate: data.heartRateAverage,
        averageHeartRate: data.heartRateAverage,
        maxHeartRate: data.heartRateMax,
        minHeartRate: data.heartRateMin,
        elevationGain: data.elevationAscended,
        elevationLoss: data.elevationDescended,
        activities: data.activities,
        exercises: data.exercises,
        timestamp: new Date(data.startDate),
        confidence: data.metadata?.confidence || 0.95,
        source: 'automatic' as DataSource,
        workoutId: data.uuid,
        metadata: {
          source: 'Apple Health',
          uuid: data.uuid,
          device: data.device,
          metadata: data.metadata,
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch workout data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get activity data
   */
  async getActivityData(startDate: Date, endDate: Date): Promise<DeviceActivity[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const workoutData = await this.getWorkoutData(startDate, endDate);
      const stepsData = await this.getStepsData(startDate, endDate);
      const distanceData = await this.getDistanceData(startDate, endDate);
      const caloriesData = await this.getCaloriesData(startDate, endDate);

      // Combine all activity data
      const allActivityData = [
        ...workoutData.map((data: DeviceWorkoutData) => ({
          ...data,
          activityType: data.workoutType,
          intensity: 'high' as ActivityIntensity,
          duration: data.duration,
          calories: data.calories,
          distance: data.distance,
          steps: data.steps,
          heartRate: data.heartRate,
          startTime: data.startTime,
        })),
        ...stepsData.map((data: DeviceStepsData) => ({
          ...data,
          activityType: 'walking',
          intensity: 'medium' as ActivityIntensity,
          duration: 0,
          calories: 0,
          distance: 0,
          steps: data.steps,
          heartRate: 0,
          startTime: data.timestamp,
        })),
        ...distanceData.map((data: DeviceDistanceData) => ({
          ...data,
          activityType: 'walking',
          intensity: 'medium' as ActivityIntensity,
          duration: 0,
          calories: 0,
          distance: data.distance,
          steps: 0,
          heartRate: 0,
          startTime: data.timestamp,
        })),
        ...caloriesData.map((data: DeviceCaloriesData) => ({
          ...data,
          activityType: 'general',
          intensity: 'low' as ActivityIntensity,
          duration: 0,
          calories: data.calories,
          distance: 0,
          steps: 0,
          heartRate: 0,
          startTime: data.timestamp,
        })),
      ];

      return allActivityData;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch activity data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get all available health data
   */
  async getAllHealthData(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const [
        heartRateData,
        stepsData,
        sleepData,
        weightData,
        distanceData,
        caloriesData,
        bodyCompositionData,
        bloodPressureData,
        bloodOxygenData,
        respiratoryRateData,
        skinTemperatureData,
        heartRateVariabilityData,
        workoutData,
        activityData,
      ] = await Promise.all([
        this.getHeartRateData(startDate, endDate),
        this.getStepsData(startDate, endDate),
        this.getSleepData(startDate, endDate),
        this.getWeightData(startDate, endDate),
        this.getDistanceData(startDate, endDate),
        this.getCaloriesData(startDate, endDate),
        this.getBodyCompositionData(startDate, endDate),
        this.getBloodPressureData(startDate, endDate),
        this.getBloodOxygenData(startDate, endDate),
        this.getRespiratoryRateData(startDate, endDate),
        this.getSkinTemperatureData(startDate, endDate),
        this.getHeartRateVariabilityData(startDate, endDate),
        this.getWorkoutData(startDate, endDate),
        this.getActivityData(startDate, endDate),
      ]);

      return [
        ...heartRateData,
        ...stepsData,
        ...sleepData,
        ...weightData,
        ...distanceData,
        ...caloriesData,
        ...bodyCompositionData,
        ...bloodPressureData,
        ...bloodOxygenData,
        ...respiratoryRateData,
        ...skinTemperatureData,
        ...heartRateVariabilityData,
        ...workoutData,
        ...activityData,
      ];
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch all health data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get health data summary for a date range
   */
  async getHealthSummary(startDate: Date, endDate: Date): Promise<any> {
    try {
      const allData = await this.getAllHealthData(startDate, endDate);

      const summary = {
        totalSteps: allData
          .filter((data: any) => data.steps)
          .reduce((sum: number, data: any) => sum + data.steps, 0),
        totalDistance: allData
          .filter((data: any) => data.distance)
          .reduce((sum: number, data: any) => sum + data.distance, 0),
        totalCalories: allData
          .filter((data: any) => data.calories)
          .reduce((sum: number, data: any) => sum + data.calories, 0),
        averageHeartRate: allData
          .filter((data: any) => data.heartRate)
          .reduce((sum: number, data: any, _, arr) => sum + data.heartRate / arr.length, 0),
        totalSleepDuration: allData
          .filter((data: any) => data.duration)
          .reduce((sum: number, data: any) => sum + data.duration, 0),
        currentWeight: allData
          .filter((data: any) => data.weight)
          .pop()?.weight || 0,
        currentBodyFat: allData
          .filter((data: any) => data.bodyFat)
          .pop()?.bodyFat || 0,
        currentBMI: allData
          .filter((data: any) => data.bmi)
          .pop()?.bmi || 0,
        totalWorkouts: allData
          .filter((data: any) => data.workoutType)
          .length,
        totalActivities: allData
          .filter((data: any) => data.activityType)
          .length,
      };

      return summary;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch health summary',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if specific health data type is available
   */
  async isDataTypeAvailable(dataType: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const availableDataTypes = await this.health.getAvailableDataTypes();
      return availableDataTypes.includes(dataType);
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to check data type availability',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get available data types
   */
  async getAvailableDataTypes(): Promise<string[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const availableDataTypes = await this.health.getAvailableDataTypes();
      return availableDataTypes;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch available data types',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get health data statistics
   */
  async getHealthStatistics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const summary = await this.getHealthSummary(startDate, endDate);
      const availableDataTypes = await this.getAvailableDataTypes();

      return {
        summary,
        availableDataTypes,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        totalDataPoints: summary.totalSteps + summary.totalDistance + summary.totalCalories,
      };
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch health statistics',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Export health data
   */
  async exportHealthData(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const allData = await this.getAllHealthData(startDate, endDate);

      if (format === 'json') {
        return JSON.stringify(allData, null, 2);
      } else if (format === 'csv') {
        // Convert to CSV format
        const headers = Object.keys(allData[0] || {});
        const csvHeaders = headers.join(',');
        const csvRows = allData.map((row: any) => 
          headers.map(header => row[header]).join(',')
        );
        return [csvHeaders, ...csvRows].join('\n');
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to export health data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get health insights
   */
  async getHealthInsights(startDate: Date, endDate: Date): Promise<any> {
    try {
      const summary = await this.getHealthSummary(startDate, endDate);
      const statistics = await this.getHealthStatistics(startDate, endDate);

      const insights = {
        trends: {
          steps: summary.totalSteps > 10000 ? 'Good' : summary.totalSteps > 5000 ? 'Fair' : 'Poor',
          calories: summary.totalCalories > 2000 ? 'High' : summary.totalCalories > 1000 ? 'Medium' : 'Low',
          sleep: summary.totalSleepDuration > 7 * 60 * 60 * 1000 ? 'Good' : summary.totalSleepDuration > 5 * 60 * 60 * 1000 ? 'Fair' : 'Poor',
          weight: summary.currentWeight > 0 ? 'Recorded' : 'Not recorded',
        },
        recommendations: [
          summary.totalSteps < 10000 && 'Try to walk more steps each day',
          summary.totalSleepDuration < 7 * 60 * 60 * 1000 && 'Get more sleep for better health',
          summary.currentWeight === 0 && 'Record your weight for better tracking',
          summary.averageHeartRate > 100 && 'Consider consulting a doctor about your heart rate',
        ].filter(Boolean),
        achievements: [
          summary.totalSteps >= 10000 && 'Daily step goal achieved!',
          summary.totalSleepDuration >= 8 * 60 * 60 * 1000 && 'Great sleep duration!',
          summary.totalWorkouts >= 3 && 'Active week!',
        ].filter(Boolean),
      };

      return {
        insights,
        summary,
        statistics,
      };
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to generate health insights',
        details: error,
        timestamp: new Date()
      });
    }
  }
}

// Export singleton instance
export const appleHealthService = new AppleHealthService();
export default appleHealthService;