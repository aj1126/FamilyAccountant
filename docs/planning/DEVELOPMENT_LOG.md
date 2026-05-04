# FamilyAccountant — Development Log

> **Created:** 2026-05-04 — live codebase inspection.
> This log records what has shipped since the roadmap was last written (2026-04-26)
> and restates every remaining stage with the same step-level detail as the roadmap,
> so it can be used as a standalone progress tracker.

---

## 1. Work Completed Since Last Roadmap Update (2026-04-26 → 2026-05-04)

The following items from `DEVELOPMENT_ROADMAP.md` are now confirmed **done** via codebase inspection:

| ID | Item | Evidence |
|---|---|---|
| 2.1 | Desktop bootstrap race fixed | `App.tsx` calls `useAuthStore.getState().loadTokens()` at module level (before any React render), eliminating the blank-frame flash. |
| 2.3 | Silent 401 → token refresh interceptor (both clients) | Both `packages/mobile/src/services/api.client.ts` and `packages/desktop/src/services/api.client.ts` contain Axios response interceptors that call `/auth/refresh`, persist the new token, retry the original request, and fall back to logout on second failure. |
| 3.3 | Mobile — Accounts screen + tab entry | `packages/mobile/app/(tabs)/accounts.tsx` and `packages/mobile/src/components/AddAccountModal.tsx` exist; tab layout updated. |
| 3.4 | Desktop — Accounts page + nav entry | `packages/desktop/src/pages/Accounts.tsx` exists; `App.tsx` nav bar includes the Accounts button. |
| 3.3 / 3.4 | Account picker in transaction forms (both clients) | Mobile `AddTransactionModal` fetches `/accounts` and renders chip-style pickers. Desktop `Transactions` page has a `<select>` account dropdown. |
| 4.2 | Mobile — AddDebtModal + Settle button | `packages/mobile/src/components/AddDebtModal.tsx` exists; `debts.tsx` has FAB that opens it and per-row Settle button. |
| 4.4 | Desktop — New Debt inline form + Settle button | `packages/desktop/src/pages/Debts.tsx` has an inline "Record Debt" form and per-row Settle button. |

---

## 2. Remaining Stages

### Phase 2 — Auth & Session (partially complete)

Only items 2.3 and 2.1 are done. The following remain:

#### 2.2 Desktop: `loadTokens` does not re-validate household with server

`loadTokens` in the desktop auth store restores `householdId` from `localStorage` without calling `/users/me` to confirm the household still exists server-side. If the household is deleted server-side the desktop client will silently operate with a stale `householdId`.

**Steps:**
- In `packages/desktop/src/stores/auth.store.ts`, after restoring tokens from `localStorage` in `loadTokens`, add a lightweight `GET /users/me` call.
- If it fails (401 or network error), clear tokens and redirect to login.
- If it succeeds, update `userId` and `householdId` from the server response to ensure they are fresh.
- This is low priority — acceptable to defer if the trade-off is documented.

#### 2.4 Mobile: `loadFromDb` not called on foreground resume

The transaction store's `loadFromDb` is only called when the Transactions screen mounts. If the user backgrounds the app and another device syncs new transactions, they will not appear until the user navigates away and back.

**Steps:**
- In `packages/mobile/app/_layout.tsx`, import `AppState` from `react-native`.
- Add a `useEffect` that subscribes to `AppState` change events.
- When the state changes from `background`/`inactive` to `active`, call `useTransactionStore.getState().loadFromDb()`.
- Unsubscribe in the effect cleanup to avoid memory leaks.

---

### Phase 4 — Debt & Payment Workflows (partially complete)

Items 4.2 and 4.4 (create debt on both clients) are done. The following remain:

#### 4.1 Backend: payment → debt auto-settle

**File:** `packages/backend/src/modules/payments/payments.service.ts`

After saving a new payment, the service should automatically mark the linked debt as settled if the cumulative payment amount meets or exceeds the debt total.

**Steps:**
- Inject `DebtEntity` repository (or `DebtsService`) into `PaymentsService`.
- After `this.repo.save(payment)`, query the sum of all payments for `dto.debtId`.
- Compare the total against the debt's `amount`.
- If `total >= debt.amount`, set `debt.settled = true` and save the debt entity.
- Add a test case in `packages/backend/src/modules/payments/payments.service.spec.ts` covering the auto-settle path.

