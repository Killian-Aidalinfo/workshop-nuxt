<script setup lang="ts">
definePageMeta({ layout: 'auth', ssr: false })

const { signUp } = useAuth()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  loading.value = true
  error.value = ''
  const result = await signUp(email.value, password.value, name.value)
  loading.value = false
  if (result.error) {
    error.value = result.error.message ?? "Erreur lors de l'inscription"
  } else {
    await navigateTo('/')
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">Créer un compte</h2>
    </template>

    <form class="space-y-4" @submit.prevent="handleRegister">
      <UFormField label="Nom">
        <UInput
          v-model="name"
          placeholder="Jean Dupont"
          data-testid="register-name"
          required
        />
      </UFormField>

      <UFormField label="Email">
        <UInput
          v-model="email"
          type="email"
          placeholder="you@example.com"
          data-testid="register-email"
          required
        />
      </UFormField>

      <UFormField label="Mot de passe">
        <UInput
          v-model="password"
          type="password"
          placeholder="Min. 8 caractères"
          data-testid="register-password"
          required
        />
      </UFormField>

      <UAlert
        v-if="error"
        color="error"
        :description="error"
        data-testid="register-error"
      />

      <UButton
        type="submit"
        block
        :loading="loading"
        data-testid="register-submit"
      >
        Créer le compte
      </UButton>
    </form>

    <template #footer>
      <p class="text-sm text-center text-gray-500">
        Déjà un compte ?
        <NuxtLink to="/login" class="text-primary-500 hover:underline">Se connecter</NuxtLink>
      </p>
    </template>
  </UCard>
</template>
