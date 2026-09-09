/**
 * Structured outcome of a BackSphere tenant provision (`POST /provision`).
 *
 * Before this type existed, provision returned only `{ tenantId, tenantSlug,
 * collections: [{slug, schemaId, count}] }` and the cross-collection refine step
 * (relation wiring + data migration + cascades) logged its result and threw it
 * away — so cust-desire had no way to know a tenant went live with relations
 * unwired or values unmatched. This surfaces the data the refiner already
 * computes.
 */

/** Per-collection insert outcome. */
export interface ProvisionCollectionReport {
  slug: string;
  schemaId: string;
  itemsInserted: number;
  /** Items skipped because they failed schema validation / media checks during bulk insert. */
  itemsFailed: number;
  /**
   * Items written but holding a `widget:'relation'` value that points at a record
   * that doesn't exist in the target collection (checked after the cross-collection
   * refine wires relations). Non-zero = relation data to reconcile by hand.
   */
  itemsRelationIssues: number;
}

/** One string→relation field that the refiner flipped, and how the value migration went. */
export interface ProvisionRelationReport {
  collection: string;
  field: string;
  /** Target collection name. */
  ref: string;
  /** Rows in `collection` that held a value for `field`. */
  records: number;
  /** Rows whose value matched a record in `ref` and was rewritten to its id. */
  matched: number;
  /** Distinct values that matched nothing in `ref` (left as-is). Non-empty = data to reconcile. */
  unmatched: string[];
  /** false = the flip was held back (e.g. every value unmatched) to avoid stranding data. */
  applied: boolean;
}

/** One relation dropdown that was made dependent on another (e.g. district ← province). */
export interface ProvisionCascadeReport {
  collection: string;
  field: string;
  dependsOn: string;
  applied: boolean;
}

/** Result of the cross-collection refine pass (`refineTenantSchemas`). */
export interface ProvisionRefineReport {
  /** false = the refine pass threw; the tenant exists but relations/cascades may be unwired. */
  ok: boolean;
  /** Present when `ok` is false. */
  error?: string;
  relations: ProvisionRelationReport[];
  cascades: ProvisionCascadeReport[];
}

export interface ProvisionReport {
  tenantId: string;
  tenantSlug: string;
  /** true = the tenant already existed; provision only reset credentials, no schema/content work. */
  alreadyExists?: boolean;
  collections: ProvisionCollectionReport[];
  refine: ProvisionRefineReport;
  /**
   * true when nothing needs a human look: refine ok, no failed items, no unmatched
   * relation values. Callers can gate an alert on `!clean`.
   */
  clean: boolean;
}

/** Derive `clean` from the rest of the report. */
export function isProvisionClean(
  collections: ProvisionCollectionReport[],
  refine: ProvisionRefineReport,
): boolean {
  if (!refine.ok) return false;
  if (collections.some((c) => c.itemsFailed > 0)) return false;
  // `itemsRelationIssues` is optional at runtime for reports written before the
  // field existed — `undefined > 0` is false, so an old report stays "clean".
  if (collections.some((c) => c.itemsRelationIssues > 0)) return false;
  if (refine.relations.some((r) => r.unmatched.length > 0 || !r.applied)) return false;
  return true;
}
