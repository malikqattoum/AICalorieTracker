import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { secureApiService } from '../services/secureApiService';
import { API_URL, ENABLE_LOGGING } from '../config';

export const ConnectivityTest = () => {
  const [status, setStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const [details, setDetails] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testCount, setTestCount] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    if (ENABLE_LOGGING) {
      console.log(logEntry);
    }
  };

  const testConnection = async () => {
    setTestCount(prev => prev + 1);
    setStatus('testing');
    addLog(`Starting connection test #${testCount + 1}`);
    addLog(`API URL: ${API_URL}`);
    addLog(`Environment: ${__DEV__ ? 'development' : 'production'}`);

    try {
      addLog('Attempting to connect to server...');
      
      // Test the simple test endpoint
      const response = await secureApiService.get('/api/simple-test');
      addLog('Connection test successful!');
      addLog(`Response: ${JSON.stringify(response, null, 2)}`);
      
      setStatus('connected');
      setDetails(response);
    } catch (error: any) {
      addLog('Connection test failed!');
      addLog(`Error: ${error.message}`);
      addLog(`Error code: ${error.code}`);
      addLog(`Error config: ${JSON.stringify(error.config, null, 2)}`);
      
      setStatus('failed');
      setDetails(error);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  const retryTest = () => {
    testConnection();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'failed':
        return 'Failed';
      default:
        return 'Testing...';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connectivity Test</Text>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          Status: {getStatusText()}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>API URL:</Text>
        <Text style={styles.infoValue}>{API_URL}</Text>
        
        <Text style={styles.infoLabel}>Environment:</Text>
        <Text style={styles.infoValue}>{__DEV__ ? 'Development' : 'Production'}</Text>
        
        <Text style={styles.infoLabel}>Test Count:</Text>
        <Text style={styles.infoValue}>{testCount}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.retryButton]} 
          onPress={retryTest}
        >
          <Text style={styles.buttonText}>Retry Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {details && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Response Details:</Text>
          <ScrollView style={styles.detailsContent}>
            <Text style={styles.detailsText}>
              {JSON.stringify(details, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}

      <View style={styles.logsCard}>
        <Text style={styles.logsTitle}>Connection Logs:</Text>
        <ScrollView style={styles.logsContent}>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No logs available</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  detailsContent: {
    maxHeight: 200,
  },
  detailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  logsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  logsContent: {
    maxHeight: 300,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  noLogs: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});