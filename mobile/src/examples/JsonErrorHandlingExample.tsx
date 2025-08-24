import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { withJsonErrorHandling, getFallbackDataForEndpoint } from '../utils/jsonErrorHandler';
import { validateApiResponse } from '../utils/responseValidator';
import { ApiMonitoring } from '../utils/monitoring';

/**
 * Example component demonstrating JSON error handling
 */
export const JsonErrorHandlingExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  // Example API call that might return malformed JSON
  const potentiallyFailingApiCall = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This simulates an API call that might return empty/malformed JSON
      const mockResponse = await simulateApiCall();
      
      // Use the safe wrapper
      const result = await withJsonErrorHandling(
        () => Promise.resolve(mockResponse),
        getFallbackDataForEndpoint('/api/user/profile'),
        '/api/user/profile'
      );
      
      setData(result);
      setErrorCount(ApiMonitoring.getErrorStats()['/api/user_profile_json_parse'] || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Simulate different API response scenarios
  const simulateApiCall = async (): Promise<any> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Randomly return different response types for demonstration
    const scenarios = [
      () => ({ name: 'John', age: 30 }), // Valid response
      () => '', // Empty string
      () => null, // Null response
      () => '{"name": "John", "age":', // Invalid JSON
      () => {}, // Empty object
    ];
    
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return randomScenario();
  };

  // Manual validation example
  const testValidation = () => {
    const testCases = [
      { data: '{"name": "John"}', expected: true },
      { data: '', expected: false },
      { data: null, expected: false },
      { data: '{"invalid": json', expected: false },
      { data: {}, expected: false },
    ];

    const results = testCases.map((testCase, index) => {
      const result = validateApiResponse(testCase.data, '/api/test');
      return {
        test: `Test ${index + 1}`,
        data: JSON.stringify(testCase.data),
        expected: testCase.expected ? 'Valid' : 'Invalid',
        actual: result.isValid ? 'Valid' : 'Invalid',
        passed: result.isValid === testCase.expected,
      };
    });

    console.log('Validation Test Results:', results);
    return results;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>JSON Error Handling Example</Text>
      
      <Text style={styles.subtitle}>
        This example demonstrates how the app handles malformed JSON responses gracefully.
      </Text>

      <View style={styles.buttonContainer}>
        <Button 
          title="Test API Call (Random Response)" 
          onPress={potentiallyFailingApiCall}
          disabled={loading}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Run Validation Tests" 
          onPress={testValidation}
        />
      </View>

      {loading && <Text style={styles.loading}>Loading...</Text>}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorCount}>
            JSON parsing errors for this endpoint: {errorCount}
          </Text>
        </View>
      )}

      {data && !error && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>Response Data:</Text>
          <Text style={styles.dataText}>
            {JSON.stringify(data, null, 2)}
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          1. The API call is wrapped with error handling
        </Text>
        <Text style={styles.infoText}>
          2. If the response is invalid JSON, fallback data is used
        </Text>
        <Text style={styles.infoText}>
          3. Errors are logged for monitoring and debugging
        </Text>
        <Text style={styles.infoText}>
          4. The app never crashes due to malformed JSON
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  loading: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    marginBottom: 5,
  },
  errorCount: {
    color: '#666',
    fontSize: 14,
  },
  dataContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  dataTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
  dataText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  infoContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default JsonErrorHandlingExample;