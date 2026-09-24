<script setup lang="ts">
import type { StepField, Traced } from '~/types/api';

/** One value of a step (supplier or country), with its provenance and edit. */
const props = defineProps<{
  stepId: string;
  field: StepField;
  traced: Traced<string | null>;
  /** Fields of a step the user added have nothing declared behind them. */
  addedStep: boolean;
}>();

const tree = injectProductTree();
const { supplierName } = useReference();

const editing = ref(false);
const draft = ref('');

const label = computed(() =>
  props.field === 'supplierId' ? 'Supplier' : 'Country',
);
const isCorrection = computed(
  () => !props.addedStep && props.traced.provenance === 'CORRECTED',
);

function display(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  return props.field === 'supplierId' ? supplierName(value) : value;
}

function startEditing() {
  draft.value = props.traced.value ?? '';
  editing.value = true;
}

async function save() {
  const value =
    props.field === 'countryCode'
      ? toCountryCode(draft.value)
      : draft.value || null;
  if (await tree.correctField(props.stepId, props.field, value)) {
    editing.value = false;
  }
}

async function useDeclared() {
  if (props.traced.correctionId) {
    await tree.revert(props.traced.correctionId);
  }
}
</script>

<template>
  <div
    class="field"
    :class="{ 'field-unknown': !editing && traced.value === null }"
  >
    <span class="field-label">{{ label }}</span>

    <template v-if="!editing">
      <UnknownValue v-if="traced.value === null" />
      <span v-else class="value">{{ display(traced.value) }}</span>
      <ProvenanceBadge v-if="!addedStep" :provenance="traced.provenance" />
      <span v-if="isCorrection" class="declared">
        declared: {{ display(traced.declaredValue) }}
      </span>
      <button class="link" type="button" @click="startEditing">Edit</button>
      <button
        v-if="isCorrection"
        class="link"
        type="button"
        :disabled="tree.busy"
        @click="useDeclared"
      >
        Use declared
      </button>
    </template>

    <form v-else class="inline-form" @submit.prevent="save">
      <SupplierSelect v-if="field === 'supplierId'" v-model="draft" />
      <CountryInput v-else v-model="draft" />
      <button type="submit" :disabled="tree.busy">Save</button>
      <button class="link" type="button" @click="editing = false">
        Cancel
      </button>
    </form>
  </div>
</template>
