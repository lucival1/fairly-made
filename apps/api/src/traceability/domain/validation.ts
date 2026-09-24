import { DomainError } from './errors.js';
import type { CompositionLine, DeclaredTree } from './types.js';

const COUNTRY_CODE = /^[A-Z]{2}$/;

/** ISO-2 code or null ("unknown"). */
export function assertCountryCode(value: string | null): void {
  if (value !== null && !COUNTRY_CODE.test(value)) {
    throw new DomainError(
      `"${value}" is not a country code. Use a two-letter ISO code such as PT or IT.`,
    );
  }
}

/**
 * The composition rule from the brief: percentages must add up to exactly 100.
 * Only applied to what the user submits; declared data is taken as it comes.
 */
export function assertValidComposition(
  lines: Omit<CompositionLine, 'id'>[],
  knownRawMaterials: readonly string[],
): void {
  if (lines.length === 0) {
    throw new DomainError('A composition needs at least one material.');
  }

  const seen = new Set<string>();
  for (const line of lines) {
    if (!knownRawMaterials.includes(line.rawMaterial)) {
      throw new DomainError(`"${line.rawMaterial}" is not a known material.`);
    }
    if (seen.has(line.rawMaterial)) {
      throw new DomainError(
        `${line.rawMaterial} appears twice in the composition. List each material once.`,
      );
    }
    seen.add(line.rawMaterial);
    if (!Number.isFinite(line.percentage) || line.percentage <= 0) {
      throw new DomainError(
        `${line.rawMaterial} must have a percentage above 0.`,
      );
    }
    assertCountryCode(line.originCountryCode);
  }

  const total = lines.reduce((sum, line) => sum + line.percentage, 0);
  // Round to absorb floating-point noise such as 33.3 + 33.3 + 33.4.
  if (Math.round(total * 100) / 100 !== 100) {
    throw new DomainError(
      `The composition adds up to ${total} %, it must add up to exactly 100 %.`,
    );
  }
}

/**
 * Light structural check for a tree coming from outside (seed file or a
 * refresh payload). Not a full schema validation: enough to fail loudly on
 * the wrong document instead of deep inside the merge.
 */
export function parseDeclaredTree(input: unknown): DeclaredTree {
  const candidate = input as Partial<DeclaredTree> | null;
  if (
    typeof candidate?.brand?.id !== 'string' ||
    typeof candidate.product?.id !== 'string' ||
    candidate.rootItem?.kind !== 'PRODUCT' ||
    !Array.isArray(candidate.rootItem.children) ||
    !Array.isArray(candidate.rootItem.steps)
  ) {
    throw new DomainError(
      'This is not a traceability tree: expected a product and a PRODUCT root item.',
    );
  }
  // Rebuilt rather than returned as-is so extra envelope fields (a refresh's
  // `comment`, `refreshedAt`) do not leak into the declared layer.
  return {
    brand: candidate.brand,
    product: candidate.product,
    rootItem: candidate.rootItem,
  };
}
