Project: Finance / FamilyAccountant

# SPEC -- FA-deps: clear FamilyAccountant's critical and high Dependabot alerts (pnpm overrides, electron-builder 26, @expo/cli tar patch, npm lockfile removed) (NX-326, github-sweep-2026-10-16 GS-4)

**Implementer:** Claude Sonnet in a sub1 **cloud** session (environment `cc16-custom`, Linux). Transcription only: every changed
line is in `fa-deps.patch`; you decide nothing. Every command below is plain `sh` + `git` + `pnpm` + `node` (no PowerShell).
**Repo:** `aj1126/FamilyAccountant` (flow: branch -> PR to `preview`; AJ merges). The cloud session starts on branch
`cloud/fa-deps-input`, which holds this spec and its inputs under `docs/cloud/fa-deps/`. You build on a **separate worktree** cut
from `origin/preview`; the input branch is never merged anywhere.
**Base:** whatever `origin/preview` is when T0 runs, provided T0's three gate lines hold: D3 (the client typecheck job, FA PR from
`fix/d3-csp-readme-typecheck`, NX-600/601) is merged, and no manifest or lockfile moved since `b7ddc5a` (the commit the patch was
built on). T0 prints the SHA; it is this run's pin.
**Work branch:** `claude/fa-deps-alerts` (created in T1 with no upstream; pushed in P1, no PR). Cloud sessions may push only
`claude/<slug>` branches (cloud-credit-plan.md CC-5 note; #696 pushed `claude/web-p1p3-build`). If the push is refused, stop and
paste the error.
**Inputs** (`docs/cloud/fa-deps/` on `cloud/fa-deps-input`; SHA-256, first 16 hex):

| File | Bytes | SHA-256/16 | What |
|---|---|---|---|
| `fa-deps.patch` | 206176 | `eb0306b1108d4286` | the whole change: `git diff --binary b7ddc5a..2548b0a` (6 files, +1075 / -2584) |
| `check-mobile-tooling.cjs` | 5378 | `2b6be02364e1cda8` | V5: proves the Expo 51 tooling works on the overridden majors (12 checks, built-in control C3) |
| `commit-msg.txt` | 1399 | `7093ce7fc2a1872a` | the commit message (C1) |

**Written:** 2026-10-28, Opus 5.5 high (sub1, NX-326). The patch was built and run by Opus in a Windows worktree of `b7ddc5a`
(pnpm 9.1.0, Node 22.16): CI's lint, build and test-backend (with and without Postgres), D3's two typecheck commands, the mobile
check, `pnpm audit`, `electron-builder --dir` and a packaged desktop launch. It was then applied to a local merge of
`origin/preview` + `fix/d3-csp-readme-typecheck` (`2704d37`, the stand-in for post-D3 preview) and every V-step passed there; the
EXPECT lines are those results. The sh text of T0-C1 was rehearsed verbatim in **Git Bash on Windows** (not Linux: no Linux runtime
on this machine); a Linux-only difference is a stop-and-report, not a fix.
**Decisions recorded:** NX-326 grill G-1..G-3 (2026-10-28 06:55, plan `local-sess-sub1-cc-326-start-quizzical-wigderson.md`).

## Why

On 2026-10-28 `aj1126/FamilyAccountant` had 125 open Dependabot alerts: 3 critical, 69 high, 38 medium, 15 low (108 from
`pnpm-lock.yaml`, 10 from a stale root `package-lock.json`, 7 from `packages/desktop/package.json`). Every critical and high is a
transitive dependency, so no single Dependabot PR clears them. `pnpm audit` at `b7ddc5a`: 3 critical, 91 high.

## The rule (decided by Opus; do not change)

| # | Decision | Source (fetched / run 2026-10-28) |
|---|---|---|
| R1 | Same-major fixes go in root `package.json` `pnpm.overrides` as `"<pkg>@<vulnerable range>": "^<first patched>"` (range selector, so only the vulnerable copies move). | pnpm 9.x docs `package_json.md` "pnpm.overrides" (pnpm/pnpm.io `versioned_docs_archived/version-9.x`): `"bar@^2.1.0": "3.0.0"`; "the overrides field can only be set at the root of the project". **Executed:** every override resolved as listed in the table below |
| R2 | desktop `electron-builder` ^24.13.3 -> ^26.18.0 (fixes app-builder-lib, builder-util-runtime, tmp, desktop's tar). | electron-builder v26.0.0 release "Major Changes": HFS+ dmg removed, `winOptions`/`macOptions` deprecated fields removed, `desktop` property becomes an object, node_modules in subdirectories -- FA's `build` block (nsis / dmg / AppImage, no signing, no `desktop`) uses none. v25.0.0 notes list no breaking change. **Executed:** `electron-builder --dir` packages; the packaged app opens its window ("FamilyAccountant") with better-sqlite3 rebuilt for Electron 41.10.6 |
| R3 | desktop `concurrently` ^10.0.5 -> ^10.0.6 (its pinned `shell-quote` 1.9.0 -> 1.12.0: critical GHSA-pqg4-j6r4-53mv). | `npm view concurrently@10.0.6 dependencies`: `"shell-quote": "1.12.0"` |
| R4 | tar 6 -> 7 for everything (`tar@<7.5.21`), plus `pnpm patch` of `@expo/cli@0.18.31`: its `utils/tar.js` and `utils/npm.js` load tar through Babel's `_interopRequireDefault`; tar 7 is ESM-flagged (`__esModule`) with no default export, so `_tar().default.extract` throws. The patch replaces that one expression with `{ default: require("tar") }` in both files. Retire the patch with the Expo SDK upgrade. | tar CHANGELOG 7.0: "Rewrite in TypeScript, provide ESM and CommonJS hybrid interface". **Executed:** unpatched + tar 7 -> C5/C6 "Cannot read properties of undefined (reading 'extract')"; patched -> 12/12. Only consumers of tar 6 at base: `@expo/cli@0.18.31`, `app-builder-lib@24.13.3`, `cacache@18.0.4` (lists tar, requires it nowhere in `lib/`) |
| R5 | Two more majors under Expo 51 are taken because the consumer's call still works: `@xmldom/xmldom` 0.7 -> 0.8 (`@expo/plist` uses `new DOMParser({errorHandler}).parseFromString`) and `turbo-stream` 2 -> 3 (`@remix-run/server-runtime` imports `encode`). | **Executed:** C7-C11 (plist parses; `@remix-run/node` and `@expo/server` load) |
| R6 | `image-size` stays at 1.2.1 (2 high alerts left open). The fix is 2.0.3 only, and 2.x is not callable: metro 0.80.12 `src/Assets.js` does `const getImageSize = require("image-size"); ... getImageSize(content)`. | **Executed:** `require('image-size')` 2.0.3 is an object (keys `disableTypes,imageSize,default,types`) |
| R7 | `node-forge` -> ^1.4.2 although the advisory (GHSA-86w9-cpqp-85rv, 2026-09-03) lists no patched version: 1.4.1 fixes it. | digitalbazaar/forge CHANGELOG 1.4.1 (2026-10-27): "HIGH: Signature forgery in RSA-PKCS due to ASN.1 extra field in DigestAlgorithm" (= the advisory's "accepts extra nested DigestAlgorithm elements"); 1.4.2 fixes 1.4.1's `pem.decode()` Buffer regression |
| R8 | `package-lock.json` is deleted and added to `.gitignore`. Nothing reads it: CI runs `pnpm install --frozen-lockfile` three times, `packageManager` is `pnpm@9.1.0`, README says `pnpm install`; it covers only the root devDependencies (no `workspaces`), was last touched `f7ada73` 2026-04-25, and carries 10 of the alerts. The only `npm` text in the repo is backend's `npm run typeorm` scripts (a script runner; reads no lockfile). This absorbs NX-690's FamilyAccountant half. | `rg -n "npm ci|npm install|npm i |package-lock|npm run|npx |yarn"` over the repo (minus lockfiles); `git log -- package-lock.json` |
| R9 | Three audit-only highs (not yet Dependabot alerts) get same-major overrides: `body-parser` 2.2.2 -> ^2.4.0 (backend runtime via express 5), `undici` 6.29.0 -> ^6.29.1 and 7.30.0 -> ^7.30.1. Two stay: `zod` (fix is 4.x only; consumer is Expo 51's experimental `babel-plugin-react-compiler`) and `electron` (41 -> 42+ major; its own Dependabot PRs, see the PR table). | `pnpm audit --json` on the set; `npm view` latest in each major |
| R10 | Stale-peer fix inside the lockfile: after the bump, pnpm kept `electron-builder-squirrel-windows@24.13.3` to satisfy app-builder-lib 26's exact peer `26.18.0`. The patch's lockfile was re-resolved (electron-builder removed, installed, re-added) so no 24.x builder package remains. | `npm view app-builder-lib@26.18.0 peerDependencies`: `"electron-builder-squirrel-windows": "26.18.0"`; lockfile grep `squirrel-windows@24|app-builder-lib@24|builder-util-runtime@9.2` = 0 |

### Upgrade table: every critical and high alert open on 2026-10-28

| Package | Alerts | At base | After | How | Major? | Consumer (tree) |
|---|---|---|---|---|---|---|
| tar | 1 crit, 8 high | 6.2.1 | 7.5.22 | override + `@expo/cli` patch (R4); electron-builder 26 | **yes** | @expo/cli (mobile), app-builder-lib 24 (desktop) |
| proxy-addr | 1 crit | 2.0.7 | 2.0.8 | override | no | express 5 (backend runtime) |
| shell-quote | 1 crit | 1.9.0 | 1.12.0 | concurrently 10.0.6 (R3) | no | concurrently (desktop dev) |
| @xmldom/xmldom | 13 high | 0.7.13, 0.8.13 | 0.8.15 | override (R5) | **yes** (0.7 -> 0.8) | @expo/plist, plist (dmg-builder) |
| brace-expansion | 9 high (2 npm) | 1.1.14, 2.1.0, 5.0.5 | 1.1.21, 2.1.7, 5.0.12 | 3 overrides | no | minimatch everywhere |
| js-yaml | 9 high (3 npm) | 3.14.2, 4.1.1 | 3.15.2, 4.3.2 | 2 overrides | no | jest, eslint, swagger, expo |
| fast-uri | 7 high | 3.1.2 | 3.1.9 | override | no | ajv (nest cli, expo-router) |
| multer | 3 high | 2.1.1 | 2.5.0 | override | no | @nestjs/platform-express (backend runtime) |
| nanoid | 3 high | 3.3.11 | 3.3.20 | override | no | @react-navigation (mobile) |
| ws | 3 high | 6.2.3, 7.5.10, 8.20.0 | 6.2.6, 7.5.13, 8.22.0 | 3 overrides | no | react-native, @expo/cli |
| browserslist | 2 high | 4.28.2 | 4.29.4 | override | no | webpack (nest cli), plugin-react |
| image-size | 2 high | 1.2.1 | **1.2.1** | **left open (R6)** | fix is major | metro 0.80 (mobile) |
| postcss | 2 high | 8.4.49 | 8.5.31 | override | no | @expo/metro-config |
| @remix-run/server-runtime | 1 high | 2.17.4 | 2.17.5 | override | no | expo-router -> @expo/server |
| app-builder-lib | 1 high | 24.13.3 | 26.18.0 | electron-builder 26 (R2) | **yes** | desktop packaging |
| builder-util-runtime | 1 high | 9.2.4 | 9.7.0 | electron-builder 26 | no | desktop packaging |
| compression | 1 high | 1.8.1 | 1.8.2 | override | no | RN community cli |
| joi | 1 high | 17.13.3 | 17.13.9 | override | no | RN community cli |
| node-forge | 1 high | 1.4.0 | 1.4.2 | override (R7) | no | @expo/cli |
| tmp | 1 high | 0.2.5 | 0.2.7 | override; electron-builder 26 | no | flatpak-bundler |
| turbo-stream | 1 high | 2.4.1 | 3.2.1 | override (R5) | **yes** | @remix-run/server-runtime |

Projection by lockfile (one-off script; the real count is the Opus review's live fetch): closes **3/3 critical, 67/69 high**, 24
medium, 7 low; left open: high #182, #183 (image-size), 14 medium, 8 low. Same script on `b7ddc5a` (control): closes 0.

### Dependabot PRs (G-1: each ruled; outward actions are AJ's go, listed in the Opus review)

| PR | Bump | Alerts it touches | Ruling |
|---|---|---|---|
| #77 | zustand 4.5.7 -> 5.0.15 (desktop, mobile) | none | D3's verdict stands: mergeable after D3 lands and #77 rebases green |
| #83 | nestjs group, 12 updates (NestJS 12 major); `test-backend` red | none of this set (the backend highs are fixed by overrides) | held: a NestJS 12 major needs its own spec; Dependabot rebases it after this PR |
| #85 | electron 41.10.6 -> 44.9.1 (supersedes #81) | fixes the audit high GHSA-jr5w-w6x2-84p9 (`>= 44.0.0-alpha.1, < 44.9.1`) and the 7 desktop-manifest electron alerts | held (D3): needs AJ's desktop launch run; the Opus review's B3 launch on this set is its baseline |
| #86 | react-native 0.74.2 -> 0.88.0 (supersedes #78) | none | D3's verdict stands: held, needs the Expo SDK upgrade |
| #87 | react 18.2.0 -> 19.3.1, @types/react 19 (desktop, mobile) | none | held: mobile pins `react` 18.2.0 for Expo 51; goes with the Expo SDK upgrade |
| #88 | electron -> 42.11.9, desktop group; no lockfile change; `lint`, `build` red | still inside GHSA-jr5w (`< 42.11.16`) | **close** on AJ's go: red, duplicate of #90, superseded by #85 |
| #89 | @babel/core 8.0.0 -> 8.0.7 (mobile dev) | none | merge on AJ's go after this PR lands and #89 rebases green (patch bump; G-1: not merged earlier) |
| #90 | electron 41.10.6 -> 42.11.9 | still inside GHSA-jr5w (`< 42.11.16`) | **close** on AJ's go: superseded by #85 |

## HARD RULES -- violating any of these fails the task

1. Apply the patch exactly with `git apply --index`. Do not hand-edit any file the patch touches. If `git apply --check` fails, stop and report.
2. Stage nothing beyond what `git apply --index` stages. Never `git add -A`, `git add .` or `git commit -a`.
3. `sh` only. Build in `/tmp/fa-build` (T1). Never commit to `cloud/fa-deps-input`, `preview` or `main`.
4. Push exactly one branch, `claude/fa-deps-alerts`, once, in P1. No PR, no comment, no issue, no Dependabot or settings change.
5. Never run `pnpm update`, `pnpm dedupe`, `pnpm install` without `--frozen-lockfile`, `pnpm patch`, `pnpm format`, `prettier` or any fixer.
6. Any EXPECT that differs: stop, report the step and its full output, and do not continue. Do not retry with other flags.

## T0 -- tools, inputs, gate

```sh
cd "$(git rev-parse --show-toplevel)"
INREF=origin/cloud/fa-deps-input
BASE=origin/preview
git fetch -q origin
git config user.email > /dev/null && echo identity-ok
# EXPECT: identity-ok   (C1 commits with -s; no identity = stop)
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
mkdir -p "$HOME/.local/bin" && corepack enable --install-directory "$HOME/.local/bin" && export PATH="$HOME/.local/bin:$PATH"
pnpm -v
# EXPECT: 9.1.0
mkdir -p /tmp/fa-deps-in
for f in fa-deps.patch check-mobile-tooling.cjs commit-msg.txt; do git show "$INREF:docs/cloud/fa-deps/$f" > "/tmp/fa-deps-in/$f"; done
(cd /tmp/fa-deps-in && sha256sum fa-deps.patch check-mobile-tooling.cjs commit-msg.txt | cut -c1-16)
# EXPECT exactly:
# eb0306b1108d4286
# 2b6be02364e1cda8
# 7093ce7fc2a1872a
git rev-parse --short "$BASE"
# Record this SHA in the report as the pin (no EXPECT; it is post-D3 preview).
git show "$BASE:.github/workflows/ci.yml" | grep -c '^  typecheck-clients:'
# EXPECT: 1          (D3 merged; 0 = stop: the build entry's gate was not met)
git cat-file -e "$BASE:packages/backend/src/security-headers.ts" && echo d3-files-ok
# EXPECT: d3-files-ok
git diff --quiet b7ddc5a "$BASE" -- package.json pnpm-lock.yaml pnpm-workspace.yaml package-lock.json .gitignore packages/backend/package.json packages/desktop/package.json packages/mobile/package.json packages/shared/package.json && echo manifests-unchanged
# EXPECT: manifests-unchanged   (anything else = stop: a dependency PR merged after b7ddc5a; Opus rebuilds the patch)
```

## T1 -- worktree and patch

```sh
git worktree add --no-track -b claude/fa-deps-alerts /tmp/fa-build "$BASE"
cd /tmp/fa-build
git rev-parse --abbrev-ref '@{u}' 2>&1 | head -1
# EXPECT: fatal: no upstream configured for branch 'claude/fa-deps-alerts'
git apply --check /tmp/fa-deps-in/fa-deps.patch && echo check-ok
# EXPECT: check-ok
git apply --index /tmp/fa-deps-in/fa-deps.patch
git status --porcelain
# EXPECT exactly:
# M  .gitignore
# D  package-lock.json
# M  package.json
# M  packages/desktop/package.json
# A  patches/@expo__cli@0.18.31.patch
# M  pnpm-lock.yaml
git diff --cached --shortstat
# EXPECT:  6 files changed, 1075 insertions(+), 2584 deletions(-)
```

## T2 -- install (as CI does)

```sh
cd /tmp/fa-build
export ELECTRON_SKIP_BINARY_DOWNLOAD=1
pnpm install --frozen-lockfile > /tmp/fa-install.log 2>&1; echo "install exit=$?"
# EXPECT: install exit=0
grep -c 'ERR_PNPM' /tmp/fa-install.log
# EXPECT: 0
```

Noise in the install log (expected, ignore): `WARN deprecated ...`, "Issues with peer dependencies found" (mobile: `@babel/core`
8.0.0 vs Babel 7 plugins; `@vector-icons` wants `expo-font >= 14.0.4`). Both exist at base.

## V -- verification (CI's jobs, D3's typecheck job, the mobile check, the audit)

```sh
cd /tmp/fa-build
pnpm turbo run lint > /tmp/v1.log 2>&1; echo "V1 lint exit=$?"; grep -E '^ ?Tasks:' /tmp/v1.log
# EXPECT: V1 lint exit=0
# EXPECT:  Tasks:    5 successful, 5 total
pnpm turbo run build --filter=@family-accountant/shared --filter=@family-accountant/backend > /tmp/v2.log 2>&1; echo "V2 build exit=$?"; grep -E '^ ?Tasks:' /tmp/v2.log
# EXPECT: V2 build exit=0
# EXPECT:  Tasks:    2 successful, 2 total
pnpm --filter @family-accountant/desktop exec tsc --noEmit -p tsconfig.json > /tmp/v3a.log 2>&1; echo "V3a typecheck desktop exit=$?"
# EXPECT: V3a typecheck desktop exit=0
pnpm --filter @family-accountant/mobile exec tsc --noEmit -p tsconfig.json > /tmp/v3b.log 2>&1; echo "V3b typecheck mobile exit=$?"
# EXPECT: V3b typecheck mobile exit=0
env -u DATABASE_URL JWT_SECRET=test_jwt_secret JWT_EXPIRES_IN=15m JWT_REFRESH_SECRET=test_refresh_secret JWT_REFRESH_EXPIRES_IN=7d pnpm turbo run test --filter=@family-accountant/backend > /tmp/v4.log 2>&1; echo "V4 test exit=$?"; grep -E 'Test Suites:|Tests:' /tmp/v4.log
# EXPECT: V4 test exit=0
# EXPECT: @family-accountant/backend:test: Test Suites: 20 passed, 20 total
# EXPECT: @family-accountant/backend:test: Tests:       115 passed, 115 total
node /tmp/fa-deps-in/check-mobile-tooling.cjs . ; echo "V5 exit=$?"
# EXPECT: 12 lines starting PASS (C1, C2, C3, C4 x2, C5-C11), then: RESULT pass=12 fail=0 / V5 exit=0
pnpm audit --json > /tmp/v6.json 2>/dev/null; node -e 'const a=require(require("path").resolve(process.argv[1]));const v=a.metadata.vulnerabilities;const hi=[...new Set(Object.values(a.advisories).filter(x=>x.severity==="high").map(x=>x.module_name))].sort();console.log("V6 critical="+v.critical+" high="+v.high+" high-modules="+hi.join(","))' /tmp/v6.json
# EXPECT: V6 critical=0 high=4 high-modules=electron,image-size,zod
```

V4 runs without `DATABASE_URL`, so the 4 Postgres integration tests are replaced by 1 skip-notice test (CI runs them with a database;
the Opus review runs them locally: 118). Lint prints warnings only (backend 8, desktop 2, mobile 4): noise.
**V6 is the one EXPECT that can drift by date** (new advisories land daily). If `critical` is not 0 or `high-modules` names anything
besides electron, image-size, zod: stop and report the full V6 line; do not change the patch.

## C1 -- commit

```sh
cd /tmp/fa-build
git commit -q -s -F /tmp/fa-deps-in/commit-msg.txt
git log -1 --format=%s
# EXPECT: chore(deps): clear the critical and high Dependabot alerts (pnpm overrides, electron-builder 26, expo-cli tar patch)
git diff --binary HEAD~1 HEAD | sha256sum | cut -c1-16
# EXPECT: eb0306b1108d4286   (the commit is the patch, byte for byte)
git status --porcelain | wc -l
# EXPECT: 0
```

## P1 -- push the work branch (no PR)

```sh
cd /tmp/fa-build
git push -q -u origin claude/fa-deps-alerts
git ls-remote --heads origin claude/fa-deps-alerts | cut -c1-40; git rev-parse HEAD
# EXPECT: the two lines are the same 40-hex SHA
```

## Report

The pin (T0 SHA), every EXPECT line's real output (T0-P1) in order, the pushed SHA, and the session's `/usage` cost line. Nothing
else: no judgment of the change; Opus reviews it.

## Rollback

Before P1: `git worktree remove --force /tmp/fa-build && git branch -D claude/fa-deps-alerts` (nothing left the session). After P1:
the branch is unmerged; AJ deletes it (`git push origin --delete claude/fa-deps-alerts`) on his go. After the PR merges: revert the
merge commit; the overrides, the patch file and the lockfile return together.

## Opus review (local, Windows, after the cloud run; never from the session's report)

1. Fetch; worktree `--detach` of `origin/claude/fa-deps-alerts`; `git diff --binary HEAD~1 HEAD` SHA-256/16 = `EB0306B1108D4286`;
   parent = the T0 pin; pin contains `typecheck-clients`.
2. Re-run T2, V1-V6 in PowerShell; V4 also **with** the scratch Postgres
   (`B:/Repos/HomeFinancesApp/FamilyAccountant-wt/supabase-schema/scripts/Start-ScratchPostgres.ps1 -Apply`, database
   `family_accountant_test`, `DATABASE_URL=postgresql://postgres:supabase_test@localhost:5434/family_accountant_test`): EXPECT
   20 suites / 118 tests.
3. **B3 desktop launch (G-2, moved here from the build):** `packages/desktop`: `pnpm exec tsc`, `pnpm exec vite build`,
   `$env:CSC_IDENTITY_AUTO_DISCOVERY='false'; pnpm exec electron-builder --dir`, then start
   `dist-packaged/win-unpacked/FamilyAccountant.exe` with `NODE_ENV=production` and, after 10 s, a process with
   `MainWindowTitle` = `FamilyAccountant` (pre-run 2026-10-28: 4 processes, window up; the app uses the real
   `%APPDATA%\@family-accountant\desktop` profile, setting `APPDATA` does not move it; `family_accountant.db` is opened with
   `CREATE TABLE IF NOT EXISTS` and was left unchanged). Stop the processes; delete `dist-packaged`.
4. Negative control: in the review tree, put `_interopRequireDefault(require("tar"))` back in the installed patched
   `@expo/cli` `build/src/utils/{tar,npm}.js`, run V5 (EXPECT `fail=4`: C4 x2, C5, C6), restore, re-run (12/0).
5. Live alerts: `gh api --paginate "repos/aj1126/FamilyAccountant/dependabot/alerts?state=open&per_page=100"`; project them
   against the branch's lockfile (critical 0; high = image-size #182, #183 plus any alert newer than 2026-10-28, each named).
6. AJ's go list (numbered, one line each on what it changes): PR `claude/fa-deps-alerts` -> `preview` via `/pr-body`; close #88
   and #90; merge #89 after rebase; delete `cloud/fa-deps-input` once the PR is open.
