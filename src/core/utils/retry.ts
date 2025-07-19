/**
 * Retry utility with exponential backoff
 * Production-grade implementation following Amazon standards
 */

import { monitor } from '../monitoring';
import { TimeoutError } from '../errors';

export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: Array<new (...args: any[]) => Error>;
  onRetry?: (attempt: number, error: Error) => void;
  timeoutMs?: number;
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'retryableErrors' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  timeoutMs: 60000,
};

export async function retry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    timeoutMs,
  } = { ...DEFAULT_CONFIG, ...config };

  const { retryableErrors = [], onRetry } = config;

  let lastError: Error | undefined;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await withTimeout(operation(), timeoutMs);
      
      if (attempt > 1) {
        monitor.info('Retry succeeded', {
          module: 'retry',
          attempt,
          totalAttempts: maxAttempts,
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      const isRetryable = retryableErrors.length === 0 || 
        retryableErrors.some(ErrorClass => error instanceof ErrorClass);
      
      if (!isRetryable || attempt === maxAttempts) {
        monitor.error('Retry failed - max attempts reached or non-retryable error', error, {
          module: 'retry',
          attempt,
          totalAttempts: maxAttempts,
          isRetryable,
        });
        throw error;
      }

      monitor.warn(`Operation failed, retrying in ${delayMs}ms`, {
        module: 'retry',
        attempt,
        totalAttempts: maxAttempts,
        delayMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      await delay(delayMs);
      delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError || new Error('Retry failed');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export class RetryableOperation<T> {
  constructor(
    private operation: () => Promise<T>,
    private config: RetryConfig = {}
  ) {}

  async execute(): Promise<T> {
    return retry(this.operation, this.config);
  }

  withConfig(config: RetryConfig): RetryableOperation<T> {
    return new RetryableOperation(this.operation, { ...this.config, ...config });
  }
}