# Docker / CI / Coolify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dockeriser les deux apps du monorepo, publier les images sur le registry Scaleway via GitHub Actions déclenché par changement de version, et fournir un guide de déploiement Coolify.

**Architecture:** Deux Dockerfiles multi-stage avec le contexte de build à la racine du monorepo pnpm. Deux workflows GitHub Actions indépendants, chacun déclenché par le changement de `apps/*/package.json` sur `main`. Le nom de l'image est construit dynamiquement depuis `GITHUB_REPOSITORY_OWNER` (lowercased).

**Tech Stack:** Docker multi-stage, pnpm 11 workspaces, Nuxt 4, Mastra build, Prisma 6 CLI, GitHub Actions `docker/build-push-action@v6`, Scaleway Container Registry.

## Global Constraints

- Image de base : `node:22-alpine` pour tous les stages builder et runner
- pnpm version : `11` (correspond à la version locale `11.1.2`)
- Contexte Docker : toujours la racine du repo (`.`)
- Registry : `rg.fr-par.scw.cloud/namespace-cda-devops-cesi`
- Noms d'images : `${GITHUB_REPOSITORY_OWNER,,}-workshop-web` et `${GITHUB_REPOSITORY_OWNER,,}-workshop-mastra`
- Tags git : préfixés `web-v` et `mastra-v` pour éviter les collisions
- Port web : `3000`, port mastra : `4111`
- Post-deploy migration (Coolify) : `prisma migrate deploy --schema /app/prisma/schema.prisma`
- `prisma@6` CLI installé globalement dans le runner web (pour la commande post-deploy Coolify)

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `.dockerignore` | Créer | Exclure node_modules, .nuxt, .output, .mastra/output du contexte |
| `apps/web/package.json` | Modifier | Ajouter `"version": "0.1.0"` |
| `apps/mastra/package.json` | Modifier | Ajouter `"version": "0.1.0"` |
| `apps/web/Dockerfile` | Créer | Multi-stage build Nuxt 4 + Prisma |
| `apps/mastra/Dockerfile` | Créer | Multi-stage build Mastra |
| `.github/workflows/docker-web.yml` | Créer | CI build+push image web |
| `.github/workflows/docker-mastra.yml` | Créer | CI build+push image mastra |
| `docs/coolify-deployment-guide.md` | Créer | Guide élèves pour déployer sur Coolify |

---

## Task 1: .dockerignore + champs version

**Files:**
- Create: `.dockerignore`
- Modify: `apps/web/package.json`
- Modify: `apps/mastra/package.json`

**Interfaces:**
- Produces: les deux `package.json` exposent un champ `version` lisible par `node -p "require('./apps/web/package.json').version"`

- [ ] **Step 1: Créer `.dockerignore` à la racine**

```
**/node_modules
**/.nuxt
**/.output
**/.mastra/output
**/dist
**/.env
**/.env.*
!**/.env.example
```

Fichier : `.dockerignore` à la racine du repo.

- [ ] **Step 2: Ajouter `version` dans `apps/web/package.json`**

Insérer après `"private": true,` :

```json
"version": "0.1.0",
```

- [ ] **Step 3: Ajouter `version` dans `apps/mastra/package.json`**

Insérer après `"private": true,` :

```json
"version": "0.1.0",
```

- [ ] **Step 4: Vérifier que node peut lire les versions**

```bash
node -p "require('./apps/web/package.json').version"
# Expected: 0.1.0
node -p "require('./apps/mastra/package.json').version"
# Expected: 0.1.0
```

- [ ] **Step 5: Commit**

```bash
git add .dockerignore apps/web/package.json apps/mastra/package.json
git commit -m "chore: add version field and .dockerignore"
```

---

## Task 2: Dockerfile pour apps/web

**Files:**
- Create: `apps/web/Dockerfile`

**Interfaces:**
- Consumes: racine du repo comme contexte de build (`context: .`)
- Produces: image Docker exposant le port `3000`, avec `prisma` CLI disponible globalement et `prisma/schema.prisma` dans `/app/prisma/`

- [ ] **Step 1: Créer `apps/web/Dockerfile`**

