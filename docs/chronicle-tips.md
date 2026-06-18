# /chronicle tips — Personalized Session Checklist

Paste this at the start of each Copilot Coding Agent session to stay consistent with your best working patterns.

---

## ✅ Session Start Checklist

- [ ] **Search first, read second** — use `rg`/`glob` to locate the relevant files before opening them with `view`. Avoid reading files one-by-one until you know exactly which ones matter.
- [ ] **Define the change scope** — before any edit, state (even informally) the minimal set of files that need to change. Resist scope creep.
- [ ] **Request a Code Review pass early** — open a Copilot Code Review session *before* your final edits, not after. Catching issues earlier saves rework.
- [ ] **Batch independent tool calls** — whenever two or more reads, searches, or edits don't depend on each other, send them in the same turn to save time.

---

## ✅ Mid-Session Checkpoint

- [ ] **Run `report_progress` after every meaningful unit of work** — commit and push incrementally so progress is never lost.
- [ ] **Check for unintended side-effects** — after each edit, grep for other usages of the symbol/function you changed and verify they still hold.

---

## ✅ Session End Checklist

- [ ] **Secret scan** — run `runtime-tools-secret_scanning` on every modified file before the final commit.
- [ ] **CodeQL + Code Review** — run `parallel_validation` on the full diff. Address any actionable findings before closing the session.
- [ ] **Store new facts** — if you discovered a codebase convention, build/test command, or useful pattern, call `store_memory` so future sessions can benefit.

---

## 🕐 Best Times to Work (UTC)

| Window        | Suggested Focus        |
|---------------|------------------------|
| ~09:00 UTC    | Implementation (peak)  |
| ~23:00 UTC    | Review & cleanup (peak)|

---

## 🔁 Reuse Instructions

1. Copy the three checklists above into your session prompt or a sticky note.
2. Tick boxes as you progress.
3. Update this file via a PR whenever your habits change — run `/chronicle tips` again to get fresh recommendations.
