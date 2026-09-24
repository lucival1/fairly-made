import { traceabilityApi } from '~/services/traceability-api';
import type { ReferenceData } from '~/types/api';

/**
 * Suppliers and vocabularies, loaded once and shared by every picker.
 * Falls back to raw codes until loaded.
 */
export function useReference() {
  const data = useState<ReferenceData | null>('reference', () => null);
  const requested = useState('reference-requested', () => false);

  if (!requested.value) {
    requested.value = true;
    void traceabilityApi.getReference().then((reference) => {
      data.value = reference;
    });
  }

  const suppliers = computed(() => data.value?.suppliers ?? []);
  const processes = computed(() => data.value?.processes ?? []);
  const rawMaterials = computed(() => data.value?.rawMaterials ?? []);

  const supplierName = (id: string) =>
    suppliers.value.find((supplier) => supplier.id === id)?.name ?? id;
  const processLabel = (code: string) =>
    processes.value.find((process) => process.code === code)?.label ?? code;

  return { suppliers, processes, rawMaterials, supplierName, processLabel };
}
