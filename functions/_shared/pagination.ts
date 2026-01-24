// Pagination utilities for retreat-manager

import type { PaginationParams, PaginationMeta, PaginatedResponse } from './types.js';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 500;
export const MIN_LIMIT = 1;

/**
 * Parse pagination parameters from URL query string
 */
export function parsePaginationParams(url: URL): PaginationParams {
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
  let offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  // Validate and constrain limit
  if (isNaN(limit) || limit < MIN_LIMIT) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  // Validate and constrain offset
  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }

  return { limit, offset };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  limit: number,
  offset: number
): PaginationMeta {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMeta(total, limit, offset)
  };
}

/**
 * Build SQL LIMIT/OFFSET clause
 */
export function buildPaginationClause(params: PaginationParams): string {
  return `LIMIT ${params.limit} OFFSET ${params.offset}`;
}

/**
 * Get total count query for a table
 */
export function buildCountQuery(tableName: string, whereClause?: string): string {
  let query = `SELECT COUNT(*) as total FROM ${tableName}`;
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
  }
  return query;
}
