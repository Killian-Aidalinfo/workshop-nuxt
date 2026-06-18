<script setup lang="ts">
import type { Document } from '~/composables/useDocuments'

const props = defineProps<{ document: Document }>()

const { runComparison, getResult } = useAbTest()

const result = computed(() => getResult(props.document.id))
const isLoading = computed(() => result.value?.isLoading ?? false)
</script>

<template>
  <aside class="panel">
    <div class="head">
      <span class="ab-badge">A/B</span>
      <span class="head-title">// scaleway_vs_ollama</span>
      <button class="run" :disabled="isLoading" @click="runComparison(document.id)">
        {{ isLoading ? '…' : '$ run →' }}
      </button>
    </div>

    <!-- Initial -->
    <div v-if="!result" class="state">
      <div class="glyph">⇄</div>
      <div class="state-text">Lancez la comparaison des deux providers.</div>
    </div>

    <!-- Loading -->
    <div v-else-if="result.isLoading" class="state">
      <div class="spinner"></div>
      <div class="state-text">Extraction sur les deux providers…</div>
    </div>

    <!-- Error -->
    <div v-else-if="result.error" class="state">
      <div class="state-text err">{{ result.error }}</div>
    </div>

    <!-- Results -->
    <div v-else class="cols">
      <AbTestColumn title="scaleway" :text="result.scaleway" accent="#60a5fa" />
      <AbTestColumn title="ollama" :text="result.ollama" accent="#4ade80" />
    </div>
  </aside>
</template>

<style scoped>
.panel {
  width: 560px; background: var(--bg-shell); border-left: 1px solid var(--bd-subtle);
  display: flex; flex-direction: column; flex-shrink: 0;
}
.head {
  padding: 10px 14px; border-bottom: 1px solid var(--bd-inner);
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.ab-badge {
  font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 3px;
  background: rgba(37,99,235,0.14); color: #60a5fa; letter-spacing: 0.06em;
}
.head-title {
  font-size: 9px; font-weight: 700; color: var(--tx-muted);
  letter-spacing: 0.12em; text-transform: uppercase; flex: 1;
}
.run {
  font-size: 10px; font-weight: 600; color: #fff; background: #2563eb;
  border: none; padding: 5px 12px; border-radius: 3px; cursor: pointer;
  letter-spacing: 0.04em; transition: background 0.15s;
}
.run:hover:not(:disabled) { background: #1d4ed8; }
.run:disabled { opacity: 0.7; cursor: default; }

.state {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px; padding: 60px 24px; text-align: center;
}
.glyph { font-size: 34px; color: var(--tx-muted); }
.state-text { font-size: 11px; color: var(--tx-muted); line-height: 1.8; }
.state-text.err { color: #f87171; }
.spinner {
  width: 28px; height: 28px; border: 2px solid var(--bd-standard);
  border-top-color: #2563eb; border-radius: 50%; animation: spinAnim 0.8s linear infinite;
}

.cols { flex: 1; display: flex; overflow: hidden; min-height: 0; }
</style>
