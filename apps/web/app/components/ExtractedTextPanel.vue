<script setup lang="ts">
import type { Document } from '~/composables/useDocuments'
import { countTokens } from '~/utils/document-format'

const props = defineProps<{ document: Document }>()
const emit = defineEmits<{ retry: [] }>()

const copied = ref(false)
const copiedJson = ref(false)
const toast = useToast()

const isDone = computed(() => props.document.status === 'done')
const hasText = computed(() => isDone.value && !!props.document.extractedText)
const hasJson = computed(() => isDone.value && props.document.extractedData != null)
const tokens = computed(() => (hasText.value ? countTokens(props.document.extractedText) : 0))

const jsonString = computed(() =>
  hasJson.value ? JSON.stringify(props.document.extractedData, null, 2) : '',
)

const statusBadge = computed(() => {
  switch (props.document.status) {
    case 'done': return { label: '[OK]', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
    case 'processing': return { label: '[RUN]', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    case 'error': return { label: '[ERR]', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    default: return { label: '[QUE]', color: '#475569', bg: 'rgba(71,85,105,0.12)' }
  }
})

async function copyText() {
  if (!props.document.extractedText) return
  await navigator.clipboard.writeText(props.document.extractedText)
  copied.value = true
  toast.add({ title: 'Texte copié !', color: 'success' })
  setTimeout(() => { copied.value = false }, 2000)
}

async function copyJson() {
  if (!jsonString.value) return
  await navigator.clipboard.writeText(jsonString.value)
  copiedJson.value = true
  toast.add({ title: 'JSON copié !', color: 'success' })
  setTimeout(() => { copiedJson.value = false }, 2000)
}
</script>

<template>
  <aside class="panel" data-testid="extracted-text-panel">
    <!-- HEADER -->
    <div class="head">
      <span class="head-title">// extracted_text</span>
      <span class="head-status" :style="{ color: statusBadge.color, background: statusBadge.bg }">
        {{ statusBadge.label }}
      </span>
      <button
        v-if="hasText"
        class="copy"
        data-testid="copy-text-btn"
        @click="copyText"
      >{{ copied ? 'copied ✓' : 'copy' }}</button>
      <button
        v-if="hasJson"
        class="copy copy-json"
        data-testid="copy-json-btn"
        title="Copier la sortie structurée"
        @click="copyJson"
      >{{ copiedJson ? 'json ✓' : 'copy json' }}</button>
    </div>

    <!-- STATS -->
    <div class="stats">
      <div class="stat">
        <div class="stat-label">LANG</div>
        <div class="stat-val">{{ hasText ? 'FR' : '—' }}</div>
      </div>
      <div class="stat-div"></div>
      <div class="stat">
        <div class="stat-label">TOKENS</div>
        <div class="stat-val">{{ tokens || '—' }}</div>
      </div>
      <div class="stat-div"></div>
      <div class="stat">
        <div class="stat-label">PAGES</div>
        <div class="stat-val">{{ hasText ? '1' : '—' }}</div>
      </div>
    </div>

    <!-- BODY -->
    <div class="body">
      <pre
        v-if="hasText"
        class="text"
        data-testid="extracted-text-content"
      >{{ document.extractedText }}</pre>

      <div v-else-if="document.status === 'processing'" class="state">
        <div class="spinner"></div>
        <div class="state-text">Extraction en cours…</div>
      </div>

      <div v-else-if="document.status === 'pending'" class="state">
        <div class="state-text dim">En file d'attente.<br>Aucun texte disponible.</div>
      </div>

      <div v-else-if="document.status === 'error'" class="state">
        <div class="state-text dim">Extraction échouée.<br>Aucun texte disponible.</div>
        <button class="retry" @click="emit('retry')">↺ Réessayer</button>
      </div>

      <div v-else class="state">
        <div class="state-text dim">Aucun texte extrait.</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  width: 356px; background: var(--bg-shell); border-left: 1px solid var(--bd-subtle);
  display: flex; flex-direction: column; flex-shrink: 0;
}

.head {
  padding: 10px 14px; border-bottom: 1px solid var(--bd-inner);
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
}
.head-title {
  font-size: 9px; font-weight: 700; color: var(--tx-muted);
  letter-spacing: 0.12em; text-transform: uppercase; flex: 1;
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.head-status {
  font-size: 9px; font-weight: 600; padding: 2px 7px; border-radius: 3px; flex-shrink: 0;
}
.copy {
  flex-shrink: 0;
  font-size: 9px; color: var(--tx-muted); background: var(--bg-input);
  border: 1px solid var(--bd-subtle); padding: 3px 8px; border-radius: 3px;
  cursor: pointer; letter-spacing: 0.04em; transition: color 0.15s, border-color 0.15s; white-space: nowrap;
}
.copy:hover { color: var(--tx-secondary); border-color: var(--bd-standard); }
.copy-json { color: #60a5fa; border-color: rgba(37,99,235,0.3); }
.copy-json:hover { color: #93c5fd; border-color: #2563eb; }

.stats { display: flex; padding: 10px 0; border-bottom: 1px solid var(--bd-inner); flex-shrink: 0; }
.stat { flex: 1; padding: 0 14px; }
.stat-label {
  font-size: 8px; color: var(--tx-nano); letter-spacing: 0.1em;
  text-transform: uppercase; margin-bottom: 4px; font-weight: 700;
}
.stat-val { font-size: 12px; color: var(--tx-secondary); font-weight: 500; }
.stat-div { width: 1px; background: var(--bd-inner); flex-shrink: 0; }

.body { flex: 1; overflow-y: auto; padding: 16px 14px; }
.text {
  font-size: 11.5px; color: var(--tx-extracted); line-height: 1.95;
  white-space: pre-wrap; word-break: break-word; font-family: 'JetBrains Mono', monospace; margin: 0;
}

.state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 60px 20px; text-align: center;
}
.spinner {
  width: 28px; height: 28px; border: 2px solid var(--bd-standard);
  border-top-color: #f59e0b; border-radius: 50%; animation: spinAnim 0.8s linear infinite;
}
.state-text { font-size: 11px; color: var(--tx-muted); line-height: 1.8; }
.state-text.dim { color: var(--tx-nano); }
.retry {
  font-size: 11px; padding: 7px 16px; background: rgba(239,68,68,0.08);
  color: #ef4444; border: 1px solid rgba(239,68,68,0.2); border-radius: 3px; cursor: pointer;
}
.retry:hover { background: rgba(239,68,68,0.16); }
</style>
