<script setup lang="ts">
import type { Document } from '~/composables/useDocuments'

const props = defineProps<{ document: Document }>()
const emit = defineEmits<{ retry: [] }>()

const fileUrl = computed(() => `/api/files/${props.document.filename}`)
const isPdf = computed(() => props.document.mimeType === 'application/pdf')
const status = computed(() => props.document.status)
</script>

<template>
  <main class="viewer" data-testid="document-viewer">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <span class="tb-name">{{ document.originalName }}</span>
      <span class="tb-page">p. 1 / 1</span>
      <div class="tb-zoom">
        <button class="zbtn">−</button>
        <span class="zlevel">100%</span>
        <button class="zbtn">+</button>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <!-- DONE → real document -->
      <template v-if="status === 'done'">
        <div class="sheet-wrap">
          <div class="scanline"></div>
          <iframe
            v-if="isPdf"
            :src="fileUrl"
            class="file-frame"
            :title="document.originalName"
          />
          <img
            v-else
            :src="fileUrl"
            :alt="document.originalName"
            class="file-img"
            data-testid="document-image"
          >
        </div>
      </template>

      <!-- PROCESSING → 3D scan animation -->
      <div v-else-if="status === 'processing'" class="proc" data-testid="extraction-loading">
        <div class="scene">
          <div class="doc3d">
            <span class="d-line w90"></span>
            <span class="d-line w72"></span>
            <span class="d-block"></span>
            <span class="d-line w84"></span>
            <span class="d-line w66"></span>
            <span class="d-line w78"></span>
            <span class="d-line w52"></span>
            <span class="d-grid"></span>
            <span class="d-line w70"></span>
            <span class="d-line w44"></span>
            <div class="beam"></div>
            <div class="ring"></div>
            <div class="ring ring2"></div>
          </div>
        </div>
        <div class="proc-text">
          <div class="proc-title">[RUN] Extraction en cours…</div>
          <div class="proc-sub">Le moteur OCR analyse votre document en 3D.</div>
        </div>
      </div>

      <!-- PENDING -->
      <div v-else-if="status === 'pending'" class="msg">
        <div class="msg-title">[QUE] En file d'attente</div>
        <div class="msg-sub">Le document sera traité prochainement.</div>
      </div>

      <!-- ERROR -->
      <div v-else class="msg" data-testid="extraction-error">
        <div class="msg-title err">[ERR] Extraction échouée</div>
        <div class="msg-sub">Une erreur est survenue lors du<br>traitement de ce document.</div>
        <button class="retry" data-testid="retry-extraction-btn" @click="emit('retry')">↺ Réessayer</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.viewer {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  min-width: 0; background: var(--bg-shell);
}

