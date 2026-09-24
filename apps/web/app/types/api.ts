// Response shapes of the API (apps/api). Kept by hand for now; a shared
// types package is on the "next" list.

export type Provenance = 'DECLARED' | 'CORRECTED';
export type StepField = 'supplierId' | 'countryCode';

export interface Traced<T> {
  value: T;
  provenance: Provenance;
  declaredValue?: T;
  correctionId?: string;
}

export interface CompositionLine {
  id: string;
  rawMaterial: string;
  percentage: number;
  originCountryCode: string | null;
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

interface ItemBase {
  id: string;
  label: string;
  steps: WorkingStep[];
}

export interface WorkingMaterial extends ItemBase {
  kind: 'MATERIAL';
  rawMaterial: string;
  originCountryCode: string | null;
  children: never[];
}

export interface WorkingComponent extends ItemBase {
  kind: 'COMPONENT';
  usageCategory: string;
  usagePercentage: number;
  composition: Traced<CompositionLine[]>;
  children: WorkingMaterial[];
}

export interface WorkingProduct extends ItemBase {
  kind: 'PRODUCT';
  children: WorkingComponent[];
}

export type WorkingItem = WorkingProduct | WorkingComponent | WorkingMaterial;

export type ItemKind = WorkingItem['kind'];

export interface ProductInfo {
  id: string;
  name: string;
  reference: string;
  season: string;
  category: string;
  weightGrams: number;
  lastModifiedAt: string;
}

export interface WorkingTree {
  product: ProductInfo;
  rootItem: WorkingProduct;
}

interface CorrectionBase {
  id: string;
  createdAt: string;
}

export type Correction = CorrectionBase &
  (
    | {
        kind: 'FIELD_OVERRIDE';
        stepId: string;
        field: StepField;
        value: string | null;
      }
    | { kind: 'COMPOSITION_OVERRIDE'; itemId: string; value: CompositionLine[] }
    | {
        kind: 'ADDED_STEP';
        itemId: string;
        step: Omit<WorkingStep, 'supplierId' | 'countryCode' | 'provenance'> & {
          supplierId: string | null;
          countryCode: string | null;
        };
      }
  );

export interface WorkingTreeView {
  tree: WorkingTree;
  dormantCorrections: Correction[];
}

export interface ProductSummary {
  id: string;
  name: string;
  reference: string;
  season: string;
  category: string;
  lastChangedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  city: string;
  countryCode: string;
}

export interface Process {
  code: string;
  label: string;
  appliesTo: string[];
}

export interface ReferenceData {
  suppliers: Supplier[];
  processes: Process[];
  rawMaterials: string[];
  usageCategories: string[];
}

export type CompositionInput = Omit<CompositionLine, 'id'>;

export interface AddStepInput {
  process: string;
  supplierId: string | null;
  countryCode: string | null;
}
