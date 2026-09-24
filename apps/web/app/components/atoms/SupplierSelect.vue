<script setup lang="ts">
/** A supplier from the registry; '' means unknown. */
const model = defineModel<string>({ required: true });

const { suppliers } = useReference();
</script>

<template>
  <select v-model="model" aria-label="Supplier">
    <option value="">Supplier unknown</option>
    <option v-for="s in suppliers" :key="s.id" :value="s.id">
      {{ s.name }} ({{ s.countryCode }})
    </option>
  </select>
</template>
