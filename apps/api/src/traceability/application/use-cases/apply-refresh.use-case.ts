import { Injectable } from '@nestjs/common';
import { DomainError } from '../../domain/errors.js';
import { parseDeclaredTree } from '../../domain/validation.js';
import {
  ProductRecords,
  toView,
  type WorkingTreeView,
} from '../shared/product-records.js';

/**
 * A full tree arrives from the collection system: it replaces the declared
 * layer. Corrections are never touched, which is why they survive.
 */
@Injectable()
export class ApplyRefreshUseCase {
  constructor(private readonly records: ProductRecords) {}

  async execute(productId: string, payload: unknown): Promise<WorkingTreeView> {
    const record = await this.records.load(productId);
    const declared = parseDeclaredTree(payload);
    if (declared.product.id !== productId) {
      throw new DomainError(
        `This refresh is for product ${declared.product.id}, not ${productId}.`,
      );
    }
    // The same refresh twice changes nothing, not even the timestamp.
    if (JSON.stringify(declared) === JSON.stringify(record.declared)) {
      return toView(record);
    }
    record.declared = declared;
    return this.records.commit(record);
  }
}
