<script setup lang="ts">
definePageMeta({ layout: 'auth', ssr: false })

const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  const result = await signIn(email.value, password.value)
  loading.value = false
  if (result.error) {
    error.value = result.error.message ?? 'Erreur de connexion'
  } else {
    await navigateTo('/')
  }
}
</script>

<template>
  <div class="split">
    <!-- Left: branded panel + terminal -->
    <div class="brand">
      <div class="logo-row">
        <div class="logo-box">C</div>
        <div>
          <div class="logo-cesi">CESI</div>
          <div class="logo-sub">École d'ingénieurs</div>
        </div>
      </div>

      <div>
        <div class="kicker">workshop · nuxt</div>
        <div class="title">Doc<span class="accent">Extract</span></div>
        <div class="tagline">Extraction de texte par OCR depuis<br>des fichiers PDF &amp; images.</div>

        <div class="terminal">
          <div class="term-bar">
            <div class="dot" style="background:#ef4444;"></div>
            <div class="dot" style="background:#f59e0b;"></div>
            <div class="dot" style="background:#22c55e;"></div>
            <span class="term-title">workshop-nuxt — zsh</span>
          </div>
          <div class="term-body">
            <div><span class="t-prompt">$</span> <span class="t-cmd">nuxt start</span></div>
            <div class="t-ok" style="padding-left:2px;">  ✓ Ready on http://localhost:3000</div>
            <div style="height:4px;"></div>
            <div><span class="t-prompt">$</span> <span class="t-cmd">POST /api/documents/upload</span></div>
            <div class="t-dim" style="padding-left:18px;">    file: rapport_2024.pdf</div>
            <div class="t-dim2" style="padding-left:4px;">  › Processing document...</div>
            <div class="t-dim2" style="padding-left:4px;">  › Running OCR engine...</div>
            <div class="t-ok" style="padding-left:4px;">  ✓ 847 tokens extracted</div>
            <div class="t-ok" style="padding-left:4px;">  ✓ Language: fr · confidence: 98.2%</div>
            <div style="height:4px;"></div>
            <div style="display:flex; align-items:center; gap:6px;"><span class="t-prompt">$</span><span class="cursor"></span></div>
          </div>
        </div>
      </div>

      <div class="copyright">© 2024 CESI · Workshop Nuxt · OCR</div>
    </div>

    <!-- Right: form -->
    <div class="form-panel">
      <div class="form-inner">
        <div class="form-kicker">// connexion</div>
        <div class="form-title">Bon retour.</div>
        <div class="form-desc">Connectez-vous à votre espace DocExtract.</div>

        <form @submit.prevent="handleLogin">
          <div style="margin-bottom:18px;">
            <label class="field-label">&gt;_ email</label>
            <input
              v-model="email"
              type="email"
              placeholder="prenom.nom@cesi.fr"
              data-testid="login-email"
              required
              class="field"
            >
          </div>
          <div style="margin-bottom:30px;">
            <label class="field-label">&gt;_ mot de passe</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••••"
              data-testid="login-password"
              required
              class="field"
            >
          </div>

          <p v-if="error" class="err" data-testid="login-error">{{ error }}</p>

          <button type="submit" class="submit" :disabled="loading" data-testid="login-submit">
            {{ loading ? '$ connexion…' : '$ connexion →' }}
          </button>
        </form>

        <div class="switch">
          Pas encore de compte ?
          <NuxtLink to="/register" class="switch-link">Inscription →</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.split { display: flex; height: 100vh; }

.brand {
  flex: 0 0 46%;
  background: var(--bg-shell);
  padding: 52px 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--bd-subtle);
}
.logo-row { display: flex; align-items: center; gap: 10px; }
.logo-box {
  width: 30px; height: 30px; background: #2563eb; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.logo-cesi { font-size: 12px; font-weight: 600; color: var(--tx-primary); letter-spacing: 0.08em; }
.logo-sub  { font-size: 10px; color: var(--tx-label); letter-spacing: 0.04em; }

.kicker {
  font-size: 10px; font-weight: 700; color: var(--tx-muted);
  letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 18px;
}
.title { font-size: 40px; font-weight: 700; color: var(--tx-h1); line-height: 1.0; margin-bottom: 14px; letter-spacing: -0.02em; }
.accent { color: #2563eb; }
.tagline { font-size: 13px; color: var(--tx-label); line-height: 1.9; margin-bottom: 44px; }

.terminal { background: #020508; border: 1px solid #0d1624; border-radius: 8px; overflow: hidden; }
.term-bar {
  display: flex; align-items: center; gap: 6px; padding: 9px 14px;
  background: #04080f; border-bottom: 1px solid #0d1624;
}
.dot { width: 10px; height: 10px; border-radius: 50%; opacity: 0.55; }
.term-title { flex: 1; text-align: center; font-size: 10px; color: #1a2d45; letter-spacing: 0.04em; }
.term-body { padding: 18px 20px; font-size: 11.5px; line-height: 2.1; }
.t-prompt { color: #1e3a5f; }
.t-cmd { color: #3d6090; }
.t-ok { color: #22c55e; }
.t-dim { color: #1e3a5f; }
.t-dim2 { color: #2a4060; }
.cursor {
  display: inline-block; width: 7px; height: 13px; background: #2563eb;
  margin-left: 4px; vertical-align: middle; animation: blink 1s step-end infinite;
}
.copyright { font-size: 10px; color: var(--tx-footer); }

.form-panel { flex: 1; background: var(--bg-panel); display: flex; align-items: center; justify-content: center; }
.form-inner { width: 100%; max-width: 380px; padding: 0 44px; animation: slideUp 0.35s ease; }
.form-kicker {
  font-size: 9px; font-weight: 700; color: var(--tx-muted);
  letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 14px;
}
.form-title { font-size: 28px; font-weight: 700; color: var(--tx-h1); margin-bottom: 6px; letter-spacing: -0.02em; }
.form-desc { font-size: 12px; color: var(--tx-label); margin-bottom: 38px; line-height: 1.6; }

.field-label {
  display: block; font-size: 9px; color: var(--tx-label); font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;
}
.field {
  width: 100%; padding: 11px 14px; background: var(--bg-input);
  border: 1px solid var(--bd-standard); border-radius: 4px;
  color: var(--tx-input); font-size: 13px; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.field:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

.err {
  font-size: 11px; color: #f87171; margin-bottom: 16px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 4px; padding: 9px 12px;
}
.submit {
  width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 0.04em;
  transition: background 0.15s;
}
.submit:hover:not(:disabled) { background: #1d4ed8; }
.submit:disabled { opacity: 0.7; cursor: default; }

.switch { margin-top: 26px; text-align: center; font-size: 12px; color: var(--tx-muted); }
.switch-link { color: #2563eb; margin-left: 6px; text-decoration: none; }
.switch-link:hover { color: #60a5fa; }
</style>
