import { Inject, Injectable } from '@nestjs/common';
import type { ProductInfo } from '../../domain/types.js';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../ports/product.repository.js';

export interface ProductSummary extends Pick<
  ProductInfo,
  'id' | 'name' | 'reference' | 'season' | 'category'
> {
  lastChangedAt: string;
}

/** Browse: every product with when its working tree last changed. */
@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
  ) {}

  async execute(): Promise<ProductSummary[]> {
    const records = await this.repository.findAll();
    return records.map(({ declared: { product }, lastChangedAt }) => ({
      id: product.id,
      name: product.name,
      reference: product.reference,
      season: product.season,
      category: product.category,
      lastChangedAt,
    }));
  }
}
