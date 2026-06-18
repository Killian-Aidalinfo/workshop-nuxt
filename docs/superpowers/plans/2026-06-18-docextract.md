# DocExtract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullstack Nuxt 4 monorepo application where authenticated users upload PDF/images, view them on the left and read AI-extracted text on the right.

**Architecture:** pnpm monorepo with `apps/web` (Nuxt 4). Better Auth handles sessions via Prisma adapter on PostgreSQL (Docker Compose). Files stored locally under `uploads/`. AI extraction (OpenAI Vision for images, pdf-parse for PDFs) triggered server-side after upload, status tracked in DB. Split-view UI built with Nuxt UI + @tato30/vue-pdf.

**Tech Stack:** Nuxt 4 (`future.compatibilityVersion: 4`), @nuxt/ui (latest), better-auth, Prisma + PostgreSQL, OpenAI SDK, pdf-parse, Vitest, Playwright, pnpm workspaces, TypeScript strict, Zod.

## Global Constraints

- pnpm monorepo: `pnpm-workspace.yaml` at root, `apps/web`, `packages/` (empty)
- Nuxt 4 app directory structure: source in `app/`, server stays at `server/`
- TypeScript strict mode, zero `any`
- All server routes validated with Zod before any logic
- Files max 400 lines, functions max 50 lines, Vue templates max 80 lines
- Prisma client singleton in `server/utils/prisma.ts` (globalThis pattern)
- No Prisma calls directly in routes — use service functions in `server/utils/documents.ts`
- Vitest for unit tests (`tests/unit/`), Playwright for E2E (`tests/e2e/`)
- `data-testid` on all interactive UI elements
- `.env` gitignored, `.env.example` committed
- Root `.env` read by both Docker Compose and Nuxt (via `--env-file` or dotenv)

---

## File Map

```
workshop-nuxt/
├── pnpm-workspace.yaml
├── package.json                          # root: scripts only
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
└── apps/
    └── web/
        ├── package.json
        ├── nuxt.config.ts
        ├── tsconfig.json
        ├── vitest.config.ts
        ├── playwright.config.ts
        ├── prisma/
        │   └── schema.prisma
        ├── app/                          # Nuxt 4 source dir
        │   ├── app.vue
        │   ├── layouts/
        │   │   ├── default.vue
        │   │   └── auth.vue
        │   ├── middleware/
        │   │   └── auth.global.ts
        │   ├── pages/
        │   │   ├── index.vue             # split-view main page
        │   │   ├── login.vue
        │   │   └── register.vue
        │   ├── composables/
        │   │   ├── useAuth.ts
        │   │   └── useDocuments.ts
        │   ├── utils/
        │   │   └── auth-client.ts
        │   └── components/
        │       ├── DocumentList.vue
        │       ├── UploadModal.vue
        │       ├── DocumentViewer.vue
        │       └── ExtractedTextPanel.vue
        ├── server/
        │   ├── utils/
        │   │   ├── prisma.ts             # Prisma singleton
        │   │   ├── auth.ts               # Better Auth instance
        │   │   ├── storage.ts            # file I/O + validation helpers
        │   │   ├── documents.ts          # DB service functions
        │   │   └── extraction.ts         # AI extraction orchestrator
        │   └── api/
        │       ├── auth/
        │       │   └── [...all].ts       # Better Auth catch-all
        │       ├── files/
        │       │   └── [...path].get.ts  # serve uploaded files
        │       └── documents/
        │           ├── index.get.ts
        │           ├── upload.post.ts
        │           ├── [id].get.ts
        │           ├── [id].delete.ts
        │           └── [id]/
        │               └── extract.post.ts
        └── tests/
            ├── unit/
            │   ├── storage.test.ts
            │   └── documents.test.ts
            └── e2e/
                ├── auth.spec.ts
                ├── upload.spec.ts
                └── viewer.spec.ts
```

---

## Task 1: Monorepo + Infrastructure Scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.env`
- Create: `.gitignore`
- Create: `apps/web/.gitkeep`, `packages/.gitkeep`

**Interfaces:**
- Produces: PostgreSQL on `localhost:5432`, db `docextract`, user `postgres`, password `postgres`

- [ ] **Step 1: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "workshop-nuxt",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "test:unit": "pnpm --filter web test:unit",
    "test:e2e": "pnpm --filter web test:e2e",
    "db:migrate": "pnpm --filter web db:migrate",
    "db:generate": "pnpm --filter web db:generate"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: docextract
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 4: Create .env.example**

```env
# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docextract

# Auth
BETTER_AUTH_SECRET=changeme-use-a-random-32-char-string-here
BETTER_AUTH_URL=http://localhost:3000

# IA (au moins une clé requise pour l'extraction sur images)
OPENAI_API_KEY=
MISTRAL_API_KEY=

# App
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 5: Create .env (valeurs développement)**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docextract
BETTER_AUTH_SECRET=dev-secret-please-change-in-production-32ch
BETTER_AUTH_URL=http://localhost:3000
OPENAI_API_KEY=
MISTRAL_API_KEY=
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 6: Create .gitignore**

```gitignore
node_modules/
.nuxt/
.output/
dist/
.env
uploads/
*.log
.DS_Store
```

- [ ] **Step 7: Create directory structure**

```bash
mkdir -p apps/web packages
touch packages/.gitkeep
```

- [ ] **Step 8: Start PostgreSQL and verify**

```bash
docker compose up -d
docker compose ps
```

Expected: postgres container is `healthy`

- [ ] **Step 9: Commit**

```bash
git init
git add pnpm-workspace.yaml package.json docker-compose.yml .env.example .gitignore packages/.gitkeep
git commit -m "chore: monorepo scaffold with Docker Compose"
```

---

## Task 2: Nuxt 4 App Initialization

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/nuxt.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/app/app.vue`

**Interfaces:**
- Produces: `pnpm dev` starts Nuxt on port 3000

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare && prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@nuxt/ui": "latest",
    "@prisma/client": "^6.0.0",
    "@tato30/vue-pdf": "^1.9.0",
    "better-auth": "^1.0.0",
    "nuxt": "latest",
    "openai": "^4.0.0",
    "pdf-parse": "^1.1.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@nuxt/test-utils": "latest",
    "@playwright/test": "^1.45.0",
    "@types/pdf-parse": "^1.1.4",
    "prisma": "^6.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create apps/web/nuxt.config.ts**

```typescript
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-06-01',
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
})
```

- [ ] **Step 3: Create apps/web/tsconfig.json**

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "paths": {
      "~/*": ["./*"]
    }
  }
}
```

- [ ] **Step 4: Create apps/web/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 5: Create apps/web/app/app.vue**

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 6: Install dependencies**

```bash
cd apps/web && pnpm install
```

- [ ] **Step 7: Verify Nuxt starts**

```bash
pnpm dev
```

Expected: `Nuxt 4.x.x ready on http://localhost:3000`

