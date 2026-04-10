/**
 * Common webhook primitives shared by all producers/consumers in the SPM ecosystem.
 */

/**
 * HMAC-SHA256 signature header name conventions.
 *
 * Each producer uses a distinct header name so the receiver can tell who signed it.
 */
export const WebhookSignatureHeader = {
  CUST_DESIRE: 'x-custdesire-signature',
  DOC_GO_DRAFT: 'x-docgodraft-signature',
  SPM_CORE: 'x-spmcore-signature',
} as const;

export type WebhookSignatureHeaderName =
  (typeof WebhookSignatureHeader)[keyof typeof WebhookSignatureHeader];

/**
 * Generic webhook envelope. All webhook POSTs in the ecosystem follow this shape,
 * wrapping their event-specific payload in `data`.
 *
 * @template TEvent Literal string type of the event name (narrow this per producer)
 * @template TData  Shape of the event-specific payload
 */
export interface WebhookEnvelope<TEvent extends string, TData> {
  /** Event identifier — e.g., 'case.triage_request', 'parse_customer_text' */
  event: TEvent;

  /** ISO 8601 timestamp of when the producer emitted the event */
  timestamp: string;

  /** Event-specific payload */
  data: TData;

  /** Optional producer-assigned ID for deduplication / idempotency */
  eventId?: string;
}

/**
 * Standard webhook HTTP response from the receiver.
 * Producers should treat 2xx as acknowledged, 4xx as permanently failed
 * (signature invalid, malformed), and 5xx as retryable.
 */
export interface WebhookResponse {
  received: boolean;
  eventId?: string;
  /** Present on error responses */
  error?: string;
}
