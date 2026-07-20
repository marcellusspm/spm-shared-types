/**
 * Dynamic content — media reference traversal.
 *
 * Companion to `field-descriptor.ts` and bound by the same law: **which values
 * are media is decided by the descriptor, never by a field name, a file
 * extension, or the shape of a sample value**. Anything that needs to find or
 * rewrite media inside a content record — import pipelines, storage
 * normalizers, maintenance tooling — walks the record through here so every
 * surface agrees on the same answer.
 *
 * The traversal is a pure function of (data, schema): no I/O, no storage
 * knowledge, no notion of what a "correct" URL looks like. Deciding whether a
 * value needs to change is the caller's policy; finding it is this module's job.
 */
import { resolveWidget, type FieldDescriptor, type FieldWidget, type MappedSchema } from './field-descriptor';

/** Widgets whose stored value is a media URL. */
export const MEDIA_WIDGETS: ReadonlySet<FieldWidget> = new Set<FieldWidget>([
  'image',
  'gallery',
  'file',
  'files',
]);

/** Widgets that hold a *collection* of media URLs rather than a single one. */
const MEDIA_COLLECTION_WIDGETS: ReadonlySet<FieldWidget> = new Set<FieldWidget>(['gallery', 'files']);

/**
 * A media value may be stored as a bare URL string, or as an object carrying
 * the URL under this key alongside display metadata (`name`, `alt`, …) — the
 * shape produced by the media picker for `gallery` / `files` fields. Only the
 * URL is a media reference; the metadata beside it is ordinary content.
 */
export const MEDIA_URL_KEY = 'url';

/** One media value found inside a content record. */
export interface MediaRef {
  /** Location within the record, e.g. `['images', 2, 'url']`. */
  path: ReadonlyArray<string | number>;
  /** The value as stored. */
  value: string;
  /** The widget that declared this value to be media. */
  widget: FieldWidget;
}

/** Stable string form of a path — usable as a Map key. */
export function mediaRefKey(path: ReadonlyArray<string | number>): string {
  return path.map((p) => String(p)).join('.');
}

/**
 * Visit every media value in `data` as described by `schema`.
 *
 * `rewrite` returns the replacement for a ref, or `undefined` to leave it as
 * is. Returning a value never mutates the input — a new record is built.
 */
function traverse(
  data: unknown,
  schema: MappedSchema,
  onRef: (ref: MediaRef) => string | undefined,
): unknown {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return data;
  const record = data as Record<string, unknown>;

  const next: Record<string, unknown> = { ...record };
  for (const [name, descriptor] of Object.entries(schema)) {
    if (!(name in record)) continue;
    next[name] = visit(record[name], descriptor, [name], onRef);
  }
  return next;
}

function visit(
  value: unknown,
  descriptor: FieldDescriptor,
  path: ReadonlyArray<string | number>,
  onRef: (ref: MediaRef) => string | undefined,
): unknown {
  if (value === null || value === undefined) return value;

  const widget = resolveWidget(descriptor);

  // Array — element descriptor decides. A gallery/files widget declares its
  // own elements to be media even when no `items` descriptor is present.
  if (Array.isArray(value)) {
    const itemDescriptor: FieldDescriptor =
      descriptor.items ??
      (MEDIA_COLLECTION_WIDGETS.has(widget)
        ? { type: 'string', widget: widget === 'gallery' ? 'image' : 'file' }
        : { type: 'string' });
    return value.map((item, index) => visit(item, itemDescriptor, [...path, index], onRef));
  }

  // Object — recurse into declared sub-fields only.
  if (typeof value === 'object' && descriptor.properties) {
    return traverse(value, descriptor.properties, (ref) =>
      onRef({ ...ref, path: [...path, ...ref.path] }),
    );
  }

  if (!MEDIA_WIDGETS.has(widget)) return value;
  return visitMediaValue(value, widget, path, onRef);
}

/**
 * A value the descriptor has already declared to be media. Accepts the three
 * storage shapes the platform uses: a URL string, an object carrying the URL
 * under `url` plus metadata, or a localized map of either.
 */
function visitMediaValue(
  value: unknown,
  widget: FieldWidget,
  path: ReadonlyArray<string | number>,
  onRef: (ref: MediaRef) => string | undefined,
): unknown {
  if (typeof value === 'string') {
    if (value === '') return value;
    return onRef({ path, value, widget }) ?? value;
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const object = value as Record<string, unknown>;

  // Object-formed media — only `url` is a reference, the rest is metadata.
  const url = object[MEDIA_URL_KEY];
  if (typeof url === 'string') {
    if (url === '') return value;
    const replacement = onRef({ path: [...path, MEDIA_URL_KEY], value: url, widget });
    return replacement === undefined ? value : { ...object, [MEDIA_URL_KEY]: replacement };
  }

  // Localized map — one media value per language.
  const next: Record<string, unknown> = { ...object };
  let changed = false;
  for (const [lang, translated] of Object.entries(object)) {
    const visited = visitMediaValue(translated, widget, [...path, lang], onRef);
    if (visited !== translated) {
      next[lang] = visited;
      changed = true;
    }
  }
  return changed ? next : value;
}

/** Every media value in a content record, in traversal order. */
export function collectMediaRefs(data: unknown, schema: MappedSchema): MediaRef[] {
  const refs: MediaRef[] = [];
  traverse(data, schema, (ref) => {
    refs.push(ref);
    return undefined;
  });
  return refs;
}

/**
 * Rewrite media values in a content record. `replace` receives each ref and
 * returns its replacement, or `undefined` to keep the current value.
 * Non-media data is copied through untouched; the input is never mutated.
 */
export function applyMediaRefs<T>(
  data: T,
  schema: MappedSchema,
  replace: (ref: MediaRef) => string | undefined,
): T {
  return traverse(data, schema, replace) as T;
}
