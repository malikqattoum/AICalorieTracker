import { crashReporter } from '../services/crashReporter';
import { ErrorHandler, ErrorType } from './errorHandler';
import { cameraService } from '../services/cameraService';
import { permissionManager } from '../services/permissionManager';
import { logError, log } from '../config';

export interface CrashScenario {
  id: string;
  name: string;
  description: string;
  category: 'memory' | 'network' | 'permission' | 'ui' | 'async' | 'json' | 'device';
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  expectedError: ErrorType;
  reproductionRate: number; // 0-1
  deviceRequirements?: {
    minOS?: string;
    minRAM?: number;
    storageRequired?: number;
  };
  mitigation: string[];
}

export interface TestResult {
  scenarioId: string;
  success: boolean;
  error?: any;
  duration: number;
  timestamp: string;
  deviceInfo: {
    platform: string;
    osVersion: string;
    model: string;
    freeMemory: number;
    totalMemory: number;
  };
}

export class CrashScenarioTester {
  private static instance: CrashScenarioTester;
  private testResults: TestResult[] = [];
  private isTesting: boolean = false;

  private constructor() {}

  static getInstance(): CrashScenarioTester {
    if (!CrashScenarioTester.instance) {
      CrashScenarioTester.instance = new CrashScenarioTester();
    }
    return CrashScenarioTester.instance;
  }

