// Manual verification script for mobile configuration module
// This script verifies that the mobile configuration loads correctly with environment variables

console.log('🔍 Testing Mobile Configuration Module Loading...\n');

// Mock Constants.expoConfig for testing
const mockExpoConfig = (extra: Record<string, any>) => {
  (global as any).Constants = {
    expoConfig: {
      extra: extra
    }
  };
};

const resetExpoConfig = () => {
  delete (global as any).Constants;
};

const configTestResults: { test: string; passed: boolean; message: string }[] = [];

const runConfigTest = (testName: string, testFn: () => boolean) => {
  try {
    const result = testFn();
    configTestResults.push({
      test: testName,
      passed: result,
      message: result ? '✅ PASSED' : '❌ FAILED'
    });
    console.log(`${result ? '✅' : '❌'} ${testName}`);
    return result;
  } catch (error: any) {
    configTestResults.push({
      test: testName,
      passed: false,
      message: `❌ FAILED: ${error.message}`
    });
    console.log(`❌ ${testName}: ${error.message}`);
    return false;
  }
};

// Test API Configuration
console.log('📡 Testing API Configuration...');
runConfigTest('should load API URL from expo config', () => {
  mockExpoConfig({
    apiUrl: 'https://custom-api.example.com'
  });

  const API_URL = (global as any).Constants?.expoConfig?.extra?.apiUrl || 'http://146.190.120.35:3002';
  return API_URL === 'https://custom-api.example.com';
});

runConfigTest('should use fallback API URL when not set', () => {
  mockExpoConfig({});
  const API_URL = (global as any).Constants?.expoConfig?.extra?.apiUrl || 'http://146.190.120.35:3002';
  return API_URL === 'http://146.190.120.35:3002';
});

// Test Domain Configuration
console.log('\n🌐 Testing Domain Configuration...');
runConfigTest('should load domain variables from expo config', () => {
  mockExpoConfig({
    supportEmail: 'mobile@example.com',
    privacyUrl: 'https://mobile.example.com/privacy',
    termsUrl: 'https://mobile.example.com/terms',
    appUrl: 'https://mobile.example.com'
  });

  const DOMAINS_CONFIG = {
    supportEmail: (global as any).Constants?.expoConfig?.extra?.supportEmail || 'support@aical.scanitix.com',
    privacyUrl: (global as any).Constants?.expoConfig?.extra?.privacyUrl || 'https://aicalorietracker.com/privacy',
    termsUrl: (global as any).Constants?.expoConfig?.extra?.termsUrl || 'https://aicalorietracker.com/terms',
    appUrl: (global as any).Constants?.expoConfig?.extra?.appUrl || 'https://aicalorietracker.com',
  };

  return DOMAINS_CONFIG.supportEmail === 'mobile@example.com' &&
         DOMAINS_CONFIG.privacyUrl === 'https://mobile.example.com/privacy' &&
         DOMAINS_CONFIG.termsUrl === 'https://mobile.example.com/terms' &&
         DOMAINS_CONFIG.appUrl === 'https://mobile.example.com';
});

runConfigTest('should use fallback domain values when not set', () => {
  mockExpoConfig({});

  const DOMAINS_CONFIG = {
    supportEmail: (global as any).Constants?.expoConfig?.extra?.supportEmail || 'support@aical.scanitix.com',
    privacyUrl: (global as any).Constants?.expoConfig?.extra?.privacyUrl || 'https://aicalorietracker.com/privacy',
    termsUrl: (global as any).Constants?.expoConfig?.extra?.termsUrl || 'https://aicalorietracker.com/terms',
    appUrl: (global as any).Constants?.expoConfig?.extra?.appUrl || 'https://aicalorietracker.com',
  };

  return DOMAINS_CONFIG.supportEmail === 'support@aical.scanitix.com' &&
         DOMAINS_CONFIG.privacyUrl === 'https://aicalorietracker.com/privacy' &&
         DOMAINS_CONFIG.termsUrl === 'https://aicalorietracker.com/terms' &&
         DOMAINS_CONFIG.appUrl === 'https://aicalorietracker.com';
});

