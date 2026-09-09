import {
  isProvisionClean,
  type ProvisionCollectionReport,
  type ProvisionRefineReport,
} from './provision';

const col = (
  over: Partial<ProvisionCollectionReport> = {},
): ProvisionCollectionReport => ({
  slug: 'services',
  schemaId: 's1',
  itemsInserted: 3,
  itemsFailed: 0,
  itemsRelationIssues: 0,
  ...over,
});

const refineOk: ProvisionRefineReport = { ok: true, relations: [], cascades: [] };

describe('isProvisionClean', () => {
  it('all-zero collections + refine ok → clean', () => {
    expect(isProvisionClean([col()], refineOk)).toBe(true);
  });

  it('refine threw → not clean', () => {
    expect(
      isProvisionClean([col()], { ok: false, error: 'boom', relations: [], cascades: [] }),
    ).toBe(false);
  });

  it('a collection had failed items → not clean', () => {
    expect(isProvisionClean([col({ itemsFailed: 2 })], refineOk)).toBe(false);
  });

  it('a collection had relation issues → not clean', () => {
    expect(isProvisionClean([col({ itemsRelationIssues: 1 })], refineOk)).toBe(false);
  });

  it('an unmatched relation value → not clean', () => {
    expect(
      isProvisionClean([col()], {
        ok: true,
        cascades: [],
        relations: [
          {
            collection: 'properties',
            field: 'group',
            ref: 'property_groups',
            records: 10,
            matched: 8,
            unmatched: ['บ้านเดี่ยว'],
            applied: true,
          },
        ],
      }),
    ).toBe(false);
  });

  it('a relation plan held back (not applied) → not clean', () => {
    expect(
      isProvisionClean([col()], {
        ok: true,
        cascades: [],
        relations: [
          {
            collection: 'properties',
            field: 'group',
            ref: 'property_groups',
            records: 10,
            matched: 0,
            unmatched: [],
            applied: false,
          },
        ],
      }),
    ).toBe(false);
  });

  it('legacy report missing itemsRelationIssues (undefined) → still clean', () => {
    const legacy = {
      slug: 'services',
      schemaId: 's1',
      itemsInserted: 3,
      itemsFailed: 0,
    } as unknown as ProvisionCollectionReport;
    expect(isProvisionClean([legacy], refineOk)).toBe(true);
  });
});
