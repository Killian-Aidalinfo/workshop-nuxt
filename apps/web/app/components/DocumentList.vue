<script setup lang="ts">
import type { Document, DocumentStatus } from '~/composables/useDocuments'

const { documents, selectedDocument, loading, selectDocument, deleteDocument, fetchDocuments } =
  useDocuments()

const statusColor: Record<DocumentStatus, string> = {
  pending: 'warning',
  processing: 'info',
  done: 'success',
  error: 'error',
}

const statusLabel: Record<DocumentStatus, string> = {
  pending: 'En attente',
  processing: 'Extraction...',
  done: 'Terminé',
  error: 'Erreur',
}

onMounted(fetchDocuments)
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div
      v-if="loading"
      class="flex-1 flex items-center justify-center"
    >
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-2xl" />
    </div>

    <div
      v-else-if="documents.length === 0"
      class="flex-1 flex items-center justify-center text-gray-400 text-sm"
    >
      Aucun document
    </div>

    <ul v-else class="flex-1 overflow-y-auto divide-y dark:divide-gray-700">
      <li
        v-for="doc in documents"
        :key="doc.id"
        class="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        :class="{ 'bg-primary-50 dark:bg-primary-900/20': selectedDocument?.id === doc.id }"
        :data-testid="`doc-item-${doc.id}`"
        @click="selectDocument(doc)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium truncate">{{ doc.originalName }}</span>
          <UBadge
            :color="statusColor[doc.status]"
            size="xs"
            :data-testid="`doc-status-${doc.id}`"
          >
            {{ statusLabel[doc.status] }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs text-gray-400">
            {{ (doc.size / 1024).toFixed(0) }} Ko
          </span>
          <UButton
            variant="ghost"
            color="error"
            size="xs"
            icon="i-lucide-trash"
            :data-testid="`doc-delete-${doc.id}`"
            @click.stop="deleteDocument(doc.id)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
