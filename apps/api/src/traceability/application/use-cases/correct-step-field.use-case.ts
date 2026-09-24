import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../domain/errors.js';
import { findStep } from '../../domain/tree.js';
import type {
  AddedStep,
  FieldOverride,
  StepField,
} from '../../domain/types.js';
import {
  REFERENCE_CATALOG,
  type ReferenceCatalog,
} from '../ports/reference-catalog.js';
import { assertStepValue, newCorrection } from '../shared/corrections.js';
import {
  ProductRecords,
  type WorkingTreeView,
} from '../shared/product-records.js';

/** Correct a step's supplier or country (null = unknown). */
@Injectable()
export class CorrectStepFieldUseCase {
  constructor(
    private readonly records: ProductRecords,
    @Inject(REFERENCE_CATALOG) private readonly catalog: ReferenceCatalog,
  ) {}

  async execute(
    productId: string,
    stepId: string,
    field: StepField,
    value: string | null,
  ): Promise<WorkingTreeView> {
    const record = await this.records.load(productId);
    assertStepValue(this.catalog, field, value);

    // A step the user added is edited in place: there is nothing declared
    // to override.
    const added = record.corrections.find(
      (c): c is AddedStep => c.kind === 'ADDED_STEP' && c.step.id === stepId,
    );
    if (added) {
      added.step[field] = value;
      return this.records.commit(record);
    }

    if (!findStep(record.declared, stepId)) {
      throw new NotFoundError(`Step ${stepId} is not in this product's tree.`);
    }
    // One correction per step field: correcting again updates it.
    const existing = record.corrections.find(
      (c): c is FieldOverride =>
        c.kind === 'FIELD_OVERRIDE' && c.stepId === stepId && c.field === field,
    );
    if (existing) {
      existing.value = value;
    } else {
      record.corrections.push({
        ...newCorrection(),
        kind: 'FIELD_OVERRIDE',
        stepId,
        field,
        value,
      });
    }
    return this.records.commit(record);
  }
}
