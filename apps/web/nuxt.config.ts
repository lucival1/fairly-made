// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  typescript: { strict: true },
  routeRules: {
    '/api/**': { proxy: 'http://localhost:3001/api/**' },
  },
});
