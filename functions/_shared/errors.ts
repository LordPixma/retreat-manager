// Error handling utilities for retreat-manager

// Error codes enumeration
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

// HTTP status codes mapping
export const errorStatusMap: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503
};

// AppError class
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = errorStatusMap[code];
    this.details = details;
    this.requestId = requestId;
  }

  toJSON(): Record<string, unknown> {
    return {
      error: this.message,
      code: this.code,
      details: {
        ...this.details,
        requestId: this.requestId
      }
    };
  }
}

// Factory functions for common errors
export const errors = {
  validation: (fields: Record<string, string>, requestId?: string): AppError =>
    new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', { fields }, requestId),

  unauthorized: (message = 'Unauthorized', requestId?: string): AppError =>
    new AppError(ErrorCode.UNAUTHORIZED, message, undefined, requestId),

  forbidden: (message = 'Forbidden', requestId?: string): AppError =>
    new AppError(ErrorCode.FORBIDDEN, message, undefined, requestId),

  notFound: (resource: string, requestId?: string): AppError =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, undefined, requestId),

  conflict: (message: string, requestId?: string): AppError =>
    new AppError(ErrorCode.CONFLICT, message, undefined, requestId),

  badRequest: (message: string, requestId?: string): AppError =>
    new AppError(ErrorCode.BAD_REQUEST, message, undefined, requestId),

  internal: (message = 'Internal server error', requestId?: string): AppError =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, undefined, requestId),

  database: (message = 'Database error', requestId?: string): AppError =>
    new AppError(ErrorCode.DATABASE_ERROR, message, undefined, requestId),

  rateLimited: (retryAfter?: number, requestId?: string): AppError =>
    new AppError(ErrorCode.RATE_LIMITED, 'Rate limit exceeded', { retryAfter }, requestId),

  externalService: (service: string, requestId?: string, details?: string): AppError =>
    new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, details ? `${service} error: ${details}` : `${service} service error`, undefined, requestId)
};

// Create error response
export function createErrorResponse(error: AppError): Response;
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status?: number,
  requestId?: string
): Response;
export function createErrorResponse(
  errorOrCode: AppError | ErrorCode,
  message?: string,
  status?: number,
  requestId?: string
): Response {
  let responseBody: Record<string, unknown>;
  let responseStatus: number;
  let reqId: string | undefined;

  if (errorOrCode instanceof AppError) {
    responseBody = errorOrCode.toJSON();
    responseStatus = errorOrCode.status;
    reqId = errorOrCode.requestId;
  } else {
    responseBody = {
      error: message || 'An error occurred',
      code: errorOrCode,
      details: { requestId }
    };
    responseStatus = status || errorStatusMap[errorOrCode] || 500;
    reqId = requestId;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (reqId) {
    headers['X-Request-ID'] = reqId;
  }

  return new Response(JSON.stringify(responseBody), {
    status: responseStatus,
    headers
  });
}

// Generate request ID
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
}

// Check if error is an AppError
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Handle unknown errors and convert to AppError
export function handleError(error: unknown, requestId?: string): AppError {
  if (error instanceof AppError) {
    if (requestId) {
      error.requestId = requestId;
    }
    return error;
  }

  if (error instanceof Error) {
    // Handle specific database errors
    if (error.message.includes('UNIQUE constraint failed')) {
      return errors.conflict('Resource already exists', requestId);
    }
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return errors.badRequest('Referenced resource does not exist', requestId);
    }
    if (error.message.includes('NOT NULL constraint failed')) {
      return errors.badRequest('Required field is missing', requestId);
    }

    return errors.internal(error.message, requestId);
  }

  return errors.internal('An unexpected error occurred', requestId);
}
