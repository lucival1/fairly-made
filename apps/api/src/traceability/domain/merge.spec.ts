import {
  fieldOverride,
  loadTree,
  loadTshirtRefresh,
} from '../../testing/fixtures.js';
import { mergeTree } from './merge.js';
import type {
  Correction,
  DeclaredTree,
  Item,
  Step,
  WorkingComponent,
  WorkingItem,
  WorkingStep,
  WorkingTree,
} from './types.js';

// The scenarios from the brief, run against the seeded t-shirt tree and its
// refresh. stp_b2 = jersey DYEING (Tintoria Nord, IT → Malhas do Ave, PT in the
// refresh), stp_a3 = root PACKAGING (removed by the refresh).

const allItems = <T extends { children: T[] }>(root: T): T[] => [
  root,
  ...root.children.flatMap((child) => allItems(child)),
];

function declaredStep(tree: DeclaredTree, stepId: string): Step {
  const step = allItems<Item>(tree.rootItem)
    .flatMap((item) => item.steps)
    .find((s) => s.id === stepId);
  if (!step) {
    throw new Error(`no declared step ${stepId}`);
  }
  return step;
}

function workingStep(
  tree: WorkingTree,
  stepId: string,
): WorkingStep | undefined {
  return allItems<WorkingItem>(tree.rootItem)
    .flatMap((item) => item.steps)
    .find((s) => s.id === stepId);
}

function workingItem(
  tree: WorkingTree,
  itemId: string,
): WorkingItem | undefined {
  return allItems<WorkingItem>(tree.rootItem).find((i) => i.id === itemId);
}

