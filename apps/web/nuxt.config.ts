import { resolve } from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2025-06-01',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
  vite: {
    optimizeDeps: {
      include: ['better-auth/vue'],
    },
  },
  nitro: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
    experimental: {
      asyncContext: true,
    },
  },
})
