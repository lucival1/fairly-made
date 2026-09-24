/**
 * Port. What the use cases need to know about suppliers and vocabularies to
 * check user input. Bound to the reference module's service in
 * TraceabilityModule, so this module never depends on how that data is kept.
 */
export interface ReferenceCatalog {
  readonly rawMaterials: readonly string[];
  hasSupplier(supplierId: string): boolean;
  hasProcess(processCode: string): boolean;
}

export const REFERENCE_CATALOG = Symbol('REFERENCE_CATALOG');
