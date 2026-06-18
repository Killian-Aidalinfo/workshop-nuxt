<script setup lang="ts">
import {
  docExt, docType, formatDocDate,
  STATUS_LABEL, STATUS_COLOR, STATUS_BG,
} from '~/utils/document-format'

const { documents, selectedDocument, loading, selectDocument, deleteDocument, fetchDocuments } =
  useDocuments()

onMounted(fetchDocuments)
</script>

<template>
  <div class="list-root">
    <div v-if="loading" class="state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="documents.length === 0" class="state empty">
      <span>// vide</span>
      <span class="sub">Aucun document</span>
    </div>

    <div v-else class="items">
      <div
        v-for="doc in documents"
        :key="doc.id"
        class="item"
        :class="{ selected: selectedDocument?.id === doc.id }"
        :data-testid="`doc-item-${doc.id}`"
        @click="selectDocument(doc)"
      >
        <div class="item-top">
          <span class="ext" :class="docType(doc) === 'pdf' ? 'ext-pdf' : 'ext-img'">{{ docExt(doc) }}</span>
          <span class="name">{{ doc.originalName }}</span>
          <button
            class="del"
            :data-testid="`doc-delete-${doc.id}`"
            title="Supprimer"
            @click.stop="deleteDocument(doc.id)"
          >×</button>
        </div>
        <div class="item-bottom">
          <span class="date">{{ formatDocDate(doc.createdAt) }}</span>
          <span
            class="status"
            :data-testid="`doc-status-${doc.id}`"
            :style="{ color: STATUS_COLOR[doc.status], background: STATUS_BG[doc.status] }"
          >{{ STATUS_LABEL[doc.status] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-root { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.state {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 6px; color: var(--tx-muted);
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
}
.state .sub { font-size: 10px; font-weight: 400; letter-spacing: normal; color: var(--tx-nano); }
.spinner {
  width: 22px; height: 22px; border: 2px solid var(--bd-standard);
  border-top-color: #2563eb; border-radius: 50%; animation: spinAnim 0.8s linear infinite;
}

.items { flex: 1; overflow-y: auto; padding: 6px 0; }

.item {
  padding: 11px 12px 11px 14px;
  cursor: pointer;
  border-left: 2px solid transparent;
  transition: background 0.12s;
}
.item:hover { background: rgba(37,99,235,0.04); }
.item:hover .del { opacity: 1; }
.item.selected { border-left: 2px solid #2563eb; background: rgba(37,99,235,0.08); }

.item-top { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; }
.ext {
  font-size: 8px; font-weight: 700; padding: 2px 5px; border-radius: 2px;
  letter-spacing: 0.04em; flex-shrink: 0;
}
.ext-pdf { background: rgba(239,68,68,0.14); color: #f87171; }
.ext-img { background: rgba(37,99,235,0.14); color: #60a5fa; }
.name {
  font-size: 11.5px; color: var(--tx-secondary); flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.item.selected .name { color: var(--tx-primary); }
.del {
  opacity: 0; flex-shrink: 0; background: none; border: none; cursor: pointer;
  color: var(--tx-muted); font-size: 15px; line-height: 1; padding: 0 2px;
  transition: opacity 0.12s, color 0.12s;
}
.del:hover { color: #ef4444; }

.item-bottom { display: flex; align-items: center; justify-content: space-between; padding-left: 27px; }
.date { font-size: 10px; color: var(--tx-nano); }
.status {
  font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px;
  flex-shrink: 0; letter-spacing: 0.02em;
}
</style>