- [ ] **Step 8: Commit**

```bash
git add apps/web/package.json apps/web/nuxt.config.ts apps/web/tsconfig.json apps/web/vitest.config.ts apps/web/app/app.vue
git commit -m "feat: init Nuxt 4 app with Nuxt UI"
```

---

## Task 3: Prisma Schema + Client Singleton

**Files:**
- Create: `apps/web/prisma/schema.prisma`
- Create: `apps/web/server/utils/prisma.ts`

**Interfaces:**
- Produces: `prisma` export from `~/server/utils/prisma` — typed Prisma client

- [ ] **Step 1: Create apps/web/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Better Auth required models
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions  Session[]
  accounts  Account[]
  documents Document[]

  @@map("user")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verification")
}

// App model
model Document {
  id            String         @id @default(cuid())
  userId        String
  filename      String
  originalName  String
  mimeType      String
  size          Int
  status        DocumentStatus @default(pending)
  extractedText String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("document")
}

enum DocumentStatus {
  pending
  processing
  done
  error
}
```

- [ ] **Step 2: Create apps/web/server/utils/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/web
pnpm db:migrate
```

When prompted for migration name: `init`

Expected output:
```
✔ Generated Prisma Client
✔ Applied migration `20260618000000_init`
```

- [ ] **Step 4: Verify Prisma studio opens**

```bash
pnpm db:studio
```

Expected: browser opens at `http://localhost:5555` showing all tables (user, session, account, verification, document)

- [ ] **Step 5: Commit**

```bash
git add apps/web/prisma/ apps/web/server/utils/prisma.ts
git commit -m "feat: Prisma schema with Better Auth tables and Document model"
```

---

## Task 4: Better Auth Server Setup

**Files:**
- Create: `apps/web/server/utils/auth.ts`
- Create: `apps/web/server/api/auth/[...all].ts`

**Interfaces:**
- Produces: `auth` export from `~/server/utils/auth` — Better Auth instance
- Produces: `GET/POST /api/auth/*` — Better Auth endpoints (sign-in, sign-up, sign-out, get-session)

- [ ] **Step 1: Create apps/web/server/utils/auth.ts**

```typescript
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
})
```

- [ ] **Step 2: Create apps/web/server/api/auth/[...all].ts**

```typescript
import { auth } from '~/server/utils/auth'
import { toWebRequest } from 'h3'

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
```

- [ ] **Step 3: Start dev server and verify auth endpoint**

```bash
pnpm dev
```

In a second terminal:
```bash
curl -s http://localhost:3000/api/auth/get-session | jq .
```

Expected: `null` or `{}` (no session yet, no 404)

- [ ] **Step 4: Commit**

```bash
git add apps/web/server/utils/auth.ts apps/web/server/api/auth/
git commit -m "feat: Better Auth server with Prisma adapter"
```

---

## Task 5: Auth Client + Auth Pages + Global Middleware

**Files:**
- Create: `apps/web/app/utils/auth-client.ts`
- Create: `apps/web/app/composables/useAuth.ts`
- Create: `apps/web/app/middleware/auth.global.ts`
- Create: `apps/web/app/layouts/auth.vue`
- Create: `apps/web/app/layouts/default.vue`
- Create: `apps/web/app/pages/login.vue`
- Create: `apps/web/app/pages/register.vue`

**Interfaces:**
- Produces: `useAuth()` composable → `{ session, signIn(email, password), signUp(email, password, name), signOut() }`
- Consumes: `BETTER_AUTH_URL` via `runtimeConfig.public.appUrl`

- [ ] **Step 1: Create apps/web/app/utils/auth-client.ts**

```typescript
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000',
})
```

- [ ] **Step 2: Create apps/web/app/composables/useAuth.ts**

```typescript
import { authClient } from '~/utils/auth-client'

export function useAuth() {
  const session = authClient.useSession()

  async function signIn(email: string, password: string) {
    return authClient.signIn.email({ email, password })
  }

  async function signUp(email: string, password: string, name: string) {
    return authClient.signUp.email({ email, password, name })
  }

  async function signOut() {
    await authClient.signOut()
    await navigateTo('/login')
  }

  return { session, signIn, signUp, signOut }
}
```

- [ ] **Step 3: Create apps/web/app/middleware/auth.global.ts**

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(to.path)) return

  const { data } = await useFetch('/api/auth/get-session', {
    headers: useRequestHeaders(['cookie']),
  })

  if (!(data.value as { user?: unknown } | null)?.user) {
    return navigateTo('/login')
  }
})
```

- [ ] **Step 4: Create apps/web/app/layouts/auth.vue**

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">DocExtract</h1>
        <p class="text-gray-500 mt-2">Extraction de texte par IA</p>
      </div>
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 5: Create apps/web/app/layouts/default.vue**

```vue
<script setup lang="ts">
const { session, signOut } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <header class="border-b bg-white dark:bg-gray-800 px-6 py-3 flex items-center justify-between">
      <span class="font-bold text-lg">DocExtract</span>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">{{ session.data?.user?.email }}</span>
        <UButton
          variant="ghost"
          size="sm"
          data-testid="sign-out-btn"
          @click="signOut"
        >
          Déconnexion
        </UButton>
      </div>
    </header>
    <main class="flex-1 flex overflow-hidden">
      <slot />
    </main>
  </div>
</template>
```

- [ ] **Step 6: Create apps/web/app/pages/login.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const toast = useToast()

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
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">Connexion</h2>
    </template>

    <UForm class="space-y-4" @submit.prevent="handleLogin">
      <UFormField label="Email">
        <UInput
          v-model="email"
          type="email"
          placeholder="you@example.com"
          data-testid="login-email"
          required
        />
      </UFormField>

      <UFormField label="Mot de passe">
        <UInput
          v-model="password"
          type="password"
          placeholder="••••••••"
          data-testid="login-password"
          required
        />
      </UFormField>

      <UAlert v-if="error" color="red" :description="error" />

      <UButton
        type="submit"
        block
        :loading="loading"
        data-testid="login-submit"
      >
        Se connecter
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-gray-500">
        Pas encore de compte ?
        <NuxtLink to="/register" class="text-primary-500">S'inscrire</NuxtLink>
      </p>
    </template>
  </UCard>
</template>
```

- [ ] **Step 7: Create apps/web/app/pages/register.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

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
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">Créer un compte</h2>
    </template>

    <UForm class="space-y-4" @submit.prevent="handleRegister">
      <UFormField label="Nom">
        <UInput
          v-model="name"
          placeholder="Jean Dupont"
          data-testid="register-name"
          required
        />
      </UFormField>

      <UFormField label="Email">
        <UInput
          v-model="email"
          type="email"
          placeholder="you@example.com"
          data-testid="register-email"
          required
        />
      </UFormField>

      <UFormField label="Mot de passe">
        <UInput
          v-model="password"
          type="password"
          placeholder="Min. 8 caractères"
          data-testid="register-password"
          required
        />
      </UFormField>

      <UAlert v-if="error" color="red" :description="error" />

      <UButton
        type="submit"
        block
        :loading="loading"
        data-testid="register-submit"
      >
        Créer le compte
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-gray-500">
        Déjà un compte ?
        <NuxtLink to="/login" class="text-primary-500">Se connecter</NuxtLink>
      </p>
    </template>
  </UCard>
