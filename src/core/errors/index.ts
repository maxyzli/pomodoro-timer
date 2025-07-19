/**
 * Core error handling utilities for the application
 * Following Amazon SDE III production standards
 */

export enum ErrorCode {
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorMetadata {
  module?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public metadata?: ErrorMetadata,
    public originalError?: Error | unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', metadata?: ErrorMetadata) {
    super(ErrorCode.AUTHENTICATION_REQUIRED, message, metadata);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public validationErrors: Array<{ field: string; message: string }>,
    metadata?: ErrorMetadata
  ) {
    super(ErrorCode.VALIDATION_FAILED, message, metadata);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(
    message = 'Network request failed',
    metadata?: ErrorMetadata,
    originalError?: Error
  ) {
    super(ErrorCode.NETWORK_ERROR, message, metadata, originalError);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends AppError {
  constructor(
    message = 'Operation timed out',
    public timeoutMs: number,
    metadata?: ErrorMetadata
  ) {
    super(ErrorCode.TIMEOUT_ERROR, message, metadata);
    this.name = 'TimeoutError';
  }
}

export class DatabaseError extends AppError {
  constructor(
    message = 'Database operation failed',
    metadata?: ErrorMetadata,
    originalError?: Error
  ) {
    super(ErrorCode.DATABASE_ERROR, message, metadata, originalError);
    this.name = 'DatabaseError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isAppError(error)) {
    return error.code;
  }
  return ErrorCode.UNKNOWN_ERROR;
}