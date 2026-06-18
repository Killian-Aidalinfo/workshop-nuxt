<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  const result = await signIn(email.value, password.value)
  loading.value = false
  if (result.error) {
    error.value = result.error.message ?? 'Erreur de connexion'
  } else {
    await navigateTo('/')
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">Connexion</h2>
    </template>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <UFormField label="Email">
        <UInput
          v-model="email"
          type="email"
          placeholder="you@example.com"
          data-testid="login-email"
          required
        />
      </UFormField>

      <UFormField label="Mot de passe">
        <UInput
          v-model="password"
          type="password"
          placeholder="••••••••"
          data-testid="login-password"
          required
        />
      </UFormField>

      <UAlert
        v-if="error"
        color="error"
        :description="error"
        data-testid="login-error"
      />

      <UButton
        type="submit"
        block
        :loading="loading"
        data-testid="login-submit"
      >
        Se connecter
      </UButton>
    </form>

    <template #footer>
      <p class="text-sm text-center text-gray-500">
        Pas encore de compte ?
        <NuxtLink to="/register" class="text-primary-500 hover:underline">S'inscrire</NuxtLink>
      </p>
    </template>
  </UCard>
</template>
