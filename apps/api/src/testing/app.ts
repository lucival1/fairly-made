import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module.js';
import type {
  WorkingItem,
  WorkingStep,
  WorkingTree,
} from '../traceability/domain/types.js';

// Test-only helpers for specs that run through the real module graph
// (seeded from data/, in-memory adapter).

/** The seeded t-shirt: stp_b2 = jersey DYEING, stp_a3 = root PACKAGING. */
export const TSHIRT = 'prd_ts0142';

/** A fresh, seeded app per call, so tests never share state. */
export async function bootApp(): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  await moduleRef.init();
  return moduleRef;
}

function allItems(tree: WorkingTree): WorkingItem[] {
  const walk = (item: WorkingItem): WorkingItem[] => [
    item,
    ...item.children.flatMap((child: WorkingItem) => walk(child)),
  ];
  return walk(tree.rootItem);
}

export function workingItem(
  tree: WorkingTree,
  itemId: string,
): WorkingItem | undefined {
  return allItems(tree).find((item) => item.id === itemId);
}

export function workingStep(
  tree: WorkingTree,
  stepId: string,
): WorkingStep | undefined {
  return allItems(tree)
    .flatMap((item) => item.steps)
    .find((step) => step.id === stepId);
}
