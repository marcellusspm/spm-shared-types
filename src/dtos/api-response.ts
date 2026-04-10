/**
 * Standard response wrapper types used across the SPM ecosystem.
 *
 * NOTE: Not all endpoints use the envelope (`{success, data}`) — some return
 * the bare resource directly (`data`). Check the endpoint's contract before
 * assuming one or the other. When designing NEW endpoints, prefer the envelope
 * for consistency.
 */

/** Successful response envelope. */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  /** Optional metadata (pagination info, request ID, etc.) */
  meta?: Record<string, unknown>;
}

/** Error response envelope. */
export interface ApiErrorResponse {
  success: false;
  /** Human-readable message (may be localized) */
  message: string;
  /** Stable machine-readable error code */
  error: string;
  /** HTTP status code echoed in the body */
  statusCode: number;
  /** Optional field-level validation errors */
  fieldErrors?: Record<string, string[]>;
  /** ISO 8601 timestamp */
  timestamp?: string;
  /** Request path (server-side debugging) */
  path?: string;
}

/** Discriminated union — use with `if (res.success)` narrowing. */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Minimal shape returned by NestJS's default exception filter.
 * Useful when catching axios errors from an SPM-ecosystem service.
 */
export interface NestExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}
