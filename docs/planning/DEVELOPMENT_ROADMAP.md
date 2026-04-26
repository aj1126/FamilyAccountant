# FamilyAccountant — Remaining Development Roadmap

> **Scope:** This document covers ~90% of the remaining product work, catalogued from a live inspection of the codebase on 2026-04-26. It supersedes earlier ChatGPT scaffolding notes wherever they conflict with the actual repo state.

---

## 1. Current State Summary

| Package | Implementation Completeness | Notes |
|---|---|---|
| `backend` | ~75% | Auth, households, accounts, transactions, debts, payments, sync — all have CRUD + tests. Missing: real DB migrations, token-refresh interception, payment↔debt auto-settle, tighter cross-household guards. |
| `mobile` | ~50% | Auth bootstrap + household onboarding wired in `_layout.tsx`. Transactions list + add modal exists (SQLite + sync queue). Debts: **read-only**. Accounts: **missing**. Payments: **missing**. |
| `desktop` | ~45% | Auth bootstrap + household onboarding wired in `App.tsx`. Transactions list + add form + CSV export exists (better-sqlite3 via IPC). Debts: **read-only**. Accounts: **missing**. Payments: **missing**. Desktop sync only updates `syncStatus` — does not merge server-returned delta. |
| `shared` | ~70% | DTOs, types, SyncQueue, sync types. Sync contracts cover transactions only (not debts/accounts). No validation helpers. |
| `testing` | ~20% | Backend has Jest + ts-jest covering all modules. Mobile, desktop, and shared have **zero** automated tests. |
| `accessibility` | ~5% | No explicit labels, ARIA roles, or keyboard navigation in either client. |

---

## 2. Delivery Phases

### Phase 2 — Auth & Session Completeness (both clients)

**Goal:** ensure every launch correctly restores session state, then routes to the right screen.

#### 2.1 Desktop: blank first frame before bootstrap effect fires

**File:** `packages/desktop/src/App.tsx`

`loadTokens()` is synchronous — it reads from `localStorage`, calls Zustand `set()` synchronously, and then `setBootstrapped(true)` fires in the same effect tick. Because Zustand state updates are synchronous, the re-render that sets `bootstrapped = true` already sees the correct `accessToken` and `householdId` values; there is no stale-state bug in the current flow.

The real user-visible limitation is that `useEffect` runs **after the first paint**, so the app renders a blank screen (`return null`) for one frame before the effect fires and routing can happen. If `loadTokens` is ever made asynchronous (e.g. to validate the token server-side), the current pattern would also need to await it before setting `bootstrapped`.

**Fix:**
- For the blank-frame issue: initialise `bootstrapped` from a synchronous selector read at component construction time, or move the token read into a module-level Zustand `getState()` call before the component mounts.
- To future-proof against an async `loadTokens`: convert the `useEffect` to `await loadTokens()` and only call `setBootstrapped(true)` in the `finally` block, matching the mobile pattern in `_layout.tsx`.

#### 2.2 Desktop: `loadTokens` does not await hydrateUser

The desktop `login` and `register` actions call `hydrateUser(token)` (to fetch `userId` and `householdId` from `/users/me`), which works correctly. But `loadTokens` restores tokens from `localStorage` **without** re-fetching the user — so `householdId` is restored from the locally-stored string rather than re-validated with the server. This is fine for normal flow but breaks if the server-side household is deleted. Consider adding a lightweight `/users/me` call on `loadTokens` (or accepting the trade-off and documenting it).

#### 2.3 Both clients: silent token refresh interceptor

Neither client handles HTTP 401 responses from expired access tokens by automatically using the refresh token. The backend exposes `POST /auth/refresh`.

**Fix (mobile):**
- Add an Axios response interceptor in `packages/mobile/src/services/api.client.ts` that catches 401s, calls `/auth/refresh` with the stored `refreshToken`, persists the new `accessToken`, retries the original request, and falls back to logout on second failure.

**Fix (desktop):**
- Mirror the same Axios response interceptor pattern in `packages/desktop/src/services/api.client.ts`.

#### 2.4 Mobile: `loadFromDb` not called on app resume

The transaction store's `loadFromDb` is called lazily from individual screens. Add an `AppState`/`useEffect` hook (or Zustand middleware) in `_layout.tsx` to call `loadFromDb` on foreground resume so newly-synced data appears without a manual refresh.

---

### Phase 3 — Account Management (both clients)

**Goal:** users can create and select accounts; transactions are linked to accounts.

#### 3.1 Backend — already complete

`GET/POST/PUT/DELETE /accounts` all exist and are household-scoped. No backend work needed for this phase.

#### 3.2 Shared — AccountDTO for client use

