import type { AddStepInput } from '../../application/use-cases/add-step.use-case.js';
import type { CompositionInput } from '../../application/use-cases/correct-composition.use-case.js';
import { DomainError } from '../../domain/errors.js';
import type { StepField } from '../../domain/types.js';

// Shape checks for request bodies. Business rules (sum to 100, known
// supplier…) live in the domain and the use cases, not here.

export type RequestBody = Record<string, unknown> | undefined;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

export function parseStepField(field: string): StepField {
  if (field !== 'supplierId' && field !== 'countryCode') {
    throw new DomainError(
      `Only a step's supplierId or countryCode can be corrected, not "${field}".`,
    );
  }
  return field;
}

export function parseFieldValue(body: RequestBody): string | null {
  const value = body?.value;
  if (!isNullableString(value)) {
    throw new DomainError(
      'Expected { "value": string | null } (null means unknown).',
    );
  }
  return value;
}

export function parseComposition(body: RequestBody): CompositionInput[] {
  const lines = body?.composition;
  const valid =
    Array.isArray(lines) &&
    lines.every(
      (line: Record<string, unknown>) =>
        typeof line?.rawMaterial === 'string' &&
        typeof line.percentage === 'number' &&
        isNullableString(line.originCountryCode ?? null),
    );
  if (!valid) {
    throw new DomainError(
      'Expected { "composition": [{ "rawMaterial", "percentage", "originCountryCode" }] }.',
    );
  }
  return (lines as Record<string, unknown>[]).map((line) => ({
    rawMaterial: line.rawMaterial as string,
    percentage: line.percentage as number,
    originCountryCode: (line.originCountryCode as string | null) ?? null,
  }));
}

export function parseAddStep(body: RequestBody): AddStepInput {
  const process = body?.process;
  const supplierId = body?.supplierId ?? null;
  const countryCode = body?.countryCode ?? null;
  if (
    typeof process !== 'string' ||
    !isNullableString(supplierId) ||
    !isNullableString(countryCode)
  ) {
    throw new DomainError(
      'Expected { "process": string, "supplierId"?: string | null, "countryCode"?: string | null }.',
    );
  }
  return { process, supplierId, countryCode };
}

/** An empty body means "no payload" (e.g. replay the refresh fixture). */
export const isEmpty = (body: RequestBody): boolean =>
  !body || Object.keys(body).length === 0;
