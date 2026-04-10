/**
 * Webhooks emitted by cust-desire-server → consumed by spm-core-server.
 *
 * Endpoint: POST {SPM_CORE_API_URL}/api/webhooks/cust-desire
 * Signature header: x-custdesire-signature (HMAC-SHA256 of raw body, secret is CUST_DESIRE_WEBHOOK_SECRET)
 *
 * Two categories of events:
 *   - **Sync events** — spm-core must return a JSON result synchronously
 *     (e.g., parse_customer_text, analyze_schema)
 *   - **Async events** — spm-core acknowledges with 2xx and processes in background
 *     (e.g., project.status_changed, case.triage_request, case.estimate_request)
 */

import type { WebhookEnvelope } from './common';

/** All event names emitted by cust-desire. Literal union for exhaustive handling. */
export type CustDesireEventType =
  | 'project.status_changed'
  | 'case.triage_request'
  | 'case.estimate_request'
  | 'parse_customer_text'
  | 'analyze_schema';

// ── Async event payloads ─────────────────────────────────────────────

export interface ProjectStatusChangedPayload {
  projectCode: string;
  projectName: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

export interface CaseTriageRequestPayload {
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  affectedPages?: string[];
  currentContent?: string;
  newContent?: string;
  projectCode: string;
  projectName: string;
}

export interface CaseEstimateRequestPayload {
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  priority: string;
  projectCode: string;
  projectName: string;
  /** Hours already logged on prior rounds, if any */
  priorHours?: number;
}

// ── Sync event payloads ──────────────────────────────────────────────

export interface ParseCustomerTextPayload {
  /** Raw customer-written text (Thai or English) to extract structured fields from */
  text: string;
  /** Optional context — e.g., which form the text came from */
  source?: string;
}

export interface ParseCustomerTextResponse {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  address?: string;
  /** Raw parsed dictionary for caller to interpret; reserved for future fields */
  extra?: Record<string, unknown>;
}

export interface AnalyzeSchemaPayload {
  /** Sample data the caller wants the AI to derive a schema from */
  sample: unknown;
  /** Optional hint about expected schema shape */
  intent?: string;
}

export interface AnalyzeSchemaResponse {
  /** JSON Schema (draft-07) describing the inferred shape */
  schema: Record<string, unknown>;
  /** Human-readable summary of what the AI saw */
  summary: string;
}

// ── Envelope aliases — narrow the generic envelope per event ─────────

export type ProjectStatusChangedEvent = WebhookEnvelope<
  'project.status_changed',
  ProjectStatusChangedPayload
>;

export type CaseTriageRequestEvent = WebhookEnvelope<
  'case.triage_request',
  CaseTriageRequestPayload
>;

export type CaseEstimateRequestEvent = WebhookEnvelope<
  'case.estimate_request',
  CaseEstimateRequestPayload
>;

export type ParseCustomerTextEvent = WebhookEnvelope<
  'parse_customer_text',
  ParseCustomerTextPayload
>;

export type AnalyzeSchemaEvent = WebhookEnvelope<'analyze_schema', AnalyzeSchemaPayload>;

/** Discriminated union of every event cust-desire can send. Use in the receiver's switch statement. */
export type CustDesireWebhookEvent =
  | ProjectStatusChangedEvent
  | CaseTriageRequestEvent
  | CaseEstimateRequestEvent
  | ParseCustomerTextEvent
  | AnalyzeSchemaEvent;
