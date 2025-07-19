/**
 * Production-grade monitoring and telemetry service
 * Following Amazon SDE III standards
 */

import { AppError } from '../errors';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  [key: string]: any;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  sensitiveKeys: Set<string>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private config: LoggerConfig;
  private buffer: Array<{ timestamp: Date; level: LogLevel; message: string; context?: LogContext }> = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableRemote: !import.meta.env.DEV,
      sensitiveKeys: new Set([
        'password', 'token', 'auth', 'secret', 'key', 'apiKey',
        'accessToken', 'refreshToken', 'sessionId', 'cookie',
        'email', 'phone', 'ssn', 'creditCard', 'cvv'
      ]),
    };

    if (this.config.enableRemote) {
      this.startFlushInterval();
    }
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000);
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    if (this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs }),
        });
      } catch (error) {
        this.buffer.unshift(...logs);
      }
    }
  }

  private sanitize(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        if (Array.from(this.config.sensitiveKeys).some(sensitive => 
          lowerKey.includes(sensitive.toLowerCase())
        )) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    return data;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const prefix = context?.module ? `[${context.module}]` : '';
    return `${timestamp} [${levelStr}]${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const sanitizedContext = this.sanitize(context);
    const formattedMessage = this.formatMessage(level, message, sanitizedContext);

    if (this.config.enableConsole) {
      const logMethod = level >= LogLevel.ERROR ? console.error : console.log;
      logMethod(formattedMessage, sanitizedContext || '');
    }

    if (this.config.enableRemote) {
      this.buffer.push({
        timestamp: new Date(),
        level,
        message,
        context: sanitizedContext,
      });
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const errorInfo = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: import.meta.env.DEV ? error.stack : undefined,
    } : error;

    this.log(LogLevel.ERROR, message, {
      ...context,
      error: this.sanitize(errorInfo),
    });
  }

  fatal(message: string, error?: unknown, context?: LogContext) {
    this.error(message, error, context);
    this.flush();
  }

  captureException(error: unknown, context?: LogContext) {
    if (error instanceof AppError) {
      this.error(error.message, error, {
        ...context,
        errorCode: error.code,
        errorMetadata: error.metadata,
      });
    } else if (error instanceof Error) {
      this.error(error.message, error, context);
    } else {
      this.error('Unknown error occurred', error, context);
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.info(`Performance: ${metric.operation}`, {
      type: 'performance',
      duration: metric.duration,
      success: metric.success,
      ...metric.metadata,
    });
  }

  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } catch (error) {
      this.captureException(error, { ...context, operation });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation,
        duration,
        success,
        metadata: context,
      });
    }
  }

  measure<T>(
    operation: string,
    fn: () => T,
    context?: LogContext
  ): T {
    const startTime = performance.now();
    let success = false;

    try {
      const result = fn();
      success = true;
      return result;
    } catch (error) {
      this.captureException(error, { ...context, operation });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation,
        duration,
        success,
        metadata: context,
      });
    }
  }

  setUserId(userId: string | null) {
    if (userId) {
      this.info('User context updated', { userId: '[REDACTED]' });
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

export const monitor = MonitoringService.getInstance();