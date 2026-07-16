/**
 * Dynamic content schema — Field Descriptor v2.
 *
 * The BackSphere CMS renders every collection (list / create / edit) as a pure
 * function of this descriptor. Nothing in the UI should guess a widget from a
 * field name or a sample value — the descriptor is the single source of truth.
 *
 * Backward-compat: every field beyond `type` is OPTIONAL, so a legacy
 * `mappedSchema` of shape `{ type, label, isRequired, isMediaField }` is still a
 * valid `MappedSchema`. `resolveWidget()` derives a widget deterministically for
 * legacy descriptors that lack an explicit `widget`.
 */

/** How a value is stored (kept intentionally small; matches legacy set). */
export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';

/** How a value is edited / displayed. The only signal the UI switches on. */
export type FieldWidget =
  | 'text'
  | 'longtext'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'image'
  | 'gallery'
  | 'file'
  | 'files'
  | 'enum'
  | 'relation'
  | 'url'
  | 'email'
  | 'object'
  | 'array';

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface FieldDescriptor {
  /** Storage type. Required. */
  type: FieldType;
  /** Explicit UI widget. If absent, derived from `type` (+ `isMediaField`). */
  widget?: FieldWidget;
  /** Thai label shown in the UI. */
  label?: string;
  /** Deterministic display order (ascending). Missing = sorts last. */
  order?: number;
  isRequired?: boolean;
  /** Legacy media flag — kept for backward-compat + widget derivation. */
  isMediaField?: boolean;
  /** Default value used to seed create forms and fill missing keys. */
  default?: unknown;
  /** Allowed values for `widget: 'enum'`. */
  options?: string[];
  /** Target collection name for `widget: 'relation'`. */
  ref?: string;
  /** Element descriptor for `type: 'array'`. */
  items?: FieldDescriptor;
  /** Sub-field descriptors for `type: 'object'`. */
  properties?: Record<string, FieldDescriptor>;
  /** Whether to show this field as a column in the list table. */
  showInList?: boolean;
  /** System / auto-managed field — not user-editable. */
  readOnly?: boolean;
  validation?: FieldValidation;
}

export type MappedSchema = Record<string, FieldDescriptor>;

/**
 * Keys that are system metadata, never real content fields. They are preserved
 * (not stripped) during validation and hidden from generated forms.
 */
export const SYSTEM_META_FIELDS = [
  'id',
  '_id',
  'sortOrder',
  'createdAt',
  'updatedAt',
  'created_at',
  'updated_at',
  'countViews',
  'legacyId',
  'blocksCount',
  'slug',
] as const;

/**
 * Deterministically resolve the UI widget for a field.
 * Uses ONLY the descriptor (type / widget / isMediaField / items) — never the
 * field name or a runtime value.
 */
export function resolveWidget(field: FieldDescriptor): FieldWidget {
  if (field.widget) return field.widget;
  switch (field.type) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'object':
      return 'object';
    case 'array':
      if (field.isMediaField) return 'gallery';
      return field.items?.type === 'string' ? 'enum' : 'array';
    case 'string':
      return field.isMediaField ? 'image' : 'text';
    default:
      return 'text';
  }
}

/** Fields of a schema, sorted by `order` (missing order sorts last, stable). */
export function orderedFields(schema: MappedSchema): Array<[string, FieldDescriptor]> {
  return Object.entries(schema).sort(([, a], [, b]) => {
    const oa = a.order ?? Number.MAX_SAFE_INTEGER;
    const ob = b.order ?? Number.MAX_SAFE_INTEGER;
    return oa - ob;
  });
}

/** The empty value appropriate for a storage type. */
export function emptyValueForType(type: FieldType): unknown {
  switch (type) {
    case 'array':
      return [];
    case 'object':
      return {};
    case 'boolean':
      return false;
    case 'number':
      return null;
    case 'date':
      return null;
    case 'string':
      return '';
    default:
      return null;
  }
}

/** The seed value for a field on create: explicit default, else empty-for-type. */
export function defaultValueFor(field: FieldDescriptor): unknown {
  return field.default !== undefined ? field.default : emptyValueForType(field.type);
}
