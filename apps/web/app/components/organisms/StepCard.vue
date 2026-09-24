<script setup lang="ts">
import type { WorkingStep } from '~/types/api';

/** One production step: its supplier and country. */
const props = defineProps<{ step: WorkingStep }>();

const tree = injectProductTree();
const { processLabel } = useReference();

const added = computed(() => props.step.provenance === 'CORRECTED');

async function remove() {
  if (props.step.correctionId) {
    await tree.revert(props.step.correctionId);
  }
}
</script>

<template>
  <div class="step" :class="{ 'step-added': added }">
    <div class="step-head">
      <span class="process">{{ processLabel(step.process) }}</span>
      <template v-if="added">
        <span class="badge badge-corrected">Added</span>
        <button
          class="link"
          type="button"
          :disabled="tree.busy"
          @click="remove"
        >
          Remove
        </button>
      </template>
    </div>
    <StepValue
      :step-id="step.id"
      field="supplierId"
      :traced="step.supplierId"
      :added-step="added"
    />
    <StepValue
      :step-id="step.id"
      field="countryCode"
      :traced="step.countryCode"
      :added-step="added"
    />
  </div>
</template>
