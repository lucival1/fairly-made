import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../domain/errors.js';
import { mergeTree } from '../../domain/merge.js';
import type { Correction, WorkingTree } from '../../domain/types.js';
import {
  PRODUCT_REPOSITORY,
  type ProductRecord,
  type ProductRepository,
} from '../ports/product.repository.js';

/** What every use case answers with: the merged tree the user reads. */
export interface WorkingTreeView {
  tree: WorkingTree;
  /** Corrections whose target the latest refresh no longer contains. */
  dormantCorrections: Correction[];
}

export function toView(record: ProductRecord): WorkingTreeView {
  const { tree, dormant } = mergeTree(record.declared, record.corrections);
  return { tree, dormantCorrections: dormant };
}

/**
 * The load → change → save cycle shared by every write use case, so each use
 * case only holds its own rule.
 */
@Injectable()
export class ProductRecords {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
  ) {}

  async load(productId: string): Promise<ProductRecord> {
    const record = await this.repository.findById(productId);
    if (!record) {
      throw new NotFoundError(`Product ${productId} does not exist.`);
    }
    return record;
  }

  /** Saves a changed record, stamping when its working tree changed. */
  async commit(record: ProductRecord): Promise<WorkingTreeView> {
    record.lastChangedAt = new Date().toISOString();
    await this.repository.save(record);
    return toView(record);
  }
}
