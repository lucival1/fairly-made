import type {
  AddStepInput,
  CompositionInput,
  ProductSummary,
  ReferenceData,
  StepField,
  WorkingTreeView,
} from '~/types/api';

// The only place that knows the API's URLs and HTTP methods. Composables and
// pages call these functions; a route change is a change here only.

const product = (productId: string) =>
  `/api/products/${encodeURIComponent(productId)}`;

export const traceabilityApi = {
  listProducts: () => $fetch<ProductSummary[]>('/api/products'),

  getReference: () => $fetch<ReferenceData>('/api/reference'),

  getTree: (productId: string) =>
    $fetch<WorkingTreeView>(`${product(productId)}/tree`),

  correctStepField: (
    productId: string,
    stepId: string,
    field: StepField,
    value: string | null,
  ) =>
    $fetch<WorkingTreeView>(`${product(productId)}/steps/${stepId}/${field}`, {
      method: 'PUT',
      body: { value },
    }),

  correctComposition: (
    productId: string,
    itemId: string,
    composition: CompositionInput[],
  ) =>
    $fetch<WorkingTreeView>(
      `${product(productId)}/items/${itemId}/composition`,
      {
        method: 'PUT',
        body: { composition },
      },
    ),

  addStep: (productId: string, itemId: string, input: AddStepInput) =>
    $fetch<WorkingTreeView>(`${product(productId)}/items/${itemId}/steps`, {
      method: 'POST',
      body: input,
    }),

  revertCorrection: (productId: string, correctionId: string) =>
    $fetch<WorkingTreeView>(
      `${product(productId)}/corrections/${correctionId}`,
      { method: 'DELETE' },
    ),

  /** Without a body the API replays the seeded refresh fixture. */
  applyRefresh: (productId: string) =>
    $fetch<WorkingTreeView>(`${product(productId)}/refresh`, {
      method: 'POST',
    }),
};
