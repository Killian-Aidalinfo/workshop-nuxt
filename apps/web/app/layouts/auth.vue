<script setup lang="ts">
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <div :data-theme="theme" class="auth-root">
    <button
      class="theme-btn"
      :title="theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'"
      data-testid="theme-toggle"
      @click="toggleTheme"
    >{{ theme === 'dark' ? '☀' : '☾' }}</button>
    <slot />
  </div>
</template>

<style scoped>
.auth-root {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-shell);
  font-family: 'JetBrains Mono', monospace;
}
.theme-btn {
  position: absolute; top: 18px; right: 18px; z-index: 10;
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  background: var(--bg-input); border: 1px solid var(--bd-standard); border-radius: 4px;
  color: var(--tx-secondary); font-size: 14px; cursor: pointer; line-height: 1;
  transition: border-color 0.15s, color 0.15s;
}
.theme-btn:hover { border-color: #2563eb; color: #60a5fa; }
</style>
