// Pure domain types. No framework imports: everything in `domain/` can be
// unit-tested on its own and reused outside Nest.

// ---------------------------------------------------------------------------
// Declared layer: the tree exactly as the collection system states it.
// Replaced wholesale by every refresh, never edited by the user.
// ---------------------------------------------------------------------------

export interface Step {
  id: string;
  process: string;
  supplierId: string | null;
  countryCode: string | null;
}

export interface CompositionLine {
  id: string;
  rawMaterial: string;
  percentage: number;
  originCountryCode: string | null;
}

export interface MaterialItem {
  id: string;
  kind: 'MATERIAL';
  label: string;
  rawMaterial: string;
  originCountryCode: string | null;
  steps: Step[];
  children: never[];
}

export interface ComponentItem {
  id: string;
  kind: 'COMPONENT';
  label: string;
  usageCategory: string;
  usagePercentage: number;
  composition: CompositionLine[];
  steps: Step[];
  children: MaterialItem[];
}

export interface ProductItem {
  id: string;
  kind: 'PRODUCT';
  label: string;
  steps: Step[];
  children: ComponentItem[];
}

export type Item = ProductItem | ComponentItem | MaterialItem;

export interface ProductInfo {
  id: string;
  name: string;
  reference: string;
  season: string;
  category: string;
  weightGrams: number;
  lastModifiedAt: string;
}

export interface DeclaredTree {
  brand: { id: string; name: string };
  product: ProductInfo;
  rootItem: ProductItem;
}

// ---------------------------------------------------------------------------
// Correction layer: what the brand user changed. Stored apart from the
// declared tree and never touched by a refresh.
// ---------------------------------------------------------------------------

export type StepField = 'supplierId' | 'countryCode';

interface CorrectionBase {
  id: string;
  createdAt: string;
}

export interface FieldOverride extends CorrectionBase {
  kind: 'FIELD_OVERRIDE';
  stepId: string;
  field: StepField;
  value: string | null;
}

export interface CompositionOverride extends CorrectionBase {
  kind: 'COMPOSITION_OVERRIDE';
  itemId: string;
  value: CompositionLine[];
}

export interface AddedStep extends CorrectionBase {
  kind: 'ADDED_STEP';
  itemId: string;
  step: Step;
}

export type Correction = FieldOverride | CompositionOverride | AddedStep;

// ---------------------------------------------------------------------------
// Working tree: declared + corrections, computed at read time, never stored
// (except frozen inside a published version).
// ---------------------------------------------------------------------------

export type Provenance = 'DECLARED' | 'CORRECTED';

/** A value plus where it comes from. Only corrected values carry the declared one. */
export interface Traced<T> {
  value: T;
  provenance: Provenance;
  declaredValue?: T;
  correctionId?: string;
}

export interface WorkingStep {
  id: string;
  process: string;
  supplierId: Traced<string | null>;
  countryCode: Traced<string | null>;
  /** CORRECTED when the whole step was added by the user. */
  provenance: Provenance;
  correctionId?: string;
}

export interface WorkingMaterial {
  id: string;
  kind: 'MATERIAL';
  label: string;
  rawMaterial: string;
  originCountryCode: string | null;
  steps: WorkingStep[];
  children: never[];
}

export interface WorkingComponent {
  id: string;
  kind: 'COMPONENT';
  label: string;
  usageCategory: string;
  usagePercentage: number;
  composition: Traced<CompositionLine[]>;
  steps: WorkingStep[];
  children: WorkingMaterial[];
}

export interface WorkingProduct {
  id: string;
  kind: 'PRODUCT';
  label: string;
  steps: WorkingStep[];
  children: WorkingComponent[];
}

export type WorkingItem = WorkingProduct | WorkingComponent | WorkingMaterial;

export interface WorkingTree {
  product: ProductInfo;
  rootItem: WorkingProduct;
}
