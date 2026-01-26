// Tests for error handling utilities
import { describe, it, expect } from 'vitest';
import { errors, createErrorResponse, generateRequestId, handleError, AppError } from '../functions/_shared/errors.js';

describe('Error Handling Utilities', () => {
  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });

    it('should start with req_ prefix', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^req_/);
    });

    it('should have reasonable length', () => {
      const id = generateRequestId();
      expect(id.length).toBeGreaterThan(10);
      expect(id.length).toBeLessThan(50);
    });
  });

  describe('errors factory functions', () => {
    describe('errors.validation', () => {
      it('should create validation error with field errors', () => {
        const fieldErrors = { email: 'Invalid email format', name: 'Name is required' };
        const error = errors.validation(fieldErrors, 'req_123');

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.status).toBe(400);
        expect(error.details.fields).toEqual(fieldErrors);
        expect(error.details.requestId).toBe('req_123');
      });
    });

    describe('errors.unauthorized', () => {
      it('should create unauthorized error', () => {
        const error = errors.unauthorized('Token expired', 'req_456');

        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.status).toBe(401);
        expect(error.message).toBe('Token expired');
        expect(error.details.requestId).toBe('req_456');
      });
    });

    describe('errors.notFound', () => {
      it('should create not found error', () => {
        const error = errors.notFound('Attendee', 'req_789');

        expect(error.code).toBe('NOT_FOUND');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Attendee not found');
        expect(error.details.requestId).toBe('req_789');
      });
    });

    describe('errors.conflict', () => {
      it('should create conflict error', () => {
        const error = errors.conflict('Email already exists', 'req_abc');

        expect(error.code).toBe('CONFLICT');
        expect(error.status).toBe(409);
        expect(error.message).toBe('Email already exists');
      });
    });

    describe('errors.badRequest', () => {
      it('should create bad request error', () => {
        const error = errors.badRequest('Invalid input', 'req_def');

        expect(error.code).toBe('BAD_REQUEST');
        expect(error.status).toBe(400);
        expect(error.message).toBe('Invalid input');
      });
    });

    describe('errors.internal', () => {
      it('should create internal error', () => {
        const error = errors.internal('Database connection failed', 'req_ghi');

        expect(error.code).toBe('INTERNAL_ERROR');
        expect(error.status).toBe(500);
        expect(error.message).toBe('Database connection failed');
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create Response with correct status code', async () => {
      const appError = errors.notFound('User', 'req_123');
      const response = createErrorResponse(appError);

      expect(response.status).toBe(404);
    });

    it('should include correct headers', async () => {
      const appError = errors.validation({}, 'req_123');
      const response = createErrorResponse(appError);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include error body with all fields', async () => {
      const appError = errors.unauthorized('Invalid token', 'req_test');
      const response = createErrorResponse(appError);
      const body = await response.json();

      expect(body.error).toBe('Invalid token');
      expect(body.code).toBe('UNAUTHORIZED');
      expect(body.details).toBeDefined();
      expect(body.details.requestId).toBe('req_test');
    });
  });

  describe('handleError', () => {
    it('should return AppError as-is', () => {
      const original = errors.badRequest('Test error', 'req_123');
      const result = handleError(original, 'req_456');

      expect(result).toBe(original);
    });

    it('should wrap regular Error in internal error', () => {
      const error = new Error('Something went wrong');
      const result = handleError(error, 'req_789');

      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.status).toBe(500);
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle non-Error objects', () => {
      const result = handleError('string error', 'req_abc');

      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.status).toBe(500);
    });

    it('should use provided requestId for wrapped errors', () => {
      const error = new Error('Test');
      const result = handleError(error, 'req_custom');

      expect(result.details.requestId).toBe('req_custom');
    });
  });

  describe('AppError class', () => {
    it('should extend Error', () => {
      const appError = new AppError('Test', 'TEST_CODE', 400, {});
      expect(appError instanceof Error).toBe(true);
    });

    it('should have correct properties', () => {
      const details = { field: 'value' };
      const appError = new AppError('Test message', 'CUSTOM_CODE', 418, details);

      expect(appError.message).toBe('Test message');
      expect(appError.code).toBe('CUSTOM_CODE');
      expect(appError.status).toBe(418);
      expect(appError.details).toEqual(details);
    });
  });
});
