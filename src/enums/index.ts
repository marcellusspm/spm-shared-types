/**
 * Enum constants that cross project boundaries in the SPM ecosystem.
 *
 * These are defined as `const` objects with `as const` + derived string literal
 * union types instead of TypeScript `enum` — this gives:
 *   - Tree-shakeable output (no runtime enum object if only types are used)
 *   - Exhaustive switch checking
 *   - Compatibility with Prisma string enums
 */

// ── Agent types (spm-core AI orchestrator) ──────────────────────────

export const AgentType = {
  SALES: 'SALES',
  ACCOUNTING: 'ACCOUNTING',
  DEV: 'DEV',
  CEO: 'CEO',
  CUSTOM: 'CUSTOM',
} as const;

export type AgentType = (typeof AgentType)[keyof typeof AgentType];

// ── Conversation lifecycle ──────────────────────────────────────────

export const ConversationStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  HUMAN_TAKEOVER: 'HUMAN_TAKEOVER',
  CLOSED: 'CLOSED',
} as const;

export type ConversationStatus =
  (typeof ConversationStatus)[keyof typeof ConversationStatus];

// ── Support case lifecycle (cust-desire) ────────────────────────────

export const CaseStatus = {
  NEW: 'NEW',
  TRIAGED: 'TRIAGED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_REVIEW: 'WAITING_REVIEW',
  REVISION: 'REVISION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

export const CasePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type CasePriority = (typeof CasePriority)[keyof typeof CasePriority];

// ── User roles (cross-project) ──────────────────────────────────────

/**
 * Roles used in back-sphere and cust-desire-server.
 * Note: spm-core-server currently uses a single OWNER role (single-tenant).
 */
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  LEADER: 'LEADER',
  DEVELOPER: 'DEVELOPER',
  TESTER: 'TESTER',
  SUPPORT: 'SUPPORT',
  ACCOUNTANT: 'ACCOUNTANT',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
  OWNER: 'OWNER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
