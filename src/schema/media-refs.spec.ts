import { applyMediaRefs, collectMediaRefs, mediaRefKey } from './media-refs';
import type { MappedSchema } from './field-descriptor';

/**
 * The schemas below are copied from live tenant data (orianna-clinic), because
 * the bug this module exists to prevent was a traversal that never reached
 * `blogs.images[].url` — an array of objects.
 */
const blogsSchema: MappedSchema = {
  title: { type: 'string', widget: 'text' },
  content: { type: 'string', widget: 'richtext' },
  coverImage: { type: 'string', widget: 'image', isMediaField: true },
  images: {
    type: 'array',
    widget: 'array',
    items: {
      type: 'object',
      widget: 'object',
      properties: {
        url: { type: 'string', widget: 'image', isMediaField: true },
        alt: { type: 'string', widget: 'text' },
      },
    },
  },
};

const portfolioSchema: MappedSchema = {
  title: { type: 'string', widget: 'text' },
  thumbnail: { type: 'string', widget: 'image', isMediaField: true },
  images: { type: 'array', widget: 'array', items: { type: 'string', widget: 'image' } },
};

describe('collectMediaRefs', () => {
  it('finds media nested inside an array of objects', () => {
    const refs = collectMediaRefs(
      {
        title: 'ไม่ใช่รูป',
        content: 'ข้อความมี .png อยู่ในนั้นด้วย',
        coverImage: '/images/blog/blog-07/cover.png',
        images: [
          { url: '/images/blog/blog-07/image-01.png', alt: 'คำอธิบาย' },
          { url: '/images/blog/blog-07/image-02.png', alt: 'อีกอัน' },
        ],
      },
      blogsSchema,
    );

    expect(refs.map((r) => mediaRefKey(r.path))).toEqual([
      'coverImage',
      'images.0.url',
      'images.1.url',
    ]);
    expect(refs.every((r) => r.widget === 'image')).toBe(true);
  });

  it('finds media in an array of plain strings', () => {
    const refs = collectMediaRefs(
      { title: 'งานผิว', thumbnail: '/a/1.jpg', images: ['/a/1.jpg', '/a/2.jpg'] },
      portfolioSchema,
    );
    expect(refs.map((r) => mediaRefKey(r.path))).toEqual(['thumbnail', 'images.0', 'images.1']);
  });

  it('treats gallery elements as media even without an items descriptor', () => {
    const refs = collectMediaRefs(
      { photos: ['/a.jpg', '/b.jpg'] },
      { photos: { type: 'array', isMediaField: true } },
    );
    expect(refs.map((r) => mediaRefKey(r.path))).toEqual(['photos.0', 'photos.1']);
    expect(refs.every((r) => r.widget === 'image')).toBe(true);
  });

  it('reads only the url of an object-formed media value, never its metadata', () => {
    // real shape from tenant project-nuc86k: catalog = files widget, no items descriptor
    const refs = collectMediaRefs(
      {
        catalog: [
          { url: 'https://cdn.test/19d6533d.pdf', name: 'ชิ้นส่วนตัวถัง ISUZU.pdf' },
          { url: 'https://cdn.test/f0306df2.pdf', name: 'ชิ้นส่วนตัวถัง HINO.pdf' },
        ],
      },
      { catalog: { type: 'array', widget: 'files', isMediaField: true } },
    );

    expect(refs.map((r) => [mediaRefKey(r.path), r.value])).toEqual([
      ['catalog.0.url', 'https://cdn.test/19d6533d.pdf'],
      ['catalog.1.url', 'https://cdn.test/f0306df2.pdf'],
    ]);
  });

  it('treats each translation of a localized media field as its own ref', () => {
    const refs = collectMediaRefs(
      { banner: { th: '/th/banner.png', en: '/en/banner.png' } },
      { banner: { type: 'string', widget: 'image' } },
    );
    expect(refs.map((r) => mediaRefKey(r.path))).toEqual(['banner.th', 'banner.en']);
  });

  it('never infers media from a field name or a file extension', () => {
    const refs = collectMediaRefs(
      {
        // every trap the previous name/value-guessing implementation fell for
        imageUrl: '/images/not-declared-as-media.png',
        logo: '/images/logo.png',
        downloadLink: 'https://example.com/manual.pdf',
      },
      {
        imageUrl: { type: 'string', widget: 'text' },
        logo: { type: 'string', widget: 'text' },
        downloadLink: { type: 'string', widget: 'url' },
      },
    );
    expect(refs).toEqual([]);
  });

  it('ignores data keys the schema does not describe, and empty values', () => {
    const refs = collectMediaRefs(
      { coverImage: '', legacyCover: '/images/old.png', images: null },
      blogsSchema,
    );
    expect(refs).toEqual([]);
  });

  it('reads media widgets from a legacy descriptor that has no explicit widget', () => {
    const refs = collectMediaRefs(
      { cover: '/a.png', docs: ['/a.pdf'] },
      {
        cover: { type: 'string', isMediaField: true },
        docs: { type: 'array', widget: 'files' },
      },
    );
    expect(refs.map((r) => [mediaRefKey(r.path), r.widget])).toEqual([
      ['cover', 'image'],
      ['docs.0', 'file'],
    ]);
  });
});

