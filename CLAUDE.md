# CLAUDE.md — DocExtract

## Projet

Application fullstack de gestion et d'extraction de texte depuis des documents (PDF, images). L'utilisateur uploade un fichier, le visualise à gauche, et récupère le texte extrait par IA à droite.

## Stack

- **Framework** : Nuxt 4 (app router + server routes)
- **UI** : Nuxt UI v4
- **Auth** : Better Auth (email/password)
- **BDD** : PostgreSQL via Prisma ORM
- **Extraction IA** : OpenAI Vision ou Mistral OCR
- **Tests unitaires** : Vitest
- **Tests E2E** : Playwright
- **Package manager** : pnpm monorepo workspace
- **Dev infra** : Docker Compose (PostgreSQL sur port 5432)

## Structure

```
workshop-nuxt/
├── apps/web/
│   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── layouts/
│   ├── server/
│   │   ├── api/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── tests/
│   │   ├── unit/
│   │   └── e2e/
├── packages/
├── docker-compose.yml
├── .env / .env.example
└── pnpm-workspace.yaml
```

## Règles clean code

### Taille des fichiers
- **400 lignes maximum** par fichier — si tu dépasses, découpe en modules/composants
- **1 responsabilité par fichier** : un composant = une UI, une route = un endpoint, un util = une fonction ou famille de fonctions liées
- Les pages Nuxt ne contiennent pas de logique métier — elle va dans des composables ou des utils

### Fonctions et composants
- **50 lignes maximum** par fonction ou méthode
- **3 niveaux d'imbrication maximum** (if dans if dans for = déjà trop)
- Pas de fonction avec plus de **4 paramètres** — utilise un objet si besoin
- Un composant Vue fait une seule chose. Si le `<template>` dépasse 80 lignes, extrais des sous-composants

### Nommage
- Composants Vue : **PascalCase** (`DocumentViewer.vue`, `ExtractedTextPanel.vue`)
- Fichiers pages/routes/utils : **kebab-case** (`document-viewer.ts`, `upload.post.ts`)
- Variables et fonctions : **camelCase**, noms explicites (`extractedText`, pas `txt`)
- Booléens préfixés : `isLoading`, `hasError`, `canUpload`
- Évite les abréviations sauf standards (`id`, `url`, `api`)

### TypeScript
- **Strict mode activé**, zéro `any` explicite
- Pas de `as unknown as X` sauf cas extrême documenté
- Types et interfaces dans des fichiers dédiés si réutilisés entre modules
- Les server routes Nuxt sont validées avec **zod** avant tout traitement

### Composables et utils
- Un composable = un domaine (`useDocuments`, `useAuth`)
- Les appels `$fetch` / `useFetch` sont encapsulés dans des composables, jamais directement dans les pages
- Les utils purs (sans état) vont dans `server/utils/` ou `app/utils/`

### Gestion d'erreurs
- Toutes les server routes retournent des erreurs via `createError({ statusCode, statusMessage })`
- Côté client, les erreurs sont capturées et affichées via les composants Nuxt UI (toast, alert)
- Pas de `console.log` en production — utilise `useLogger` ou les logs serveur Nitro

### Base de données (Prisma)
- Le client Prisma est instancié **une seule fois** dans `server/utils/prisma.ts`
- Pas de requêtes Prisma directement dans les routes — passe par des fonctions de service dans `server/utils/`
- Les migrations sont générées avec `prisma migrate dev`, jamais éditées manuellement

### Tests unitaires (Vitest)
- Cibles : fonctions de service dans `server/utils/`, composables, helpers et utils purs
- Un fichier de test par module testé, colocalisé dans `tests/unit/`
- Pas de mock de la base de données — teste la logique pure, isole les effets de bord
- Nommage : `describe('nomDuModule')` + `it('should ...')` en anglais

### Tests E2E (Playwright)
- Chaque scénario est indépendant (pas de dépendance entre tests)
- Les tests créent leurs propres données, ne partagent pas d'état global
- Les sélecteurs utilisent `data-testid` plutôt que des classes CSS ou du texte

### Git
- `.env` dans `.gitignore`, seul `.env.example` est commité
- Pas de fichiers générés (`node_modules`, `.nuxt`, `dist`, `prisma/migrations` auto) hors `.gitignore`

## Variables d'environnement

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docextract
BETTER_AUTH_SECRET=changeme
BETTER_AUTH_URL=http://localhost:3000
OPENAI_API_KEY=
MISTRAL_API_KEY=
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

## Commandes utiles

```bash
# Démarrer la BDD
docker compose up -d

# Installer les dépendances
pnpm install

# Migrations Prisma
pnpm --filter web prisma migrate dev

# Dev
pnpm --filter web dev

# Tests unitaires
pnpm --filter web test:unit

# Tests E2E
pnpm --filter web test:e2e
```