</template>
```

- [ ] **Step 8: Test manually — register then login**

Navigate to `http://localhost:3000/register`, create account, verify redirect to `/`.
Navigate to `http://localhost:3000/login`, sign in with same creds.
Click Déconnexion, verify redirect to `/login`.

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/
git commit -m "feat: Better Auth client, auth pages, global auth middleware"
```

---

## Task 6: Storage Utilities + Unit Tests (TDD)

**Files:**
- Create: `apps/web/server/utils/storage.ts`
- Create: `apps/web/tests/unit/storage.test.ts`

**Interfaces:**
- Produces:
  - `isAllowedMimeType(mimeType: string): boolean`
  - `isFileSizeValid(size: number): boolean`
  - `generateFilename(originalName: string, mimeType: string): string`
  - `saveFile(filename: string, buffer: Buffer): Promise<string>`
  - `deleteFile(filename: string): Promise<void>`
  - `getUploadPath(filename: string): string`
  - `ALLOWED_MIME_TYPES: readonly string[]`
  - `MAX_FILE_SIZE: number` (10 MB)

- [ ] **Step 1: Write failing unit tests**

Create `apps/web/tests/unit/storage.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  isAllowedMimeType,
  isFileSizeValid,
  generateFilename,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '~/server/utils/storage'

describe('isAllowedMimeType', () => {
  it('accepts PDF', () => {
    expect(isAllowedMimeType('application/pdf')).toBe(true)
  })

  it('accepts PNG', () => {
    expect(isAllowedMimeType('image/png')).toBe(true)
  })

  it('accepts JPEG', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true)
  })

  it('accepts WEBP', () => {
    expect(isAllowedMimeType('image/webp')).toBe(true)
  })

  it('accepts TIFF', () => {
    expect(isAllowedMimeType('image/tiff')).toBe(true)
  })

  it('rejects ZIP', () => {
    expect(isAllowedMimeType('application/zip')).toBe(false)
  })

  it('rejects plain text', () => {
    expect(isAllowedMimeType('text/plain')).toBe(false)
  })
})

describe('isFileSizeValid', () => {
  it('accepts file under 10 MB', () => {
    expect(isFileSizeValid(5 * 1024 * 1024)).toBe(true)
  })

  it('accepts file exactly 10 MB', () => {
    expect(isFileSizeValid(MAX_FILE_SIZE)).toBe(true)
  })

  it('rejects file over 10 MB', () => {
    expect(isFileSizeValid(MAX_FILE_SIZE + 1)).toBe(false)
  })
})