describe('applyMediaRefs', () => {
  const record = {
    title: 'หัวข้อ',
    coverImage: '/images/blog/blog-07/cover.png',
    images: [
      { url: '/images/blog/blog-07/image-01.png', alt: 'คำอธิบาย' },
      { url: '/images/blog/blog-07/image-02.png', alt: 'อีกอัน' },
    ],
  };

  it('rewrites every media value and leaves everything else identical', () => {
    const next = applyMediaRefs(record, blogsSchema, (ref) => `https://cdn.test${ref.value}`);

    expect(next).toEqual({
      title: 'หัวข้อ',
      coverImage: 'https://cdn.test/images/blog/blog-07/cover.png',
      images: [
        { url: 'https://cdn.test/images/blog/blog-07/image-01.png', alt: 'คำอธิบาย' },
        { url: 'https://cdn.test/images/blog/blog-07/image-02.png', alt: 'อีกอัน' },
      ],
    });
  });

  it('keeps the original value when the caller returns undefined', () => {
    const next = applyMediaRefs(record, blogsSchema, (ref) =>
      ref.path[0] === 'coverImage' ? 'https://cdn.test/cover.png' : undefined,
    );
    expect(next.coverImage).toBe('https://cdn.test/cover.png');
    expect(next.images[0].url).toBe('/images/blog/blog-07/image-01.png');
  });

  it('rewrites an object-formed media value in place, keeping its metadata', () => {
    const schema: MappedSchema = { catalog: { type: 'array', widget: 'files', isMediaField: true } };
    const input = { catalog: [{ url: '/files/a.pdf', name: 'แค็ตตาล็อก ISUZU.pdf' }] };
    const next = applyMediaRefs(input, schema, (ref) => `https://cdn.test${ref.value}`);
    expect(next).toEqual({
      catalog: [{ url: 'https://cdn.test/files/a.pdf', name: 'แค็ตตาล็อก ISUZU.pdf' }],
    });
  });

  it('does not mutate the input record', () => {
    const snapshot = JSON.stringify(record);
    applyMediaRefs(record, blogsSchema, () => 'https://cdn.test/x.png');
    expect(JSON.stringify(record)).toBe(snapshot);
  });

  it('round-trips: what collect finds is exactly what apply rewrites', () => {
    const found = collectMediaRefs(record, blogsSchema).map((r) => mediaRefKey(r.path));
    const rewritten: string[] = [];
    applyMediaRefs(record, blogsSchema, (ref) => {
      rewritten.push(mediaRefKey(ref.path));
      return undefined;
    });
    expect(rewritten).toEqual(found);
  });
});
