#!/usr/bin/env node

/**
 * Standalone Authentication Flow Test Script
 * Tests the complete login/refresh/logout flow end-to-end
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';
const TEST_USER = {
  username: `testuser_flow_${Date.now()}`,
  firstName: 'Test',
  lastName: 'User',
  email: `testuser_flow_${Date.now()}@example.com`,
  password: 'TestPassword123!'
};

let accessToken = '';
let refreshToken = '';
let userId = '';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testRegistration() {
  console.log('\n=== Testing User Registration ===');

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, TEST_USER);
    console.log('Registration Response Status:', response.status);

    if (response.status === 201) {
      console.log('✅ Registration successful');
      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
      userId = response.body.user.id;
      console.log('Access Token:', accessToken ? 'Received' : 'Missing');
      console.log('Refresh Token:', refreshToken ? 'Received' : 'Missing');
      console.log('User ID:', userId);
      return true;
    } else {
      console.log('❌ Registration failed:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return false;
  }
}

async function testProtectedEndpoint() {
  console.log('\n=== Testing Protected Endpoint Access ===');

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    console.log('Protected Endpoint Response Status:', response.status);

    if (response.status === 200) {
      console.log('✅ Protected endpoint access successful');
      console.log('User data:', response.body.username, response.body.email);
      return true;
    } else {
      console.log('❌ Protected endpoint access failed:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Protected endpoint error:', error.message);
    return false;
  }
}

async function testInvalidToken() {
  console.log('\n=== Testing Invalid Token Access ===');

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid-token'
    }
  };

  try {
    const response = await makeRequest(options);
    console.log('Invalid Token Response Status:', response.status);

    if (response.status === 401) {
      console.log('✅ Invalid token correctly rejected');
      return true;
    } else {
      console.log('❌ Invalid token not rejected properly:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid token test error:', error.message);
    return false;
  }
}

async function testTokenRefresh() {
  console.log('\n=== Testing Token Refresh ===');

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/refresh',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, { refreshToken });
    console.log('Refresh Response Status:', response.status);

    if (response.status === 200) {
      console.log('✅ Token refresh successful');
      const newAccessToken = response.body.accessToken;
      console.log('New Access Token:', newAccessToken ? 'Received' : 'Missing');

      // Test the new token
      const testOptions = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newAccessToken}`
        }
      };

      const testResponse = await makeRequest(testOptions);
      if (testResponse.status === 200) {
        console.log('✅ New access token works correctly');
        return true;
      } else {
        console.log('❌ New access token does not work');
        return false;
      }
    } else {
      console.log('❌ Token refresh failed:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Token refresh error:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n=== Testing User Login ===');

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    console.log('Login Response Status:', response.status);

    if (response.status === 200) {
      console.log('✅ Login successful');
      console.log('Login tokens match registration tokens:',
        response.body.tokens.accessToken === accessToken,
        response.body.tokens.refreshToken === refreshToken);
      return true;
    } else {
      console.log('❌ Login failed:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testLogout() {
  console.log('\n=== Testing User Logout ===');

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/logout',
    method: 'POST'
  };

  try {
    const response = await makeRequest(options);
    console.log('Logout Response Status:', response.status);

    if (response.status === 200) {
      console.log('✅ Logout successful');
      console.log('Logout message:', response.body.message);

      // For JWT, logout is client-side, so tokens should still be valid
      // until they expire naturally
      console.log('Note: JWT tokens remain valid until expiration (client-side logout)');

      return true;
    } else {
      console.log('❌ Logout failed:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Logout error:', error.message);
    return false;
  }
}

async function testInvalidRefreshToken() {
  console.log('\n=== Testing Invalid Refresh Token ===');

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/refresh',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, { refreshToken: 'invalid-refresh-token' });
    console.log('Invalid Refresh Response Status:', response.status);

    if (response.status === 401) {
      console.log('✅ Invalid refresh token correctly rejected');
      return true;
    } else {
      console.log('❌ Invalid refresh token not rejected properly:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid refresh token test error:', error.message);
    return false;
  }
}

async function testConcurrentRequests() {
  console.log('\n=== Testing Concurrent Requests ===');

  const requests = Array(5).fill(null).map(() => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };
    return makeRequest(options);
  });

  try {
    const responses = await Promise.all(requests);
    const successfulRequests = responses.filter(res => res.status === 200);
    const rateLimitedRequests = responses.filter(res => res.status === 429);

    console.log(`Concurrent requests: ${responses.length} total`);
    console.log(`Successful: ${successfulRequests.length}`);
    console.log(`Rate limited: ${rateLimitedRequests.length}`);

    if (successfulRequests.length > 0) {
      console.log('✅ Concurrent requests handled correctly');
      return true;
    } else {
      console.log('❌ No concurrent requests succeeded');
      return false;
    }
  } catch (error) {
    console.log('❌ Concurrent requests error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication Flow Integration Tests');
  console.log('Base URL:', BASE_URL);
  console.log('Test User:', TEST_USER.username);

  const results = {
    registration: false,
    protectedAccess: false,
    invalidToken: false,
    tokenRefresh: false,
    login: false,
    logout: false,
    invalidRefresh: false,
    concurrent: false
  };

  try {
    // Test registration
    results.registration = await testRegistration();

    if (!results.registration) {
      console.log('\n❌ Cannot continue tests without successful registration');
      return;
    }

    // Test protected endpoint access
    results.protectedAccess = await testProtectedEndpoint();

    // Test invalid token
    results.invalidToken = await testInvalidToken();

    // Test token refresh
    results.tokenRefresh = await testTokenRefresh();

    // Test login
    results.login = await testLogin();

    // Test logout
    results.logout = await testLogout();

    // Test invalid refresh token
    results.invalidRefresh = await testInvalidRefreshToken();

    // Test concurrent requests
    results.concurrent = await testConcurrentRequests();

  } catch (error) {
    console.log('\n❌ Test suite error:', error.message);
  }

  // Summary
  console.log('\n=== Test Results Summary ===');
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All authentication flow tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
    process.exit(1);
  }
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log('Server status:', res.statusCode);
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      console.log('❌ Server is not running on localhost:3000');
      console.log('Please start the server with: npm start');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Server connection timeout');
      resolve(false);
    });

    req.end();
  });
}

// Main execution
async function main() {
  console.log('Checking server status...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('❌ Cannot run tests: Server is not running');
    process.exit(1);
  }

  await runTests();
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});