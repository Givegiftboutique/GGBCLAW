---
taskId: TASK-20260609-OC-DASH-15B
title: OpenClaw Dashboard Traditional Chinese Localization
status: completed
date: 2026-06-10
scope: internal-operator-beta
safetyMode: read-only
mutationEnabled: false
productionWiring: disabled
---

# TASK-20260609-OC-DASH-15B

## Summary

Sprint 15B localizes the OpenClaw Dashboard Internal Operator Beta user-facing UI into Traditional Chinese using a small dependency-free i18n layer. Technical values remain unchanged: route hashes, source mode values, adapter interface names, schema/data model keys, script/report filenames, and safety enum values stay in English where required.

## Acceptance Criteria

- [x] i18n folder exists.
- [x] `zh-hant.js` exists.
- [x] `i18n.js` exists.
- [x] Major UI labels are Traditional Chinese.
- [x] Sidebar labels are Chinese or bilingual Chinese/technical labels.
- [x] Overview/source badge/safety labels are Chinese with enum values preserved.
- [x] Help / Runbook, Observability, RBAC, action draft, and Real Local Data Pilot wording are localized.
- [x] README quick start has Chinese wording.
- [x] Docs index has Chinese quick start wording.
- [x] Safety enum values are preserved.
- [x] Route values are preserved.
- [x] Source mode values are preserved.
- [x] Localization test passes.
- [x] Quality gate passes.
- [x] Safety scan passes.
- [x] Verifier passes.
- [x] No production API/Gateway, mutation endpoint, secrets, auth/token/cookie handling, dependency, deploy, or CI was added.

## Execution Plan

1. Add `apps/dashboard/src/lib/i18n/zh-hant.js` and `apps/dashboard/src/lib/i18n/i18n.js`.
2. Update the dashboard shell and route rendering to call `t(key, fallback)` for user-facing strings.
3. Localize README/docs entrypoints without changing commands, paths, source modes, routes, or safety enums.
4. Add `apps/dashboard/scripts/test-dashboard-localization.mjs`.
5. Extend quality gate, safety scan, and verifier for localization coverage.
6. Run local validation, syntax checks, safety scan, verifier, and browser acceptance.

## Execution History

- Added dependency-free Traditional Chinese string dictionary and lookup helper.
- Localized major dashboard labels, safety text, source status labels, RBAC simulation, action draft UI, Observability / Readiness, Real Local Data Pilot, and runbook text.
- Preserved required technical strings including `read-only`, `mutationEnabled`, `productionWiring`, `disabled`, `no-go-for-production`, source modes, and route paths.
- Added localization test and wired it into the one-command quality gate.
- Updated phase log, roadmap, manual smoke tests, README/docs entrypoints, task memory, and artifact note.
- Git is unavailable in current PowerShell PATH; manual Git status/diff review is required in Git Bash or VS Code terminal before commit.

## Files Changed

- `apps/dashboard/index.html`
- `apps/dashboard/src/app.js`
- `apps/dashboard/src/lib/i18n/zh-hant.js`
- `apps/dashboard/src/lib/i18n/i18n.js`
- `apps/dashboard/scripts/test-dashboard-localization.mjs`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- `apps/dashboard/README.md`
- `docs/dashboard/README.md`
- `docs/dashboard/openclaw-dashboard-operator-handoff.md`
- `docs/dashboard/openclaw-dashboard-roadmap.md`
- `docs/phase-log.md`
- `tests/manual-smoke-tests.md`
- `ops/tasks/TASK-20260609-OC-DASH-15B.md`
- `artifacts/TASK-20260609-OC-DASH-15B/README.md`

## Commands Executed

- `node apps/dashboard/scripts/test-dashboard-localization.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`
- `node --check apps/dashboard/scripts/test-dashboard-localization.mjs`
- `node --check apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node --check apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node --check apps/dashboard/verify-dashboard.mjs`
- `node --check apps/dashboard/src/app.js`
- `node --check apps/dashboard/src/lib/i18n/i18n.js`
- `node --check apps/dashboard/src/lib/i18n/zh-hant.js`
- `git status`
- `git diff --stat`
- `git diff --name-only`

## Test Results

- `test-dashboard-localization.mjs`: passed.
- `run-dashboard-quality-gates.mjs`: passed.
- `safety-scan-dashboard.mjs`: passed.
- `verify-dashboard.mjs`: passed.
- Required syntax checks for localization script, quality gate, safety scan, verifier, `app.js`, `i18n.js`, and `zh-hant.js`: passed.
- Manual browser acceptance: passed in local browser session with the requested source/route URLs.
- PowerShell `node` on PATH returned access denied; tests were executed with the bundled Codex Node runtime.
- PowerShell `git` remained unavailable; manual Git review is still required before commit.

## Risk Notes

- This is UI localization only; it does not make the dashboard production ready.
- Some technical labels remain intentionally English to preserve testability and avoid changing enum/source/route/schema values.
- Manual Git review is required outside the current PowerShell PATH before commit.

## Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-15B/README.md`

## Localization Notes

- Default dashboard language is Traditional Chinese (`zh-Hant`).
- No runtime language switch was added.
- Missing keys fall back to the provided fallback string.

## Glossary Notes

- Dashboard = 儀表板
- Overview = 總覽
- Source = 資料來源
- Safety mode = 安全模式
- read-only = 唯讀, enum value preserved
- mutationEnabled = 寫入操作啟用, key preserved
- productionWiring = Production wiring, key/value preserved
- Action draft = 操作草稿
- Internal Operator Beta = 內部 Operator Beta
- no-go-for-production = Production 暫不可上線, enum value preserved

## Reviewer Notes

- Reviewer should confirm Chinese UI readability in browser and verify route/source values remain unchanged.