describe('generateFilename', () => {
  it('returns a string with the original extension', () => {
    const name = generateFilename('report.pdf', 'application/pdf')
    expect(name).toMatch(/\.pdf$/)
  })

  it('returns unique names for same input', () => {
    const a = generateFilename('doc.png', 'image/png')
    const b = generateFilename('doc.png', 'image/png')
    expect(a).not.toBe(b)
  })

  it('sanitizes special characters from original name', () => {
    const name = generateFilename('my file (1).pdf', 'application/pdf')
    expect(name).not.toContain(' ')
    expect(name).not.toContain('(')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/web && pnpm test:unit
```

Expected: `FAIL tests/unit/storage.test.ts` — "Cannot find module '~/server/utils/storage'"

- [ ] **Step 3: Implement apps/web/server/utils/storage.ts**

```typescript
import { join } from 'path'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

export function isFileSizeValid(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

const EXTENSION_MAP: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/tiff': '.tiff',
}

export function generateFilename(originalName: string, mimeType: string): string {
  const ext = EXTENSION_MAP[mimeType] ?? '.bin'
  const safe = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_')
  return `${randomUUID()}-${safe}${ext}`
}

const UPLOADS_DIR = join(process.cwd(), 'uploads')

async function ensureUploadsDir(): Promise<void> {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true })
  }
}

export async function saveFile(filename: string, buffer: Buffer): Promise<string> {
  await ensureUploadsDir()
  const filepath = join(UPLOADS_DIR, filename)
  await writeFile(filepath, buffer)
  return filepath
}

export async function deleteFile(filename: string): Promise<void> {
  const filepath = join(UPLOADS_DIR, filename)
  await unlink(filepath)
}

export function getUploadPath(filename: string): string {
  return join(UPLOADS_DIR, filename)
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test:unit
```

Expected: all storage tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/server/utils/storage.ts apps/web/tests/unit/storage.test.ts
git commit -m "feat: file storage utilities with Vitest unit tests"
```

---

## Task 7: Document Service + Unit Tests (TDD)

**Files:**
- Create: `apps/web/server/utils/documents.ts`
- Create: `apps/web/tests/unit/documents.test.ts`

**Interfaces:**
- Produces:
  - `createDocument(data: CreateDocumentInput): Promise<Document>`
  - `getDocumentsByUser(userId: string): Promise<Document[]>`
  - `getDocumentById(id: string, userId: string): Promise<Document | null>`
  - `updateDocumentStatus(id: string, status: DocumentStatus, extractedText?: string): Promise<Document>`
  - `deleteDocument(id: string, userId: string): Promise<Document>`
  - `CreateDocumentInput` type
- Consumes: `prisma` from `~/server/utils/prisma`

- [ ] **Step 1: Write failing unit tests**

Create `apps/web/tests/unit/documents.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma before importing documents.ts
vi.mock('~/server/utils/prisma', () => ({
  prisma: {
    document: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '~/server/utils/prisma'
import {
  createDocument,
  getDocumentsByUser,
  getDocumentById,
  updateDocumentStatus,
  deleteDocument,
} from '~/server/utils/documents'

const mockDoc = {
  id: 'doc-1',
  userId: 'user-1',
  filename: 'uuid-file.pdf',
  originalName: 'file.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  status: 'pending' as const,
  extractedText: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createDocument', () => {
  it('calls prisma.document.create with correct data', async () => {
    vi.mocked(prisma.document.create).mockResolvedValue(mockDoc)
    const input = {
      userId: 'user-1',
      filename: 'uuid-file.pdf',
      originalName: 'file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    }
    const result = await createDocument(input)
    expect(prisma.document.create).toHaveBeenCalledWith({ data: input })
    expect(result).toBe(mockDoc)
  })
})

describe('getDocumentsByUser', () => {
  it('returns documents ordered by createdAt desc', async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([mockDoc])
    const result = await getDocumentsByUser('user-1')
    expect(prisma.document.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toHaveLength(1)
  })
})

describe('getDocumentById', () => {
  it('returns document when found', async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc)
    const result = await getDocumentById('doc-1', 'user-1')
    expect(prisma.document.findFirst).toHaveBeenCalledWith({
      where: { id: 'doc-1', userId: 'user-1' },
    })
    expect(result).toBe(mockDoc)
  })

  it('returns null when not found', async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null)
    const result = await getDocumentById('not-exist', 'user-1')
    expect(result).toBeNull()
  })
})

describe('updateDocumentStatus', () => {
  it('updates status without extractedText', async () => {
    vi.mocked(prisma.document.update).mockResolvedValue({ ...mockDoc, status: 'processing' })
    await updateDocumentStatus('doc-1', 'processing')
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { status: 'processing' },
    })
  })

  it('updates status with extractedText', async () => {
    vi.mocked(prisma.document.update).mockResolvedValue({ ...mockDoc, status: 'done', extractedText: 'hello' })
    await updateDocumentStatus('doc-1', 'done', 'hello')
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { status: 'done', extractedText: 'hello' },
    })
  })
})

describe('deleteDocument', () => {
  it('calls prisma.document.delete with id and userId', async () => {
    vi.mocked(prisma.document.delete).mockResolvedValue(mockDoc)
    await deleteDocument('doc-1', 'user-1')
    expect(prisma.document.delete).toHaveBeenCalledWith({
      where: { id: 'doc-1', userId: 'user-1' },
    })
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm test:unit
```

Expected: storage tests still pass, documents tests FAIL — "Cannot find module '~/server/utils/documents'"

- [ ] **Step 3: Implement apps/web/server/utils/documents.ts**

```typescript
import { prisma } from './prisma'
import type { Document, DocumentStatus } from '@prisma/client'

export type CreateDocumentInput = {
  userId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
}

export async function createDocument(data: CreateDocumentInput): Promise<Document> {
  return prisma.document.create({ data })
}

export async function getDocumentsByUser(userId: string): Promise<Document[]> {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDocumentById(id: string, userId: string): Promise<Document | null> {
  return prisma.document.findFirst({ where: { id, userId } })
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  extractedText?: string,
): Promise<Document> {
  return prisma.document.update({
    where: { id },
    data: {
      status,
      ...(extractedText !== undefined ? { extractedText } : {}),
    },
  })
}

export async function deleteDocument(id: string, userId: string): Promise<Document> {
  return prisma.document.delete({ where: { id, userId } })
}
```

- [ ] **Step 4: Run tests — expect all PASS**

```bash
pnpm test:unit
```

Expected: all 9 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/server/utils/documents.ts apps/web/tests/unit/documents.test.ts
git commit -m "feat: document service with Prisma + Vitest unit tests"
```

---

## Task 8: File Upload Route + File Serving

**Files:**
- Create: `apps/web/server/api/documents/upload.post.ts`
- Create: `apps/web/server/api/files/[...path].get.ts`

**Interfaces:**
- Consumes: `isAllowedMimeType`, `isFileSizeValid`, `generateFilename`, `saveFile` from `~/server/utils/storage`
- Consumes: `createDocument` from `~/server/utils/documents`
- Consumes: `auth` from `~/server/utils/auth`
- Produces: `POST /api/documents/upload` → `{ document: Document }`
- Produces: `GET /api/files/:filename` → file stream

- [ ] **Step 1: Create apps/web/server/api/documents/upload.post.ts**

```typescript
import { z } from 'zod'
import { auth } from '~/server/utils/auth'
import {
  isAllowedMimeType,
  isFileSizeValid,
  generateFilename,
  saveFile,
  MAX_FILE_SIZE,
} from '~/server/utils/storage'
import { createDocument } from '~/server/utils/documents'
import { extractTextFromDocument } from '~/server/utils/extraction'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })
  }

  const formData = await readMultipartFormData(event)
  const filePart = formData?.find((f) => f.name === 'file')

  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun fichier fourni' })
  }

  const mimeType = filePart.type ?? 'application/octet-stream'

  if (!isAllowedMimeType(mimeType)) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Type de fichier non supporté. Formats acceptés : PDF, PNG, JPG, WEBP, TIFF',
    })
  }

  if (!isFileSizeValid(filePart.data.length)) {
    throw createError({
      statusCode: 413,
      statusMessage: `Fichier trop volumineux. Maximum : ${MAX_FILE_SIZE / 1024 / 1024} Mo`,
    })
  }

  const filename = generateFilename(filePart.filename, mimeType)
  await saveFile(filename, filePart.data)

  const document = await createDocument({
    userId: session.user.id,
    filename,
    originalName: filePart.filename,
    mimeType,
    size: filePart.data.length,
  })

  // Trigger extraction in background (do not await — let it run async)
  extractTextFromDocument(document.id, filename, mimeType).catch((err) => {
    console.error(`Extraction failed for document ${document.id}:`, err)
  })

  return { document }
})
```

- [ ] **Step 2: Create apps/web/server/api/files/[...path].get.ts**

```typescript
import { createReadStream, existsSync } from 'fs'
import { join, basename } from 'path'

export default defineEventHandler((event) => {
  const pathParam = getRouterParam(event, 'path')
  if (!pathParam) throw createError({ statusCode: 400 })

  // Security: allow only filename, no directory traversal
  const filename = basename(pathParam)
  const filepath = join(process.cwd(), 'uploads', filename)

  if (!existsSync(filepath)) {
    throw createError({ statusCode: 404, statusMessage: 'Fichier non trouvé' })
  }

  return sendStream(event, createReadStream(filepath))
})
```

- [ ] **Step 3: Stub extraction service (needed for upload to work)**

Create `apps/web/server/utils/extraction.ts` with a stub — real implementation in Task 10:

```typescript
import { updateDocumentStatus } from './documents'

export async function extractTextFromDocument(
  documentId: string,
  _filename: string,
  _mimeType: string,
): Promise<void> {
  // Stub: marks as done with placeholder text until Task 10 implements real AI extraction
  await updateDocumentStatus(documentId, 'processing')
  await new Promise((resolve) => setTimeout(resolve, 500))
  await updateDocumentStatus(
    documentId,
    'done',
    '[Extraction IA non configurée — ajoutez OPENAI_API_KEY dans .env]',
  )
}
```

- [ ] **Step 4: Test upload manually**

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@/path/to/any.pdf" \
  -H "Cookie: <session-cookie-from-browser>"
```

Or test via browser: open DevTools → Application → Cookies, copy the `better-auth-session` cookie value.

- [ ] **Step 5: Commit**

```bash
git add apps/web/server/api/documents/upload.post.ts apps/web/server/api/files/ apps/web/server/utils/extraction.ts
git commit -m "feat: document upload route, file serving, extraction stub"
```

---

