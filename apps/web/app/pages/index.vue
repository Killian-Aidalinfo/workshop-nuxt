<script setup lang="ts">
const { documents, selectedDocument, retryExtraction } = useDocuments()
const { abMode } = useAbTest()
const showUpload = useState<boolean>('showUpload', () => false)

function handleRetry() {
  if (selectedDocument.value) {
    retryExtraction(selectedDocument.value.id)
  }
}
</script>

<template>
  <div class="page">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="side-head">
        <span class="side-title">// documents</span>
        <span class="side-count">{{ documents.length }}</span>
      </div>
      <DocumentList class="side-list" />
      <div class="side-foot">workshop-nuxt · v0.1.0</div>
    </aside>

    <!-- VIEWER + EXTRACTED PANEL -->
    <template v-if="selectedDocument">
      <DocumentViewer :document="selectedDocument" @retry="handleRetry" />
      <AbTestPanel v-if="abMode" :document="selectedDocument" />
      <ExtractedTextPanel
        v-else
        :document="selectedDocument"
        @retry="handleRetry"
      />
    </template>

    <!-- EMPTY STATE -->
    <div v-else class="empty" data-testid="empty-state">
      <div class="empty-glyph">⌁</div>
      <div class="empty-title">// aucun document sélectionné</div>
      <div class="empty-desc">Sélectionnez un document ou uploadez-en un nouveau.</div>
      <button class="empty-btn" data-testid="upload-open-btn-empty" @click="showUpload = true">
        <span class="plus">+</span> upload un document
      </button>
    </div>

    <!-- UPLOAD MODAL -->
    <UploadModal v-if="showUpload" data-testid="upload-modal" @close="showUpload = false" />
  </div>
</template>

<style scoped>
.page { flex: 1; display: flex; overflow: hidden; min-width: 0; }

/* SIDEBAR */
.sidebar {
  width: 252px; background: var(--bg-shell);
  border-right: 1px solid var(--bd-subtle);
  display: flex; flex-direction: column; flex-shrink: 0;
}
.side-head {
  padding: 12px 14px 10px; border-bottom: 1px solid var(--bd-inner);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.side-title {
  font-size: 9px; font-weight: 700; color: var(--tx-muted);
  letter-spacing: 0.14em; text-transform: uppercase;
}
.side-count {
  font-size: 9px; color: var(--tx-muted); background: var(--bg-viewer);
  border: 1px solid var(--bd-subtle); padding: 1px 7px; border-radius: 3px;
}
.side-list { flex: 1; overflow: hidden; }
.side-foot {
  padding: 10px 14px; border-top: 1px solid var(--bd-inner); flex-shrink: 0;
  font-size: 9px; color: var(--tx-footer); letter-spacing: 0.06em;
}

/* EMPTY */
.empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; background: var(--bg-viewer);
  animation: fadeIn 0.3s ease;
}
.empty-glyph { font-size: 44px; color: var(--tx-muted); line-height: 1; }
.empty-title { font-size: 12px; font-weight: 700; color: var(--tx-secondary); letter-spacing: 0.08em; }
.empty-desc { font-size: 11px; color: var(--tx-muted); }
.empty-btn {
  margin-top: 8px; display: flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: #2563eb; color: #fff; border: none; border-radius: 3px;
  font-size: 11px; font-weight: 600; cursor: pointer; letter-spacing: 0.04em;
  transition: background 0.15s;
}
.empty-btn:hover { background: #1d4ed8; }
.plus { font-size: 15px; line-height: 1; font-weight: 300; }
</style>
