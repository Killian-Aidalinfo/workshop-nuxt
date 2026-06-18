# DocExtract — Cahier des charges

## Vue d'ensemble

Application web de gestion et d'extraction de texte depuis des documents (PDF, images). L'utilisateur uploade un fichier, le visualise à gauche, et récupère le texte extrait par IA à droite pour le copier facilement.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework fullstack | Nuxt 4 (app router, server routes) |
| UI | Nuxt UI v4 |
| Auth | Better Auth (email/password, sessions) |
| Base de données | PostgreSQL (via Prisma ORM) |
| Extraction IA | API OpenAI Vision / Mistral OCR |
| Tests unitaires | Vitest |
| Tests E2E | Playwright |
| Package manager | pnpm (monorepo workspace) |
| Dev infra | Docker Compose (PostgreSQL) |

---

## Structure du monorepo

```
workshop-nuxt/
├── apps/
│   └── web/                  # Application Nuxt 4
│       ├── app/
│       │   ├── components/
│       │   ├── pages/
│       │   └── layouts/
│       ├── server/
│       │   ├── api/
│       │   └── utils/
│       ├── prisma/
│       │   └── schema.prisma
│       ├── tests/
│       │   ├── unit/         # Tests Vitest
│       │   └── e2e/          # Tests Playwright
│       ├── nuxt.config.ts
│       └── package.json
├── packages/                 # Packages partagés futurs
├── docker-compose.yml
├── .env
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

---

## Fonctionnalités

### Authentification (Better Auth)
- Inscription / connexion par email + mot de passe
- Sessions persistantes côté serveur
- Protection des routes : toutes les pages sauf `/login` et `/register` nécessitent une session active
- Déconnexion

### Upload de documents
- Formats acceptés : PDF, PNG, JPG, JPEG, WEBP, TIFF
- Taille maximale : 10 Mo par fichier
- Stockage local en développement (`/uploads` dans `server/`)
- Métadonnées sauvegardées en base (nom, type, taille, date, userId)

### Extraction de texte par IA
- Déclenchée automatiquement après l'upload
- Statuts : `pending` → `processing` → `done` / `error`
- Résultat stocké en base de données (champ texte)
- Possibilité de relancer l'extraction en cas d'erreur

### Interface de visualisation (page principale)
- **Colonne gauche (50 %)** : aperçu du document
  - PDF : rendu page par page via `@tato30/vue-pdf`
  - Image : balise `<img>` native
- **Colonne droite (50 %)** : texte extrait
  - Zone de texte scrollable et sélectionnable
  - Bouton "Copier tout" avec retour visuel
  - Indicateur de chargement pendant l'extraction
- Liste des documents uploadés (sidebar ou liste en haut)

---

## Modèle de données (Prisma + PostgreSQL)

### Table `users`
Gérée par Better Auth (email, password hash, createdAt…)

### Table `documents`
```prisma
model Document {
  id            String   @id @default(uuid())
  userId        String
  filename      String
  originalName  String
  mimeType      String
  size          Int
  status        DocumentStatus @default(pending)
  extractedText String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
}

enum DocumentStatus {
  pending
  processing
  done
  error
}
```

---

## API Server (Nuxt server routes)

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload d'un fichier, création en base |
| GET | `/api/documents` | Liste des documents de l'utilisateur connecté |
| GET | `/api/documents/:id` | Détail d'un document |
| DELETE | `/api/documents/:id` | Suppression |
| POST | `/api/documents/:id/extract` | Relancer l'extraction |

---

## Variables d'environnement

```env
# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docextract

# Auth
BETTER_AUTH_SECRET=changeme
BETTER_AUTH_URL=http://localhost:3000

# IA (choisir l'un)
OPENAI_API_KEY=
MISTRAL_API_KEY=

# App
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Infrastructure de développement (Docker Compose)

Service PostgreSQL exposé sur le port `5432` avec persistence via volume nommé.

---

## Tests unitaires (Vitest)

Cibles prioritaires :
- Fonctions de service (`server/utils/`) : validation des types de fichiers, calcul de taille, formatage du texte extrait
- Logique métier des composables (`useDocuments`, `useAuth`)
- Helpers et utils purs

## Tests E2E (Playwright)

Scénarios à couvrir :
1. **Auth** : inscription, connexion, déconnexion, redirection si non connecté
2. **Upload** : upload d'un PDF valide, upload d'un fichier non supporté (erreur attendue)
3. **Visualisation** : après upload, la colonne gauche affiche le document et la droite le texte extrait
4. **Copie** : le bouton "Copier" déclenche bien la copie dans le presse-papier

---

## Contraintes et conventions

- TypeScript strict partout
- Pas de `any` explicite
- Composants nommés en PascalCase, fichiers en kebab-case
- Server routes validées avec `zod`
- Migrations Prisma versionnées dans `prisma/migrations/`
- `.env` non commité (dans `.gitignore`), `.env.example` commité
