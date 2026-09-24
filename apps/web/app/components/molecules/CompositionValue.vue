<script setup lang="ts">
import type { CompositionLine, WorkingComponent } from '~/types/api';

/** A component's composition, with its provenance and an editor. */
const props = defineProps<{ item: WorkingComponent }>();

const tree = injectProductTree();
const { rawMaterials } = useReference();

interface DraftLine {
  rawMaterial: string;
  percentage: number;
  originCountryCode: string;
}

const editing = ref(false);
const draft = ref<DraftLine[]>([]);
const total = computed(() =>
  draft.value.reduce((sum, line) => sum + Number(line.percentage || 0), 0),
);
const isCorrection = computed(
  () => props.item.composition.provenance === 'CORRECTED',
);

function describe(lines: CompositionLine[] | undefined): string {
  return (lines ?? [])
    .map(
      (line) =>
        `${line.percentage} % ${humanize(line.rawMaterial)}` +
        (line.originCountryCode ? ` (${line.originCountryCode})` : ''),
    )
    .join(' · ');
}

function startEditing() {
  draft.value = props.item.composition.value.map((line) => ({
    rawMaterial: line.rawMaterial,
    percentage: line.percentage,
    originCountryCode: line.originCountryCode ?? '',
  }));
  editing.value = true;
}

function addLine() {
  draft.value.push({ rawMaterial: '', percentage: 0, originCountryCode: '' });
}

async function save() {
  const composition = draft.value.map((line) => ({
    rawMaterial: line.rawMaterial,
    percentage: Number(line.percentage),
    originCountryCode: toCountryCode(line.originCountryCode),
  }));
  if (await tree.correctComposition(props.item.id, composition)) {
    editing.value = false;
  }
}

async function useDeclared() {
  if (props.item.composition.correctionId) {
    await tree.revert(props.item.composition.correctionId);
  }
}
</script>

<template>
  <div class="composition">
    <template v-if="!editing">
      <span class="field-label">Composition</span>
      <span class="value">{{ describe(item.composition.value) }}</span>
      <ProvenanceBadge :provenance="item.composition.provenance" />
      <span v-if="isCorrection" class="declared">
        declared: {{ describe(item.composition.declaredValue) }}
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

    <form v-else class="composition-form" @submit.prevent="save">
      <div v-for="(line, index) in draft" :key="index" class="composition-line">
        <select v-model="line.rawMaterial" aria-label="Material">
          <option value="" disabled>Material…</option>
          <option
            v-for="material in rawMaterials"
            :key="material"
            :value="material"
          >
            {{ humanize(material) }}
          </option>
        </select>
        <input
          v-model.number="line.percentage"
          type="number"
          min="0"
          max="100"
          step="0.1"
          aria-label="Percentage"
        />
        <span>%</span>
        <CountryInput v-model="line.originCountryCode" placeholder="origin" />
        <button class="link" type="button" @click="draft.splice(index, 1)">
          Remove
        </button>
      </div>
      <div class="composition-actions">
        <button class="link" type="button" @click="addLine">
          + Add material
        </button>
        <span :class="total === 100 ? 'total-ok' : 'total-off'">
          Total: {{ total }} %{{ total === 100 ? '' : ' (must be 100 %)' }}
        </span>
        <button type="submit" :disabled="tree.busy">Save</button>
        <button class="link" type="button" @click="editing = false">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>
