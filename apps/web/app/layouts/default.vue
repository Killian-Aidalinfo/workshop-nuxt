<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

const { data: session } = await authClient.useSession(useFetch)
const { selectedDocument } = useDocuments()
const { abMode } = useAbTest()
const { theme, toggleTheme } = useTheme()
const { provider, setProvider, isProvider } = useProvider()
const showUpload = useState<boolean>('showUpload', () => false)

function onProviderChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isProvider(value)) setProvider(value)
}

const selDocName = computed(() => selectedDocument.value?.originalName ?? '—')

const initials = computed(() => {
  const src = session.value?.user?.name || session.value?.user?.email || '?'
  const parts = src.trim().split(/[\s.@]+/).filter(Boolean)
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  return (letters || src[0] || '?').toUpperCase()
})

async function handleSignOut() {
  await authClient.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div :data-theme="theme" class="shell">
    <!-- HEADER -->
    <header class="header">
      <div class="brand">
        <div class="logo-box">C</div>
        <div class="brand-text">
          <span class="brand-cesi">CESI</span>
          <span class="brand-app">DocExtract</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="breadcrumb">
        <span class="bc-path">~/documents/</span>
        <span class="bc-name" data-testid="selected-doc-name">{{ selDocName }}</span>
      </div>

      <div class="actions">
        <div class="provider" :class="{ disabled: abMode }" :title="abMode ? 'Le mode A/B lance les deux providers' : 'Provider d\'extraction'">
          <span class="provider-label">&gt;_</span>
          <select
            class="provider-select"
            :value="provider"
            :disabled="abMode"
            data-testid="provider-select"
            @change="onProviderChange"
          >
            <option value="scaleway">scaleway</option>
            <option value="ollama">ollama</option>
          </select>
        </div>

        <button
          class="theme-btn"
          :title="theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'"
          data-testid="theme-toggle"
          @click="toggleTheme"
        >{{ theme === 'dark' ? '☀' : '☾' }}</button>

        <label class="ab-toggle" :class="{ active: abMode }">
          <input v-model="abMode" type="checkbox" class="ab-checkbox">
          <span class="ab-dot"></span>
          <span class="ab-label">A/B</span>
        </label>

        <button class="upload-btn" data-testid="upload-open-btn" @click="showUpload = true">
          <span class="plus">+</span>
          <span>upload</span>
        </button>

        <div class="user" data-testid="sign-out-btn" @click="handleSignOut">
          <div class="avatar">{{ initials }}</div>
          <span class="exit">exit →</span>
        </div>
      </div>
    </header>

    <!-- BODY -->
    <div class="body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-shell);
  font-family: 'JetBrains Mono', monospace;
  animation: fadeIn 0.3s ease;
}

.header {
  height: 50px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--bd-subtle);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 14px;
  flex-shrink: 0;
}

.brand { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.logo-box {
  width: 24px; height: 24px; background: #2563eb; border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff;
}
.brand-text { display: flex; align-items: baseline; gap: 7px; }
.brand-cesi { font-size: 12px; font-weight: 600; color: var(--tx-primary); letter-spacing: 0.06em; }
.brand-app { font-size: 10px; color: var(--tx-muted); letter-spacing: 0.02em; }

.divider { width: 1px; height: 18px; background: var(--bd-subtle); flex-shrink: 0; }

.breadcrumb {
  flex: 1; display: flex; align-items: center; gap: 5px;
  font-size: 11px; min-width: 0; overflow: hidden;
}
.bc-path { color: var(--tx-muted); flex-shrink: 0; }
.bc-name { color: var(--tx-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.provider {
  display: flex; align-items: center; gap: 6px; padding: 4px 8px 4px 10px;
  background: var(--bg-input); border: 1px solid var(--bd-standard); border-radius: 3px;
  transition: opacity 0.15s;
}
.provider.disabled { opacity: 0.4; }
.provider-label { font-size: 10px; font-weight: 700; color: var(--tx-muted); }
.provider-select {
  background: transparent; border: none; outline: none; cursor: pointer;
  color: var(--tx-secondary); font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
  padding-right: 2px;
}
.provider-select:disabled { cursor: default; }
.provider-select option { background: var(--bg-panel); color: var(--tx-primary); }

.theme-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: var(--bg-input); border: 1px solid var(--bd-standard); border-radius: 3px;
  color: var(--tx-secondary); font-size: 13px; cursor: pointer; line-height: 1;
  transition: border-color 0.15s, color 0.15s;
}
.theme-btn:hover { border-color: #2563eb; color: #60a5fa; }

.ab-toggle {
  display: flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 5px 10px; border: 1px solid var(--bd-standard); border-radius: 3px;
  background: var(--bg-input); transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.ab-toggle.active { border-color: #2563eb; background: rgba(37,99,235,0.1); }
.ab-checkbox { display: none; }
.ab-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--tx-muted); transition: background 0.15s, box-shadow 0.15s;
}
.ab-toggle.active .ab-dot { background: #2563eb; box-shadow: 0 0 6px rgba(37,99,235,0.7); }
.ab-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  color: var(--tx-muted); transition: color 0.15s;
}
.ab-toggle.active .ab-label { color: #60a5fa; }

.upload-btn {
  display: flex; align-items: center; gap: 7px; padding: 6px 13px;
  background: #2563eb; color: #fff; border: none; border-radius: 3px;
  font-size: 11px; font-weight: 600; cursor: pointer; letter-spacing: 0.04em;
  transition: background 0.15s;
}
.upload-btn:hover { background: #1d4ed8; }
.plus { font-size: 16px; line-height: 1; font-weight: 300; margin-top: -1px; }

.user { display: flex; align-items: center; gap: 8px; cursor: pointer; transition: opacity 0.15s; }
.user:hover { opacity: 0.6; }
.avatar {
  width: 26px; height: 26px; border-radius: 50%; background: var(--bg-input);
  border: 1px solid var(--bd-standard); display: flex; align-items: center;
  justify-content: center; font-size: 9px; color: var(--tx-secondary); font-weight: 700;
}
.exit { font-size: 10px; color: var(--tx-muted); }

.body { flex: 1; display: flex; overflow: hidden; }
</style>
