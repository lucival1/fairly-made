<script setup lang="ts">
import type { WorkingItem } from '~/types/api';

const props = defineProps<{ item: WorkingItem }>();

const tree = injectProductTree();

const open = ref(false);
const process = ref('');
const supplierId = ref('');
const countryCode = ref('');

async function save() {
  const added = await tree.addStep(props.item.id, {
    process: process.value,
    supplierId: supplierId.value || null,
    countryCode: toCountryCode(countryCode.value),
  });
  if (added) {
    open.value = false;
    process.value = '';
    supplierId.value = '';
    countryCode.value = '';
  }
}
</script>

<template>
  <div class="add-step">
    <button v-if="!open" class="link" type="button" @click="open = true">
      + Add a step
    </button>
    <form v-else class="inline-form" @submit.prevent="save">
      <ProcessSelect v-model="process" :kind="item.kind" />
      <SupplierSelect v-model="supplierId" />
      <CountryInput v-model="countryCode" />
      <button type="submit" :disabled="tree.busy">Add</button>
      <button class="link" type="button" @click="open = false">Cancel</button>
    </form>
  </div>
</template>
