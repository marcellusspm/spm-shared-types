/**
 * Request/response shapes for paginated endpoints.
 * Every list endpoint in the SPM ecosystem should accept PaginationParams
 * and return PaginatedResponse<T>.
 */

/** Query params for list endpoints — usually passed as `?page=1&limit=10&sortBy=createdAt&sortOrder=desc` */
export interface PaginationParams {
  /** 1-based page number. Default 1. */
  page?: number;
  /** Number of items per page. Default 10, max usually capped at 100 by the server. */
  limit?: number;
  /** Column to sort by (server-validated). */
  sortBy?: string;
  /** Sort direction. Default 'desc'. */
  sortOrder?: 'asc' | 'desc';
}

/** Response shape for paginated list endpoints. */
export interface PaginatedResponse<T> {
  /** Items on the current page */
  data: T[];
  /** Total number of matching records (across all pages) */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Items per page (echoes the request limit) */
  limit: number;
  /** Total pages = Math.ceil(total / limit) */
  totalPages: number;
  /** True if page < totalPages */
  hasNextPage: boolean;
  /** True if page > 1 */
  hasPreviousPage: boolean;
}

/**
 * Helper to build a PaginatedResponse from a DB query result.
 * Use on the server-side when composing a list response.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
