import { Injectable } from '@nestjs/common';
import {
  ProductRecords,
  toView,
  type WorkingTreeView,
} from '../shared/product-records.js';

/** Read the working tree: declared ⊕ corrections, merged now. */
@Injectable()
export class GetWorkingTreeUseCase {
  constructor(private readonly records: ProductRecords) {}

  async execute(productId: string): Promise<WorkingTreeView> {
    return toView(await this.records.load(productId));
  }
}
