<script setup lang="ts">
definePageMeta({ layout: 'auth', ssr: false })

const { signUp } = useAuth()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  loading.value = true
  error.value = ''
  const result = await signUp(email.value, password.value, name.value)
  loading.value = false
  if (result.error) {
    error.value = result.error.message ?? "Erreur lors de l'inscription"
  } else {
    await navigateTo('/')
  }
}
</script>

<template>
  <div class="split">
    <!-- Left: branded panel + feature badges -->
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
        <div class="tagline" style="margin-bottom:40px;">Upload un fichier, l'OCR extrait<br>le texte automatiquement.</div>

        <div class="features">
          <div class="feature">
            <span class="badge badge-pdf">PDF</span>
            <span class="feature-text">Documents PDF multi-pages</span>
          </div>
          <div class="feature">
            <span class="badge badge-img">IMG</span>
            <span class="feature-text">PNG, JPG, WEBP, TIFF</span>
          </div>
          <div class="feature">
            <span class="badge badge-ocr">OCR</span>
            <span class="feature-text">Extraction haute précision</span>
          </div>
        </div>
      </div>

      <div class="copyright">© 2024 CESI · Workshop Nuxt · OCR</div>
    </div>

    <!-- Right: form -->
    <div class="form-panel">
      <div class="form-inner">
        <div class="form-kicker">// nouveau compte</div>
        <div class="form-title">Inscription.</div>
        <div class="form-desc">Créez votre compte pour commencer.</div>

        <form @submit.prevent="handleRegister">
          <div style="margin-bottom:16px;">
            <label class="field-label">&gt;_ nom complet</label>
            <input
              v-model="name"
              type="text"
              placeholder="Jean Dupont"
              data-testid="register-name"
              required
              class="field"
            >
          </div>
          <div style="margin-bottom:16px;">
            <label class="field-label">&gt;_ email</label>
            <input
              v-model="email"
              type="email"
              placeholder="prenom.nom@cesi.fr"
              data-testid="register-email"
              required
              class="field"
            >
          </div>
          <div style="margin-bottom:28px;">
            <label class="field-label">&gt;_ mot de passe</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••••"
              data-testid="register-password"
              required
              class="field"
            >
          </div>

          <p v-if="error" class="err" data-testid="register-error">{{ error }}</p>

          <button type="submit" class="submit" :disabled="loading" data-testid="register-submit">
            {{ loading ? '$ création…' : '$ créer mon compte →' }}
          </button>
        </form>

        <div class="switch">
          Déjà un compte ?
          <NuxtLink to="/login" class="switch-link">Connexion →</NuxtLink>
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
.tagline { font-size: 13px; color: var(--tx-label); line-height: 1.9; }

.features { display: flex; flex-direction: column; gap: 14px; }
.feature { display: flex; align-items: center; gap: 12px; }
.badge {
  font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 3px;
  flex-shrink: 0; letter-spacing: 0.04em;
}
.badge-pdf { background: rgba(239,68,68,0.12); color: #f87171; }
.badge-img { background: rgba(37,99,235,0.12); color: #60a5fa; }
.badge-ocr { background: rgba(34,197,94,0.12); color: #4ade80; }
.feature-text { font-size: 12px; color: var(--tx-label); }
.copyright { font-size: 10px; color: var(--tx-footer); }

.form-panel { flex: 1; background: var(--bg-panel); display: flex; align-items: center; justify-content: center; }
.form-inner { width: 100%; max-width: 380px; padding: 0 44px; animation: slideUp 0.35s ease; }
.form-kicker {
  font-size: 9px; font-weight: 700; color: var(--tx-muted);
  letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 14px;
}
.form-title { font-size: 28px; font-weight: 700; color: var(--tx-h1); margin-bottom: 6px; letter-spacing: -0.02em; }
.form-desc { font-size: 12px; color: var(--tx-label); margin-bottom: 36px; line-height: 1.6; }

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
