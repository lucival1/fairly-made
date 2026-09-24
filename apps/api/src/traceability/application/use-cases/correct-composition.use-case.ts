import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../domain/errors.js';
import { findItem } from '../../domain/tree.js';
import type {
  CompositionLine,
  CompositionOverride,
} from '../../domain/types.js';
import { assertValidComposition } from '../../domain/validation.js';
import {
  REFERENCE_CATALOG,
  type ReferenceCatalog,
} from '../ports/reference-catalog.js';
import { newCorrection, newId } from '../shared/corrections.js';
import {
  ProductRecords,
  type WorkingTreeView,
} from '../shared/product-records.js';

export type CompositionInput = Omit<CompositionLine, 'id'>;

/** Replace a component's whole composition; it must add up to 100 %. */
@Injectable()
export class CorrectCompositionUseCase {
  constructor(
    private readonly records: ProductRecords,
    @Inject(REFERENCE_CATALOG) private readonly catalog: ReferenceCatalog,
  ) {}

  async execute(
    productId: string,
    itemId: string,
    lines: CompositionInput[],
  ): Promise<WorkingTreeView> {
    const record = await this.records.load(productId);
    const item = findItem(record.declared, itemId);
    if (!item) {
      throw new NotFoundError(`Item ${itemId} is not in this product's tree.`);
    }
    if (item.kind !== 'COMPONENT') {
      throw new DomainError('Only a component has a composition.');
    }
    assertValidComposition(lines, this.catalog.rawMaterials);

    // Keep the declared line id when the material is the same one.
    const value = lines.map((line) => ({
      id:
        item.composition.find((l) => l.rawMaterial === line.rawMaterial)?.id ??
        newId('cor_cmp'),
      ...line,
    }));
    const existing = record.corrections.find(
      (c): c is CompositionOverride =>
        c.kind === 'COMPOSITION_OVERRIDE' && c.itemId === itemId,
    );
    if (existing) {
      existing.value = value;
    } else {
      record.corrections.push({
        ...newCorrection(),
        kind: 'COMPOSITION_OVERRIDE',
        itemId,
        value,
      });
    }
    return this.records.commit(record);
  }
}
