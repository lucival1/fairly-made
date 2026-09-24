<script setup lang="ts">
import { traceabilityApi } from '~/services/traceability-api';

const { data: products, error } = await useAsyncData('products', () =>
  traceabilityApi.listProducts(),
);
</script>

<template>
  <main>
    <h1>Traceability</h1>
    <p class="muted">
      Your products and where they are made. Open one to see what is still
      unknown and to correct it.
    </p>

    <p v-if="error" class="banner banner-error">
      The product list could not be loaded. Is the API running?
    </p>

    <table v-else class="products">
      <thead>
        <tr>
          <th>Product</th>
          <th>Reference</th>
          <th>Season</th>
          <th>Working tree last changed</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>
            <NuxtLink :to="`/products/${product.id}`">{{
              product.name
            }}</NuxtLink>
          </td>
          <td>{{ product.reference }}</td>
          <td>{{ product.season }}</td>
          <td>{{ formatDate(product.lastChangedAt) }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
