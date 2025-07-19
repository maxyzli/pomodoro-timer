/**
 * Base repository interface and implementation
 * Following repository pattern for data access layer
 */

import { monitor } from '../core/monitoring';
import { DatabaseError } from '../core/errors';
import { retry } from '../core/utils/retry';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface QueryOptions {
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export abstract class BaseRepository<T> {
  protected abstract tableName: string;
  protected abstract moduleName: string;

  protected async executeQuery<R>(
    operation: string,
    queryFn: () => Promise<R>
  ): Promise<R> {
    return monitor.measureAsync(
      `${this.moduleName}.${operation}`,
      async () => {
        try {
          return await retry(queryFn, {
            maxAttempts: 3,
            initialDelayMs: 500,
            retryableErrors: [DatabaseError],
          });
        } catch (error) {
          throw new DatabaseError(
            `Failed to execute ${operation}`,
            {
              module: this.moduleName,
              operation,
              table: this.tableName,
            },
            error as Error
          );
        }
      },
      { module: this.moduleName, operation }
    );
  }

  protected handleDatabaseError(operation: string, error: unknown): never {
    monitor.error(`Database operation failed: ${operation}`, error, {
      module: this.moduleName,
      table: this.tableName,
      operation,
    });

    throw new DatabaseError(
      `${operation} failed`,
      {
        module: this.moduleName,
        operation,
        table: this.tableName,
      },
      error as Error
    );
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(options?: QueryOptions): Promise<T[]>;
  abstract create(data: any): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
}