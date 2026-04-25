$readmeContent = @"
# Family Home Finances App

## Overview
A cross-platform home finance management application designed for multiple users (families, roommates, small groups). It tracks debts, credits, accounts, cards, and payments while seamlessly syncing across Windows 11 and Android environments.

## Key Features
* **Multi-User Collaboration:** Shared household workspaces with role-based access (Admin/Member) and per-person expense tracking (e.g., assigning transactions to specific family members).
* **Comprehensive Tracking:** Manage bank accounts, cash, credit cards, digital wallets, debts (internal & external), and recurring payments.
* **Offline-First Synchronization:** Robust offline support using a local SQLite cache and a queue-based sync engine with last-write-wins and additive transactions.

## Architecture & Tech Stack
* **Frontend:** React Native (Android) / React + Electron (Windows 11)
* **Backend:** Node.js (NestJS) with REST API and JWT authentication
* **Database:** PostgreSQL (Remote Source of Truth) + SQLite (Local Device Cache)
* **State Management:** Zustand for lightweight, offline-friendly state handling

## Project Structure
* `docs/planning/` - Core architectural decisions, imported planning logs, and schema blueprints.
* `src/` - Primary application source code containing backend modules, frontend state, and sync logic.

## Development Status
* **Current Phase:** First working system prototype. Core relational entities, API endpoints, Zustand state, and initial offline queue logic are in place.
* **Next Iteration:** - Full Accounts module (CRUD + UI)
  - Complete Debts & Payments system
  - Persistent local DB integration (SQLite)
  - Conflict resolution handling
  - Authentication UI & flow
"@

# Overwrite the existing README.md at the repository root
Set-Content -Path "README.md" -Value $readmeContent -Encoding UTF8

# Stage, commit, and push the documentation update
git add README.md
git commit -m "docs: comprehensive README update based on planning documents"
git push origin Chore-Import_ChatGPTcontent