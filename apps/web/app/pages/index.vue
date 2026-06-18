<script setup lang="ts">
const { selectedDocument, retryExtraction } = useDocuments()
const showUploadModal = ref(false)

function handleRetry() {
  if (selectedDocument.value) {
    retryExtraction(selectedDocument.value.id)
  }
}
</script>

<template>
  <div class="flex h-full w-full overflow-hidden">
    <!-- Sidebar: document list -->
    <aside class="w-72 shrink-0 flex flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between shrink-0">
        <h2 class="font-semibold text-sm">Documents</h2>
        <UButton
          size="xs"
          icon="i-lucide-plus"
          data-testid="upload-open-btn"
          @click="showUploadModal = true"
        >
          Ajouter
        </UButton>
      </div>
      <DocumentList class="flex-1 overflow-hidden" />
    </aside>

    <!-- Main area: viewer + extracted text -->
    <div class="flex-1 flex overflow-hidden">
      <template v-if="selectedDocument">
        <!-- Left: document preview (50%) -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
            <p class="text-sm font-medium truncate" data-testid="selected-doc-name">
              {{ selectedDocument.originalName }}
            </p>
          </div>
          <DocumentViewer :document="selectedDocument" />
        </div>

        <!-- Right: extracted text (50%) -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <ExtractedTextPanel
            :document="selectedDocument"
            @retry="handleRetry"
          />
        </div>
      </template>

      <!-- Empty state -->
      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400"
        data-testid="empty-state"
      >
        <UIcon name="i-lucide-file-text" class="text-5xl" />
        <p>Sélectionnez ou uploadez un document</p>
        <UButton
          icon="i-lucide-plus"
          data-testid="upload-open-btn-empty"
          @click="showUploadModal = true"
        >
          Uploader un document
        </UButton>
      </div>
    </div>
  </div>

  <!-- Upload modal -->
  <UModal
    v-model:open="showUploadModal"
    title="Uploader un document"
    data-testid="upload-modal"
  >
    <template #body>
      <UploadModal @close="showUploadModal = false" />
    </template>
  </UModal>
</template>
