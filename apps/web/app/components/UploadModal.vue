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
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <span class="modal-title">$ upload_document</span>
        <button class="close" @click="emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div
          class="dropzone"
          :class="{ dragging }"
          data-testid="upload-dropzone"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <div class="dz-icon">{{ uploading ? '…' : '↑' }}</div>
          <div class="dz-title">{{ uploading ? 'Upload en cours…' : 'Glissez un fichier ici' }}</div>
          <div class="dz-sub">ou cliquez pour parcourir</div>
          <div class="dz-badges">
            <span class="badge badge-pdf">PDF</span>
            <span class="badge badge-img">PNG</span>
            <span class="badge badge-img">JPG</span>
            <span class="badge badge-img">WEBP</span>
            <span class="badge badge-img">TIFF</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            class="hidden-input"
            :accept="ACCEPTED"
            data-testid="upload-input"
            @change="onFileChange"
          >
        </div>
        <div class="dz-max">Taille maximale : 10 Mo</div>

        <p v-if="error" class="err" data-testid="upload-error">{{ error }}</p>
      </div>

      <div class="modal-foot">
        <button class="btn-cancel" @click="emit('close')">annuler</button>
        <button
          class="btn-upload"
          data-testid="upload-browse-btn"
          :disabled="uploading"
          @click="fileInput?.click()"
        >$ upload →</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(2,4,10,0.88);
  display: flex; align-items: center; justify-content: center; z-index: 100;
  animation: fadeIn 0.2s ease;
}
.modal {
  background: var(--bg-panel); border: 1px solid var(--bd-standard); border-radius: 8px;
  width: 500px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.5);
}

.modal-head {
  display: flex; align-items: center; padding: 15px 18px; border-bottom: 1px solid var(--bd-inner);
}
.modal-title {
  font-size: 10px; font-weight: 700; color: var(--tx-muted);
  letter-spacing: 0.12em; text-transform: uppercase; flex: 1;
}
.close {
  color: var(--tx-muted); background: none; border: none; font-size: 18px; line-height: 1;
  cursor: pointer; padding: 2px 6px; display: flex; align-items: center; transition: color 0.15s;
}
.close:hover { color: var(--tx-secondary); }

.modal-body { padding: 20px 18px; }
.dropzone {
  border: 2px dashed var(--bd-standard); background: transparent; border-radius: 8px;
  padding: 44px 32px; text-align: center; cursor: pointer; transition: all 0.15s;
}
.dropzone.dragging { border-color: #2563eb; background: rgba(37,99,235,0.06); }
.dz-icon {
  width: 44px; height: 44px; border: 1px solid var(--bd-standard); border-radius: 8px;
  background: var(--bg-input); display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px; font-size: 22px; line-height: 1; color: var(--tx-muted);
}
.dz-title { font-size: 13px; color: var(--tx-secondary); font-weight: 600; margin-bottom: 6px; }
.dz-sub { font-size: 11px; color: var(--tx-nano); margin-bottom: 20px; }
.dz-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.badge { font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 3px; letter-spacing: 0.04em; }
.badge-pdf { background: rgba(239,68,68,0.12); color: #f87171; }
.badge-img { background: rgba(37,99,235,0.12); color: #60a5fa; }
.hidden-input { display: none; }
.dz-max { margin-top: 12px; text-align: center; font-size: 10px; color: var(--tx-footer); }
.err {
  margin-top: 12px; font-size: 11px; color: #f87171;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 4px; padding: 9px 12px;
}

.modal-foot {
  display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px;
  border-top: 1px solid var(--bd-inner); background: var(--bg-header);
}
.btn-cancel {
  padding: 8px 16px; background: transparent; color: var(--tx-muted);
  border: 1px solid var(--bd-standard); border-radius: 3px; font-size: 11px; cursor: pointer;
  transition: color 0.15s;
}
.btn-cancel:hover { color: var(--tx-secondary); }
.btn-upload {
  padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 3px;
  font-size: 11px; font-weight: 600; cursor: pointer; transition: background 0.15s;
}
.btn-upload:hover:not(:disabled) { background: #1d4ed8; }
.btn-upload:disabled { opacity: 0.7; cursor: default; }
</style>
