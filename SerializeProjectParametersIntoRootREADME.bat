# 1. Define the updated README payload based on current architectural documentation
$readmeContent = @"
# Family Home Finances App

## Overview
A cross-platform home finance management application engineered for multi-user synchronization (families, roommates, small groups). The system tracks relational debts, credits, and distributed account balances across Windows and Android environments.

## Architecture
* **Frontend:** React Native (Android) / React + Electron (Windows)
* **Backend:** Node.js (NestJS) REST API
* **Database Layer:** PostgreSQL (Remote Source of Truth) + SQLite (Local Device Cache)
* **State & Sync:** Zustand state management coupled with an offline-first, additive-transaction sync engine (last-write-wins queueing).

## Project Structure
* `docs/planning/` - Core architectural decisions, imported AI conversation logs, and schema blueprints.
* `src/` - Primary application source code.

## Development Status
* **Current Phase:** First working system prototype (Backend auth base, API endpoints, relational entities).
* **Next Iteration:** Implementation of full Accounts module (CRUD/UI), Debt/Payment system, and persistent local DB initialization.
"@

# 2. Overwrite the existing README.md at the repository root
Set-Content -Path "README.md" -Value $readmeContent -Encoding UTF8

# 3. Stage, commit, and push the documentation update
git add README.md
git commit -m "docs: synchronize README with current multi-platform architecture specs"
git push origin Chore-Import_ChatGPTcontent