#### 4.3 Mobile: RecordPaymentModal

**Files to create:**
- `packages/mobile/src/components/RecordPaymentModal.tsx` — modal with a single amount field; calls `POST /payments` with the `debtId`.

**Files to update:**
- `packages/mobile/app/(tabs)/debts.tsx` — add a "Record Payment" action on each unsettled debt row (long-press or a secondary button); pass the debt's `id` to `RecordPaymentModal` and invalidate the `['debts']` query on success.

#### 4.5 Desktop: Record Payment button/modal

**Files to update:**
- `packages/desktop/src/pages/Debts.tsx` — add a "Record Payment" button to each unsettled row in the debts table.
- Implement an inline modal or expandable row form that accepts an amount and calls `POST /payments` via `apiClient`.
- Invalidate the `['debts']` query on success.

---

### Phase 5 — Offline Sync Improvements

#### 5.1 Desktop: merge server delta after sync

**File:** `packages/desktop/src/stores/transaction.store.ts`

The current `syncWithServer` only updates `syncStatus` for transactions that were sent from this device. It does not ingest server-side transactions that originated on other devices.

**Steps:**
- After receiving `data.transactions` from `POST /sync`, upsert every returned transaction into the better-sqlite3 database via a new IPC call (e.g. `db:upsertTransaction`).
- **File to update:** `packages/desktop/electron/main.js` — add an `ipcMain.handle('db:upsertTransaction', ...)` handler that runs `INSERT OR REPLACE INTO transactions ...`.
- **File to update:** `packages/desktop/electron/preload.js` — expose `upsertTransaction` on `window.electronAPI`.
- Call `get().loadFromDb()` at the end of `syncWithServer` (already present) to refresh the React state.

#### 5.2 Mobile: SQLite schema expansion

**File:** `packages/mobile/src/db/database.ts`

Only the `transactions` table is created. Accounts, debts, and payments are fetched from the API on every mount with no local persistence.

**Steps:**
- Add `CREATE TABLE IF NOT EXISTS accounts (...)` covering: `id`, `householdId`, `name`, `type`, `balance`, `currency`, `createdAt`, `updatedAt`.
- Add `CREATE TABLE IF NOT EXISTS debts (...)` covering: `id`, `householdId`, `description`, `amount`, `currency`, `direction`, `settled`, `creditorId`, `debtorId`, `createdAt`, `updatedAt`.
- Add `CREATE TABLE IF NOT EXISTS payments (...)` covering: `id`, `householdId`, `debtId`, `amount`, `currency`, `paidAt`, `createdAt`.
- Add `INSERT OR REPLACE` helper functions for each table, called from their respective stores when data is fetched from the server or created locally.

#### 5.3 Desktop: SQLite schema expansion

**File:** `packages/desktop/electron/main.js`

Mirrors 5.2 for better-sqlite3.

**Steps:**
- Add `accounts`, `debts`, and `payments` table creation in `initDatabase()`.
- Add `ipcMain.handle` entries for CRUD operations on each new table (at minimum get-all and upsert).
- Expose the new handlers in `packages/desktop/electron/preload.js`.
- Update the `Window.electronAPI` TypeScript declaration in each store file that needs the new methods.

#### 5.4 Shared: extend SyncPayload

**File:** `packages/shared/src/sync/sync.types.ts`

`SyncPayload` and `SyncResponse` currently only cover `transactions`.

**Steps:**
- Add optional `accounts?: Account[]`, `debts?: Debt[]`, and `payments?: Payment[]` fields to both `SyncPayload` and `SyncResponse`.
- Import the required types from `packages/shared/src/types/`.
- Update `packages/backend/src/modules/sync/sync.service.ts` to read and return these new fields from the respective repositories.
- Update `packages/backend/src/modules/sync/sync.controller.ts` if the request/response DTOs need updating.
- Update both client sync calls (`transaction.store.ts` on desktop, `transaction.store.ts` on mobile) to include pending accounts/debts/payments in the payload and merge returned data.

#### 5.5 Both clients: periodic background sync

**Steps (mobile):**
- In `packages/mobile/app/_layout.tsx`, set up a `setInterval` inside a `useEffect` (after bootstrap) that calls `useTransactionStore.getState().syncWithServer(lastSyncedAt)` every 60 seconds.
- Use the existing `SyncQueue` to prevent overlapping requests (already used by `addTransaction`).
- Clear the interval in the effect cleanup.

