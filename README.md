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

## Development Status

- **Current Phase:** Monorepo scaffold complete — backend entities, auth, CRUD modules, and sync endpoint are defined.
- **Next Steps:** Run database migrations, implement mobile UI screens, implement desktop UI.

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of all changes.