```dockerfile
ARG NODE_VERSION=22-alpine

# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN npm install -g pnpm@11

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mastra/package.json ./apps/mastra/package.json
RUN mkdir -p packages && pnpm install --frozen-lockfile --filter web...

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/web/ ./apps/web/
RUN pnpm --filter web exec prisma generate
RUN pnpm --filter web build

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN npm install -g prisma@6
COPY --from=builder /app/apps/web/.output ./.output
COPY --from=builder /app/apps/web/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/Dockerfile
git commit -m "feat: add Dockerfile for apps/web"
```

---

## Task 3: Dockerfile pour apps/mastra

**Files:**
- Create: `apps/mastra/Dockerfile`

**Interfaces:**
- Consumes: racine du repo comme contexte de build
- Produces: image Docker exposant le port `4111`, `CMD ["node", "index.mjs"]` depuis le bundle `.mastra/output/`

- [ ] **Step 1: Créer `apps/mastra/Dockerfile`**

```dockerfile
ARG NODE_VERSION=22-alpine

# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN npm install -g pnpm@11

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/mastra/package.json ./apps/mastra/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN mkdir -p packages && pnpm install --frozen-lockfile --filter mastra-app...

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/mastra/ ./apps/mastra/
RUN pnpm --filter mastra-app build

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
COPY --from=builder /app/apps/mastra/.mastra/output ./
ENV NODE_ENV=production
EXPOSE 4111
CMD ["node", "index.mjs"]
```

- [ ] **Step 2: Commit**

```bash
git add apps/mastra/Dockerfile
git commit -m "feat: add Dockerfile for apps/mastra"
```

---

## Task 4: Test local — image web

**Files:** aucun fichier modifié — test uniquement

- [ ] **Step 1: Build l'image web depuis la racine**

```bash
docker build -f apps/web/Dockerfile -t workshop-web:local .
# Expected: BUILD SUCCESS — "writing image sha256:..."
```

Si le build échoue sur `prisma generate` : vérifier que `apps/web/prisma/schema.prisma` est bien copié dans le stage builder.

Si le build échoue sur `pnpm install --frozen-lockfile` : vérifier que `apps/mastra/package.json` est copié dans le stage deps (nécessaire pour valider le lockfile workspace).

- [ ] **Step 2: Lancer le container et vérifier le démarrage**

```bash
docker run --rm \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/docextract \
  -e BETTER_AUTH_SECRET=test-secret-32-chars-minimum-here \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -e NUXT_PUBLIC_APP_URL=http://localhost:3000 \
  -e NUXT_PUBLIC_MASTRA_URL=http://localhost:4111 \
  -p 3000:3000 \
  workshop-web:local
# Expected: "Nitro server started" sur le port 3000
```

- [ ] **Step 3: Vérifier que prisma CLI est disponible dans le container**

```bash
docker run --rm workshop-web:local prisma --version
# Expected: prisma version 6.x.x
```

---

## Task 5: Test local — image mastra

**Files:** aucun fichier modifié — test uniquement

- [ ] **Step 1: Build l'image mastra depuis la racine**

```bash
docker build -f apps/mastra/Dockerfile -t workshop-mastra:local .
# Expected: BUILD SUCCESS
```

Si le build échoue sur `mastra build` : vérifier que `apps/mastra/src/` est bien dans le contexte (pas exclu par `.dockerignore`).

- [ ] **Step 2: Lancer le container et vérifier le démarrage**

```bash
docker run --rm \
  -e SCALEWAY_API_KEY=dummy-key-for-start-test \
  -p 4111:4111 \
  workshop-mastra:local
# Expected: serveur Mastra démarré sur le port 4111 (logs de démarrage Mastra)
```

---

## Task 6: GitHub Actions — docker-web.yml

**Files:**
- Create: `.github/workflows/docker-web.yml`

**Interfaces:**
- Consumes: secret `SCW_SECRET_KEY` dans GitHub, champ `version` dans `apps/web/package.json`
- Produces: image `{owner}-workshop-web:{version}` + `{owner}-workshop-web:latest` dans le registry Scaleway, git tag `web-v{version}`

- [ ] **Step 1: Créer `.github/workflows/docker-web.yml`**