Verify that `CreateAccountDto` and the `Account` type from `packages/shared/src/types/account.types.ts` are exported and usable in both clients (they already exist; just confirm they are wired into each client's imports).

#### 3.3 Mobile — Accounts screen

**Files to create:**
- `packages/mobile/app/(tabs)/accounts.tsx` — lists household accounts; FAB opens an "Add Account" modal.
- `packages/mobile/src/components/AddAccountModal.tsx` — name + type fields; calls `POST /accounts`.

**Files to update:**
- `packages/mobile/app/(tabs)/_layout.tsx` — add a fourth tab entry (`accounts.tsx`).
- `packages/mobile/src/components/AddTransactionModal.tsx` — add an account picker that fetches `GET /accounts` and lets the user choose (or leave blank for unlinked).

#### 3.4 Desktop — Accounts page

**Files to create:**
- `packages/desktop/src/pages/Accounts.tsx` — table of accounts with inline "New Account" form.

**Files to update:**
- `packages/desktop/src/App.tsx` — add `accounts` to the `Page` union and nav bar; render `<Accounts />`.
- `packages/desktop/src/pages/Transactions.tsx` — add an account selector `<select>` to the "Add Transaction" form; fetch `/accounts` with `useQuery`.

---

### Phase 4 — Debt & Payment Workflows (both clients)

**Goal:** users can record debts, mark them settled, and record partial payments.

#### 4.1 Backend — payment → debt auto-settle

**File:** `packages/backend/src/modules/payments/payments.service.ts`

After saving a new payment, query total payments against the debt. If the sum meets or exceeds the debt `amount`, automatically set `settled = true` on the debt. Add a corresponding test in `payments.service.spec.ts`.

#### 4.2 Mobile — create debt

**Files to update:**
- `packages/mobile/app/(tabs)/debts.tsx` — add a FAB; tapping it opens `AddDebtModal`.
- **File to create:** `packages/mobile/src/components/AddDebtModal.tsx` — description, amount, currency, direction (`owe_to` / `owed_by`); calls `POST /debts`.
- Add a "Settle" button on each debt row that calls `POST /debts/:id/settle`.

#### 4.3 Mobile — payment recording

- Add a "Record Payment" action on a debt detail view (long-press row or swipe action).
- **File to create:** `packages/mobile/src/components/RecordPaymentModal.tsx` — amount field; calls `POST /payments` with `debtId`.

#### 4.4 Desktop — create debt

**Files to update:**
- `packages/desktop/src/pages/Debts.tsx` — add an inline "New Debt" form above the table; calls `POST /debts` via `apiClient`. Add a "Settle" button per row.

#### 4.5 Desktop — payment recording

- Add a "Record Payment" button per debt row that opens a small modal; calls `POST /payments`.

---

### Phase 5 — Offline Sync Improvements

**Goal:** sync covers more than transactions; both clients merge server deltas correctly.

#### 5.1 Desktop: merge server delta after sync

**File:** `packages/desktop/src/stores/transaction.store.ts`

Current `syncWithServer` only calls `updateSyncStatus` per returned server transaction. It does **not** merge server-side transactions that originated on other devices (or the same device from a different session). Fix to upsert every item in `data.transactions` into the better-sqlite3 DB via IPC (parallel to the mobile approach) and call `loadFromDb` at the end.

**File to update:** `packages/desktop/electron/main.js` — add `ipcMain.handle('db:upsertTransaction', ...)` handler.

#### 5.2 Mobile: SQLite schema expansion

**File:** `packages/mobile/src/db/database.ts`

Add tables for `accounts`, `debts`, and `payments` so all domain data survives offline. Provide corresponding `INSERT OR REPLACE` helpers called from their respective stores.

#### 5.3 Desktop: SQLite schema expansion

**File:** `packages/desktop/electron/main.js`

Add `accounts`, `debts`, and `payments` tables with matching IPC handlers for each CRUD operation.

#### 5.4 Shared: extend SyncPayload

**File:** `packages/shared/src/sync/sync.types.ts`

Extend `SyncPayload` to optionally include `accounts`, `debts`, and `payments` arrays (with `lastSyncedAt` per entity or a single watermark). Update the backend `SyncService` and `SyncController` accordingly.

#### 5.5 Both clients: periodic background sync

Add a simple interval-based sync trigger (e.g. every 60 seconds when the app is in the foreground) in `_layout.tsx` (mobile) and `App.tsx` (desktop). Use `SyncQueue` to prevent overlapping requests.

---

### Phase 6 — Accessibility Hardening

**Goal:** every interactive element meets a baseline for older / low-tech-confidence users.

#### 6.1 Mobile baseline

For every `TouchableOpacity`, `TextInput`, and status badge:

- Add `accessibilityLabel` and `accessibilityHint` props.
- Ensure minimum 48 × 48 dp hit area (adjust `padding` or wrap with a larger `View`).
- Replace raw `Text` sync status strings with the `SyncStatusBadge` component (already built) everywhere they are missing.
- Add `accessibilityRole="button"` on all `TouchableOpacity` elements that act as buttons.

Screens to update: `login.tsx`, `register.tsx`, `household.tsx`, `index.tsx` (dashboard), `transactions.tsx`, `debts.tsx`, `accounts.tsx` (new).

#### 6.2 Desktop baseline

For every `<button>`, `<input>`, `<table>`:

- Add ARIA roles where semantic HTML does not already provide them.
- Ensure all `<button>` elements have visible `:focus` styles (currently missing — CSS sets no outline).
- Add `aria-label` to icon-only or ambiguous controls.
- Ensure the nav bar is keyboard-navigable with `Tab` and `Enter`.
- Add `role="status"` to the `SyncStatusBadge` component so screen readers announce sync state changes.

Files to update: `App.tsx` (nav), `Login.tsx`, `HouseholdOnboarding.tsx`, `Transactions.tsx`, `Debts.tsx`, `Accounts.tsx` (new), `Dashboard.tsx`, `SyncStatusBadge.tsx`.

#### 6.3 Empty and error states

Every list screen currently shows a plain text "No X yet" message. Replace with:
- A centred empty-state block with a short instruction (e.g. "Tap + to add your first transaction").
- Consistent error states with a retry button and an accessible error message.

---

### Phase 7 — Backend Hardening

**Goal:** production-safe database schema management and airtight household authorization.

#### 7.1 Replace `synchronize` with migrations

**Files to create:**
- `packages/backend/src/migrations/` directory.
- One migration file per entity, generated via TypeORM CLI (`typeorm migration:generate`).

**Files to update:**
- `packages/backend/src/app.module.ts` — set `synchronize: false` and add `migrations` array.
- CI workflow — add `typeorm migration:run` step before tests (or use `migrationsRun: true` in test config).

#### 7.2 Tighten household authorization guards

Current gap: several controllers pass `user.householdId!` with a non-null assertion; if a user has no household assigned they will hit an SQL error rather than a clean 403.

**Fix:**
- Create a `HouseholdGuard` (`packages/backend/src/common/guards/household.guard.ts`) that checks `user.householdId != null` and throws `ForbiddenException('Household membership required')` if absent.
- Apply `@UseGuards(JwtAuthGuard, HouseholdGuard)` on `AccountsController`, `TransactionsController`, `DebtsController`, `PaymentsController`, and `SyncController`.
- Remove all `!` assertions on `user.householdId` in service calls.

#### 7.3 `householdId == null` style in DebtsService

**File:** `packages/backend/src/modules/debts/debts.service.ts` line 26

`householdId == null` is logically correct — loose equality with `null` is `true` for both `null` and `undefined`, so the guard already handles both cases. The same pattern is used consistently across `AccountsService`, `TransactionsService`, and `PaymentsService`.

The only reason to change it would be to satisfy an `eqeqeq` ESLint rule that forbids loose equality. If that rule is enabled, replace with:

```ts
if (householdId === null || householdId === undefined)
```

This item has low priority; the primary deliverable in this phase is adding `HouseholdGuard` (7.2), which makes the service-level guard redundant anyway.

#### 7.4 Payments service: validate debt belongs to same household

**File:** `packages/backend/src/modules/payments/payments.service.ts`

Before saving a payment, confirm that the referenced `debtId` belongs to the caller's household. Add a `DebtsService.findOne()` call (or a direct repo look-up) and throw `ForbiddenException` if there is a mismatch.

---

### Phase 8 — Test Coverage Expansion

**Goal:** automated tests for the shared package and both clients; additional backend coverage for auth/session boundaries.

#### 8.1 Backend — additional test cases

| Module | Missing coverage |
|---|---|
| `auth` | Token refresh flow; 401 on expired token; duplicate email conflict |
| `households` | Join with invalid ID; create when already in a household |
| `payments` | Auto-settle when total meets debt amount; cross-household payment attempt |
| `sync` | Conflict resolution (server wins when `updatedAt` is newer); missing-household guard |
| `accounts` | Cross-household read attempt |

#### 8.2 Shared — SyncQueue tests

**File to create:** `packages/shared/src/sync/sync-queue.spec.ts`

Cover: enqueue + drain sequentially; concurrent enqueues serialise correctly; errors in one job do not block subsequent jobs.

**Update `packages/shared/package.json`:** add `"test": "jest"` script and Jest config (can mirror the backend pattern with `ts-jest`).

#### 8.3 Mobile — component and store tests

**Files to create:**
- `packages/mobile/src/stores/auth.store.spec.ts` — test `login`, `register`, `logout`, `loadTokens` with mocked SecureStore and apiClient.
- `packages/mobile/src/stores/transaction.store.spec.ts` — test `addTransaction`, `loadFromDb`, `syncWithServer` with mocked db and apiClient.
- `packages/mobile/src/components/AddTransactionModal.spec.tsx` — render + submit happy path and validation states.

**Update `packages/mobile/package.json`:** add `"test": "jest"` script and Jest/React Native Testing Library config.

#### 8.4 Desktop — component and store tests

**Files to create:**
- `packages/desktop/src/stores/auth.store.spec.ts` — test `login`, `register`, `logout`, `loadTokens` with mocked localStorage and apiClient.
- `packages/desktop/src/stores/transaction.store.spec.ts` — test `addTransaction`, `loadFromDb`, `syncWithServer` with mocked `window.electronAPI`.
- `packages/desktop/src/pages/Login.spec.tsx` — render login/register tabs; submit triggers correct store action.

**Update `packages/desktop/package.json`:** add `"test": "jest"` script and Jest/React Testing Library config (JSDOM environment).

---

## 3. Work Item Checklist (ordered by priority)

### Immediate (unblock core user journeys)

- [x] **2.1** Fix desktop bootstrap race in `App.tsx`
- [x] **2.3** Add 401 → refresh token interceptor to both clients
- [x] **3.3** Mobile: Accounts screen + tab entry
- [x] **3.4** Desktop: Accounts page + nav entry
- [x] **3.3 / 3.4** Add account picker to transaction forms on both clients
- [x] **4.2** Mobile: AddDebtModal + Settle button
- [x] **4.4** Desktop: New Debt form + Settle button

### Soon (complete first end-to-end workflows)

- [ ] **4.3** Mobile: RecordPaymentModal
- [ ] **4.5** Desktop: Record Payment button/modal
- [ ] **4.1** Backend: payment → debt auto-settle
- [ ] **5.1** Desktop: fix server-delta merge in `syncWithServer`
- [ ] **2.4** Mobile: reload store on foreground resume
- [ ] **5.5** Both clients: periodic 60-second background sync trigger

### Medium priority (offline completeness)

- [ ] **5.2** Mobile: expand SQLite schema (accounts, debts, payments tables)
- [ ] **5.3** Desktop: expand better-sqlite3 schema (same entities)
- [ ] **5.4** Shared: extend `SyncPayload` to cover accounts + debts + payments
- [ ] **7.1** Backend: replace `synchronize` with TypeORM migrations
- [ ] **7.2** Backend: `HouseholdGuard` + remove `!` assertions in controllers

### Lower priority (polish & safety)

- [ ] **6.1** Mobile: accessibility labels, hit targets, empty/error states
- [ ] **6.2** Desktop: ARIA, focus styles, keyboard nav
- [ ] **6.3** Both: consistent empty + error states on all list screens
- [ ] **7.3** Backend: fix loose `== null` in `DebtsService`
- [ ] **7.4** Backend: validate debt household in `PaymentsService`
- [ ] **2.2** Consider `loadTokens` re-validation via `/users/me` (desktop)

### Test coverage

- [ ] **8.1** Backend: additional spec cases (auth refresh, household boundary, payment auto-settle, sync conflict)
- [ ] **8.2** Shared: `SyncQueue` spec + Jest config
- [ ] **8.3** Mobile: store + component specs + Jest config
- [ ] **8.4** Desktop: store + component specs + Jest config

---

## 4. Cross-Cutting Constraints

- **Platform parity:** do not advance one client significantly ahead of the other on any core user journey (auth → household → accounts → transactions → debts → payments).
- **Offline-first:** every create/update action must write to local DB and enqueue sync before any network call.
- **Accessibility by default:** every new screen ships with labels, hit targets, and focus styles from the start — do not defer until Phase 6.
- **No new planning docs:** update this file and `README.md` in-place as phases move forward.
- **Branch strategy:** one feature branch per phase; squash-merge to `main` once CI passes.

---

## 5. Out of Scope (deferred beyond this roadmap)

- iOS support (app is Android-only by design)
- Multi-currency conversion (amounts stored in their original currency; display only)
- Cloud backup / hosted backend (PostgreSQL is local by design)
- Push notifications
- Recurring transactions / scheduled payments
- User roles / permissions within a household (everyone is equal for now)

---

*Last updated: 2026-04-26 — generated from live codebase inspection.*