**Steps (desktop):**
- In `packages/desktop/src/App.tsx`, add a `useEffect` that sets up a 60-second interval calling `useTransactionStore.getState().syncWithServer(null)`.
- Guard with `isAuthenticated` check so the interval only runs when a valid session exists.
- Clear the interval on cleanup.

---

### Phase 6 — Accessibility Hardening

#### 6.1 Mobile baseline

Screens to update: `login.tsx`, `register.tsx`, `household.tsx`, `index.tsx`, `transactions.tsx`, `debts.tsx`, `accounts.tsx`.

**Steps for each screen:**
- Add `accessibilityLabel` and `accessibilityHint` to every `TouchableOpacity`.
- Add `accessibilityRole="button"` to all `TouchableOpacity` elements acting as buttons.
- Ensure minimum 48 × 48 dp hit area via `padding` or a wrapping `View` with `minHeight`/`minWidth`.
- Replace any raw `Text` sync status strings with `<SyncStatusBadge>` (the component already exists in `packages/mobile/src/components/SyncStatusBadge.tsx`).
- Add `accessibilityLabel` to every `TextInput`.

#### 6.2 Desktop baseline

Files to update: `App.tsx` (nav), `Login.tsx`, `HouseholdOnboarding.tsx`, `Transactions.tsx`, `Debts.tsx`, `Accounts.tsx`, `Dashboard.tsx`, `SyncStatusBadge.tsx`.

**Steps:**
- Add `aria-label` to every `<button>` that does not have visible text, or where the visible text is ambiguous.
- Add `:focus` outline CSS — currently no focus ring is visible, which fails WCAG 2.4.7. Add `outline: '2px solid #2563eb'` in a global stylesheet or via inline `:focus` pseudo-class workaround.
- Add `role="status"` and `aria-live="polite"` to `SyncStatusBadge` so screen readers announce state changes.
- Ensure the top nav bar is keyboard-navigable: each `<button>` must be reachable by `Tab` and activatable by `Enter`/`Space` (standard HTML buttons already handle this; verify no `tabIndex={-1}` is inadvertently set).
- Add `<table>` with proper `<thead>`, `<th scope="col">`, and `<th scope="row">` usage on every data table.

#### 6.3 Empty and error states (both clients)

Every list screen currently shows only a plain text "No X yet" or nothing at all.

**Steps:**
- Define a shared `EmptyState` component (mobile) and a `<div>` pattern (desktop) with a centred icon placeholder, a short instruction (e.g. "Tap + to record your first debt"), and consistent styling.
- Define a shared `ErrorState` component / pattern with an error message and a "Retry" button.
- Apply to: Transactions, Debts, Accounts, and Dashboard on both clients.

---

### Phase 7 — Backend Hardening

#### 7.1 Replace `synchronize: true` with TypeORM migrations

**Current state:** `app.module.ts` uses `synchronize: config.get<string>('NODE_ENV') !== 'production'` — schema sync is on in development and off in production. No migration files exist.

**Steps:**

1. **Create `packages/backend/src/data-source.ts`** — TypeORM 0.3.x requires a standalone `DataSource` instance for the CLI (the `TypeOrmModule.forRootAsync` config in `app.module.ts` is not readable by the CLI). The file should load the same env vars used at runtime:

   ```ts
   // packages/backend/src/data-source.ts
   import 'reflect-metadata';
   import { DataSource } from 'typeorm';
   import * as dotenv from 'dotenv';
   dotenv.config();

   export const AppDataSource = new DataSource({
     type: 'postgres',
     url: process.env.DATABASE_URL,
     entities: [__dirname + '/entities/*.entity.{ts,js}'],
     migrations: [__dirname + '/migrations/*.{ts,js}'],
     synchronize: false,
   });
   ```

2. **Add `typeorm` and `ts-node` CLI scripts** to `packages/backend/package.json`:

   ```json
   "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/data-source.ts",
   "migration:generate": "pnpm typeorm migration:generate",
   "migration:run": "pnpm typeorm migration:run",
   "migration:revert": "pnpm typeorm migration:revert"
   ```

   `ts-node` and `tsconfig-paths` are already available as transitive dev dependencies via `@nestjs/cli`; add them explicitly to `devDependencies` if `pnpm` does not hoist them.

