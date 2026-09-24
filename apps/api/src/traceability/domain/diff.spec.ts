import {
  fieldOverride,
  loadTree,
  loadTshirtRefresh,
} from '../../testing/fixtures.js';
import { diffTrees } from './diff.js';
import { mergeTree } from './merge.js';

describe('diffTrees', () => {
  const seed = mergeTree(loadTree('tshirt-mariniere'), []).tree;
  const refreshed = mergeTree(loadTshirtRefresh(), []).tree;

  it('finds nothing between a tree and itself', () => {
    expect(diffTrees(seed, structuredClone(seed))).toEqual([]);
  });

  it('finds every change the seeded refresh brings', () => {
    const summary = diffTrees(seed, refreshed).map((c) =>
      [c.change, c.id, ...c.fields.map((f) => f.field)].join(' '),
    );

    expect(summary.sort()).toEqual(
      [
        // renames + composition 95/5 → 92/8
        'CHANGED itm_ts0142_c1 label composition',
        // not in the brief's list: thread usage 8 % → 6 %
        'CHANGED itm_ts0142_c3 usagePercentage',
        // elastane origin now known
        'CHANGED itm_ts0142_m2 originCountryCode',
        // dyeing contradicts: Tintoria Nord (IT) → Malhas do Ave (PT)
        'CHANGED stp_b2 supplierId countryCode',
        // holes filled
        'CHANGED stp_b3 supplierId countryCode',
        'CHANGED stp_c1 supplierId',
        // new component with its step, first elastane step
        'ADDED itm_ts0142_c5',
        'ADDED stp_p1',
        'ADDED stp_c3',
        // root packaging dropped
        'REMOVED stp_a3',
      ].sort(),
    );
  });

  it('reports before and after values of a changed field', () => {
    const corrected = mergeTree(loadTree('tshirt-mariniere'), [
      fieldOverride('stp_b2', 'countryCode', 'FR'),
    ]).tree;

    expect(diffTrees(seed, corrected)).toEqual([
      {
        id: 'stp_b2',
        entity: 'STEP',
        label: 'DYEING · Jersey coton bio 180 g/m²',
        change: 'CHANGED',
        fields: [{ field: 'countryCode', before: 'IT', after: 'FR' }],
      },
    ]);
  });
});
