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

### Phase 1 — Repo and planning alignment

- Keep README and existing planning docs synchronized with the live repo.
- Translate remaining work into explicit tracked backlog items.

### Phase 2 — Auth/session bootstrap + household onboarding

- Run persisted auth bootstrap during app startup on both clients.
- Run local database initialization during mobile startup.
- Add create-household / join-household onboarding immediately after auth.
- Prevent transaction and account flows from assuming household context before onboarding is complete.

### Phase 3 — Accounts + first polished finance workflow

- Finish account management.
- Make transaction create/list/sync the first polished household workflow.
- Preserve parity between mobile and desktop while doing so.

### Phase 4 — Debts and payments

- Complete debt tracking and payment flows after the transaction path is stable.
- Extend offline behavior only after the primary transaction workflow is reliable.

### Phase 5 — Accessibility hardening

- Increase target sizes and reduce dense layouts.
- Add explicit mobile accessibility labels and hints.
- Improve desktop semantics and keyboard navigation.
- Prefer calmer, simpler flows with clearer status messaging.

### Phase 6 — Backend hardening

- Replace `synchronize` with real migrations.
- Tighten household authorization and cross-household access rules.
- Re-check null-household behavior across API boundaries.

### Phase 7 — Dedicated test expansion

- Backend: onboarding, auth/session flows, authorization boundaries, sync conflicts
- Shared: sync queue behavior and validation/format helpers
- Mobile/Desktop: auth bootstrap, onboarding, transaction flows, and accessibility-critical states

## 5. Working Rules for Future Sessions

- Update `README.md` development status as phases move forward.
- Keep this file and the imported planning document aligned with repo reality.
- Avoid adding new planning docs unless existing docs cannot hold the needed context.
- Treat backend as the reference implementation, but do not advance one client far ahead of the other on core user journeys.