```yaml
name: Docker — web

on:
  push:
    branches: [main]
    paths:
      - apps/web/package.json
  workflow_dispatch:

env:
  REGISTRY: rg.fr-par.scw.cloud/namespace-cda-devops-cesi

jobs:
  build:
    name: Build & push
    runs-on: ubuntu-24.04
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - name: Set image name
        run: echo "IMAGE=${GITHUB_REPOSITORY_OWNER,,}-workshop-web" >> "$GITHUB_ENV"

      - name: Read version
        id: version
        run: echo "version=$(node -p "require('./apps/web/package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Login to registry
        env:
          SCW_SECRET_KEY: ${{ secrets.SCW_SECRET_KEY }}
        run: docker login ${{ env.REGISTRY }} -u nologin -p "$SCW_SECRET_KEY"

      - name: Ensure git tag does not already exist
        timeout-minutes: 2
        run: |
          VERSION="${{ steps.version.outputs.version }}"
          if git ls-remote --exit-code --tags origin "refs/tags/web-v$VERSION" > /dev/null 2>&1; then
            echo "::error::Le tag git web-v$VERSION existe déjà. Incrémente la version dans apps/web/package.json."
            exit 1
          fi
          echo "Version $VERSION disponible, build en cours."

      - name: Build & push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./apps/web/Dockerfile
          platforms: linux/amd64
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE }}:${{ steps.version.outputs.version }}
            ${{ env.REGISTRY }}/${{ env.IMAGE }}:latest
          cache-from: type=gha,scope=${{ env.IMAGE }}
          cache-to: type=gha,mode=max,scope=${{ env.IMAGE }}

      - name: Create and push git tag
        run: |
          TAG="web-v${{ steps.version.outputs.version }}"
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag -a "$TAG" -m "Release $TAG"
          git push origin "$TAG"
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/docker-web.yml
git commit -m "ci: add Docker build workflow for web"
```

---

## Task 7: GitHub Actions — docker-mastra.yml

**Files:**
- Create: `.github/workflows/docker-mastra.yml`

**Interfaces:**
- Consumes: secret `SCW_SECRET_KEY`, champ `version` dans `apps/mastra/package.json`
- Produces: image `{owner}-workshop-mastra:{version}` + `:latest`, git tag `mastra-v{version}`

- [ ] **Step 1: Créer `.github/workflows/docker-mastra.yml`**

```yaml
name: Docker — mastra

on:
  push:
    branches: [main]
    paths:
      - apps/mastra/package.json
  workflow_dispatch:

env:
  REGISTRY: rg.fr-par.scw.cloud/namespace-cda-devops-cesi

jobs:
  build:
    name: Build & push
    runs-on: ubuntu-24.04
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - name: Set image name
        run: echo "IMAGE=${GITHUB_REPOSITORY_OWNER,,}-workshop-mastra" >> "$GITHUB_ENV"

      - name: Read version
        id: version
        run: echo "version=$(node -p "require('./apps/mastra/package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Login to registry
        env:
          SCW_SECRET_KEY: ${{ secrets.SCW_SECRET_KEY }}
        run: docker login ${{ env.REGISTRY }} -u nologin -p "$SCW_SECRET_KEY"

      - name: Ensure git tag does not already exist
        timeout-minutes: 2
        run: |
          VERSION="${{ steps.version.outputs.version }}"
          if git ls-remote --exit-code --tags origin "refs/tags/mastra-v$VERSION" > /dev/null 2>&1; then
            echo "::error::Le tag git mastra-v$VERSION existe déjà. Incrémente la version dans apps/mastra/package.json."
            exit 1
          fi
          echo "Version $VERSION disponible, build en cours."

      - name: Build & push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./apps/mastra/Dockerfile
          platforms: linux/amd64
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE }}:${{ steps.version.outputs.version }}
            ${{ env.REGISTRY }}/${{ env.IMAGE }}:latest
          cache-from: type=gha,scope=${{ env.IMAGE }}
          cache-to: type=gha,mode=max,scope=${{ env.IMAGE }}

      - name: Create and push git tag
        run: |
          TAG="mastra-v${{ steps.version.outputs.version }}"
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag -a "$TAG" -m "Release $TAG"
          git push origin "$TAG"
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/docker-mastra.yml
git commit -m "ci: add Docker build workflow for mastra"
```

---

