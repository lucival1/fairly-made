import type {
  CompositionLine,
  WorkingItem,
  WorkingStep,
  WorkingTree,
} from './types.js';

export type ChangeKind = 'ADDED' | 'REMOVED' | 'CHANGED';

type Comparable = string | number | null;

export interface FieldChange {
  field: string;
  before: Comparable;
  after: Comparable;
}

export interface TreeChange {
  id: string;
  entity: 'ITEM' | 'STEP';
  /** Human-readable, e.g. "Jersey coton bio 185 g/m²" or "DYEING · Jersey…". */
  label: string;
  change: ChangeKind;
  /** Only for CHANGED. */
  fields: FieldChange[];
}

/**
 * What changed from `before` to `after`. Ids are stable across trees (brief
 * assumption), so a flat id-keyed comparison is enough: no tree matching.
 *
 * Compares values only, not provenance: a correction that restates the
 * declared value is not a change for whoever reads the tree.
 */
export function diffTrees(
  before: WorkingTree,
  after: WorkingTree,
): TreeChange[] {
  const a = flatten(before);
  const b = flatten(after);
  const changes: TreeChange[] = [];

  for (const [id, next] of b) {
    const prev = a.get(id);
    if (!prev) {
      changes.push({
        id,
        entity: next.entity,
        label: next.label,
        change: 'ADDED',
        fields: [],
      });
      continue;
    }
    const fields = Object.keys(next.values)
      .filter((field) => prev.values[field] !== next.values[field])
      .map((field) => ({
        field,
        before: prev.values[field] ?? null,
        after: next.values[field] ?? null,
      }));
    if (fields.length > 0) {
      changes.push({
        id,
        entity: next.entity,
        label: next.label,
        change: 'CHANGED',
        fields,
      });
    }
  }
  for (const [id, prev] of a) {
    if (!b.has(id)) {
      changes.push({
        id,
        entity: prev.entity,
        label: prev.label,
        change: 'REMOVED',
        fields: [],
      });
    }
  }
  return changes;
}

interface FlatNode {
  entity: 'ITEM' | 'STEP';
  label: string;
  values: Record<string, Comparable>;
}

function flatten(tree: WorkingTree): Map<string, FlatNode> {
  const nodes = new Map<string, FlatNode>();

  const visit = (item: WorkingItem): void => {
    nodes.set(item.id, {
      entity: 'ITEM',
      label: item.label,
      values: itemValues(item),
    });
    for (const step of item.steps) {
      nodes.set(step.id, {
        entity: 'STEP',
        label: `${step.process} · ${item.label}`,
        values: stepValues(step),
      });
    }
    for (const child of item.children) {
      visit(child);
    }
  };
  visit(tree.rootItem);

  return nodes;
}

function itemValues(item: WorkingItem): Record<string, Comparable> {
  switch (item.kind) {
    case 'PRODUCT':
      return { label: item.label };
    case 'COMPONENT':
      return {
        label: item.label,
        usagePercentage: item.usagePercentage,
        composition: formatComposition(item.composition.value),
      };
    case 'MATERIAL':
      return {
        label: item.label,
        rawMaterial: item.rawMaterial,
        originCountryCode: item.originCountryCode,
      };
  }
}

function stepValues(step: WorkingStep): Record<string, Comparable> {
  return {
    process: step.process,
    supplierId: step.supplierId.value,
    countryCode: step.countryCode.value,
  };
}

/** One string per composition so it compares, and reads, as a whole. */
function formatComposition(lines: CompositionLine[]): string {
  return lines
    .map((line) => {
      const origin = line.originCountryCode
        ? ` (${line.originCountryCode})`
        : '';
      return `${line.percentage} % ${line.rawMaterial}${origin}`;
    })
    .join(', ');
}