## Task 9: Document CRUD API Routes

**Files:**
- Create: `apps/web/server/api/documents/index.get.ts`
- Create: `apps/web/server/api/documents/[id].get.ts`
- Create: `apps/web/server/api/documents/[id].delete.ts`
- Create: `apps/web/server/api/documents/[id]/extract.post.ts`

**Interfaces:**
- Produces: `GET /api/documents` → `{ documents: Document[] }`
- Produces: `GET /api/documents/:id` → `{ document: Document }`
- Produces: `DELETE /api/documents/:id` → `{ success: true }`
- Produces: `POST /api/documents/:id/extract` → `{ document: Document }`

- [ ] **Step 1: Create apps/web/server/api/documents/index.get.ts**

```typescript
import { auth } from '~/server/utils/auth'
import { getDocumentsByUser } from '~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const documents = await getDocumentsByUser(session.user.id)
  return { documents }
})
```

- [ ] **Step 2: Create apps/web/server/api/documents/[id].get.ts**

```typescript
import { auth } from '~/server/utils/auth'
import { getDocumentById } from '~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const document = await getDocumentById(id, session.user.id)
  if (!document) throw createError({ statusCode: 404, statusMessage: 'Document non trouvé' })

  return { document }
})
```

- [ ] **Step 3: Create apps/web/server/api/documents/[id].delete.ts**

```typescript
import { auth } from '~/server/utils/auth'
import { getDocumentById, deleteDocument } from '~/server/utils/documents'
import { deleteFile } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const document = await getDocumentById(id, session.user.id)
  if (!document) throw createError({ statusCode: 404, statusMessage: 'Document non trouvé' })

  await deleteFile(document.filename).catch(() => {
    // File may already be missing — continue with DB deletion
  })
  await deleteDocument(id, session.user.id)

  return { success: true }
})
```

- [ ] **Step 4: Create apps/web/server/api/documents/[id]/extract.post.ts**

```typescript
import { auth } from '~/server/utils/auth'
import { getDocumentById, updateDocumentStatus } from '~/server/utils/documents'
import { extractTextFromDocument } from '~/server/utils/extraction'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const document = await getDocumentById(id, session.user.id)
  if (!document) throw createError({ statusCode: 404, statusMessage: 'Document non trouvé' })

  // Reset to pending then trigger async extraction
  await updateDocumentStatus(id, 'pending')
  extractTextFromDocument(id, document.filename, document.mimeType).catch((err) => {
    console.error(`Re-extraction failed for document ${id}:`, err)
  })

  const updated = await getDocumentById(id, session.user.id)
  return { document: updated }
})
```

- [ ] **Step 5: Test all routes**

```bash
# List (should return empty array initially)
curl http://localhost:3000/api/documents -H "Cookie: <session>"

# Upload first, then get by ID from the list response
curl http://localhost:3000/api/documents/<id> -H "Cookie: <session>"
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/server/api/documents/
git commit -m "feat: document CRUD API routes"
```

---

## Task 10: AI Extraction Service (Real Implementation)

**Files:**
- Modify: `apps/web/server/utils/extraction.ts` (replace stub with real implementation)

**Interfaces:**
- Consumes: `OPENAI_API_KEY` from env
- Consumes: `getUploadPath` from `~/server/utils/storage`
- Consumes: `updateDocumentStatus` from `~/server/utils/documents`
- Produces: `extractTextFromDocument(documentId, filename, mimeType): Promise<void>`

- [ ] **Step 1: Replace extraction stub with real implementation**

Replace the full content of `apps/web/server/utils/extraction.ts`:

```typescript
import { readFile } from 'fs/promises'
import { getUploadPath } from './storage'
import { updateDocumentStatus } from './documents'

async function extractFromImage(base64: string, mimeType: string): Promise<string> {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extrais tout le texte de ce document. Retourne uniquement le texte extrait, sans commentaire ni mise en forme supplémentaire.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 4096,
  })

  return response.choices[0]?.message?.content ?? ''
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  // pdf-parse extracts text without AI — reliable and free
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
}

export async function extractTextFromDocument(
  documentId: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  await updateDocumentStatus(documentId, 'processing')

  try {
    const filepath = getUploadPath(filename)
    const buffer = await readFile(filepath)

    let extractedText: string

    if (mimeType === 'application/pdf') {
      extractedText = await extractFromPdf(buffer)
    } else if (process.env.OPENAI_API_KEY) {
      const base64 = buffer.toString('base64')
      extractedText = await extractFromImage(base64, mimeType)
    } else {
      extractedText = '[Clé OPENAI_API_KEY manquante — extraction non disponible pour les images]'
    }

    await updateDocumentStatus(documentId, 'done', extractedText)
  } catch (error) {
    await updateDocumentStatus(documentId, 'error')
    throw error
  }
}
```

- [ ] **Step 2: Test with a PDF upload**

Upload a PDF via curl (get session cookie from browser first):
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@/path/to/test.pdf" \
  -H "Cookie: better-auth.session_token=<token>"
```

Then poll the document until status is `done`:
```bash
curl http://localhost:3000/api/documents/<id> -H "Cookie: ..."
```

Expected: `status: "done"` with non-empty `extractedText`

- [ ] **Step 3: Commit**

```bash
git add apps/web/server/utils/extraction.ts
git commit -m "feat: AI extraction — OpenAI Vision for images, pdf-parse for PDFs"
```

---

## Task 11: useDocuments Composable

**Files:**
- Create: `apps/web/app/composables/useDocuments.ts`

**Interfaces:**
- Produces:
  - `documents: Ref<Document[]>`
  - `selectedDocument: Ref<Document | null>`
  - `loading: Ref<boolean>`
  - `fetchDocuments(): Promise<void>`
  - `uploadDocument(file: File): Promise<void>`
  - `selectDocument(doc: Document): void`
  - `deleteDocument(id: string): Promise<void>`
  - `retryExtraction(id: string): Promise<void>`
  - `pollDocument(id: string): void` — polls every 2s until status is done/error
  - `Document` type (re-exported)

- [ ] **Step 1: Create apps/web/app/composables/useDocuments.ts**

```typescript
export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error'

export interface Document {
  id: string
  userId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  status: DocumentStatus
  extractedText: string | null
  createdAt: string
  updatedAt: string
}

