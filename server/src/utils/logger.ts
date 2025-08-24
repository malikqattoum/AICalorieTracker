import winston from 'winston';
import { config } from '../config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define which log level to use based on the environment
const level = () => {
  const env = config.nodeEnv || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports for logs
const transports = [
  // Console transport
  new winston.transports.Console({
    format: format,
  }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
  }),
];

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Custom logger class with additional methods
export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  // Log error messages
  error(message: string, meta?: any): void {
    logger.error(`${this.context}: ${message}`, meta);
  }

  // Log warning messages
  warn(message: string, meta?: any): void {
    logger.warn(`${this.context}: ${message}`, meta);
  }

  // Log info messages
  info(message: string, meta?: any): void {
    logger.info(`${this.context}: ${message}`, meta);
  }

  // Log HTTP requests
  http(message: string, meta?: any): void {
    logger.http(`${this.context}: ${message}`, meta);
  }

  // Log debug messages
  debug(message: string, meta?: any): void {
    logger.debug(`${this.context}: ${message}`, meta);
  }

  // Log performance metrics
  performance(message: string, duration: number, meta?: any): void {
    logger.info(`${this.context} - Performance: ${message} - Duration: ${duration}ms`, meta);
  }

  // Log security events
  security(message: string, meta?: any): void {
    logger.error(`${this.context} - Security: ${message}`, meta);
  }

  // Log database operations
  database(message: string, duration: number, meta?: any): void {
    logger.info(`${this.context} - Database: ${message} - Duration: ${duration}ms`, meta);
  }

  // Log API calls
  api(message: string, method: string, url: string, statusCode: number, duration: number, meta?: any): void {
    logger.http(`${this.context} - API: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`, meta);
  }

  // Log user activities
  userActivity(userId: number, action: string, meta?: any): void {
    logger.info(`${this.context} - User Activity: User ${userId} - Action: ${action}`, meta);
  }

  // Log system events
  system(message: string, meta?: any): void {
    logger.info(`${this.context} - System: ${message}`, meta);
  }

  // Log business events
  business(message: string, meta?: any): void {
    logger.info(`${this.context} - Business: ${message}`, meta);
  }

  // Log external API calls
  externalApi(service: string, endpoint: string, method: string, duration: number, success: boolean, meta?: any): void {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.info(`${this.context} - External API: ${service} ${method} ${endpoint} - Status: ${status} - Duration: ${duration}ms`, meta);
  }

  // Log file operations
  fileOperation(operation: string, filename: string, size?: number, meta?: any): void {
    const sizeInfo = size ? ` - Size: ${size} bytes` : '';
    logger.info(`${this.context} - File: ${operation} ${filename}${sizeInfo}`, meta);
  }

  // Log payment events
  payment(message: string, amount?: number, currency?: string, meta?: any): void {
    const amountInfo = amount && currency ? ` - Amount: ${amount} ${currency}` : '';
    logger.info(`${this.context} - Payment: ${message}${amountInfo}`, meta);
  }

  // Log AI service events
  aiService(message: string, model?: string, duration?: number, meta?: any): void {
    const modelInfo = model ? ` - Model: ${model}` : '';
    const durationInfo = duration ? ` - Duration: ${duration}ms` : '';
    logger.info(`${this.context} - AI Service: ${message}${modelInfo}${durationInfo}`, meta);
  }

  // Log wearable device events
  wearableDevice(message: string, deviceId?: string, deviceType?: string, meta?: any): void {
    const deviceInfo = deviceId && deviceType ? ` - Device: ${deviceType} (${deviceId})` : '';
    logger.info(`${this.context} - Wearable Device: ${message}${deviceInfo}`, meta);
  }

  // Log health events
  health(message: string, userId?: number, metricType?: string, value?: number, meta?: any): void {
    const userInfo = userId ? ` - User: ${userId}` : '';
    const metricInfo = metricType ? ` - Metric: ${metricType}` : '';
    const valueInfo = value !== undefined ? ` - Value: ${value}` : '';
    logger.info(`${this.context} - Health: ${message}${userInfo}${metricInfo}${valueInfo}`, meta);
  }

  // Log analytics events
  analytics(message: string, event: string, userId?: number, meta?: any): void {
    const userInfo = userId ? ` - User: ${userId}` : '';
    logger.info(`${this.context} - Analytics: ${message} - Event: ${event}${userInfo}`, meta);
  }

  // Log error with stack trace
  errorWithStack(message: string, error: Error, meta?: any): void {
    logger.error(`${this.context}: ${message}\n${error.stack}`, meta);
  }

  // Log with context
  withContext(newContext: string): Logger {
    return new Logger(newContext);
  }

  // Create child logger with additional metadata
  child(metadata: Record<string, any>): Logger {
    const childLogger = Object.create(this);
    childLogger.metadata = { ...this.metadata, ...metadata };
    return childLogger;
  }

  private metadata: Record<string, any> = {};
}

// Export default logger instance
export default logger;