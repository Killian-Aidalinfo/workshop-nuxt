<script setup lang="ts">
const { session, signOut } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <header class="border-b bg-white dark:bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
      <span class="font-bold text-lg">DocExtract</span>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">{{ session.data?.user?.email }}</span>
        <UButton
          variant="ghost"
          size="sm"
          data-testid="sign-out-btn"
          @click="signOut"
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
