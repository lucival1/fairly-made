import type { InjectionKey } from 'vue';
import { traceabilityApi as api } from '~/services/traceability-api';
import type {
  AddStepInput,
  CompositionInput,
  StepField,
  WorkingTreeView,
} from '~/types/api';

/**
 * One product's working tree and the actions on it, as screen state:
 * the tree, whether a request is running, the last error or notice.
 *
 * Every action answers with the new tree, so the page re-renders from the
 * response. Actions resolve to true on success, so an editor knows when to
 * close.
 */
export function useProductTree(productId: string) {
  const view = ref<WorkingTreeView | null>(null);
  const error = ref<string | null>(null);
  const notice = ref<string | null>(null);
  const busy = ref(false);

  async function run(
    request: () => Promise<WorkingTreeView>,
    success: string | null = null,
  ): Promise<boolean> {
    busy.value = true;
    error.value = null;
    notice.value = null;
    try {
      view.value = await request();
      notice.value = success;
      return true;
    } catch (caught) {
      error.value = apiErrorMessage(caught);
      return false;
    } finally {
      busy.value = false;
    }
  }

  return reactive({
    view,
    error,
    notice,
    busy,
    load: () => run(() => api.getTree(productId)),
    correctField: (stepId: string, field: StepField, value: string | null) =>
      run(() => api.correctStepField(productId, stepId, field, value)),
    correctComposition: (itemId: string, composition: CompositionInput[]) =>
      run(() => api.correctComposition(productId, itemId, composition)),
    addStep: (itemId: string, input: AddStepInput) =>
      run(() => api.addStep(productId, itemId, input)),
    revert: (correctionId: string) =>
      run(() => api.revertCorrection(productId, correctionId)),
    refresh: () =>
      run(
        () => api.applyRefresh(productId),
        'Supplier refresh applied. Your corrections are still in place.',
      ),
  });
}

export type ProductTree = ReturnType<typeof useProductTree>;

// Sharing one ProductTree with every component under the product page,
// without passing it down through each level of the recursive tree.
// The Symbol is the unique key it is stored under; InjectionKey<ProductTree>
// types it, so what comes out is a ProductTree, not `unknown`.
const PRODUCT_TREE: InjectionKey<ProductTree> = Symbol('product-tree');

/** Called once, by the product page. */
export function provideProductTree(tree: ProductTree): void {
  provide(PRODUCT_TREE, tree);
}

/** Called by any component below the product page. */
export function injectProductTree(): ProductTree {
  const tree = inject(PRODUCT_TREE);
  if (!tree) {
    throw new Error('injectProductTree() must be used below a product page.');
  }
  return tree;
}