3. **Generate the initial migration** from inside `packages/backend/`:

   ```sh
   pnpm migration:generate src/migrations/InitialSchema
   ```

   This produces `src/migrations/<timestamp>-InitialSchema.ts` reflecting the current entity definitions.

4. **Update `app.module.ts`** — set `synchronize: false` unconditionally and register the migrations path:

   ```ts
   synchronize: false,
   migrations: [__dirname + '/migrations/*.js'],
   migrationsRun: true,
   ```

5. **CI workflow** — the `migrationsRun: true` flag above will run pending migrations automatically on startup during tests, so no separate `migration:run` CI step is needed. If `migrationsRun` is left `false`, add `pnpm --filter backend migration:run` before the Jest step in `.github/workflows/ci.yml`.

6. Update `.env.example` to document any new `DATABASE_URL` format requirements if they change.

#### 7.2 HouseholdGuard + remove `!` assertions

**Current state:** controllers use `user.householdId!` with TypeScript non-null assertions. If a user has no household, this causes an SQL error rather than a clean 403.

**Steps:**
- Create `packages/backend/src/common/guards/household.guard.ts` implementing `CanActivate`.
  - Read `request.user.householdId`.
  - If absent or null/undefined, throw `new ForbiddenException('Household membership required')`.
- Apply `@UseGuards(JwtAuthGuard, HouseholdGuard)` on: `AccountsController`, `TransactionsController`, `DebtsController`, `PaymentsController`, `SyncController`.
- Remove the `!` non-null assertions on `householdId` in those controllers' method signatures.
- The service-level `if (householdId == null) throw ForbiddenException` guards then become a defence-in-depth backstop rather than the primary check.

#### 7.3 `householdId == null` loose equality in DebtsService

**File:** `packages/backend/src/modules/debts/debts.service.ts` line ~26

Low priority — loose equality (`== null`) correctly catches both `null` and `undefined`. Only needs changing if the ESLint `eqeqeq` rule is enforced.

**Steps (if applicable):**
- Replace `if (householdId == null)` with `if (householdId === null || householdId === undefined)`.
- Apply the same change consistently across `AccountsService`, `TransactionsService`, and `PaymentsService` for uniformity.

#### 7.4 PaymentsService: validate debt belongs to same household

**File:** `packages/backend/src/modules/payments/payments.service.ts`

`create()` saves a payment against any `debtId` without verifying the debt belongs to the caller's household.

**Steps:**
- Inject `DebtEntity` repository (or `DebtsService`) into `PaymentsService`.
- At the top of `create()`, fetch the referenced debt and compare its `householdId` with the caller's `householdId`.
- Throw `new ForbiddenException('Access denied')` if they differ.
- Add a test case in `payments.service.spec.ts` verifying the cross-household rejection.

---

### Phase 8 — Test Coverage Expansion

#### 8.1 Backend: additional test cases

| Module | Cases to add |
|---|---|
| `auth` | Token refresh flow (valid refresh token returns new access token); 401 on expired/invalid access token; `register` with duplicate email returns 409. |
| `households` | `join` with a non-existent invite code; `create` when the user is already in a household. |
| `payments` | Auto-settle: after a payment brings the total to or above the debt amount, `debt.settled` becomes `true`. Cross-household payment attempt returns 403. |
| `sync` | Conflict resolution (server-side record wins when `updatedAt` is newer than client submission). Missing-household guard test. |
| `accounts` | Cross-household read attempt returns 403. |

**Files to update:** the relevant `*.spec.ts` files in each module directory.

#### 8.2 Shared: SyncQueue unit tests

**File to create:** `packages/shared/src/sync/sync-queue.spec.ts`

**Steps:**
- Add `jest` and `ts-jest` dev dependencies to `packages/shared/package.json`.
- Add a `"test": "jest"` script and a `jest` config block (mirror the backend pattern: `ts-jest` preset, `tsconfig.json`).
- Write tests covering:
  - Single job enqueues and executes.
  - Multiple sequential jobs all complete in order.
  - A job that throws does not block subsequent jobs.
  - Concurrent `enqueue` calls serialize execution (second job does not start until first resolves).