export function useDocuments() {
  const documents = useState<Document[]>('documents', () => [])
  const selectedDocument = useState<Document | null>('selectedDocument', () => null)
  const loading = ref(false)
  const toast = useToast()

  async function fetchDocuments(): Promise<void> {
    loading.value = true
    const data = await $fetch<{ documents: Document[] }>('/api/documents')
    documents.value = data.documents
    loading.value = false
  }

  async function uploadDocument(file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)

    const data = await $fetch<{ document: Document }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    documents.value.unshift(data.document)
    selectDocument(data.document)
    pollDocument(data.document.id)
    toast.add({ title: 'Upload réussi', color: 'green' })
  }

  function selectDocument(doc: Document): void {
    selectedDocument.value = doc
  }

  async function deleteDocument(id: string): Promise<void> {
    await $fetch(`/api/documents/${id}`, { method: 'DELETE' })
    documents.value = documents.value.filter((d) => d.id !== id)
    if (selectedDocument.value?.id === id) {
      selectedDocument.value = documents.value[0] ?? null
    }
    toast.add({ title: 'Document supprimé', color: 'green' })
  }

  async function retryExtraction(id: string): Promise<void> {
    const data = await $fetch<{ document: Document }>(`/api/documents/${id}/extract`, {
      method: 'POST',
    })
    updateDocumentInList(data.document)
    pollDocument(id)
  }

  function pollDocument(id: string): void {
    const interval = setInterval(async () => {
      const data = await $fetch<{ document: Document }>(`/api/documents/${id}`)
      updateDocumentInList(data.document)
      if (data.document.status === 'done' || data.document.status === 'error') {
        clearInterval(interval)
      }
    }, 2000)
  }

  function updateDocumentInList(updated: Document): void {
    const idx = documents.value.findIndex((d) => d.id === updated.id)
    if (idx !== -1) documents.value[idx] = updated
    if (selectedDocument.value?.id === updated.id) selectedDocument.value = updated
  }

  return {
    documents,
    selectedDocument,
    loading,
    fetchDocuments,
    uploadDocument,
    selectDocument,
    deleteDocument,
    retryExtraction,
    pollDocument,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/composables/useDocuments.ts
git commit -m "feat: useDocuments composable with polling for extraction status"
```

---

## Task 12: Frontend Components — List + Upload

**Files:**
- Create: `apps/web/app/components/DocumentList.vue`
- Create: `apps/web/app/components/UploadModal.vue`

**Interfaces:**
- `DocumentList` emits nothing, reads from `useDocuments()`
- `UploadModal` emits `close`, calls `uploadDocument` internally

- [ ] **Step 1: Create apps/web/app/components/DocumentList.vue**

```vue
<script setup lang="ts">
const { documents, selectedDocument, loading, selectDocument, deleteDocument, fetchDocuments } =
  useDocuments()

const statusColor: Record<string, string> = {
  pending: 'yellow',
  processing: 'blue',
  done: 'green',
  error: 'red',
}

const statusLabel: Record<string, string> = {
  pending: 'En attente',
  processing: 'Extraction...',
  done: 'Terminé',
  error: 'Erreur',
}

onMounted(fetchDocuments)
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div
      v-if="loading"
      class="flex-1 flex items-center justify-center"
    >
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>

    <div
      v-else-if="documents.length === 0"
      class="flex-1 flex items-center justify-center text-gray-400"
    >
      Aucun document
    </div>

    <ul v-else class="flex-1 overflow-y-auto divide-y dark:divide-gray-700">
      <li
        v-for="doc in documents"
        :key="doc.id"
        class="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        :class="{ 'bg-primary-50 dark:bg-primary-900/20': selectedDocument?.id === doc.id }"
        :data-testid="`doc-item-${doc.id}`"
        @click="selectDocument(doc)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium truncate">{{ doc.originalName }}</span>
          <UBadge :color="statusColor[doc.status]" size="xs" :data-testid="`doc-status-${doc.id}`">
            {{ statusLabel[doc.status] }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs text-gray-400">
            {{ (doc.size / 1024).toFixed(0) }} Ko
          </span>
          <UButton
            variant="ghost"
            color="red"
            size="xs"
            icon="i-heroicons-trash"
            :data-testid="`doc-delete-${doc.id}`"
            @click.stop="deleteDocument(doc.id)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
```

- [ ] **Step 2: Create apps/web/app/components/UploadModal.vue**

```vue
<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
const { uploadDocument } = useDocuments()

const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const uploading = ref(false)
const error = ref('')

const ACCEPTED = 'application/pdf,image/png,image/jpeg,image/webp,image/tiff'

async function handleFile(file: File) {
  error.value = ''
  uploading.value = true
  try {
    await uploadDocument(file)
    emit('close')
  } catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Erreur lors de l\'upload'
  } finally {
    uploading.value = false
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleFile(file)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}
</script>

<template>
  <div class="space-y-4">
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
      :class="dragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'"
      data-testid="upload-dropzone"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <UIcon name="i-heroicons-cloud-arrow-up" class="text-4xl text-gray-400 mb-2" />
      <p class="text-sm text-gray-500 mb-3">Glissez un fichier ici ou</p>
      <UButton
        variant="outline"
        size="sm"
        data-testid="upload-browse-btn"
        :loading="uploading"
        @click="fileInput?.click()"
      >
        Parcourir
      </UButton>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="ACCEPTED"
        data-testid="upload-input"
        @change="onFileChange"
      />
      <p class="text-xs text-gray-400 mt-3">PDF, PNG, JPG, WEBP, TIFF — max 10 Mo</p>
    </div>

    <UAlert v-if="error" color="red" :description="error" data-testid="upload-error" />
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/DocumentList.vue apps/web/app/components/UploadModal.vue
git commit -m "feat: DocumentList and UploadModal components"
```

---

## Task 13: Document Viewer + Extracted Text Panel

**Files:**
- Create: `apps/web/app/components/DocumentViewer.vue`
- Create: `apps/web/app/components/ExtractedTextPanel.vue`

**Interfaces:**
- `DocumentViewer` props: `document: Document`
- `ExtractedTextPanel` props: `document: Document`; emits: `retry`

- [ ] **Step 1: Create apps/web/app/components/DocumentViewer.vue**

```vue
<script setup lang="ts">
import type { Document } from '~/composables/useDocuments'
import { VuePDF, usePDF } from '@tato30/vue-pdf'

const props = defineProps<{ document: Document }>()

const fileUrl = computed(() => `/api/files/${props.document.filename}`)
const isPdf = computed(() => props.document.mimeType === 'application/pdf')

const { pdf, pages } = usePDF(computed(() => (isPdf.value ? fileUrl.value : '')))
</script>

<template>
  <div
    class="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4"
    data-testid="document-viewer"
  >
    <!-- PDF viewer -->
    <template v-if="isPdf">
      <VuePDF
        v-for="page in pages"
        :key="page"
        :pdf="pdf"
        :page="page"
        class="mb-4 shadow rounded"
      />
    </template>

    <!-- Image viewer -->
    <template v-else>
      <img
        :src="fileUrl"
        :alt="document.originalName"
        class="max-w-full rounded shadow"
        data-testid="document-image"
      />
    </template>
  </div>
</template>
```

- [ ] **Step 2: Create apps/web/app/components/ExtractedTextPanel.vue**

```vue
<script setup lang="ts">
import type { Document } from '~/composables/useDocuments'

const props = defineProps<{ document: Document }>()
const emit = defineEmits<{ retry: [] }>()

const copied = ref(false)
const toast = useToast()

async function copyText() {
  if (!props.document.extractedText) return
  await navigator.clipboard.writeText(props.document.extractedText)
  copied.value = true
  toast.add({ title: 'Texte copié !', color: 'green' })
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div
    class="flex flex-col h-full border-l dark:border-gray-700"
    data-testid="extracted-text-panel"
  >
    <div class="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
      <h2 class="font-semibold text-sm">Texte extrait</h2>
      <div class="flex items-center gap-2">
        <UButton
          v-if="document.status === 'error'"
          size="xs"
          color="red"
          variant="ghost"
          icon="i-heroicons-arrow-path"
          data-testid="retry-extraction-btn"
          @click="emit('retry')"
        >
          Réessayer
        </UButton>
        <UButton
          v-if="document.status === 'done'"
          size="xs"
          variant="outline"
          :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
          data-testid="copy-text-btn"
          @click="copyText"
        >
          {{ copied ? 'Copié !' : 'Copier' }}
        </UButton>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="document.status === 'pending' || document.status === 'processing'"
      class="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400"
      data-testid="extraction-loading"
    >
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl" />
      <p class="text-sm">Extraction en cours...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="document.status === 'error'"
      class="flex-1 flex items-center justify-center"
      data-testid="extraction-error"
    >
      <UAlert color="red" title="Extraction échouée" description="Cliquez sur Réessayer pour relancer l'extraction." />
    </div>

    <!-- Text content -->
    <pre
      v-else-if="document.extractedText"
      class="flex-1 overflow-y-auto p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed"
      data-testid="extracted-text-content"
    >{{ document.extractedText }}</pre>

    <div
      v-else
      class="flex-1 flex items-center justify-center text-gray-400 text-sm"
    >
      Aucun texte extrait
    </div>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/DocumentViewer.vue apps/web/app/components/ExtractedTextPanel.vue
git commit -m "feat: DocumentViewer (PDF + image) and ExtractedTextPanel"
```

---

## Task 14: Main Page — Split View Layout

**Files:**
- Create: `apps/web/app/pages/index.vue`

**Interfaces:**
- Consumes: `useDocuments()`, `DocumentList`, `DocumentViewer`, `ExtractedTextPanel`, `UploadModal`
- Produces: full split-view UI on `GET /`

- [ ] **Step 1: Create apps/web/app/pages/index.vue**

```vue
<script setup lang="ts">
const { selectedDocument, retryExtraction } = useDocuments()
const showUploadModal = ref(false)

function handleRetry() {
  if (selectedDocument.value) {
    retryExtraction(selectedDocument.value.id)
  }
}
</script>

<template>
  <div class="flex h-full w-full overflow-hidden">
    <!-- Sidebar: document list -->
    <aside class="w-72 shrink-0 flex flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
        <h2 class="font-semibold text-sm">Documents</h2>
        <UButton
          size="xs"
          icon="i-heroicons-plus"
          data-testid="upload-open-btn"
          @click="showUploadModal = true"
        >
          Ajouter
        </UButton>
      </div>
      <DocumentList class="flex-1 overflow-hidden" />
    </aside>

    <!-- Main area: viewer + extracted text -->
    <div class="flex-1 flex overflow-hidden">
      <template v-if="selectedDocument">
        <!-- Left: document preview (50%) -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <p class="text-sm font-medium truncate" data-testid="selected-doc-name">
              {{ selectedDocument.originalName }}
            </p>
          </div>
          <DocumentViewer :document="selectedDocument" />
        </div>

        <!-- Right: extracted text (50%) -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <ExtractedTextPanel
            :document="selectedDocument"
            @retry="handleRetry"
          />
        </div>
      </template>

      <!-- Empty state -->
      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400"
        data-testid="empty-state"
      >
        <UIcon name="i-heroicons-document-text" class="text-5xl" />
        <p>Sélectionnez ou uploadez un document</p>
        <UButton
          icon="i-heroicons-plus"
          data-testid="upload-open-btn-empty"
          @click="showUploadModal = true"
        >
          Uploader un document
        </UButton>
      </div>
    </div>
  </div>

  <!-- Upload modal -->
  <UModal v-model="showUploadModal" title="Uploader un document" data-testid="upload-modal">
    <template #body>
      <UploadModal @close="showUploadModal = false" />
    </template>
  </UModal>
</template>
```

- [ ] **Step 2: Test the full flow manually**

1. Open `http://localhost:3000`
2. Register → redirected to home
3. Click "Ajouter" → modal opens
4. Upload a PDF → appears in sidebar with status "En attente" then "Extraction..." then "Terminé"
5. Left panel shows PDF pages, right panel shows extracted text
6. Click "Copier" → verify clipboard
7. Click delete icon → document removed

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/pages/index.vue
git commit -m "feat: main split-view page with document list, viewer, and extraction panel"
```

---

## Task 15: Playwright E2E Tests

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/tests/e2e/auth.spec.ts`
- Create: `apps/web/tests/e2e/upload.spec.ts`
- Create: `apps/web/tests/e2e/viewer.spec.ts`

**Interfaces:**
- Consumes: running Nuxt dev server on port 3000
- Consumes: PostgreSQL running (docker compose up -d)

- [ ] **Step 1: Create apps/web/playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
  },
})
```

- [ ] **Step 2: Install Playwright browsers**

```bash
cd apps/web && npx playwright install chromium
```

- [ ] **Step 3: Create apps/web/tests/e2e/auth.spec.ts**

```typescript
import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'

