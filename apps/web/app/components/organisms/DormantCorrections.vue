<script setup lang="ts">
import type { Correction } from '~/types/api';

/** Corrections whose target a refresh removed: not applied, not deleted. */
defineProps<{ corrections: Correction[] }>();

const tree = injectProductTree();
const { processLabel, supplierName } = useReference();

// The target is gone from the tree, so only its id is left to show.
function describe(correction: Correction): string {
  switch (correction.kind) {
    case 'FIELD_OVERRIDE': {
      const value =
        correction.value === null
          ? 'unknown'
          : correction.field === 'supplierId'
            ? supplierName(correction.value)
            : correction.value;
      return `${correction.field === 'supplierId' ? 'Supplier' : 'Country'} set to ${value} on step ${correction.stepId}`;
    }
    case 'COMPOSITION_OVERRIDE':
      return `Composition of item ${correction.itemId}`;
    case 'ADDED_STEP':
      return `${processLabel(correction.step.process)} step added to item ${correction.itemId}`;
  }
}
</script>

<template>
  <section class="dormant">
    <h2>Corrections on things suppliers no longer declare</h2>
    <p class="muted">
      A refresh removed what these corrections pointed at. They are not applied,
      and kept in case it comes back.
    </p>
    <ul>
      <li v-for="correction in corrections" :key="correction.id">
        {{ describe(correction) }}
        <button
          class="link"
          type="button"
          :disabled="tree.busy"
          @click="tree.revert(correction.id)"
        >
          Discard
        </button>
      </li>
    </ul>
  </section>
</template>