/* TOOLBAR */
.toolbar {
  height: 40px; background: var(--bg-toolbar); border-bottom: 1px solid var(--bd-subtle);
  display: flex; align-items: center; padding: 0 16px; gap: 12px; flex-shrink: 0;
}
.tb-name {
  font-size: 10px; color: var(--tx-muted); flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.tb-page { font-size: 10px; color: var(--tx-nano); flex-shrink: 0; }
.tb-zoom { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.zbtn {
  width: 24px; height: 24px; background: var(--bg-viewer); border: 1px solid var(--bd-subtle);
  border-radius: 2px; color: var(--tx-muted); font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}
.zlevel { font-size: 10px; color: var(--tx-muted); padding: 0 8px; min-width: 48px; text-align: center; }

/* CONTENT */
.content {
  flex: 1; overflow: hidden; display: flex; justify-content: center;
  align-items: stretch; background: var(--bg-viewer);
}

/* DONE — real file with scanline overlay */
.sheet-wrap { position: relative; flex: 1; display: flex; overflow: hidden; }
.scanline {
  position: absolute; left: 0; right: 0; height: 2px; z-index: 2; top: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.4) 30%, rgba(37,99,235,0.6) 50%, rgba(37,99,235,0.4) 70%, transparent 100%);
  animation: scanMove 5s linear infinite;
}
.file-frame { flex: 1; width: 100%; border: 0; background: #fff; }
.file-img { max-width: 100%; max-height: 100%; margin: auto; display: block; object-fit: contain; padding: 20px; }

/* PROCESSING — 3D scene */
.proc {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 34px; animation: fadeIn 0.3s ease;
}
.scene {
  perspective: 1200px;
  perspective-origin: 50% 32%;
  width: 320px; height: 420px;
  display: flex; align-items: center; justify-content: center;
}
.doc3d {
  position: relative;
  width: 280px; height: 380px;
  background: #fdfcfb;
  border-radius: 3px;
  padding: 38px 34px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(37,99,235,0.15);
  transform-style: preserve-3d;
  animation: doc3dFloat 6s ease-in-out infinite;
  overflow: hidden;
}
.d-line {
  display: block; height: 8px; border-radius: 2px; background: #d7dde6;
  margin-bottom: 13px; animation: lineReveal 2.4s ease-in-out infinite;
}
.w90 { width: 90%; } .w84 { width: 84%; } .w78 { width: 78%; }
.w72 { width: 72%; } .w70 { width: 70%; } .w66 { width: 66%; }
.w52 { width: 52%; } .w44 { width: 44%; }
.d-block {
  display: block; height: 54px; border-radius: 3px; margin: 4px 0 18px;
  background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2);
}
.d-grid {
  display: block; height: 60px; border-radius: 3px; margin: 6px 0 18px;
  border: 1px solid #e5e7eb;
  background:
    linear-gradient(#f3f4f6 0 0) top/100% 22px no-repeat,
    repeating-linear-gradient(#fff 0 19px, #f3f4f6 19px 20px),
    linear-gradient(90deg, #fff 66%, #fafbfc 66%);
}
.d-line:nth-child(2) { animation-delay: 0.1s; }
.d-line:nth-child(4) { animation-delay: 0.3s; }
.d-line:nth-child(5) { animation-delay: 0.4s; }
.d-line:nth-child(6) { animation-delay: 0.5s; }
.d-line:nth-child(7) { animation-delay: 0.6s; }
.d-line:nth-child(9) { animation-delay: 0.8s; }
.d-line:nth-child(10){ animation-delay: 0.9s; }

.beam {
  position: absolute; left: -10%; right: -10%; height: 40px;
  transform: translateZ(40px);
  background: linear-gradient(180deg, transparent, rgba(37,99,235,0.55), transparent);
  box-shadow: 0 0 28px 10px rgba(37,99,235,0.45);
  animation: scan3d 2.2s ease-in-out infinite;
  pointer-events: none;
}
.ring {
  position: absolute; bottom: -60px; left: 50%; width: 90px; height: 90px;
  margin-left: -45px; border: 2px solid rgba(37,99,235,0.5); border-radius: 50%;
  transform: translateZ(-30px); animation: ringPulse 2.2s ease-out infinite; pointer-events: none;
}
.ring2 { animation-delay: 1.1s; }

.proc-text { text-align: center; line-height: 1.9; }
.proc-title { font-size: 12px; color: var(--tx-secondary); font-weight: 600; margin-bottom: 6px; }
.proc-sub { font-size: 11px; color: var(--tx-muted); }

/* PENDING / ERROR */
.msg {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 18px; animation: fadeIn 0.3s ease;
}
.msg-title { font-size: 12px; color: var(--tx-label); font-weight: 600; }
.msg-title.err { color: #ef4444; }
.msg-sub { font-size: 11px; color: var(--tx-muted); text-align: center; line-height: 1.8; }
.retry {
  font-size: 11px; padding: 7px 16px; background: rgba(239,68,68,0.08);
  color: #ef4444; border: 1px solid rgba(239,68,68,0.2); border-radius: 3px; cursor: pointer;
  transition: background 0.15s;
}
.retry:hover { background: rgba(239,68,68,0.16); }
</style>
