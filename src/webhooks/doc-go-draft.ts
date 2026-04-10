/**
 * Webhooks emitted by doc-go-draft-server → consumed by spm-core-server.
 *
 * Endpoint: POST {SPM_CORE_API_URL}/api/webhooks/cust-desire
 * (shared endpoint with cust-desire — hub-and-spoke pattern, distinguished by event name)
 *
 * Signature header: x-docgodraft-signature (HMAC-SHA256 of raw body, secret is SPM_CORE_WEBHOOK_SECRET)
 *
 * doc-go-draft primarily delegates AI work to spm-core (which owns the Claude API key).
 */

import type { WebhookEnvelope } from './common';

/** All event names emitted by doc-go-draft. */
export type DocGoDraftEventType =
  | 'parse_customer_text'
  | 'document.generated'
  | 'workflow.stage_completed';

// ── Sync event payloads ──────────────────────────────────────────────

/**
 * Request spm-core to parse free-form customer text into structured fields.
 * Reuses the same payload contract as cust-desire's parse_customer_text event
 * so spm-core can have a single handler.
 */
export interface DocGoDraftParseCustomerTextPayload {
  text: string;
  /** Which document type the text will populate (affects AI hint) */
  documentType?: 'quotation' | 'invoice' | 'contract' | 'receipt' | string;
  source?: string;
}

export interface DocGoDraftParseCustomerTextResponse {
  name?: string;
  companyName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  extra?: Record<string, unknown>;
}

// ── Async event payloads ─────────────────────────────────────────────

export interface DocumentGeneratedPayload {
  documentId: string;
  documentType: string;
  projectName?: string;
  fileName: string;
  /** Public share URL — may be empty until a share is created */
  shareUrl?: string;
  createdAt: string;
}

export interface WorkflowStageCompletedPayload {
  workflowJobId: string;
  stageId: string;
  stageName: string;
  /** Outcome of the stage — 'success' | 'skipped' | 'failed' + optional reason */
  outcome: 'success' | 'skipped' | 'failed';
  reason?: string;
  completedAt: string;
}

// ── Envelope aliases ─────────────────────────────────────────────────

export type DocGoDraftParseCustomerTextEvent = WebhookEnvelope<
  'parse_customer_text',
  DocGoDraftParseCustomerTextPayload
>;

export type DocumentGeneratedEvent = WebhookEnvelope<
  'document.generated',
  DocumentGeneratedPayload
>;

export type WorkflowStageCompletedEvent = WebhookEnvelope<
  'workflow.stage_completed',
  WorkflowStageCompletedPayload
>;

/** Discriminated union of every event doc-go-draft can send. */
export type DocGoDraftWebhookEvent =
  | DocGoDraftParseCustomerTextEvent
  | DocumentGeneratedEvent
  | WorkflowStageCompletedEvent;
