<script setup lang="ts">
import type { WorkingItem } from '~/types/api';

/**
 * One item of the tree with its steps, then its children (recursive).
 * Open by default; collapses to a one-line summary.
 */
const props = defineProps<{ item: WorkingItem }>();

const KIND_LABELS = {
  PRODUCT: 'Product',
  COMPONENT: 'Component',
  MATERIAL: 'Material',
} as const;

const open = ref(true);

const summary = computed(() => {
  const unknown = countUnknown(props.item);
  const parts = [
    `${props.item.steps.length} step${props.item.steps.length === 1 ? '' : 's'}`,
  ];
  if (props.item.children.length > 0) {
    parts.push(
      `${props.item.children.length} item${props.item.children.length === 1 ? '' : 's'} below`,
    );
  }
  parts.push(unknown === 0 ? 'nothing unknown' : `✖ ${unknown} unknown`);
  return parts.join(' · ');
});
</script>

<template>
  <section class="item" :class="`item-${item.kind.toLowerCase()}`">
    <header class="item-head">
      <button
        class="toggle"
        type="button"
        :aria-expanded="open"
        :aria-label="open ? `Collapse ${item.label}` : `Expand ${item.label}`"
        @click="open = !open"
      >
        {{ open ? '▾' : '▸' }}
      </button>
      <span class="kind">{{ KIND_LABELS[item.kind] }}</span>
      <h3>{{ item.label }}</h3>
      <span v-if="item.kind === 'COMPONENT'" class="muted">
        {{ humanize(item.usageCategory) }} · {{ item.usagePercentage }} % of the
        product
      </span>
      <span v-else-if="item.kind === 'MATERIAL'" class="muted">
        {{ humanize(item.rawMaterial) }} · origin
        {{ item.originCountryCode ?? 'unknown' }}
      </span>
      <span v-if="!open" class="muted item-summary">{{ summary }}</span>
    </header>

    <template v-if="open">
      <CompositionValue v-if="item.kind === 'COMPONENT'" :item="item" />

      <div class="steps">
        <p v-if="item.steps.length === 0" class="muted">
          No steps declared yet.
        </p>
        <StepCard v-for="step in item.steps" :key="step.id" :step="step" />
        <AddStepForm :item="item" />
      </div>

      <div v-if="item.children.length > 0" class="children">
        <TreeItem
          v-for="child in item.children as WorkingItem[]"
          :key="child.id"
          :item="child"
        />
      </div>
    </template>
  </section>
</template>
