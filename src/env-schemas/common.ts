/**
 * Reusable zod validators for env vars that appear in multiple SPM projects.
 *
 * Each project's own `src/config/env.schema.ts` can compose these instead of
 * re-declaring the same rules. This keeps validation rules consistent across
 * the ecosystem (e.g., "a JWT secret is at least 16 chars everywhere").
 *
 * Usage:
 *   import { commonEnvValidators } from '@spm/shared-types/env-schemas';
 *   import { z } from 'zod';
 *
 *   export const envSchema = z.object({
 *     DATABASE_URL: commonEnvValidators.postgresUrl,
 *     PORT: commonEnvValidators.port,
 *     JWT_SECRET: commonEnvValidators.jwtSecret,
 *     CORS_ORIGINS: commonEnvValidators.csvStringArray,
 *     ...
 *   });
 */

import { z } from 'zod';

/**
 * Collection of pre-built zod validators. Each is a plain `ZodType` that can
 * be dropped directly into a `z.object({ ... })` call.
 */
export const commonEnvValidators = {
  /** Valid http(s):// URL */
  httpUrl: z.string().url(),

  /** Valid postgresql:// connection string */
  postgresUrl: z.string().url().startsWith('postgresql://'),

  /** TCP port (1–65535), coerced from string env var */
  port: z.coerce.number().int().min(1).max(65535),

  /** Minimum 16-character secret (suitable for JWT signing, AES keys, etc.) */
  jwtSecret: z.string().min(16),

  /** Minimum 32-character secret (suitable for AES-256-GCM encryption keys) */
  encryptionKey32: z.string().min(32),

  /** Minimum 1-char non-empty string (rejects '') */
  nonEmpty: z.string().min(1),

  /** Node environment enum — accepts development | staging | production */
  nodeEnv: z
    .enum(['development', 'staging', 'production'])
    .default('development'),

  /** Anthropic API key — must start with `sk-ant-` */
  anthropicApiKey: z.string().startsWith('sk-ant-'),

  /** GitHub personal access token — must start with `ghp_` */
  githubPat: z.string().startsWith('ghp_'),

  /**
   * Comma-separated string → trimmed string[].
   * Input:  "a, b ,c"
   * Output: ['a', 'b', 'c']
   *
   * Use for CORS_ORIGINS, allow-lists, etc.
   */
  csvStringArray: z
    .string()
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),

  /** Valid email address */
  email: z.string().email(),
} as const;

/**
 * Type helper: extract the inferred output of a common validator by name.
 *
 *   type Port = InferCommon<'port'>;  // number
 */
export type InferCommon<K extends keyof typeof commonEnvValidators> = z.infer<
  (typeof commonEnvValidators)[K]
>;
