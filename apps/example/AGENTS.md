# Example App Guide

## Purpose

- This app is the reference implementation for Harness layering rules.
- Read root architecture docs first, then this file, then domain docs.

## Domain Entry Points

- Product spec: [`docs/product-specs/tasks-domain.md`](../../docs/product-specs/tasks-domain.md)
- Domain guide: [`apps/example/src/domains/tasks/AGENTS.md`](src/domains/tasks/AGENTS.md)
- Runtime wiring: [`apps/example/src/app-wiring.ts`](src/app-wiring.ts)

## Tasks Domain Structure

- Layer 0 types: [`apps/example/src/domains/tasks/types`](src/domains/tasks/types)
- Layer 1 config: [`apps/example/src/domains/tasks/config`](src/domains/tasks/config)
- Layer 2 repo: [`apps/example/src/domains/tasks/repo`](src/domains/tasks/repo)
- Layer 2.5 providers: [`apps/example/src/domains/tasks/providers`](src/domains/tasks/providers)
- Layer 3 service: [`apps/example/src/domains/tasks/service`](src/domains/tasks/service)
- Layer 4 runtime: [`apps/example/src/domains/tasks/runtime`](src/domains/tasks/runtime)

## UI Surface

- Handlers: [`apps/example/src/domains/tasks/ui`](src/domains/tasks/ui)

## Local Commands

- Test app: `pnpm --filter @harness/example test`
- Typecheck app: `pnpm --filter @harness/example typecheck`

## Working Rules

- Keep boundary parsing in UI/runtime edges.
- Keep business logic in `service/` and pure domain contracts in lower layers.
- Update domain docs with any behavior or interface changes.
