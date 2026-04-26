# FamilyAccountant Repo Plan

## 1. Purpose

Keep this file aligned with the live repository, not the original scaffold concept. The codebase is already a pnpm/Turborepo monorepo with backend, mobile, desktop, and shared packages, so planning should describe the current implementation state and the next delivery order.

## 2. Verified Repository State

### Monorepo

- `packages/backend` — NestJS REST API with TypeORM and PostgreSQL
- `packages/mobile` — Expo / React Native Android client
- `packages/desktop` — React + Vite + Electron Windows client
- `packages/shared` — shared DTOs, types, and sync contracts

### Current strengths

- Backend is the most complete layer and already contains auth plus CRUD-oriented feature modules.
- Shared contracts are in place and consumed across packages.
- Mobile and desktop both use local state stores and local persistence foundations.

### Current gaps

- Mobile defines `loadTokens()` and `initDatabase()` but they are not currently wired into app startup.
- Desktop defines `loadTokens()` but it is not currently wired into app startup.
- Household onboarding is missing from the post-auth flow even though household context is required for meaningful finance actions.
- Offline-first behavior is strongest around transactions and is not yet complete for accounts, debts, and payments.
- Accessibility is not yet treated as a first-class product requirement in the current UI.
- The backend still depends on TypeORM `synchronize` outside production; migrations are still pending.

## 3. Product Decisions Locked In

- The next implementation session should target **parity on both mobile and desktop**, not a single-platform-first approach.
- Accessibility should assume a **large text / reduced precision / keyboard-first / low cognitive load** baseline from the next session onward.
- Existing primary docs should be updated in place instead of creating new planning files.
- Remaining requirements should be mirrored into GitHub planning/work tracking before or alongside implementation when tooling allows.

## 4. Delivery Order

> **Note:** The detailed breakdown of remaining work — with specific files, code locations, and a prioritised checklist — lives in [`docs/planning/DEVELOPMENT_ROADMAP.md`](../DEVELOPMENT_ROADMAP.md). The phases below summarise the sequence; refer to that document for implementation specifics.

### Phase 1 — Repo and planning alignment ✅ Complete

- README, CHANGELOG, and planning docs are synchronised with the live repo.
- Remaining work is catalogued in `DEVELOPMENT_ROADMAP.md`.

### Phase 2 — Auth/session completeness (both clients)

- Fix desktop bootstrap race (`App.tsx` marks `bootstrapped` before auth state resolves).
- Add 401 → refresh-token Axios interceptor on both clients.
- Wire `loadFromDb` call on mobile foreground resume.

### Phase 3 — Accounts + first polished finance workflow

- Mobile: add Accounts tab (list + create modal) and account picker in Add Transaction.
- Desktop: add Accounts page and account selector in transaction form.
- Backend accounts CRUD is already complete; no backend work needed here.

### Phase 4 — Debts and payments

- Mobile: AddDebtModal, Settle button, RecordPaymentModal.
- Desktop: New Debt inline form, Settle button, Record Payment modal.
- Backend: auto-settle debt when payments reach full amount; validate debt household on payment create.

### Phase 5 — Offline sync improvements

- Desktop: fix `syncWithServer` to merge server-returned transaction delta into better-sqlite3.
- Both clients: expand local DB schema to cover accounts, debts, and payments.
- Shared: extend `SyncPayload` type to include accounts, debts, and payments.
- Both clients: add 60-second periodic background sync trigger.

### Phase 6 — Accessibility hardening

- Mobile: `accessibilityLabel` / `accessibilityHint` on every interactive element; minimum 48 dp hit targets.
- Desktop: ARIA roles, visible `:focus` styles, keyboard navigation.
- Both: consistent empty-state and error-state UI on every list screen.

### Phase 7 — Backend hardening

- Replace TypeORM `synchronize` with real migrations.
- Add `HouseholdGuard` to all household-scoped controllers; remove `!` non-null assertions.
- Fix loose `== null` check in `DebtsService`; validate debt household in `PaymentsService`.

### Phase 8 — Dedicated test expansion

- Backend: auth refresh, household-boundary edge cases, payment auto-settle, sync conflict resolution.
- Shared: `SyncQueue` unit tests + Jest config.
- Mobile/Desktop: store tests, key component tests, Jest config for each package.

## 5. Working Rules for Future Sessions

- Update `README.md` development status as phases move forward.
- Keep this file and the imported planning document aligned with repo reality.
- Avoid adding new planning docs unless existing docs cannot hold the needed context.
- Treat backend as the reference implementation, but do not advance one client far ahead of the other on core user journeys.
