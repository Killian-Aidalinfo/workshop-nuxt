<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

const { data: session } = await authClient.useSession(useFetch)

async function handleSignOut() {
  await authClient.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
    <header class="border-b bg-white dark:bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
      <span class="font-bold text-lg">DocExtract</span>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">{{ session?.user?.email }}</span>
        <UButton
          variant="ghost"
          size="sm"
          data-testid="sign-out-btn"
          @click="handleSignOut"
        >
          Déconnexion
        </UButton>
      </div>
    </header>
    <main class="flex-1 flex overflow-hidden">
      <slot />
    </main>
  </div>
</template>