const email = () => `test-${randomUUID()}@example.com`
const password = 'TestPass123!'

test.describe('Authentication', () => {
  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('registers a new user and redirects to home', async ({ page }) => {
    await page.goto('/register')
    await page.fill('[data-testid="register-name"]', 'Test User')
    await page.fill('[data-testid="register-email"]', email())
    await page.fill('[data-testid="register-password"]', password)
    await page.click('[data-testid="register-submit"]')
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
  })

  test('logs in with valid credentials and redirects to home', async ({ page }) => {
    const userEmail = email()
    // Register first
    await page.goto('/register')
    await page.fill('[data-testid="register-name"]', 'Test User')
    await page.fill('[data-testid="register-email"]', userEmail)
    await page.fill('[data-testid="register-password"]', password)
    await page.click('[data-testid="register-submit"]')
    await expect(page).toHaveURL('/')

    // Sign out
    await page.click('[data-testid="sign-out-btn"]')
    await expect(page).toHaveURL('/login')

    // Sign in
    await page.fill('[data-testid="login-email"]', userEmail)
    await page.fill('[data-testid="login-password"]', password)
    await page.click('[data-testid="login-submit"]')
    await expect(page).toHaveURL('/')
  })

  test('shows error with wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="login-email"]', 'nobody@example.com')
    await page.fill('[data-testid="login-password"]', 'wrongpass')
    await page.click('[data-testid="login-submit"]')
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('signs out and redirects to /login', async ({ page }) => {
    const userEmail = email()
    await page.goto('/register')
    await page.fill('[data-testid="register-name"]', 'Test User')
    await page.fill('[data-testid="register-email"]', userEmail)
    await page.fill('[data-testid="register-password"]', password)
    await page.click('[data-testid="register-submit"]')
    await expect(page).toHaveURL('/')

    await page.click('[data-testid="sign-out-btn"]')
    await expect(page).toHaveURL('/login')
  })
})
```

- [ ] **Step 4: Create apps/web/tests/e2e/upload.spec.ts**

```typescript
import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

