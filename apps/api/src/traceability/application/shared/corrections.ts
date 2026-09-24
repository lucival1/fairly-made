import { randomUUID } from 'node:crypto';
import { DomainError } from '../../domain/errors.js';
import type { StepField } from '../../domain/types.js';
import { assertCountryCode } from '../../domain/validation.js';
import type { ReferenceCatalog } from '../ports/reference-catalog.js';

/** Our own id space (`cor_…`), so it can never collide with a declared id. */
export const newId = (prefix: string): string =>
  `${prefix}_${randomUUID().slice(0, 8)}`;

/** The fields every new correction starts with. */
export const newCorrection = () => ({
  id: newId('cor'),
  createdAt: new Date().toISOString(),
});

/** A step's supplier must be in the registry; its country an ISO-2 code. Both may be null (unknown). */
export function assertStepValue(
  catalog: ReferenceCatalog,
  field: StepField,
  value: string | null,
): void {
  if (field === 'countryCode') {
    assertCountryCode(value);
  } else if (value !== null && !catalog.hasSupplier(value)) {
    throw new DomainError(`"${value}" is not a supplier in the registry.`);
  }
}
