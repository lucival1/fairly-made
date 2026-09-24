import type { Correction, DeclaredTree } from '../../domain/types.js';

/** What we persist per product: the two layers, never the merged tree. */
export interface ProductRecord {
  declared: DeclaredTree;
  corrections: Correction[];
  /** When the working tree last changed (correction or effective refresh). */
  lastChangedAt: string;
}

/**
 * Port. Use cases depend on this interface only; TraceabilityModule binds it
 * to an adapter (in memory today, a database tomorrow).
 */
export interface ProductRepository {
  findAll(): Promise<ProductRecord[]>;
  findById(productId: string): Promise<ProductRecord | undefined>;
  save(record: ProductRecord): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
