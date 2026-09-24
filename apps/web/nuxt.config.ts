// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  typescript: { strict: true },
  // Atomic design folders (atoms / molecules / organisms) without prefixing
  // component names with the folder: <StepValue>, not <MoleculesStepValue>.
  components: [{ path: '~/components', pathPrefix: false }],
  routeRules: {
    '/api/**': { proxy: 'http://localhost:3001/api/**' },
  },
});
