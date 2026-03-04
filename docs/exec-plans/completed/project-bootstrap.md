# Bootstrap the monorepo

**Status:** completed
**Created:** 2026-02-20
**Author:** harness-agent
**Domain:** platform

## Objective

Bootstrap the Harness Engineering Factory monorepo with strict TypeScript/ESM defaults, workspace quality gates, and foundational documentation so new domain teams can ship safely with consistent standards.

## Success Criteria

- [x] Workspace initializes with pnpm and all packages install reproducibly.
- [x] TypeScript strict mode is enforced across all packages and apps.
- [x] Base architecture and design documentation exists and is linked from root navigation.
- [x] Core quality scripts run through a single quality gate command.

## Steps

- [x] Step 1: Initialize workspace structure for apps, packages, scripts, and docs
  - **Verification:** Workspace folders and root manifests are present and discoverable by pnpm
  - **Files:** `pnpm-workspace.yaml`, `apps/**`, `packages/**`, `scripts/**`, `docs/**`
- [x] Step 2: Configure TypeScript NodeNext + strict mode baseline
  - **Verification:** `pnpm -r run typecheck` passes and strict checks are enforced
  - **Files:** `tsconfig.json`, `apps/**/tsconfig.json`, `packages/**/tsconfig.json`
- [x] Step 3: Add architecture and design guidance docs with repository map
  - **Verification:** Root and docs index link to architecture, design, reliability, and security guidance
  - **Files:** `AGENTS.md`, `ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md`
- [x] Step 4: Implement baseline scripts for observability and quality checks
  - **Verification:** Scripts execute through `npx tsx` and CI quality gate script runs end-to-end
  - **Files:** `scripts/obs-up.ts`, `scripts/obs-down.ts`, `scripts/ci-quality-gate.ts`, `scripts/pre-commit.ts`
- [x] Step 5: Validate bootstrap with install, typecheck, and test run
  - **Verification:** `pnpm install && pnpm typecheck && pnpm test` succeeds on a clean clone
  - **Files:** `package.json`, lockfile, workspace package scripts

## Decision Log

| Date       | Decision                                               | Rationale                                                                         |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 2026-02-20 | Use pnpm workspaces as the package manager baseline    | Fast installs and deterministic lockfile behavior for multi-package repositories. |
| 2026-02-21 | Enforce ESM + NodeNext for all TypeScript projects     | Consistent module semantics and compatibility with modern runtime tooling.        |
| 2026-02-21 | Make strict typechecking non-optional in quality gates | Prevents silent type debt and keeps contracts explicit at boundaries.             |
| 2026-02-22 | Adopt docs-first navigation via AGENTS and index files | Improves onboarding and reduces architectural guesswork across domains.           |

## Verification Log

| Date       | Step | Result | Notes                                                              |
| ---------- | ---- | ------ | ------------------------------------------------------------------ |
| 2026-02-20 | 1    | done   | Workspace scaffold created; pnpm recognized all projects.          |
| 2026-02-21 | 2    | done   | Strict mode failures fixed in bootstrap modules; typecheck green.  |
| 2026-02-21 | 3    | done   | Architecture/doc links validated with doc checker script.          |
| 2026-02-22 | 4    | done   | Observability scripts executed locally with expected JSON outputs. |
| 2026-02-22 | 5    | done   | Full install/typecheck/test sequence passed on clean environment.  |

## Notes

Bootstrap sequence intentionally prioritized shared standards and quality gates before domain feature development to minimize downstream rework.
