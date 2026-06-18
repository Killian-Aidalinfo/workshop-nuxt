<script setup lang="ts">
const { theme } = useTheme()

useHead({
  htmlAttrs: {
    'data-theme': theme,
  },
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
