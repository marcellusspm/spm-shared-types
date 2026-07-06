/**
 * @spm/shared-types — main aggregate export
 *
 * Re-exports every subfolder so consumers can either:
 *   import type { ... } from '@spm/shared-types';                  // everything
 *   import type { ... } from '@spm/shared-types/webhooks';          // subtree only (better for tree-shaking)
 */

export * from './webhooks';
export * from './dtos';
export * from './enums';
export * from './env-schemas';
export * from './schema';
