import { EventEmitter } from 'events';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions: Set<string> = new Set();

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.emit('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
      
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
          this.emit('maxReconnectAttemptsReached');
        }
      });
    }, this.config.reconnectInterval);
  }

  private handleMessage(message: WebSocketMessage): void {
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    // Emit message to subscribers
    this.emit('message', message);

    // Handle specific message types
    switch (message.type) {
      case 'health_metrics_update':
        this.emit('healthMetricsUpdate', message.data);
        break;
      case 'real_time_alert':
        this.emit('realTimeAlert', message.data);
        break;
      case 'prediction_update':
        this.emit('predictionUpdate', message.data);
        break;
      case 'system_status':
        this.emit('systemStatus', message.data);
        break;
      case 'user_activity':
        this.emit('userActivity', message.data);
        break;
      default:
        console.log('Received unknown message type:', message.type);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later delivery
      this.messageQueue.push(message);
    }
  }

  subscribe(topic: string): void {
    this.subscriptions.add(topic);
    this.send({
      type: 'subscribe',
      data: { topic },
      timestamp: Date.now()
    });
  }

  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
    this.send({
      type: 'unsubscribe',
      data: { topic },
      timestamp: Date.now()
    });
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Health metrics subscription
  subscribeToHealthMetrics(): void {
    this.subscribe('health_metrics');
  }

  unsubscribeFromHealthMetrics(): void {
    this.unsubscribe('health_metrics');
  }

  // Real-time alerts subscription
  subscribeToRealTimeAlerts(): void {
    this.subscribe('real_time_alerts');
  }

  unsubscribeFromRealTimeAlerts(): void {
    this.unsubscribe('real_time_alerts');
  }

  // Predictions subscription
  subscribeToPredictions(): void {
    this.subscribe('predictions');
  }

  unsubscribeFromPredictions(): void {
    this.unsubscribe('predictions');
  }

  // System status subscription
  subscribeToSystemStatus(): void {
    this.subscribe('system_status');
  }

  unsubscribeFromSystemStatus(): void {
    this.unsubscribe('system_status');
  }

  // User activity subscription
  subscribeToUserActivity(): void {
    this.subscribe('user_activity');
  }

  unsubscribeFromUserActivity(): void {
    this.unsubscribe('user_activity');
  }

  // Request real-time data
  requestRealTimeData(type: string, params?: any): void {
    this.send({
      type: 'request_real_time_data',
      data: { type, params },
      timestamp: Date.now()
    });
  }

  // Send user action
  sendUserAction(action: string, data?: any): void {
    this.send({
      type: 'user_action',
      data: { action, data },
      timestamp: Date.now()
    });
  }

  // Ping/Pong for connection health
  ping(): void {
    this.send({
      type: 'ping',
      data: {},
      timestamp: Date.now()
    });
  }

  // Connection health check
  startHealthCheck(interval: number = 30000): void {
    setInterval(() => {
      if (this.isConnected) {
        this.ping();
      }
    }, interval);
  }
}

// Singleton instance
const webSocketService = new WebSocketService({
  url: process.env.WEBSOCKET_URL || 'ws://localhost:3001/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
});

export default webSocketService;