describe('mergeTree', () => {
  const seed = loadTree('tshirt-mariniere');
  const refresh = loadTshirtRefresh();

  it('without corrections, reads the declared tree as DECLARED everywhere', () => {
    const { tree, dormant } = mergeTree(seed, []);

    expect(dormant).toEqual([]);
    expect(workingStep(tree, 'stp_b2')).toMatchObject({
      provenance: 'DECLARED',
      supplierId: { value: 'sup_3e91', provenance: 'DECLARED' },
      countryCode: { value: 'IT', provenance: 'DECLARED' },
    });
  });

  it('a corrected country survives a refresh; untouched facts come from the refresh', () => {
    const correction = fieldOverride('stp_b2', 'countryCode', 'FR');

    const { tree } = mergeTree(refresh, [correction]);

    expect(workingStep(tree, 'stp_b2')?.countryCode).toEqual({
      value: 'FR',
      provenance: 'CORRECTED',
      declaredValue: 'PT',
      correctionId: correction.id,
    });
    // Facts the user never touched are taken as they come.
    expect(workingStep(tree, 'stp_b2')?.supplierId).toEqual({
      value: 'sup_2b7c',
      provenance: 'DECLARED',
    });
    expect(workingStep(tree, 'stp_b3')?.supplierId.value).toBe('sup_1f3a');
    expect(workingItem(tree, 'itm_ts0142_c1')?.label).toBe(
      'Jersey coton bio 185 g/m²',
    );
  });

  it('a corrected supplier survives every later refresh, not just the first', () => {
    const correction = fieldOverride('stp_b1', 'supplierId', 'sup_7f60');
    const second = structuredClone(refresh);
    declaredStep(second, 'stp_b1').supplierId = 'sup_1f3a';
    const third = structuredClone(second);
    declaredStep(third, 'stp_b1').supplierId = null;

    for (const declared of [refresh, second, third]) {
      const { tree, dormant } = mergeTree(declared, [correction]);
      expect(workingStep(tree, 'stp_b1')?.supplierId.value).toBe('sup_7f60');
      expect(dormant).toEqual([]);
    }
  });

  it('applying the same refresh twice changes nothing', () => {
    const corrections = [fieldOverride('stp_b2', 'supplierId', 'sup_3e91')];

    expect(mergeTree(refresh, corrections)).toEqual(
      mergeTree(structuredClone(refresh), corrections),
    );
  });

  it('when a refresh contradicts a correction, the correction wins and the declared value is shown next to it', () => {
    const correction = fieldOverride('stp_b2', 'supplierId', 'sup_3e91');

    const corrected = mergeTree(refresh, [correction]).tree;
    expect(workingStep(corrected, 'stp_b2')?.supplierId).toMatchObject({
      value: 'sup_3e91',
      provenance: 'CORRECTED',
      declaredValue: 'sup_2b7c',
    });

    // Dropping the correction falls back to the declared value.
    const dropped = mergeTree(refresh, []).tree;
    expect(workingStep(dropped, 'stp_b2')?.supplierId).toEqual({
      value: 'sup_2b7c',
      provenance: 'DECLARED',
    });
  });

  it('when a refresh removes a corrected step, the step is not resurrected and the correction goes dormant', () => {
    const correction = fieldOverride('stp_a3', 'supplierId', 'sup_1f3a');

    const afterRemoval = mergeTree(refresh, [correction]);
    expect(workingStep(afterRemoval.tree, 'stp_a3')).toBeUndefined();
    expect(afterRemoval.dormant).toEqual([correction]);

    // Not destroyed: if a later tree brings the step back, it applies again.
    const backAgain = mergeTree(seed, [correction]);
    expect(workingStep(backAgain.tree, 'stp_a3')?.supplierId.value).toBe(
      'sup_1f3a',
    );
    expect(backAgain.dormant).toEqual([]);
  });

  it('an added step is appended to its item and survives a refresh that adds declared steps', () => {
    const added: Correction = {
      id: 'cor_added',
      createdAt: '2026-09-23T10:00:00.000Z',
      kind: 'ADDED_STEP',
      itemId: 'itm_ts0142_m2',
      step: {
        id: 'cor_stp_1',
        process: 'FIBER_PRODUCTION',
        supplierId: null,
        countryCode: 'CN',
      },
    };

    const { tree } = mergeTree(refresh, [added]);

    const steps = workingItem(tree, 'itm_ts0142_m2')?.steps ?? [];
    expect(steps.map((s) => [s.id, s.provenance])).toEqual([
      ['stp_c3', 'DECLARED'],
      ['cor_stp_1', 'CORRECTED'],
    ]);
  });

  it('an added step on an item that disappeared goes dormant', () => {
    const added: Correction = {
      id: 'cor_orphan',
      createdAt: '2026-09-23T10:00:00.000Z',
      kind: 'ADDED_STEP',
      itemId: 'itm_gone',
      step: {
        id: 'cor_stp_2',
        process: 'DYEING',
        supplierId: null,
        countryCode: null,
      },
    };

    expect(mergeTree(refresh, [added]).dormant).toEqual([added]);
  });

  it('a composition override replaces the declared composition as a whole', () => {
    const override: Correction = {
      id: 'cor_cmp',
      createdAt: '2026-09-23T10:00:00.000Z',
      kind: 'COMPOSITION_OVERRIDE',
      itemId: 'itm_ts0142_c1',
      value: [
        {
          id: 'cmp_c1_1',
          rawMaterial: 'COTTON_ORGANIC',
          percentage: 90,
          originCountryCode: 'IN',
        },
        {
          id: 'cmp_c1_2',
          rawMaterial: 'ELASTANE',
          percentage: 10,
          originCountryCode: null,
        },
      ],
    };

    const jersey = workingItem(
      mergeTree(refresh, [override]).tree,
      'itm_ts0142_c1',
    ) as WorkingComponent;

    expect(jersey.composition.provenance).toBe('CORRECTED');
    expect(jersey.composition.value.map((l) => l.percentage)).toEqual([90, 10]);
    expect(jersey.composition.declaredValue?.map((l) => l.percentage)).toEqual([
      92, 8,
    ]);
  });
});
