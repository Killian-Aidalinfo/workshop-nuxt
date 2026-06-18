# Design — Docker, CI et déploiement Coolify

**Date :** 2026-06-18  
**Scope :** Dockerfiles pour `apps/web` et `apps/mastra`, CI GitHub Actions avec push vers registry Scaleway déclenché par changement de version, guide de déploiement Coolify.

---

## 1. Dockerfiles

### Approche retenue : Option A — Dockerfiles dans chaque app, contexte de build = racine du repo

Les deux Dockerfiles utilisent le monorepo entier comme contexte de build (`context: .`) pour résoudre les dépendances pnpm workspace. Le fichier Dockerfile est dans le répertoire de chaque app.

### `apps/web/Dockerfile`

Multi-stage build, image de base `node:22-alpine` :

| Stage | Actions |
|---|---|
| `deps` | Installe `pnpm@9`, copie `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml` et `apps/web/package.json`, lance `pnpm install --frozen-lockfile --filter web...` |
| `builder` | Copie les sources `apps/web/`, lance `prisma generate` puis `nuxt build` → produit `.output/` |
| `runner` | `node:22-alpine`, installe `prisma` CLI globalement (pour les migrations post-deploy), copie `.output/` et `apps/web/prisma/schema.prisma`. `NODE_ENV=production`. Port `3000`. |

### `apps/mastra/Dockerfile`

Multi-stage build, même structure :

| Stage | Actions |
|---|---|
| `deps` | Installe `pnpm@9`, copie fichiers workspace, `apps/mastra/package.json`, `pnpm install --filter mastra-app...` |
| `builder` | Copie sources `apps/mastra/`, lance `mastra build` → produit `.mastra/output/` |
| `runner` | `node:22-alpine`, copie le bundle. Port `4111`. |

### Champ `version` dans les `package.json`

Ajouter `"version": "0.1.0"` dans `apps/web/package.json` et `apps/mastra/package.json` — requis par le CI pour le tag Docker et git.

---

## 2. CI GitHub Actions

### Deux workflows indépendants

**`.github/workflows/docker-web.yml`**

- **Trigger :** `push` sur `main`, `paths: apps/web/package.json` + `workflow_dispatch`
- **Registry :** `rg.fr-par.scw.cloud/namespace-cda-devops-cesi`
- **Image name :** dynamique via `${GITHUB_REPOSITORY_OWNER,,}-workshop-web` (lowercase automatique)
- **Étapes :**
  1. Checkout
  2. Setup Buildx
  3. Lire version depuis `apps/web/package.json`
  4. Set image name (lowercase owner)
  5. Login Scaleway avec `${{ secrets.SCW_SECRET_KEY }}`
  6. Vérifier que le git tag `web-v{version}` n'existe pas déjà
  7. Build & push avec `docker/build-push-action@v6` — `context: .`, `file: ./apps/web/Dockerfile`, cache GHA
  8. Tags : `{image}:{version}` et `{image}:latest`
  9. Créer et push le git tag `web-v{version}`

**`.github/workflows/docker-mastra.yml`**

- Identique, avec `paths: apps/mastra/package.json`, image `{owner}-workshop-mastra`, tag git `mastra-v{version}`

### Secret requis

| Secret | Description |
|---|---|
| `SCW_SECRET_KEY` | Clé secrète Scaleway pour le login au registry |

---

## 3. Guide de déploiement Coolify

### Mode de déploiement

**Docker Image** (pas Nixpacks, pas Dockerfile) — Coolify pull l'image depuis le registry Scaleway.

### Étapes

1. Créer une application → **Docker Image**
2. Image : `rg.fr-par.scw.cloud/namespace-cda-devops-cesi/{owner}-workshop-web:latest`
3. Configurer le registry privé Scaleway : URL `rg.fr-par.scw.cloud`, username `nologin`, password = `SCW_SECRET_KEY`
4. Renseigner les variables d'environnement (voir tableau)
5. Port exposé : `3000` (web), `4111` (mastra)
6. **Post-deploy command (web uniquement) :** `prisma migrate deploy --schema /app/prisma/schema.prisma`

### Variables d'environnement — `apps/web`

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/docextract` |
| `BETTER_AUTH_SECRET` | ✅ | Chaîne aléatoire 32 chars min |
| `BETTER_AUTH_URL` | ✅ | URL publique de l'app ex. `https://app.example.com` |
| `NUXT_PUBLIC_APP_URL` | ✅ | URL publique de l'app (même valeur que `BETTER_AUTH_URL`) |
| `NUXT_PUBLIC_MASTRA_URL` | ✅ | URL publique du service mastra |
| `OPENAI_API_KEY` | ⚠️ | Au moins une clé IA requise |
| `MISTRAL_API_KEY` | ⚠️ | Alternative à OpenAI |
| `SCALEWAY_API_KEY` | ⚠️ | Pour OCR Scaleway |
| `DISABLE_REGISTER` | ❌ | `false` par défaut |
| `ADMIN_EMAIL` | ❌ | Pour le script `bootstrap:admin` |
| `ADMIN_PASSWORD` | ❌ | Pour le script `bootstrap:admin` |
| `ADMIN_NAME` | ❌ | Pour le script `bootstrap:admin` |

### Variables d'environnement — `apps/mastra`

| Variable | Obligatoire | Description |
|---|---|---|
| `SCALEWAY_API_KEY` | ✅ | Provider IA principal |
| `OLLAMA_BASE_URL` | ❌ | Alternative locale à Scaleway |

---

## 4. Test local des Dockerfiles

Avant de pusher, tester les deux images en local :

```bash
# Web
docker build -f apps/web/Dockerfile -t workshop-web:local .
docker run --rm -e DATABASE_URL=... -e BETTER_AUTH_SECRET=... -p 3000:3000 workshop-web:local

# Mastra
docker build -f apps/mastra/Dockerfile -t workshop-mastra:local .
docker run --rm -e SCALEWAY_API_KEY=... -p 4111:4111 workshop-mastra:local
```

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `apps/web/Dockerfile` | Créer |
| `apps/mastra/Dockerfile` | Créer |
| `apps/web/package.json` | Ajouter `"version": "0.1.0"` |
| `apps/mastra/package.json` | Ajouter `"version": "0.1.0"` |
| `.github/workflows/docker-web.yml` | Créer |
| `.github/workflows/docker-mastra.yml` | Créer |
| `docs/coolify-deployment-guide.md` | Créer (guide complet pour les élèves) |
