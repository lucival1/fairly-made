<script setup lang="ts">
import type { ItemKind } from '~/types/api';

/** Only the processes processes.json lists for this kind of item. */
const props = defineProps<{ kind: ItemKind }>();
const model = defineModel<string>({ required: true });

const { processes } = useReference();
const options = computed(() =>
  processes.value.filter((p) => p.appliesTo.includes(props.kind)),
);
</script>

<template>
  <select v-model="model" required aria-label="Process">
    <option value="" disabled>Process…</option>
    <option v-for="p in options" :key="p.code" :value="p.code">
      {{ p.label }}
    </option>
  </select>
</template>
