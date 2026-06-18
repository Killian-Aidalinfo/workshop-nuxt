<script setup lang="ts">
defineProps<{ title: string; text: string | null; accent: string }>()
</script>

<template>
  <div class="col">
    <div class="col-head">
      <span class="dot" :style="{ background: accent }"></span>
      <span class="col-title">{{ title }}</span>
    </div>
    <pre v-if="text" class="col-text">{{ text }}</pre>
    <div v-else class="col-empty">// aucun résultat</div>
  </div>
</template>

<style scoped>
.col {
  flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden;
}
.col + .col { border-left: 1px solid var(--bd-inner); }
.col-head {
  display: flex; align-items: center; gap: 7px; padding: 8px 12px;
  border-bottom: 1px solid var(--bd-inner); background: var(--bg-toolbar); flex-shrink: 0;
}
.dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.col-title {
  font-size: 10px; font-weight: 700; color: var(--tx-secondary);
  letter-spacing: 0.08em; text-transform: uppercase;
}
.col-text {
  flex: 1; overflow-y: auto; padding: 12px; margin: 0; font-size: 11px;
  color: var(--tx-extracted); line-height: 1.9; white-space: pre-wrap;
  word-break: break-word; font-family: 'JetBrains Mono', monospace;
}
.col-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: var(--tx-nano);
}
</style>
