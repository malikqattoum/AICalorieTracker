// Manual verification script for mobile app.json configuration
// This script verifies that app.json uses environment variables correctly

console.log('🔍 Testing Mobile App.json Configuration...\n');

// Mock process.env for testing
const mockEnv = (envVars: Record<string, string | undefined>) => {
  Object.assign(process.env, envVars);
};

const resetEnv = () => {
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
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

// Test app.json structure
console.log('📱 Testing App.json Structure...');
runTest('should have valid app.json structure', () => {
  // Read and validate app.json structure
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);

    // Check required fields
    return !!(
      appJson.expo &&
      appJson.expo.name &&
      appJson.expo.slug &&
      appJson.expo.version &&
      appJson.expo.extra
    );
  } catch (error) {
    return false;
  }
});

// Test environment variable usage in app.json
console.log('\n🌍 Testing Environment Variable Usage...');
runTest('should use EXPO_PUBLIC_API_URL environment variable', () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');

    // Check if app.json contains the environment variable reference
    return appJsonContent.includes('"${EXPO_PUBLIC_API_URL}"');
  } catch (error) {
    return false;
  }
});

runTest('should use EXPO_PUBLIC_SUPPORT_EMAIL environment variable', () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');

    // Check if app.json contains the environment variable reference
    return appJsonContent.includes('"${EXPO_PUBLIC_SUPPORT_EMAIL}"');
  } catch (error) {
    return false;
  }
});

// Test app.json extra configuration
console.log('\n⚙️ Testing App.json Extra Configuration...');
runTest('should have proper extra configuration structure', () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);

    const extra = appJson.expo.extra;

    return !!(
      extra &&
      typeof extra.apiUrl === 'string' &&
      typeof extra.enableLogging === 'boolean' &&
      typeof extra.useMockData === 'boolean' &&
      typeof extra.supportEmail === 'string'
    );
  } catch (error) {
    return false;
  }
});

// Test environment variable substitution
console.log('\n🔄 Testing Environment Variable Substitution...');
runTest('should substitute environment variables correctly', () => {
  // Set test environment variables
  mockEnv({
    EXPO_PUBLIC_API_URL: 'https://test-api.example.com',
    EXPO_PUBLIC_SUPPORT_EMAIL: 'test@example.com'
  });

  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');

    // In a real Expo app, these would be substituted at build time
    // For this test, we verify the template structure
    const hasApiUrlTemplate = appJsonContent.includes('"${EXPO_PUBLIC_API_URL}"');
    const hasSupportEmailTemplate = appJsonContent.includes('"${EXPO_PUBLIC_SUPPORT_EMAIL}"');

    return hasApiUrlTemplate && hasSupportEmailTemplate;
  } catch (error) {
    return false;
  } finally {
    resetEnv();
  }
});

// Test app.json plugins configuration
console.log('\n🔌 Testing App.json Plugins Configuration...');
runTest('should have proper plugins configuration', () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);

    const plugins = appJson.expo.plugins;

    return !!(
      Array.isArray(plugins) &&
      plugins.length > 0 &&
      plugins.some((plugin: any) =>
        Array.isArray(plugin) &&
        plugin[0] === 'expo-camera'
      )
    );
  } catch (error) {
    return false;
  }
});

// Test app.json platform-specific configuration
console.log('\n📱 Testing Platform-Specific Configuration...');
runTest('should have iOS configuration', () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);

    const ios = appJson.expo.ios;

    return !!(
      ios &&
      ios.supportsTablet === true &&
      typeof ios.bundleIdentifier === 'string'
    );
  } catch (error) {
    return false;
  }
});

runTest('should have Android configuration', () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);

    const android = appJson.expo.android;

    return !!(
      android &&
      android.adaptiveIcon &&
      typeof android.package === 'string' &&
      Array.isArray(android.permissions)
    );
  } catch (error) {
    return false;
  }
});

// Test build configuration
console.log('\n🏗️ Testing Build Configuration...');
runTest('should have valid build configuration', () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const appJsonPath = path.join(__dirname, '../../app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);

    return !!(
      appJson.expo.name &&
      appJson.expo.slug &&
      appJson.expo.version &&
      appJson.expo.orientation &&
      appJson.expo.splash &&
      appJson.expo.extra
    );
  } catch (error) {
    return false;
  }
});

// Summary
console.log('\n📊 Test Summary:');
const passedTests = testResults.filter(t => t.passed).length;
const totalTests = testResults.length;
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 All mobile app.json configuration tests passed!');
} else {
  console.log('\n⚠️ Some tests failed. Check the app.json configuration.');
  testResults.filter(t => !t.passed).forEach(test => {
    console.log(`  - ${test.test}: ${test.message}`);
  });
}