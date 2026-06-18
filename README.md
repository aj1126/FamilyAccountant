# FamilyAccountant

A cross-platform home finance management app for families and roommates. Tracks debts, credits, accounts, and payments with offline-first sync across Android and Windows 11.

## Architecture

| Layer | Technology |
|---|---|
| Backend API | NestJS + TypeORM |
| Database | PostgreSQL (local install) |
| Mobile | React Native (Expo, Android) |
| Desktop | React + Electron (Windows 11) |
| Monorepo | pnpm workspaces + Turborepo |
| State / Sync | Zustand + offline-first sync queue |

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm i -g pnpm`)
- **Turborepo** (`pnpm add -g turbo`)
- **PostgreSQL** ≥ 14 installed locally (no Docker required — see below)

## Local PostgreSQL Setup (no Docker / no virtualization)

### Windows

1. Download and run the installer from https://www.postgresql.org/download/windows/
2. During setup, set a password for the `postgres` superuser and note the port (default: `5432`).
3. After installation, open **pgAdmin** (bundled with the installer) or use `psql` from Start Menu → PostgreSQL → SQL Shell.
4. Create the app database and user:

   ```sql
   CREATE USER fa_user WITH PASSWORD 'fa_pass';
   CREATE DATABASE family_accountant OWNER fa_user;
   ```

5. Optionally create a separate test database:

   ```sql
   CREATE DATABASE family_accountant_test OWNER fa_user;
   ```

### macOS

```bash
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE USER fa_user WITH PASSWORD 'fa_pass';"
psql postgres -c "CREATE DATABASE family_accountant OWNER fa_user;"
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE USER fa_user WITH PASSWORD 'fa_pass';"
sudo -u postgres psql -c "CREATE DATABASE family_accountant OWNER fa_user;"
```

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/aj1126/FamilyAccountant.git
cd FamilyAccountant
pnpm install

# 2. Configure environment
cp .env.example packages/backend/.env
# Edit packages/backend/.env with your DATABASE_URL and JWT secrets

# 3. Build shared types first
pnpm turbo run build --filter=@family-accountant/shared

# 4. Start the backend (runs on http://localhost:3000)
pnpm --filter @family-accountant/backend run dev

# 5. (Separate terminal) Start the mobile app
pnpm --filter @family-accountant/mobile run start

# 6. (Separate terminal) Start the desktop app
pnpm --filter @family-accountant/desktop run dev
```

## Monorepo Scripts

| Command | Description |
|---|---|
| `pnpm build` | Build all packages (Turborepo, respects dependency order) |
| `pnpm dev` | Start all packages in dev/watch mode |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm format` | Format all files with Prettier |

## Project Structure

```
FamilyAccountant/
├── packages/
│   ├── backend/     # NestJS REST API
│   ├── mobile/      # Expo React Native (Android)
│   ├── desktop/     # Vite + React + Electron (Windows)
│   └── shared/      # Shared TypeScript types, DTOs, sync utilities
├── turbo.json        # Turborepo pipeline config
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

## API Documentation

Swagger UI is available at `http://localhost:3000/api/docs` when the backend is running.

## Current State Snapshot

- **Backend:** Most complete layer. Auth, households, accounts, transactions, debts, payments, and sync modules exist in NestJS with TypeORM/PostgreSQL.
- **Mobile:** Expo app has login/register, dashboard, transactions, and debts screens plus SQLite-backed local storage and Zustand stores.
- **Desktop:** React + Electron app has dashboard, transactions, and debts screens, but auth/onboarding is still behind the mobile flow.
- **Shared:** Shared DTOs, types, and sync contracts are wired into the backend and both clients.
- **Testing:** Automated tests currently exist only for `@family-accountant/backend`.

## Current Delivery Priorities

1. **Finish session bootstrap on both clients** so persisted auth state and local database setup run on startup.
2. **Add household onboarding immediately after auth** so users can create or join a household before any finance workflow.
3. **Reach mobile/desktop parity** for auth and onboarding before expanding either client further.
4. **Complete account management** to give transactions stable household/account context.
5. **Polish the first end-to-end workflow** around transaction create/list/offline sync, then finish debts and payments.
6. **Replace TypeORM synchronize with migrations** and tighten household authorization rules once the core workflow is stable.

## Accessibility Baseline

All upcoming product work should assume:

- large text and clear hierarchy by default
- large hit targets and keyboard-friendly desktop navigation
- low cognitive load with simpler screens and fewer simultaneous choices
- explicit accessibility labels/hints on mobile and stronger semantic structure on desktop
- clear success, empty, and error states for low-tech-confidence users

## Development Status

- **Current Phase:** Phase 1 repo alignment is complete enough to plan against the live codebase; backend CRUD/auth is ahead of the mobile and desktop product flows.
- **Immediate Next Steps:** finish auth/session bootstrap on both apps, add household onboarding, and bring desktop to parity with the mobile auth/onboarding path.
- **Later Milestones:** account management, polished transaction sync, debt/payment completion, accessibility hardening, migrations, and broader automated test coverage.

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of all changes.

*Last automated update following merge: 2026-04-26 06:29:26*

*Last automated update following merge: 2026-04-26 07:15:14*

*Last automated update following merge: 2026-04-26 11:52:17*

*Last automated update following merge: 2026-05-04 07:18:32*

*Last automated update following merge: 2026-05-04 07:19:14*

*Last automated update following merge: 2026-05-04 07:21:10*

*Last automated update following merge: 2026-05-04 07:38:44*

*Last automated update following merge: 2026-05-15 01:57:19*

*Last automated update following merge: 2026-05-15 02:16:20*

*Last automated update following merge: 2026-06-18 04:34:34*
