<script setup lang="ts">
/** ISO-2 country code; '' means unknown. */
const model = defineModel<string>({ required: true });

defineProps<{ placeholder?: string }>();
</script>

<template>
  <input
    v-model="model"
    maxlength="2"
    size="4"
    :placeholder="placeholder ?? 'PT'"
    aria-label="Country code"
  />
</template>
