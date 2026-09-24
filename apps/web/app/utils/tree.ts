import type { WorkingItem } from '~/types/api';

/** Supplier and country values still unknown in an item and everything below it. */
export function countUnknown(item: WorkingItem): number {
  const own = item.steps.reduce(
    (sum, step) =>
      sum +
      Number(step.supplierId.value === null) +
      Number(step.countryCode.value === null),
    0,
  );
  return (item.children as WorkingItem[]).reduce(
    (sum, child) => sum + countUnknown(child),
    own,
  );
}
