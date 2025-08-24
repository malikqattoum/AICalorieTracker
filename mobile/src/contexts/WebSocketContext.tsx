import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import webSocketService from '../services/webSocketService';

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastMessage: any;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;  // Added reconnect method
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  send: (message: any) => void;
  requestRealTimeData: (type: string, params?: any) => void;
  sendUserAction: (action: string, data?: any) => void;
  healthMetrics: any[];
  realTimeAlerts: any[];
  predictions: any[];
  systemStatus: any[];
  userActivities: any[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  reconnectInterval?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  autoConnect = true,
  reconnectInterval = 5000
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      await webSocketService.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Subscribe to default topics
      webSocketService.subscribeToHealthMetrics();
      webSocketService.subscribeToRealTimeAlerts();
      webSocketService.subscribeToPredictions();
      webSocketService.subscribeToSystemStatus();
      webSocketService.subscribeToUserActivity();
      
      // Start health check
      webSocketService.startHealthCheck();
      
    } catch (err) {
      setError(err as Error);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      throw err; // Rethrow to allow retry logic
    }
  }, [connectionStatus]);

  // Reconnect to WebSocket
  const reconnect = useCallback(async () => {
    setConnectionStatus('reconnecting');
    setError(null);
    
    try {
      await webSocketService.reconnect();
      setConnectionStatus('connected');
      setIsConnected(true);
    } catch (err) {
      setError(err as Error);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      throw err; // Rethrow to allow retry logic
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setHealthMetrics([]);
    setRealTimeAlerts([]);
    setPredictions([]);
    setSystemStatus([]);
    setUserActivities([]);
  }, []);

  // Subscribe to topic
  const subscribe = useCallback((topic: string) => {
    webSocketService.subscribe(topic);
  }, []);

  // Unsubscribe from topic
  const unsubscribe = useCallback((topic: string) => {
    webSocketService.unsubscribe(topic);
  }, []);

  // Send message
  const send = useCallback((message: any) => {
    webSocketService.send(message);
  }, []);

  // Request real-time data
  const requestRealTimeData = useCallback((type: string, params?: any) => {
    webSocketService.requestRealTimeData(type, params);
  }, []);

  // Send user action
  const sendUserAction = useCallback((action: string, data?: any) => {
    webSocketService.sendUserAction(action, data);
  }, []);

  // Handle WebSocket events
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleReconnecting = () => {
      setConnectionStatus('reconnecting');
    };

    const handleMaxReconnectAttemptsReached = () => {
      setConnectionStatus('disconnected');
      setError(new Error('Max reconnection attempts reached'));
    };

    const handleMessage = (message: any) => {
      setLastMessage(message);
    };

    const handleHealthMetricsUpdate = (data: any) => {
      setHealthMetrics(prev => {
        const updated = [...prev, data];
        // Keep only last 100 metrics
        return updated.slice(-100);
      });
    };

    const handleRealTimeAlert = (data: any) => {
      setRealTimeAlerts(prev => {
        const updated = [data, ...prev];
        // Keep only last 50 alerts
        return updated.slice(-50);
      });
    };

    const handlePredictionUpdate = (data: any) => {
      setPredictions(prev => {
        const updated = [...prev, data];
        // Keep only last 20 predictions
        return updated.slice(-20);
      });
    };

    const handleSystemStatus = (data: any) => {
      setSystemStatus(prev => {
        const updated = [...prev, data];
        // Keep only last 10 status updates
        return updated.slice(-10);
      });
    };

    const handleUserActivity = (data: any) => {
      setUserActivities(prev => {
        const updated = [data, ...prev];
        // Keep only last 50 activities
        return updated.slice(-50);
      });
    };

    const handleError = (err: Error) => {
      setError(err);
    };

    // Add event listeners
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('reconnecting', handleReconnecting);
    webSocketService.on('maxReconnectAttemptsReached', handleMaxReconnectAttemptsReached);
    webSocketService.on('message', handleMessage);
    webSocketService.on('healthMetricsUpdate', handleHealthMetricsUpdate);
    webSocketService.on('realTimeAlert', handleRealTimeAlert);
    webSocketService.on('predictionUpdate', handlePredictionUpdate);
    webSocketService.on('systemStatus', handleSystemStatus);
    webSocketService.on('userActivity', handleUserActivity);
    webSocketService.on('error', handleError);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('reconnecting', handleReconnecting);
      webSocketService.off('maxReconnectAttemptsReached', handleMaxReconnectAttemptsReached);
      webSocketService.off('message', handleMessage);
      webSocketService.off('healthMetricsUpdate', handleHealthMetricsUpdate);
      webSocketService.off('realTimeAlert', handleRealTimeAlert);
      webSocketService.off('predictionUpdate', handlePredictionUpdate);
      webSocketService.off('systemStatus', handleSystemStatus);
      webSocketService.off('userActivity', handleUserActivity);
      webSocketService.off('error', handleError);
    };
  }, [autoConnect, connect]);

  // Handle reconnection
  useEffect(() => {
    if (connectionStatus === 'reconnecting') {
      const timer = setTimeout(() => {
        reconnect();
      }, reconnectInterval);

      return () => clearTimeout(timer);
    }
  }, [connectionStatus, reconnect, reconnectInterval]);

  const value: WebSocketContextType = {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    reconnect,  // Expose reconnect method
    subscribe,
    unsubscribe,
    send,
    requestRealTimeData,
    sendUserAction,
    healthMetrics,
    realTimeAlerts,
    predictions,
    systemStatus,
    userActivities
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;