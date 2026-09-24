import type {
  AddedStep,
  ComponentItem,
  CompositionOverride,
  Correction,
  DeclaredTree,
  FieldOverride,
  MaterialItem,
  ProductItem,
  Step,
  StepField,
  Traced,
  WorkingComponent,
  WorkingMaterial,
  WorkingProduct,
  WorkingStep,
  WorkingTree,
} from './types.js';

export interface MergeResult {
  tree: WorkingTree;
  /**
   * Corrections whose target is not in the declared tree any more. They are
   * not applied (nothing gets resurrected) and not deleted: if a later
   * refresh brings the target back, they apply again.
   */
  dormant: Correction[];
}

/**
 * declared ⊕ corrections → working tree.
 *
 * Pure and deterministic: the same declared tree and corrections always give
 * the same working tree. That is what makes a repeated refresh a no-op and
 * lets a correction survive any number of refreshes: the refresh only ever
 * swaps the declared input.
 */
export function mergeTree(
  declared: DeclaredTree,
  corrections: readonly Correction[],
): MergeResult {
  const index = indexCorrections(corrections);
  const applied = new Set<string>();

  const tree: WorkingTree = {
    product: declared.product,
    rootItem: mergeProduct(declared.rootItem, index, applied),
  };
  const dormant = corrections.filter((c) => !applied.has(c.id));

  return { tree, dormant };
}

interface CorrectionIndex {
  fields: Map<string, FieldOverride>;
  compositions: Map<string, CompositionOverride>;
  addedSteps: Map<string, AddedStep[]>;
}

const fieldKey = (stepId: string, field: StepField) => `${stepId}:${field}`;

function indexCorrections(corrections: readonly Correction[]): CorrectionIndex {
  const index: CorrectionIndex = {
    fields: new Map(),
    compositions: new Map(),
    addedSteps: new Map(),
  };
  for (const correction of corrections) {
    switch (correction.kind) {
      case 'FIELD_OVERRIDE':
        index.fields.set(
          fieldKey(correction.stepId, correction.field),
          correction,
        );
        break;
      case 'COMPOSITION_OVERRIDE':
        index.compositions.set(correction.itemId, correction);
        break;
      case 'ADDED_STEP': {
        const list = index.addedSteps.get(correction.itemId) ?? [];
        list.push(correction);
        index.addedSteps.set(correction.itemId, list);
        break;
      }
    }
  }
  return index;
}

function mergeProduct(
  item: ProductItem,
  index: CorrectionIndex,
  applied: Set<string>,
): WorkingProduct {
  return {
    id: item.id,
    kind: item.kind,
    label: item.label,
    steps: mergeSteps(item.id, item.steps, index, applied),
    children: item.children.map((c) => mergeComponent(c, index, applied)),
  };
}

function mergeComponent(
  item: ComponentItem,
  index: CorrectionIndex,
  applied: Set<string>,
): WorkingComponent {
  return {
    id: item.id,
    kind: item.kind,
    label: item.label,
    usageCategory: item.usageCategory,
    usagePercentage: item.usagePercentage,
    composition: traced(
      item.composition,
      index.compositions.get(item.id),
      applied,
    ),
    steps: mergeSteps(item.id, item.steps, index, applied),
    children: item.children.map((m) => mergeMaterial(m, index, applied)),
  };
}

function mergeMaterial(
  item: MaterialItem,
  index: CorrectionIndex,
  applied: Set<string>,
): WorkingMaterial {
  return {
    id: item.id,
    kind: item.kind,
    label: item.label,
    rawMaterial: item.rawMaterial,
    originCountryCode: item.originCountryCode,
    steps: mergeSteps(item.id, item.steps, index, applied),
    children: [],
  };
}

/** Declared steps (with their field overrides), then the user's added steps. */
function mergeSteps(
  itemId: string,
  steps: Step[],
  index: CorrectionIndex,
  applied: Set<string>,
): WorkingStep[] {
  const declared = steps.map((step): WorkingStep => ({
    id: step.id,
    process: step.process,
    supplierId: traced(
      step.supplierId,
      index.fields.get(fieldKey(step.id, 'supplierId')),
      applied,
    ),
    countryCode: traced(
      step.countryCode,
      index.fields.get(fieldKey(step.id, 'countryCode')),
      applied,
    ),
    provenance: 'DECLARED',
  }));

  const added = (index.addedSteps.get(itemId) ?? []).map(
    (correction): WorkingStep => {
      applied.add(correction.id);
      return {
        id: correction.step.id,
        process: correction.step.process,
        supplierId: {
          value: correction.step.supplierId,
          provenance: 'CORRECTED',
        },
        countryCode: {
          value: correction.step.countryCode,
          provenance: 'CORRECTED',
        },
        provenance: 'CORRECTED',
        correctionId: correction.id,
      };
    },
  );

  return [...declared, ...added];
}

/** The correction wins when there is one; the declared value is kept alongside. */
function traced<T>(
  declaredValue: T,
  correction: { id: string; value: T } | undefined,
  applied: Set<string>,
): Traced<T> {
  if (!correction) {
    return { value: declaredValue, provenance: 'DECLARED' };
  }
  applied.add(correction.id);
  return {
    value: correction.value,
    provenance: 'CORRECTED',
    declaredValue,
    correctionId: correction.id,
  };
}