const email = () => `upload-${randomUUID()}@example.com`
const password = 'TestPass123!'

async function registerAndLogin(page: import('@playwright/test').Page, userEmail: string) {
  await page.goto('/register')
  await page.fill('[data-testid="register-name"]', 'Upload Tester')
  await page.fill('[data-testid="register-email"]', userEmail)
  await page.fill('[data-testid="register-password"]', password)
  await page.click('[data-testid="register-submit"]')
  await page.waitForURL('/')
}

test.describe('Document Upload', () => {
  test('uploads a PNG image successfully', async ({ page }) => {
    await registerAndLogin(page, email())

    // Create a tiny 1x1 PNG in /tmp
    const pngPath = join('/tmp', `test-${randomUUID()}.png`)
    // Minimal valid PNG (1x1 transparent)
    const pngBytes = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000000200e221bc330000000049454e44ae426082',
      'hex',
    )
    writeFileSync(pngPath, pngBytes)

    await page.click('[data-testid="upload-open-btn-empty"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()

    const fileInput = page.locator('[data-testid="upload-input"]')
    await fileInput.setInputFiles(pngPath)

    // Modal closes after upload
    await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible({ timeout: 10000 })

    // Document appears in sidebar
    await expect(page.locator('[data-testid^="doc-item-"]').first()).toBeVisible()

    unlinkSync(pngPath)
  })

  test('shows error when uploading unsupported file type', async ({ page }) => {
    await registerAndLogin(page, email())

    // Create a .txt file
    const txtPath = join('/tmp', `test-${randomUUID()}.txt`)
    writeFileSync(txtPath, 'hello world')

    await page.click('[data-testid="upload-open-btn-empty"]')
    const fileInput = page.locator('[data-testid="upload-input"]')
    await fileInput.setInputFiles(txtPath)

    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible({ timeout: 5000 })

    unlinkSync(txtPath)
  })
})
```

- [ ] **Step 5: Create apps/web/tests/e2e/viewer.spec.ts**

```typescript
import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

const email = () => `viewer-${randomUUID()}@example.com`
const password = 'TestPass123!'

async function registerAndUpload(page: import('@playwright/test').Page) {
  const userEmail = email()
  await page.goto('/register')
  await page.fill('[data-testid="register-name"]', 'Viewer Tester')
  await page.fill('[data-testid="register-email"]', userEmail)
  await page.fill('[data-testid="register-password"]', password)
  await page.click('[data-testid="register-submit"]')
  await page.waitForURL('/')

  const pngPath = join('/tmp', `viewer-test-${randomUUID()}.png`)
  const pngBytes = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000000200e221bc330000000049454e44ae426082',
    'hex',
  )
  writeFileSync(pngPath, pngBytes)

  await page.click('[data-testid="upload-open-btn-empty"]')
  const fileInput = page.locator('[data-testid="upload-input"]')
  await fileInput.setInputFiles(pngPath)
  await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible({ timeout: 10000 })

  unlinkSync(pngPath)
}

test.describe('Document Viewer', () => {
  test('shows document preview and extracted text panel after upload', async ({ page }) => {
    await registerAndUpload(page)

    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="extracted-text-panel"]')).toBeVisible()
  })

  test('shows document name in header after selection', async ({ page }) => {
    await registerAndUpload(page)

    await expect(page.locator('[data-testid="selected-doc-name"]')).toBeVisible()
  })

  test('copy button appears when extraction is done', async ({ page }) => {
    await registerAndUpload(page)

    // Wait for extraction to complete (status badge = Terminé)
    await expect(page.locator('[data-testid^="doc-status-"]').filter({ hasText: 'Terminé' })).toBeVisible({
      timeout: 30000,
    })

    await expect(page.locator('[data-testid="copy-text-btn"]')).toBeVisible()
  })

  test('copy button writes text to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await registerAndUpload(page)

    // Wait for extraction done
    await expect(page.locator('[data-testid^="doc-status-"]').filter({ hasText: 'Terminé' })).toBeVisible({
      timeout: 30000,
    })

    await page.click('[data-testid="copy-text-btn"]')

    // Button should show "Copié !"
    await expect(page.locator('[data-testid="copy-text-btn"]')).toContainText('Copié', { timeout: 3000 })
  })
})
```

- [ ] **Step 6: Run E2E tests**

```bash
cd apps/web && pnpm test:e2e
```

Expected: all tests pass (some may take up to 30s for extraction)

- [ ] **Step 7: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/tests/e2e/
git commit -m "test: Playwright E2E tests for auth, upload, and viewer"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| pnpm monorepo | Task 1 |
| Nuxt 4 + Nuxt UI | Task 2 |
| Better Auth email/password | Tasks 4, 5 |
| Prisma + PostgreSQL | Task 3 |
| Docker Compose (postgres) | Task 1 |
| .env + .env.example | Task 1 |
| Upload PDF/image (max 10 Mo) | Task 8 |
| Stockage local | Task 6 |
| AI extraction (OpenAI/pdf-parse) | Task 10 |
| Statuts pending→processing→done/error | Tasks 7, 8, 9, 10 |
| Relancer extraction | Tasks 9, 14 |
| Split view (50%/50%) | Task 14 |
| Aperçu PDF (@tato30/vue-pdf) | Task 13 |
| Aperçu image (<img>) | Task 13 |
| Texte scrollable + copier | Task 13 |
| Indicateur de chargement | Task 13 |
| Liste de documents (sidebar) | Task 12 |
| Auth middleware (redirect) | Task 5 |
| Vitest unit tests | Tasks 6, 7 |
| Playwright E2E tests (4 scénarios) | Task 15 |

### Placeholder scan

No TBD, TODO, or "similar to" references found. All code blocks are complete.

### Type consistency

- `Document` type defined in `useDocuments.ts` Task 11, consumed in Tasks 12, 13, 14
- `DocumentStatus` enum consistent throughout: `pending | processing | done | error`
- `extractTextFromDocument(documentId, filename, mimeType)` consistent between Task 8 (caller) and Task 10 (implementation)
- `auth.api.getSession({ headers: event.headers })` pattern consistent across all route Tasks 8, 9
