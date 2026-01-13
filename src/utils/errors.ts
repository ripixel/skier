import type { TaskContext, Logger } from '../types.js';

/**
 * Custom error class for Skier task failures.
 * Provides consistent error formatting and supports error chaining.
 */
export class SkierTaskError extends Error {
  public readonly taskName: string;
  public readonly errorCause?: Error;

  constructor(taskName: string, message: string, cause?: Error) {
    super(`[skier/${taskName}] ${message}`);
    this.name = 'SkierTaskError';
    this.taskName = taskName;
    this.errorCause = cause;
  }
}

/**
 * Configuration validation error for missing or invalid config fields.
 */
export class SkierConfigError extends SkierTaskError {
  public readonly missingFields: string[];

  constructor(taskName: string, missingFields: string[]) {
    const message = `Missing required config: ${missingFields.join(', ')}`;
    super(taskName, message);
    this.name = 'SkierConfigError';
    this.missingFields = missingFields;
  }
}

/**
 * Throws a standardized task error after logging it.
 * Use this for all task failures to ensure consistent error handling.
 */
export function throwTaskError(
  ctx: TaskContext,
  taskName: string,
  message: string,
  cause?: Error,
): never {
  const err = new SkierTaskError(taskName, message, cause);
  ctx.logger.error(err.message);
  throw err;
}

/**
 * Validates that all required config fields are present.
 * Throws SkierConfigError if any are missing.
 */
export function validateRequiredConfig<T extends object>(
  ctx: TaskContext,
  taskName: string,
  config: T,
  requiredFields: (keyof T)[],
): void {
  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = config[field];
    if (value === undefined || value === null || value === '') {
      missing.push(String(field));
    }
  }

  if (missing.length > 0) {
    const err = new SkierConfigError(taskName, missing);
    ctx.logger.error(err.message);
    throw err;
  }
}