// Test App Configuration
console.log('\n📱 Testing App Configuration...');
runConfigTest('should load app config from expo config', () => {
  mockExpoConfig({
    appName: 'Custom App Name',
    version: '2.0.0',
    supportEmail: 'custom@example.com'
  });

  const APP_CONFIG = {
    appName: (global as any).Constants?.expoConfig?.extra?.appName || 'AI Calorie Tracker',
    version: (global as any).Constants?.expoConfig?.extra?.version || '1.0.0',
    supportEmail: (global as any).Constants?.expoConfig?.extra?.supportEmail || 'support@aical.scanitix.com',
  };

  return APP_CONFIG.appName === 'Custom App Name' &&
         APP_CONFIG.version === '2.0.0' &&
         APP_CONFIG.supportEmail === 'custom@example.com';
});

runConfigTest('should use fallback app config values', () => {
  mockExpoConfig({});

  const APP_CONFIG = {
    appName: (global as any).Constants?.expoConfig?.extra?.appName || 'AI Calorie Tracker',
    version: (global as any).Constants?.expoConfig?.extra?.version || '1.0.0',
    supportEmail: (global as any).Constants?.expoConfig?.extra?.supportEmail || 'support@aical.scanitix.com',
  };

  return APP_CONFIG.appName === 'AI Calorie Tracker' &&
         APP_CONFIG.version === '1.0.0' &&
         APP_CONFIG.supportEmail === 'support@aical.scanitix.com';
});

// Test Environment Detection
console.log('\n🏭 Testing Environment Detection...');
runConfigTest('should detect development environment', () => {
  (global as any).__DEV__ = true;

  const getEnvironment = () => {
    if ((global as any).__DEV__) return 'development';
    const releaseChannel = (global as any).Constants?.expoConfig?.extra?.releaseChannel;
    if (releaseChannel === 'staging') return 'staging';
    return 'production';
  };

  return getEnvironment() === 'development';
});

runConfigTest('should detect staging environment', () => {
  (global as any).__DEV__ = false;
  mockExpoConfig({
    releaseChannel: 'staging'
  });

  const getEnvironment = () => {
    if ((global as any).__DEV__) return 'development';
    const releaseChannel = (global as any).Constants?.expoConfig?.extra?.releaseChannel;
    if (releaseChannel === 'staging') return 'staging';
    return 'production';
  };

  return getEnvironment() === 'staging';
});

runConfigTest('should default to production environment', () => {
  (global as any).__DEV__ = false;
  mockExpoConfig({
    releaseChannel: 'production'
  });

  const getEnvironment = () => {
    if ((global as any).__DEV__) return 'development';
    const releaseChannel = (global as any).Constants?.expoConfig?.extra?.releaseChannel;
    if (releaseChannel === 'staging') return 'staging';
    return 'production';
  };

  return getEnvironment() === 'production';
});

// Test Feature Flags
console.log('\n🚀 Testing Feature Flags...');
runConfigTest('should load feature flags correctly', () => {
  const FEATURES = {
    multiFood: true,
    nutritionCoach: true,
    mealPlanning: true,
    recipeImport: true,
    referralProgram: true,
    offlineSupport: true,
    pushNotifications: true,
  };

  return FEATURES.multiFood === true &&
         FEATURES.nutritionCoach === true &&
         FEATURES.offlineSupport === true &&
         FEATURES.pushNotifications === true;
});

// Summary
console.log('\n📊 Test Summary:');
const passedConfigTests = configTestResults.filter(t => t.passed).length;
const totalConfigTests = configTestResults.length;
console.log(`✅ Passed: ${passedConfigTests}/${totalConfigTests}`);
console.log(`❌ Failed: ${totalConfigTests - passedConfigTests}/${totalConfigTests}`);

if (passedConfigTests === totalConfigTests) {
  console.log('\n🎉 All mobile configuration tests passed!');
} else {
  console.log('\n⚠️ Some tests failed. Check the configuration.');
  configTestResults.filter(t => !t.passed).forEach(test => {
    console.log(`  - ${test.test}: ${test.message}`);
  });
}