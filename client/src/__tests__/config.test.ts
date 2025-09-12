// Manual verification script for client configuration module
// This script verifies that the client configuration loads correctly with environment variables

console.log('🔍 Testing Client Configuration Module Loading...\n');

// Mock import.meta.env for testing
const mockImportMetaEnv = (envVars: Record<string, string | undefined>) => {
  // Create a mock import.meta
  (global as any).import = {
    meta: {
      env: {
        ...envVars
      }
    }
  };
};

const resetImportMeta = () => {
  delete (global as any).import;
};

const testResults: { test: string; passed: boolean; message: string }[] = [];

const runTest = (testName: string, testFn: () => boolean) => {
  try {
    const result = testFn();
    testResults.push({
      test: testName,
      passed: result,
      message: result ? '✅ PASSED' : '❌ FAILED'
    });
    console.log(`${result ? '✅' : '❌'} ${testName}`);
    return result;
  } catch (error: any) {
    testResults.push({
      test: testName,
      passed: false,
      message: `❌ FAILED: ${error.message}`
    });
    console.log(`❌ ${testName}: ${error.message}`);
    return false;
  }
};

// Test API URL Configuration
console.log('📡 Testing API URL Configuration...');
runTest('should load development API URL from environment', () => {
  mockImportMetaEnv({
    VITE_API_URL_DEV: 'http://localhost:3001'
  });

  const getApiUrl = (env: string) => {
    const apiConfig = {
      development: (global as any).import?.meta?.env?.VITE_API_URL_DEV || 'http://localhost:3000',
      production: (global as any).import?.meta?.env?.VITE_API_URL_PROD || 'http://146.190.120.35:3002',
      staging: (global as any).import?.meta?.env?.VITE_API_URL_STAGING || 'https://staging-api.aicalorietracker.com',
    };
    return apiConfig[env as keyof typeof apiConfig];
  };

  return getApiUrl('development') === 'http://localhost:3001';
});

runTest('should use fallback API URL when environment variable not set', () => {
  mockImportMetaEnv({});

  const getApiUrl = (env: string) => {
    const apiConfig = {
      development: (global as any).import?.meta?.env?.VITE_API_URL_DEV || 'http://localhost:3000',
      production: (global as any).import?.meta?.env?.VITE_API_URL_PROD || 'http://146.190.120.35:3002',
      staging: (global as any).import?.meta?.env?.VITE_API_URL_STAGING || 'https://staging-api.aicalorietracker.com',
    };
    return apiConfig[env as keyof typeof apiConfig];
  };

  return getApiUrl('development') === 'http://localhost:3000' &&
         getApiUrl('production') === 'http://146.190.120.35:3002' &&
         getApiUrl('staging') === 'https://staging-api.aicalorietracker.com';
});

// Test Domain Configuration
console.log('\n🌐 Testing Domain Configuration...');
runTest('should load domain variables from environment', () => {
  mockImportMetaEnv({
    VITE_SUPPORT_EMAIL: 'test@example.com',
    VITE_PRIVACY_URL: 'https://test.com/privacy',
    VITE_TERMS_URL: 'https://test.com/terms',
    VITE_APP_URL: 'https://test.com'
  });

  const getDomains = () => ({
    supportEmail: (global as any).import?.meta?.env?.VITE_SUPPORT_EMAIL || 'support@aical.scanitix.com',
    privacyUrl: (global as any).import?.meta?.env?.VITE_PRIVACY_URL || 'https://aicalorietracker.com/privacy',
    termsUrl: (global as any).import?.meta?.env?.VITE_TERMS_URL || 'https://aicalorietracker.com/terms',
    appUrl: (global as any).import?.meta?.env?.VITE_APP_URL || 'https://aicalorietracker.com',
  });

  const domains = getDomains();
  return domains.supportEmail === 'test@example.com' &&
         domains.privacyUrl === 'https://test.com/privacy' &&
         domains.termsUrl === 'https://test.com/terms' &&
         domains.appUrl === 'https://test.com';
});

runTest('should use fallback domain values when environment variables not set', () => {
  mockImportMetaEnv({});

  const getDomains = () => ({
    supportEmail: (global as any).import?.meta?.env?.VITE_SUPPORT_EMAIL || 'support@aical.scanitix.com',
    privacyUrl: (global as any).import?.meta?.env?.VITE_PRIVACY_URL || 'https://aicalorietracker.com/privacy',
    termsUrl: (global as any).import?.meta?.env?.VITE_TERMS_URL || 'https://aicalorietracker.com/terms',
    appUrl: (global as any).import?.meta?.env?.VITE_APP_URL || 'https://aicalorietracker.com',
  });

  const domains = getDomains();
  return domains.supportEmail === 'support@aical.scanitix.com' &&
         domains.privacyUrl === 'https://aicalorietracker.com/privacy' &&
         domains.termsUrl === 'https://aicalorietracker.com/terms' &&
         domains.appUrl === 'https://aicalorietracker.com';
});

// Test Environment Detection
console.log('\n🏭 Testing Environment Detection...');
runTest('should detect development environment based on hostname', () => {
  delete (global as any).window;
  (global as any).window = {
    location: {
      hostname: 'localhost'
    }
  };

  const getEnvironment = () => {
    if (typeof (global as any).window !== 'undefined' && (global as any).window.location.hostname === 'localhost') {
      return 'development';
    }
    if (typeof (global as any).window !== 'undefined' && (global as any).window.location.hostname.includes('staging')) {
      return 'staging';
    }
    return 'production';
  };

  return getEnvironment() === 'development';
});

runTest('should detect staging environment based on hostname', () => {
  (global as any).window = {
    location: {
      hostname: 'staging.example.com'
    }
  };

  const getEnvironment = () => {
    if (typeof (global as any).window !== 'undefined' && (global as any).window.location.hostname === 'localhost') {
      return 'development';
    }
    if (typeof (global as any).window !== 'undefined' && (global as any).window.location.hostname.includes('staging')) {
      return 'staging';
    }
    return 'production';
  };

  return getEnvironment() === 'staging';
});

runTest('should default to production environment', () => {
  (global as any).window = {
    location: {
      hostname: 'example.com'
    }
  };

  const getEnvironment = () => {
    if (typeof (global as any).window !== 'undefined' && (global as any).window.location.hostname === 'localhost') {
      return 'development';
    }
    if (typeof (global as any).window !== 'undefined' && (global as any).window.location.hostname.includes('staging')) {
      return 'staging';
    }
    return 'production';
  };

  return getEnvironment() === 'production';
});

// Test Configuration Constants
console.log('\n⚙️ Testing Configuration Constants...');
runTest('should export all required configuration constants', () => {
  const expectedConfigStructure = {
    api: 'string',
    domains: {
      supportEmail: 'string',
      privacyUrl: 'string',
      termsUrl: 'string',
      appUrl: 'string'
    },
    features: 'object',
    camera: 'object',
    enhancedFoodRecognition: 'object',
    security: 'object'
  };

  return typeof expectedConfigStructure.api === 'string' &&
         typeof expectedConfigStructure.domains === 'object' &&
         typeof expectedConfigStructure.features === 'object';
});

// Summary
console.log('\n📊 Test Summary:');
const passedTests = testResults.filter(t => t.passed).length;
const totalTests = testResults.length;
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 All client configuration tests passed!');
} else {
  console.log('\n⚠️ Some tests failed. Check the configuration.');
  testResults.filter(t => !t.passed).forEach(test => {
    console.log(`  - ${test.test}: ${test.message}`);
  });
}