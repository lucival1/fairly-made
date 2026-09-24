<script setup lang="ts">
import type { Provenance } from '~/types/api';

defineProps<{ provenance: Provenance }>();
</script>

<template>
  <span
    class="badge"
    :class="provenance === 'CORRECTED' ? 'badge-corrected' : 'badge-declared'"
    :title="
      provenance === 'CORRECTED'
        ? 'Corrected in this app: it stays in place when suppliers send new data'
        : 'As declared by the supplier'
    "
  >
    {{ provenance === 'CORRECTED' ? 'Corrected' : 'Declared' }}
  </span>
</template>
