<script setup lang="ts">
import type { Document } from '~/composables/useDocuments'

const props = defineProps<{ document: Document }>()
const emit = defineEmits<{ retry: [] }>()

const copied = ref(false)
const toast = useToast()

async function copyText() {
  if (!props.document.extractedText) return
  await navigator.clipboard.writeText(props.document.extractedText)
  copied.value = true
  toast.add({ title: 'Texte copié !', color: 'success' })
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div
    class="flex flex-col h-full border-l dark:border-gray-700"
    data-testid="extracted-text-panel"
  >
    <div class="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 shrink-0">
      <h2 class="font-semibold text-sm">Texte extrait</h2>
      <div class="flex items-center gap-2">
        <UButton
          v-if="document.status === 'error'"
          size="xs"
          color="error"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          data-testid="retry-extraction-btn"
          @click="emit('retry')"
        >
          Réessayer
        </UButton>
        <UButton
          v-if="document.status === 'done'"
          size="xs"
          variant="outline"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-clipboard'"
          data-testid="copy-text-btn"
          @click="copyText"
        >
          {{ copied ? 'Copié !' : 'Copier' }}
        </UButton>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="document.status === 'pending' || document.status === 'processing'"
      class="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400"
      data-testid="extraction-loading"
    >
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-3xl" />
      <p class="text-sm">Extraction en cours...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="document.status === 'error'"
      class="flex-1 flex items-center justify-center p-4"
      data-testid="extraction-error"
    >
      <UAlert
        color="error"
        title="Extraction échouée"
        description="Cliquez sur Réessayer pour relancer l'extraction."
      />
    </div>

    <!-- Text content -->
    <pre
      v-else-if="document.extractedText"
      class="flex-1 overflow-y-auto p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed"
      data-testid="extracted-text-content"
    >{{ document.extractedText }}</pre>

    <div
      v-else
      class="flex-1 flex items-center justify-center text-gray-400 text-sm"
    >
      Aucun texte extrait
    </div>
  </div>
</template>
