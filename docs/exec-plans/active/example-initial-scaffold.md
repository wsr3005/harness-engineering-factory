# Set up the tasks domain

**Status:** active
**Created:** 2026-03-04
**Author:** harness-agent
**Domain:** tasks

## Objective

Establish the initial tasks domain structure with strict layer boundaries, deterministic service flows, and baseline documentation so feature work can proceed without architectural drift.

## Success Criteria

- [x] Domain skeleton exists with required layer barrels and a domain-level AGENTS.md file.
- [x] Product spec for tasks domain exists and captures initial scope, success metrics, and constraints.
- [ ] Runtime entrypoints parse and validate all external input/output with Zod schemas.
- [ ] Basic domain tests pass for service and repository contracts.
- [ ] Execution plan and index docs are updated and traceable.

## Steps

- [x] Step 1: Scaffold tasks domain folder structure and layer index files
  - **Verification:** `ls apps/<app>/src/domains/tasks` shows expected layer folders and `index.ts` barrels
  - **Files:** `apps/<app>/src/domains/tasks/**`, `apps/<app>/src/domains/tasks/AGENTS.md`
- [x] Step 2: Draft tasks domain product specification
  - **Verification:** Spec includes objective, in-scope/out-of-scope, acceptance patterns, and reliability expectations
  - **Files:** `docs/product-specs/tasks-domain.md`, `docs/product-specs/index.md`
- [ ] Step 3: Add schema-validated runtime handlers and service wiring
  - **Verification:** Runtime handlers reject malformed payloads and emit structured errors with stable codes
  - **Files:** `apps/<app>/src/domains/tasks/runtime/*`, `apps/<app>/src/domains/tasks/service/*`
- [ ] Step 4: Implement repository contract and deterministic service operations
  - **Verification:** Services are idempotent for repeated requests and repository APIs are interface-driven
  - **Files:** `apps/<app>/src/domains/tasks/repo/*`, `apps/<app>/src/domains/tasks/service/*`
- [ ] Step 5: Add domain tests and quality checks
  - **Verification:** `pnpm test --filter tasks` and `pnpm typecheck` pass for new domain modules
  - **Files:** `apps/<app>/src/domains/tasks/**/*.test.ts`, `apps/<app>/src/domains/tasks/**`

## Decision Log

| Date       | Decision                                                 | Rationale                                                                     |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 2026-03-01 | Start with scaffold + spec before runtime implementation | Locks product intent and layer shape before writing executable logic.         |
| 2026-03-02 | Keep transport concerns isolated to runtime layer        | Preserves architecture rule that service layer remains transport-agnostic.    |
| 2026-03-03 | Use provider interfaces from day one                     | Avoids direct infrastructure coupling and enables deterministic test doubles. |

## Verification Log

| Date       | Step | Result | Notes                                                                    |
| ---------- | ---- | ------ | ------------------------------------------------------------------------ |
| 2026-03-01 | 1    | done   | Domain directories and barrels scaffolded through script.                |
| 2026-03-02 | 2    | done   | Spec reviewed against PRODUCT_SENSE heuristics; missing sections filled. |

## Notes

Runtime validation and tests are intentionally deferred until service interface decisions settle. Coordination with observability package is required before finalizing error envelopes.
