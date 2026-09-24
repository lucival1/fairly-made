import { readFileSync } from 'node:fs';
import { parseDeclaredTree } from '../traceability/domain/validation.js';
import type {
  Correction,
  DeclaredTree,
  StepField,
} from '../traceability/domain/types.js';

// Test-only helpers: load the seed files from the repo's data/ folder.
const DATA_DIR = new URL('../../../../data/', import.meta.url);

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(new URL(path, DATA_DIR), 'utf8'));
}

export function loadTree(name: string): DeclaredTree {
  return parseDeclaredTree(readJson(`trees/${name}.json`));
}

export function loadTshirtRefresh(): DeclaredTree {
  return parseDeclaredTree(
    readJson('refreshes/tshirt-mariniere.refresh-2026-09-20.json'),
  );
}

export function loadRawMaterials(): string[] {
  return (readJson('processes.json') as { rawMaterials: string[] })
    .rawMaterials;
}

let sequence = 0;
const nextId = () => `cor_test_${++sequence}`;
const now = '2026-09-23T10:00:00.000Z';

export function fieldOverride(
  stepId: string,
  field: StepField,
  value: string | null,
): Correction {
  return {
    id: nextId(),
    createdAt: now,
    kind: 'FIELD_OVERRIDE',
    stepId,
    field,
    value,
  };
}