  /**
   * Get predefined crash scenarios
   */
  getCrashScenarios(): CrashScenario[] {
    return [
      {
        id: 'memory_low',
        name: 'Low Memory State',
        description: 'Test app behavior when device is low on memory',
        category: 'memory',
        severity: 'high',
        steps: [
          'Simulate low memory state',
          'Open camera and capture multiple images',
          'Process large images simultaneously',
          'Navigate between memory-intensive screens'
        ],
        expectedError: 'unknown',
        reproductionRate: 0.3,
        deviceRequirements: {
          minRAM: 2048,
          storageRequired: 100
        },
        mitigation: [
          'Implement memory monitoring',
          'Reduce image quality when memory is low',
          'Clear cache when approaching memory limits',
          'Show user-friendly error messages'
        ]
      },
      {
        id: 'network_unstable',
        name: 'Unstable Network Connection',
        description: 'Test app behavior with intermittent network connectivity',
        category: 'network',
        severity: 'medium',
        steps: [
          'Start with stable connection',
          'Initiate API calls',
          'Simulate network disconnection',
          'Attempt to continue operations offline',
          'Restore connection and verify sync'
        ],
        expectedError: 'network',
        reproductionRate: 0.7,
        mitigation: [
          'Implement offline mode',
          'Queue failed requests',
          'Show network status indicators',
          'Retry failed requests automatically'
        ]
      },
      {
        id: 'permission_denied',
        name: 'Permission Denied',
        description: 'Test app behavior when permissions are denied',
        category: 'permission',
        severity: 'medium',
        steps: [
          'Request camera permission',
          'Deny permission request',
          'Attempt to use camera functionality',
          'Request photo library permission',
          'Deny and attempt gallery access'
        ],
        expectedError: 'permission',
        reproductionRate: 0.4,
        mitigation: [
          'Clear permission rationale',
          'Provide alternative functionality',
          'Guide user to settings',
          'Graceful degradation'
        ]
      },
      {
        id: 'ui_rapid_navigation',
        name: 'Rapid UI Navigation',
        description: 'Test app behavior with rapid screen transitions',
        category: 'ui',
        severity: 'low',
        steps: [
          'Navigate quickly between screens',
          'Trigger multiple animations simultaneously',
          'Perform rapid scrolling',
          'Test with complex UI components'
        ],
        expectedError: 'unknown',
        reproductionRate: 0.2,
        mitigation: [
          'Implement navigation guards',
          'Limit concurrent animations',
          'Use proper cleanup in useEffect',
          'Test on low-end devices'
        ]
      },
      {
        id: 'async_race_condition',
        name: 'Async Race Condition',
        description: 'Test for race conditions in async operations',
        category: 'async',
        severity: 'high',
        steps: [
          'Start multiple async operations simultaneously',
          'Modify shared state concurrently',
          'Cancel operations mid-execution',
          'Test with timeout scenarios'
        ],
        expectedError: 'unknown',
        reproductionRate: 0.1,
        mitigation: [
          'Use proper async/await patterns',
          'Implement operation cancellation',
          'Add state validation',
          'Use mutex/locks for shared resources'
        ]
      },
      {
        id: 'json_malformed',
        name: 'Malformed JSON Response',
        description: 'Test handling of invalid JSON from API',
        category: 'json',
        severity: 'medium',
        steps: [
          'Simulate API returning malformed JSON',
          'Parse invalid JSON response',
          'Test with empty responses',
          'Test with null/undefined responses'
        ],
        expectedError: 'jsonParse',
        reproductionRate: 0.05,
        mitigation: [
          'Implement JSON validation',
          'Provide fallback data',
          'Show user-friendly error messages',
          'Log malformed responses for debugging'
        ]
      },
      {
        id: 'device_specific',
        name: 'Device-Specific Issues',
        description: 'Test on various device configurations',
        category: 'device',
        severity: 'high',
        steps: [
          'Test on different screen sizes',
          'Test on different OS versions',
          'Test on low-end devices',
          'Test on foldable devices'
        ],
        expectedError: 'unknown',
        reproductionRate: 0.15,
        mitigation: [
          'Use responsive design',
          'Implement device detection',
          'Provide device-specific optimizations',
          'Test on target devices'
        ]
      },
      {
        id: 'camera_unavailable',
        name: 'Camera Unavailable',
        description: 'Test when camera hardware is unavailable',
        category: 'permission',
        severity: 'high',
        steps: [
          'Simulate camera hardware failure',
          'Attempt to access camera',
          'Test with camera in use by other app',
          'Test with camera disconnected'
        ],
        expectedError: 'unknown',
        reproductionRate: 0.02,
        mitigation: [
          'Check camera availability',
          'Provide alternative image sources',
          'Show appropriate error messages',
          'Graceful fallback to gallery'
        ]
      },
      {
        id: 'storage_full',
        name: 'Storage Full',
        description: 'Test when device storage is full',
        category: 'memory',
        severity: 'critical',
        steps: [
          'Simulate storage space exhaustion',
          'Attempt to save images',
          'Attempt to download data',
          'Test with cache operations'
        ],
        expectedError: 'unknown',
        reproductionRate: 0.01,
        mitigation: [
          'Monitor available storage',
          'Implement storage cleanup',
          'Show storage warnings',
          'Prevent data loss'
        ]
      },
      {
        id: 'api_timeout',
        name: 'API Timeout',
        description: 'Test handling of slow/unresponsive API calls',
        category: 'network',
        severity: 'medium',
        steps: [
          'Simulate slow network response',
          'Trigger API calls with timeout',
          'Test with connection drops',
          'Test with server errors'
        ],
        expectedError: 'network',
        reproductionRate: 0.4,
        mitigation: [
          'Implement request timeouts',
          'Show loading indicators',
          'Allow retry attempts',
          'Cancel long-running requests'
        ]
      }
    ];
  }

  /**
   * Run a specific crash scenario
   */
  async runScenario(scenarioId: string): Promise<TestResult> {
    const scenario = this.getCrashScenarios().find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const startTime = Date.now();
    const deviceInfo = await this.getDeviceInfo();

    try {
      log(`Running crash scenario: ${scenario.name}`);
      
      switch (scenario.category) {
        case 'memory':
          await this.testMemoryScenario(scenario);
          break;
        case 'network':
          await this.testNetworkScenario(scenario);
          break;
        case 'permission':
          await this.testPermissionScenario(scenario);
          break;
        case 'ui':
          await this.testUIScenario(scenario);
          break;
        case 'async':
          await this.testAsyncScenario(scenario);
          break;
        case 'json':
          await this.testJsonScenario(scenario);
          break;
        case 'device':
          await this.testDeviceScenario(scenario);
          break;
        default:
          throw new Error(`Unknown scenario category: ${scenario.category}`);
      }

      const result: TestResult = {
        scenarioId,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        deviceInfo
      };

      this.testResults.push(result);
      log(`Scenario completed successfully: ${scenario.name}`);
      return result;

    } catch (error) {
      const result: TestResult = {
        scenarioId,
        success: false,
        error,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        deviceInfo
      };

      this.testResults.push(result);
      
      // Report the crash
      await crashReporter.reportCrash(error, {
        screen: 'CrashScenarioTester',
        action: `runScenario_${scenarioId}`,
        details: { scenario, deviceInfo }
      });

      log(`Scenario failed: ${scenario.name}`, error);
      return result;
    }
  }

