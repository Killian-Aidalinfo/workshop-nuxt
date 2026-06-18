export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-06-01',
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
})