## Task 8: Guide de déploiement Coolify

**Files:**
- Create: `docs/coolify-deployment-guide.md`

- [ ] **Step 1: Créer `docs/coolify-deployment-guide.md`**

```markdown
# Guide de déploiement — Coolify

Ce guide explique comment déployer les applications `web` et `mastra` sur Coolify
en utilisant les images Docker publiées automatiquement par le CI.

## Prérequis

- Avoir forké le repo et configuré le secret `SCW_SECRET_KEY` dans GitHub
  (Settings → Secrets → Actions → New repository secret)
- Avoir pushé sur `main` après avoir incrémenté la version dans `apps/web/package.json`
  pour déclencher le build CI
- Avoir accès à une instance Coolify avec une base PostgreSQL disponible

---

## 1. Configurer le registry privé Scaleway

Dans Coolify → **Sources** → **Container Registry** → Ajouter :

| Champ | Valeur |
|---|---|
| URL | `rg.fr-par.scw.cloud` |
| Username | `nologin` |
| Password | Ta clé secrète Scaleway (`SCW_SECRET_KEY`) |

---

## 2. Déployer apps/web

### Créer l'application

1. Coolify → **New Resource** → **Docker Image**
2. Image : `rg.fr-par.scw.cloud/namespace-cda-devops-cesi/<TON_USERNAME_GITHUB_LOWERCASE>-workshop-web:latest`
3. Registry : sélectionner le registry Scaleway configuré à l'étape 1
4. Port exposé : `3000`

### Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/docextract` |
| `BETTER_AUTH_SECRET` | ✅ | Chaîne aléatoire 32 chars min (ex: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | ✅ | URL publique de l'app ex. `https://app.mondomaine.fr` |
| `NUXT_PUBLIC_APP_URL` | ✅ | Même valeur que `BETTER_AUTH_URL` |
| `NUXT_PUBLIC_MASTRA_URL` | ✅ | URL publique du service mastra ex. `https://mastra.mondomaine.fr` |
| `OPENAI_API_KEY` | ⚠️ | Au moins une clé IA requise |
| `MISTRAL_API_KEY` | ⚠️ | Alternative à OpenAI |
| `SCALEWAY_API_KEY` | ⚠️ | Pour OCR Scaleway |
| `DISABLE_REGISTER` | ❌ | `false` par défaut — mettre `true` pour désactiver l'inscription |
| `ADMIN_EMAIL` | ❌ | Email admin pour `bootstrap:admin` |
| `ADMIN_PASSWORD` | ❌ | Mot de passe admin |
| `ADMIN_NAME` | ❌ | Nom affiché pour l'admin |

### Post-deploy command (migration Prisma)

Dans Coolify → onglet **General** → **Post-deploy command** :

```
prisma migrate deploy --schema /app/prisma/schema.prisma
```

Cette commande s'exécute après chaque déploiement et applique les migrations
en attente sans recréer les données existantes.

---

## 3. Déployer apps/mastra

### Créer l'application

1. Coolify → **New Resource** → **Docker Image**
2. Image : `rg.fr-par.scw.cloud/namespace-cda-devops-cesi/<TON_USERNAME_GITHUB_LOWERCASE>-workshop-mastra:latest`
3. Registry : sélectionner le registry Scaleway
4. Port exposé : `4111`

### Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `SCALEWAY_API_KEY` | ✅ | Clé API Scaleway pour le provider IA |
| `OLLAMA_BASE_URL` | ❌ | Alternative locale ex. `http://host:11434/v1` |

---

## 4. Vérifier le déploiement

- `apps/web` : ouvrir `https://ton-domaine.fr` → page de login visible
- `apps/mastra` : ouvrir `https://mastra.ton-domaine.fr/api` → réponse JSON de l'API Mastra

---

## 5. Déclencher un nouveau déploiement

Incrémenter la version dans `apps/web/package.json` (ex: `0.1.0` → `0.2.0`),
committer et pusher sur `main`. Le CI construit la nouvelle image, la pousse
avec le nouveau tag et `latest`, puis Coolify redéploie automatiquement.
```

- [ ] **Step 2: Commit**

```bash
git add docs/coolify-deployment-guide.md
git commit -m "docs: add Coolify deployment guide"
```
