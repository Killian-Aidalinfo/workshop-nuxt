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
