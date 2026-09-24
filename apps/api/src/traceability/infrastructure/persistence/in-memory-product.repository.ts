import { Injectable } from '@nestjs/common';
import type {
  ProductRecord,
  ProductRepository,
} from '../../application/ports/product.repository.js';

/** Adapter for the ProductRepository port. In memory, as the brief allows. */
@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private readonly records = new Map<string, ProductRecord>();

  // Copies in and out, like a real store would: callers can never mutate
  // what is stored by holding on to a reference.
  findAll(): Promise<ProductRecord[]> {
    return Promise.resolve([...this.records.values()].map(copy));
  }

  findById(productId: string): Promise<ProductRecord | undefined> {
    const record = this.records.get(productId);
    return Promise.resolve(record && copy(record));
  }

  save(record: ProductRecord): Promise<void> {
    this.records.set(record.declared.product.id, copy(record));
    return Promise.resolve();
  }
}

const copy = (record: ProductRecord): ProductRecord => structuredClone(record);
