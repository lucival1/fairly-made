import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../domain/errors.js';
import { findItem } from '../../domain/tree.js';
import type { Step } from '../../domain/types.js';
import {
  REFERENCE_CATALOG,
  type ReferenceCatalog,
} from '../ports/reference-catalog.js';
import {
  assertStepValue,
  newCorrection,
  newId,
} from '../shared/corrections.js';
import {
  ProductRecords,
  type WorkingTreeView,
} from '../shared/product-records.js';

export type AddStepInput = Omit<Step, 'id'>;

/** Add a step the declarations do not have yet. */
@Injectable()
export class AddStepUseCase {
  constructor(
    private readonly records: ProductRecords,
    @Inject(REFERENCE_CATALOG) private readonly catalog: ReferenceCatalog,
  ) {}

  async execute(
    productId: string,
    itemId: string,
    input: AddStepInput,
  ): Promise<WorkingTreeView> {
    const record = await this.records.load(productId);
    if (!findItem(record.declared, itemId)) {
      throw new NotFoundError(`Item ${itemId} is not in this product's tree.`);
    }
    if (!this.catalog.hasProcess(input.process)) {
      throw new DomainError(`"${input.process}" is not a known process.`);
    }
    assertStepValue(this.catalog, 'supplierId', input.supplierId);
    assertStepValue(this.catalog, 'countryCode', input.countryCode);

    record.corrections.push({
      ...newCorrection(),
      kind: 'ADDED_STEP',
      itemId,
      step: { id: newId('cor_stp'), ...input },
    });
    return this.records.commit(record);
  }
}
