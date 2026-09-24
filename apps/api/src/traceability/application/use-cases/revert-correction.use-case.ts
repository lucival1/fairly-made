import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../domain/errors.js';
import {
  ProductRecords,
  type WorkingTreeView,
} from '../shared/product-records.js';

/** Drop a correction: the declared value shows through again. */
@Injectable()
export class RevertCorrectionUseCase {
  constructor(private readonly records: ProductRecords) {}

  async execute(
    productId: string,
    correctionId: string,
  ): Promise<WorkingTreeView> {
    const record = await this.records.load(productId);
    const index = record.corrections.findIndex((c) => c.id === correctionId);
    if (index === -1) {
      throw new NotFoundError(`Correction ${correctionId} does not exist.`);
    }
    record.corrections.splice(index, 1);
    return this.records.commit(record);
  }
}
