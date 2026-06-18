<script setup lang="ts">
import type { Document } from '~/composables/useDocuments'

const props = defineProps<{ document: Document }>()

const fileUrl = computed(() => `/api/files/${props.document.filename}`)
const isPdf = computed(() => props.document.mimeType === 'application/pdf')
</script>

<template>
  <div
    class="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800"
    data-testid="document-viewer"
  >
    <iframe
      v-if="isPdf"
      :src="fileUrl"
      class="w-full h-full border-0"
      :title="document.originalName"
    />
    <div v-else class="h-full overflow-auto p-4">
      <img
        :src="fileUrl"
        :alt="document.originalName"
        class="max-w-full rounded shadow mx-auto block"
        data-testid="document-image"
      />
    </div>
  </div>
</template>
