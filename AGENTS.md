# Harness Engineering Factory Knowledge System

## Purpose

- This file is the navigation entrypoint for agents and engineers.
- Use it to find the right document quickly, then move into domain docs.
- Keep this file index-focused; put implementation detail in linked docs.

## Quick Start

- Install dependencies and run core checks:
  - `pnpm install && pnpm typecheck && pnpm test`
- Local CI gate before PRs:
  - `npx tsx scripts/ci-quality-gate.ts`
- Read architecture first: [`ARCHITECTURE.md`](ARCHITECTURE.md).
- Read design direction next: [`docs/DESIGN.md`](docs/DESIGN.md).
- Open domain product spec before touching code: [`docs/product-specs/tasks-domain.md`](docs/product-specs/tasks-domain.md).

## Repository Map

- Architecture overview and layer dependency rules: [`ARCHITECTURE.md`](ARCHITECTURE.md).
- Design philosophy and domain boundaries: [`docs/DESIGN.md`](docs/DESIGN.md).
- Product framing and acceptance patterns: [`docs/PRODUCT_SENSE.md`](docs/PRODUCT_SENSE.md).
- Reliability baseline and operational targets: [`docs/RELIABILITY.md`](docs/RELIABILITY.md).
- Security controls and validation boundaries: [`docs/SECURITY.md`](docs/SECURITY.md).
- Application example and domain entrypoint: [`apps/example/AGENTS.md`](apps/example/AGENTS.md).
- Tasks domain local guide: [`apps/example/src/domains/tasks/AGENTS.md`](apps/example/src/domains/tasks/AGENTS.md).
- Workspace packages: [`packages/eslint-plugin-harness`](packages/eslint-plugin-harness), [`packages/observability`](packages/observability), [`packages/pr-lifecycle`](packages/pr-lifecycle), [`packages/quality`](packages/quality), [`packages/ui-validation`](packages/ui-validation).

## Documentation Index

- [`docs/DESIGN.md`](docs/DESIGN.md) - Canonical design philosophy and boundary model.
- [`docs/FRONTEND.md`](docs/FRONTEND.md) - UI/entrypoint conventions for HTTP and CLI interactions.
- [`docs/golden-principles.md`](docs/golden-principles.md) - Golden rules for autonomous engineering execution.
- [`docs/PLANS.md`](docs/PLANS.md) - Active and completed execution plan index.
- [`docs/PRODUCT_SENSE.md`](docs/PRODUCT_SENSE.md) - Product decision heuristics and acceptance criteria patterns.
- [`docs/QUALITY_SCORE.md`](docs/QUALITY_SCORE.md) - Quality scorecard template by domain.
- [`docs/RELIABILITY.md`](docs/RELIABILITY.md) - Service-level reliability guidance and operational expectations.
- [`docs/SECURITY.md`](docs/SECURITY.md) - Security baseline for validation, auth, secrets, and audits.
- [`docs/design-docs/index.md`](docs/design-docs/index.md) - Registry of design docs with lifecycle status.
- [`docs/design-docs/core-beliefs.md`](docs/design-docs/core-beliefs.md) - Agent-first engineering principles.
- [`docs/exec-plans/TEMPLATE.md`](docs/exec-plans/TEMPLATE.md) - Canonical execution plan template.
- [`docs/exec-plans/tech-debt-tracker.md`](docs/exec-plans/tech-debt-tracker.md) - Tracked debt items with severity and ownership context.
- [`docs/exec-plans/active/example-initial-scaffold.md`](docs/exec-plans/active/example-initial-scaffold.md) - Active scaffold execution plan.
- [`docs/exec-plans/completed/project-bootstrap.md`](docs/exec-plans/completed/project-bootstrap.md) - Completed bootstrap execution plan.
- [`docs/product-specs/index.md`](docs/product-specs/index.md) - Registry for product specifications by domain.
- [`docs/product-specs/tasks-domain.md`](docs/product-specs/tasks-domain.md) - Full product spec for the Tasks domain.
- [`docs/references/domain-template.md`](docs/references/domain-template.md) - Domain documentation template and checklist.

## Key Conventions

- ESM only across the monorepo.
- TypeScript strict mode is non-negotiable.
- Parse input/output at boundaries with Zod.
- Keep layer ordering strict: 0 -> 1 -> 2 -> 2.5 -> 3 -> 4 -> 5.
- Use structured logs via `@harness/observability`.
- Never use `console.log` in runtime paths.
- Keep modules small and atomic.
- Prefer barrel exports at package and domain boundaries.
- Co-locate tests with source by module.
- Separate product specs from implementation details.
- Favor deterministic, idempotent service operations.
- Keep transport concerns in UI layer only.
- Keep provider integrations behind provider interfaces.
- Keep cross-domain coupling explicit and minimal.
- Update docs in the same change as behavior shifts.

## Per-Domain Docs

- Harness uses progressive disclosure documentation.
- Root docs describe system-wide standards and navigation.
- Each domain should maintain its own `AGENTS.md` as a local table of contents.
- Domain docs should include product spec, design decisions, and reliability notes.
- Domain docs should link up to root standards and architecture.
- Agents should read domain `AGENTS.md` before editing domain code.

## Scripts

- `npx tsx scripts/obs-up.ts` - Boot local observability dependencies.
- `npx tsx scripts/obs-down.ts` - Stop local observability dependencies.
- `npx tsx scripts/query-logs.ts` - Query structured logs for recent runs.
- `npx tsx scripts/query-metrics.ts` - Query metric aggregates for health signals.
- `npx tsx scripts/query-traces.ts` - Query traces for end-to-end request flows.
- `npx tsx scripts/quality-score.ts` - Compute quality score snapshot by domain.
- `npx tsx scripts/entropy-scan.ts` - Detect architecture drift and coupling entropy.
- `npx tsx scripts/validate-architecture.ts` - Validate layer dependency constraints.
- `npx tsx scripts/doc-validate.ts` - Validate documentation links and required sections.
- `npx tsx scripts/ci-quality-gate.ts` - Run CI quality gate checks for merge readiness.
- `npx tsx scripts/pre-commit.ts` - Run staged-file lint + project typecheck pre-commit.
- `npx tsx scripts/exec-plan-create.ts` - Create a new execution plan document.
- `npx tsx scripts/exec-plan-update.ts` - Update status and checkpoints for a plan.
- `npx tsx scripts/exec-plan-complete.ts` - Mark plan complete and archive outcome.
- `npx tsx scripts/exec-plan-list.ts` - List plans by status and recency.
- `npx tsx scripts/exec-plan-index.ts` - Regenerate `docs/PLANS.md` plan index.
- `npx tsx scripts/create-domain.ts` - Scaffold a new domain doc + layer structure.

## Reading Order

- 1. [`ARCHITECTURE.md`](ARCHITECTURE.md)
- 2. [`docs/DESIGN.md`](docs/DESIGN.md)
- 3. [`docs/PRODUCT_SENSE.md`](docs/PRODUCT_SENSE.md)
- 4. Domain spec (start with [`docs/product-specs/tasks-domain.md`](docs/product-specs/tasks-domain.md))
- 5. Domain execution docs (`docs/exec-plans/*`)
- 6. App/domain local docs ([`apps/example/AGENTS.md`](apps/example/AGENTS.md), [`apps/example/src/domains/tasks/AGENTS.md`](apps/example/src/domains/tasks/AGENTS.md))

## Maintenance Rules for This File

- Keep this file between 80 and 120 lines.
- Keep entries short and navigational.
- Add new docs to Documentation Index immediately.
- Avoid implementation detail; link to canonical documents instead.
