// Tests for pagination utilities
import { describe, it, expect } from 'vitest';
import { parsePaginationParams, createPaginatedResponse } from '../functions/_shared/pagination.js';

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should return default values for no parameters', () => {
      const url = new URL('https://example.com/api/items');
      const result = parsePaginationParams(url);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should parse valid limit and offset', () => {
      const url = new URL('https://example.com/api/items?limit=20&offset=40');
      const result = parsePaginationParams(url);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });

    it('should cap limit at maximum (500)', () => {
      const url = new URL('https://example.com/api/items?limit=1000');
      const result = parsePaginationParams(url);
      expect(result.limit).toBe(500);
    });

    it('should enforce minimum limit of 1', () => {
      const url = new URL('https://example.com/api/items?limit=0');
      const result = parsePaginationParams(url);
      expect(result.limit).toBe(1);
    });

    it('should enforce non-negative offset', () => {
      const url = new URL('https://example.com/api/items?offset=-10');
      const result = parsePaginationParams(url);
      expect(result.offset).toBe(0);
    });

    it('should handle invalid values gracefully', () => {
      const url = new URL('https://example.com/api/items?limit=abc&offset=xyz');
      const result = parsePaginationParams(url);
      expect(result.limit).toBe(50); // default
      expect(result.offset).toBe(0); // default
    });

    it('should parse page parameter and calculate offset', () => {
      const url = new URL('https://example.com/api/items?page=3&limit=10');
      const result = parsePaginationParams(url);
      expect(result.offset).toBe(20); // (page - 1) * limit = (3 - 1) * 10
      expect(result.limit).toBe(10);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create correct response with hasMore=true', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = createPaginatedResponse(data, 100, 10, 0);

      expect(response.data).toEqual(data);
      expect(response.pagination.total).toBe(100);
      expect(response.pagination.limit).toBe(10);
      expect(response.pagination.offset).toBe(0);
      expect(response.pagination.hasMore).toBe(true);
    });

    it('should create correct response with hasMore=false', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = createPaginatedResponse(data, 2, 10, 0);

      expect(response.pagination.hasMore).toBe(false);
    });

    it('should handle last page correctly', () => {
      const data = [{ id: 91 }, { id: 92 }];
      const response = createPaginatedResponse(data, 92, 10, 90);

      expect(response.pagination.total).toBe(92);
      expect(response.pagination.hasMore).toBe(false);
    });

    it('should handle empty data', () => {
      const response = createPaginatedResponse([], 0, 10, 0);

      expect(response.data).toEqual([]);
      expect(response.pagination.total).toBe(0);
      expect(response.pagination.hasMore).toBe(false);
    });

    it('should calculate hasMore correctly for edge cases', () => {
      // Exactly at the boundary
      const data = Array(10).fill({ id: 1 });
      const response = createPaginatedResponse(data, 20, 10, 10);

      expect(response.pagination.hasMore).toBe(false); // offset(10) + data.length(10) = 20 = total
    });
  });
});
