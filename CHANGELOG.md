# Changelog

All notable changes to FamilyAccountant are documented here.

---

## [Unreleased]

---

## [0.1.0] — 2026-04-24

> **Note:** The changes below were originally merged together in a single pull request
> (PR #4, titled "fix(security): bump electron 31 → 41"). They are documented separately
> here to clearly distinguish the monorepo scaffold from the security fix.

---

### feat: Phase 0 — monorepo scaffold

Sets up the full project skeleton so all packages can be developed, linted,
built, and tested in one repository.

#### Added

- **Monorepo tooling**
  - `pnpm` workspaces (`pnpm-workspace.yaml`) with four packages:
    `backend`, `desktop`, `mobile`, `shared`
  - Turborepo (`turbo.json`) pipeline: `build → test → lint` with
    correct dependency ordering
  - Shared `tsconfig.base.json` with strict TypeScript settings
  - Root `package.json` with unified `build / dev / lint / test / format`
    scripts
  - ESLint (`eslint.rc.js`) and Prettier (`.prettierrc`) configs applied
    across all packages

- **`packages/shared`** — shared TypeScript types, DTOs, and sync utilities
  consumed by both `backend` and `desktop`/`mobile`

- **`packages/backend`** — NestJS REST API
  - TypeORM entities: `Account`, `Transaction`, `Debt`, `Payment`, `User`,
    `Household`
  - Decimal-to-number transformer on every TypeORM `decimal` column
    (`account.balance`, `transaction.amount`, `debt.amount`,
    `payment.amount`) to avoid string-typed values at runtime
  - Auth module (JWT access + refresh tokens); `ApiBearerAuth` decorator
    added to `auth.controller.ts` for Swagger
  - CRUD modules for accounts, transactions, debts, payments, and sync
  - Sync endpoint: reconciles by `localId`; `updateSyncStatus` stores
    calls and IPC handler both use `WHERE localId = ?`
  - Auth service returns real `userId`; `/users/me` endpoint hydrates
    `userId` and `householdId`; `accountId` is optional (shared type +
    backend DTO + nullable entity column)
  - Swagger UI at `/api/docs`
  - Unit tests for `sync.service` (both `service.sync()` calls receive
    `'user-1'` as the second argument)

- **`packages/desktop`** — Vite + React + Electron (Windows 11)
  - `tsconfig.json` overrides `module: ESNext` for Vite / `import.meta`
    compatibility
  - Auth store and desktop store both fetch `/users/me` to hydrate real
    `userId` / `householdId` (no hardcoded placeholder UUIDs)
  - UI reads real `householdId` from store

- **`packages/mobile`** — Expo React Native (Android)
  - Auth store fetches `/users/me` on login to hydrate real `userId` /
    `householdId`

- **CI** (`.github/workflows/ci.yml`)
  - Jobs: `lint`, `build`, `test-backend`
  - `test-backend` uses the PostgreSQL instance pre-installed on
    GitHub-hosted Ubuntu runners (no Docker or virtualization required)

- **Environment & documentation**
  - `.env.example` for the backend
  - `README.md` with architecture table, local PostgreSQL setup
    instructions (Windows / macOS / Linux), and monorepo script reference
  - `SECURITY.md`

- **Removed**
  - Docker / docker-compose — replaced by local native PostgreSQL install

---

### fix(security): bump Electron 31 → 41

Addresses use-after-free and CLI injection vulnerabilities present in Electron v31
that are patched in the v41 series:

| CVE | Severity | Description |
|-----|----------|-------------|
| [CVE-2026-34770](https://github.com/electron/electron/security/advisories) | High | Use-after-free in PowerMonitor (Windows/macOS) |
| [CVE-2026-34771](https://github.com/electron/electron/security/advisories) | High | Use-after-free in WebContents async permission callbacks |
| [CVE-2026-34774](https://github.com/electron/electron/security/advisories) | High | Use-after-free in offscreen child-window paint frames |
| [CVE-2026-34769](https://github.com/electron/electron/security/advisories) | High | Renderer command-line switch injection via undocumented `webPreference` |

#### Changed

- `packages/desktop/package.json`: `"electron": "^31.0.2"` →
  `"electron": "^41.0.0"`

---

[Unreleased]: https://github.com/aj1126/FamilyAccountant/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aj1126/FamilyAccountant/releases/tag/v0.1.0
