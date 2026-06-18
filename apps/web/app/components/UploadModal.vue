<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
const { uploadDocument } = useDocuments()

const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const uploading = ref(false)
const error = ref('')

const ACCEPTED = 'application/pdf,image/png,image/jpeg,image/webp,image/tiff'

async function handleFile(file: File) {
  error.value = ''
  uploading.value = true
  try {
    await uploadDocument(file)
    emit('close')
  } catch (e: unknown) {
    error.value =
      (e as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      "Erreur lors de l'upload"
  } finally {
    uploading.value = false
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleFile(file)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}
</script>

<template>
  <div class="space-y-4 p-4">
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
      :class="
        dragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600'
      "
      data-testid="upload-dropzone"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <UIcon name="i-lucide-cloud-upload" class="text-4xl text-gray-400 mb-2" />
      <p class="text-sm text-gray-500 mb-3">Glissez un fichier ici ou cliquez pour parcourir</p>
      <UButton
        variant="outline"
        size="sm"
        data-testid="upload-browse-btn"
        :loading="uploading"
        @click.stop="fileInput?.click()"
      >
        Parcourir
      </UButton>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="ACCEPTED"
        data-testid="upload-input"
        @change="onFileChange"
      />
      <p class="text-xs text-gray-400 mt-3">PDF, PNG, JPG, WEBP, TIFF — max 10 Mo</p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      :description="error"
      data-testid="upload-error"
    />
  </div>
</template>
