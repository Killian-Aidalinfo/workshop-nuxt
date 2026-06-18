<script setup lang="ts">
import VuePdfEmbed from '@tato30/vue-pdf'
import type { Document } from '~/composables/useDocuments'

const props = defineProps<{ document: Document }>()

const fileUrl = computed(() => `/api/files/${props.document.filename}`)
const isPdf = computed(() => props.document.mimeType === 'application/pdf')
</script>

<template>
  <div
    class="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4"
    data-testid="document-viewer"
  >
    <!-- PDF viewer -->
    <template v-if="isPdf">
      <ClientOnly>
        <VuePdfEmbed
          :source="fileUrl"
          class="shadow rounded"
        />
        <template #fallback>
          <div class="flex items-center justify-center h-32 text-gray-400">
            <UIcon name="i-lucide-loader-circle" class="animate-spin text-2xl" />
          </div>
        </template>
      </ClientOnly>
    </template>

    <!-- Image viewer -->
    <template v-else>
      <img
        :src="fileUrl"
        :alt="document.originalName"
        class="max-w-full rounded shadow mx-auto block"
        data-testid="document-image"
      />
    </template>
  </div>
</template>