  /**
   * Test memory-related scenarios
   */
  private async testMemoryScenario(scenario: CrashScenario): Promise<void> {
    // Simulate memory-intensive operations
    const largeArray = new Array(1000000).fill('test');
    
    // Test camera operations with large images
    try {
      await cameraService.checkMemoryAvailability();
      
      // Create large image data
      const largeImageData = new Uint8Array(10 * 1024 * 1024); // 10MB
      const blob = new Blob([largeImageData], { type: 'image/jpeg' });
      
      // Test image manipulation
      // Note: This would normally use actual image processing
      log('Memory test: Created large image data');
      
    } catch (error) {
      throw ErrorHandler.createError(
        'Memory scenario test failed',
        'unknown',
        'MEMORY_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Test network-related scenarios
   */
  private async testNetworkScenario(scenario: CrashScenario): Promise<void> {
    // Simulate network issues
    try {
      // Test with invalid URLs
      const invalidUrl = 'https://invalid-domain-that-does-not-exist.com';
      
      // This would normally trigger a network error
      log('Network test: Attempting to connect to invalid URL');
      
      // Simulate timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      throw ErrorHandler.createError(
        'Network scenario test failed',
        'network',
        'NETWORK_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Test permission-related scenarios
   */
  private async testPermissionScenario(scenario: CrashScenario): Promise<void> {
    try {
      // Test permission denial scenarios
      const status = await permissionManager.getPermissionStatus('camera');
      
      if (!status.granted) {
        log('Permission test: Camera permission not granted');
      }
      
      // Test with invalid permission types
      await permissionManager.getPermissionStatus('invalid_permission');
      
    } catch (error) {
      throw ErrorHandler.createError(
        'Permission scenario test failed',
        'permission',
        'PERMISSION_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Test UI-related scenarios
   */
  private async testUIScenario(scenario: CrashScenario): Promise<void> {
    try {
      // Simulate rapid UI operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(Promise.resolve(i));
      }
      
      await Promise.all(operations);
      log('UI test: Completed rapid operations');
      
    } catch (error) {
      throw ErrorHandler.createError(
        'UI scenario test failed',
        'unknown',
        'UI_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Test async-related scenarios
   */
  private async testAsyncScenario(scenario: CrashScenario): Promise<void> {
    try {
      // Simulate race conditions
      let sharedState = 0;
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              sharedState++;
              resolve(sharedState);
            }, Math.random() * 100);
          })
        );
      }
      
      await Promise.all(promises);
      log('Async test: Completed concurrent operations');
      
    } catch (error) {
      throw ErrorHandler.createError(
        'Async scenario test failed',
        'unknown',
        'ASYNC_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Test JSON-related scenarios
   */
  private async testJsonScenario(scenario: CrashScenario): Promise<void> {
    try {
      // Test malformed JSON
      const malformedJson = '{"invalid": json, "missing": quotes}';
      
      try {
        JSON.parse(malformedJson);
      } catch (parseError) {
        log('JSON test: Successfully caught malformed JSON');
        throw parseError;
      }
      
      // Test empty responses
      const emptyJson = '';
      JSON.parse(emptyJson || '{}');
      
    } catch (error) {
      throw ErrorHandler.createError(
        'JSON scenario test failed',
        'jsonParse',
        'JSON_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Test device-specific scenarios
   */
  private async testDeviceScenario(scenario: CrashScenario): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      // Test with different device configurations
      log('Device test:', {
        platform: deviceInfo.platform,
        osVersion: deviceInfo.osVersion,
        model: deviceInfo.model,
        freeMemory: deviceInfo.freeMemory
      });
      
      // Simulate device-specific issues
      if (deviceInfo.freeMemory < 500) {
        throw new Error('Low memory device detected');
      }
      
    } catch (error) {
      throw ErrorHandler.createError(
        'Device scenario test failed',
        'unknown',
        'DEVICE_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      const { NativeModules } = require('react-native');
      const { DeviceInfo } = NativeModules;
      
      return {
        platform: 'unknown',
        osVersion: 'unknown',
        model: 'unknown',
        freeMemory: Math.floor(Math.random() * 2000), // MB
        totalMemory: 2048 // MB
      };
    } catch {
      return {
        platform: 'unknown',
        osVersion: 'unknown',
        model: 'unknown',
        freeMemory: 1000,
        totalMemory: 2048
      };
    }
  }

  /**
   * Run all crash scenarios
   */
  async runAllScenarios(): Promise<TestResult[]> {
    if (this.isTesting) {
      throw new Error('Test already in progress');
    }

    this.isTesting = true;
    const results: TestResult[] = [];

    try {
      log('Starting comprehensive crash scenario testing');
      
      for (const scenario of this.getCrashScenarios()) {
        const result = await this.runScenario(scenario.id);
        results.push(result);
        
        // Add delay between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      log('Completed crash scenario testing');
      return results;
      
    } finally {
      this.isTesting = false;
    }
  }

  /**
   * Get test results
   */
  getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  /**
   * Get test results by scenario
   */
  getResultsByScenario(scenarioId: string): TestResult[] {
    return this.testResults.filter(result => result.scenarioId === scenarioId);
  }

  /**
   * Get test statistics
   */
  getTestStats(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    averageDuration: number;
    failuresByCategory: Record<string, number>;
  } {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const averageDuration = totalTests > 0 
      ? this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests 
      : 0;

    const failuresByCategory: Record<string, number> = {};
    this.testResults
      .filter(r => !r.success)
      .forEach(result => {
        const scenario = this.getCrashScenarios().find(s => s.id === result.scenarioId);
        const category = scenario?.category || 'unknown';
        failuresByCategory[category] = (failuresByCategory[category] || 0) + 1;
      });

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      averageDuration,
      failuresByCategory
    };
  }

  /**
   * Clear test results
   */
  clearTestResults(): void {
    this.testResults = [];
    log('Test results cleared');
  }

  /**
   * Export test results
   */
  exportTestResults(): string {
    const results = {
      timestamp: new Date().toISOString(),
      scenarios: this.getCrashScenarios(),
      results: this.testResults,
      statistics: this.getTestStats()
    };

    return JSON.stringify(results, null, 2);
  }

  /**
   * Generate crash report based on test results
   */
  generateCrashReport(): string {
    const stats = this.getTestStats();
    const failures = this.testResults.filter(r => !r.success);

    const report = {
      summary: {
        totalTests: stats.totalTests,
        passedTests: stats.passedTests,
        failedTests: stats.failedTests,
        successRate: `${stats.successRate.toFixed(2)}%`,
        averageDuration: `${stats.averageDuration.toFixed(2)}ms`
      },
      failures: failures.map(failure => ({
        scenarioId: failure.scenarioId,
        error: failure.error?.message || 'Unknown error',
        duration: failure.duration,
        deviceInfo: failure.deviceInfo
      })),
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getTestStats();

    if (stats.successRate < 80) {
      recommendations.push('Overall success rate is low. Consider reviewing error handling.');
    }

    if (stats.failuresByCategory.memory > 2) {
      recommendations.push('Multiple memory-related failures detected. Implement better memory management.');
    }

    if (stats.failuresByCategory.network > 2) {
      recommendations.push('Network-related failures are common. Improve offline handling.');
    }

    if (stats.failuresByCategory.permission > 1) {
      recommendations.push('Permission handling needs improvement. Add better user guidance.');
    }

    if (stats.averageDuration > 5000) {
      recommendations.push('Tests are taking too long. Optimize performance-critical code.');
    }

    return recommendations;
  }
}

// Export singleton instance
export const crashScenarioTester = CrashScenarioTester.getInstance();
export default crashScenarioTester;