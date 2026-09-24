<script setup lang="ts">
const route = useRoute();
const tree = useProductTree(String(route.params.id));
provideProductTree(tree);
await tree.load();

/** The brand's to-do list: how many facts are still unknown. */
const unknownCount = computed(() =>
  tree.view ? countUnknown(tree.view.tree.rootItem) : 0,
);
</script>

<template>
  <main>
    <NuxtLink to="/" class="back">← All products</NuxtLink>

    <p v-if="!tree.view" class="banner banner-error">
      {{ tree.error ?? 'Loading…' }}
    </p>

    <template v-else>
      <header class="page-head">
        <div>
          <h1>{{ tree.view.tree.product.name }}</h1>
          <p class="muted">
            {{ tree.view.tree.product.reference }} ·
            {{ tree.view.tree.product.season }} · working tree
          </p>
        </div>
        <div class="page-actions">
          <button type="button" :disabled="tree.busy" @click="tree.refresh()">
            Simulate supplier refresh
          </button>
        </div>
      </header>

      <p class="summary" :class="{ 'summary-done': unknownCount === 0 }">
        {{
          unknownCount === 0
            ? 'Every supplier and country is known.'
            : `${unknownCount} supplier or country values are still unknown (✖).`
        }}
      </p>

      <p v-if="tree.error" class="banner banner-error" role="alert">
        {{ tree.error }}
      </p>
      <p v-if="tree.notice" class="banner banner-ok" role="status">
        {{ tree.notice }}
      </p>

      <DormantCorrections
        v-if="tree.view.dormantCorrections.length > 0"
        :corrections="tree.view.dormantCorrections"
      />

      <TreeItem :item="tree.view.tree.rootItem" />
    </template>
  </main>
</template>