#### 8.3 Mobile: store and component tests

**Files to create:**
- `packages/mobile/src/stores/auth.store.spec.ts` — test `login`, `register`, `logout`, and `loadTokens` with mocked `SecureStore` and `apiClient`.
- `packages/mobile/src/stores/transaction.store.spec.ts` — test `addTransaction`, `loadFromDb`, and `syncWithServer` with mocked SQLite db and `apiClient`.
- `packages/mobile/src/components/AddTransactionModal.spec.tsx` — render the modal; submit with valid data; verify `addTransaction` is called; verify error state on invalid input.

**Files to update:**
- `packages/mobile/package.json` — add `"test": "jest"` script and Jest config using `jest-expo` preset and React Native Testing Library.

#### 8.4 Desktop: store and component tests

**Files to create:**
- `packages/desktop/src/stores/auth.store.spec.ts` — test `login`, `register`, `logout`, and `loadTokens` with mocked `localStorage` and `apiClient`.
- `packages/desktop/src/stores/transaction.store.spec.ts` — test `addTransaction`, `loadFromDb`, and `syncWithServer` with mocked `window.electronAPI`.
- `packages/desktop/src/pages/Login.spec.tsx` — render login/register tabs; submit triggers correct store action; error state is displayed on failed login.

**Files to update:**
- `packages/desktop/package.json` — add `"test": "jest"` script and Jest config using `ts-jest` with a JSDOM environment and React Testing Library.

---

## 3. Remaining Work Item Checklist (ordered by priority)

### Soon (complete first end-to-end workflows)

- [ ] **4.3** Mobile: `RecordPaymentModal` + "Record Payment" action on debt rows
- [ ] **4.5** Desktop: "Record Payment" button + modal on debt rows
- [ ] **4.1** Backend: payment → debt auto-settle in `PaymentsService`
- [ ] **5.1** Desktop: upsert server-delta transactions in `syncWithServer`
- [ ] **2.4** Mobile: reload store on foreground resume (`AppState` listener in `_layout.tsx`)
- [ ] **5.5** Both clients: periodic 60-second background sync trigger

### Medium priority (offline completeness)

- [ ] **5.2** Mobile: expand SQLite schema — add `accounts`, `debts`, `payments` tables
- [ ] **5.3** Desktop: expand better-sqlite3 schema — same entities + IPC handlers
- [ ] **5.4** Shared: extend `SyncPayload` / `SyncResponse` to include accounts, debts, payments
- [ ] **7.1** Backend: replace `synchronize` with TypeORM migration files
- [ ] **7.2** Backend: `HouseholdGuard` guard class + remove `!` assertions in controllers

### Lower priority (polish & safety)

- [ ] **6.1** Mobile: accessibility labels, hit targets, empty/error states on all screens
- [ ] **6.2** Desktop: ARIA attributes, focus ring CSS, keyboard nav on all pages
- [ ] **6.3** Both: consistent `EmptyState` and `ErrorState` components on all list screens
- [ ] **7.3** Backend: replace loose `== null` with strict checks in `DebtsService` (ESLint compliance)
- [ ] **7.4** Backend: validate `debtId` household ownership in `PaymentsService.create()`
- [ ] **2.2** Desktop: re-validate `householdId` via `/users/me` on `loadTokens` (low priority)

### Test coverage

- [ ] **8.1** Backend: additional spec cases (auth refresh, household boundary, payment auto-settle, sync conflict, cross-household account read)
- [ ] **8.2** Shared: `SyncQueue` spec file + Jest config in `packages/shared/package.json`
- [ ] **8.3** Mobile: auth + transaction store specs + `AddTransactionModal` spec + Jest config
- [ ] **8.4** Desktop: auth + transaction store specs + `Login` page spec + Jest config

---

## 4. Cross-Cutting Constraints (unchanged)

- **Platform parity:** do not advance one client significantly ahead of the other on any core user journey.
- **Offline-first:** every create/update action must write to local DB and enqueue sync before any network call.
- **Accessibility by default:** every new screen ships with labels, hit targets, and focus styles from the start.
- **No new planning docs:** update the roadmap and this log in-place as phases move forward.
- **Branch strategy:** one feature branch per phase; squash-merge to `main` once CI passes.

---

*Last updated: 2026-05-04 — generated from live codebase inspection.*
