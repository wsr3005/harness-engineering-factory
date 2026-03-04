# Tasks Domain Guide

## Purpose

- Provide a complete sample CRUD domain for layered architecture.
- Demonstrate strict layer boundaries and testable pure logic.
- Keep transport details outside the domain and handlers framework-agnostic.

## Layers

- `types/`: Zod schemas and inferred domain types.
- `config/`: validated domain configuration defaults.
- `repo/`: persistence contracts and in-memory implementation.
- `service/`: business rules and orchestration logic.
- `runtime/`: composition factory for config, repo, service.
- `ui/`: pure handler functions returning serializable results.
- `providers/`: external capability interfaces and stubs.

## Dependency Rules

- Types layer imports only stdlib and `zod`.
- Config imports only from types.
- Repo imports from types + config only.
- Service imports from types + config + repo + providers only.
- Runtime imports from lower layers only.
- UI imports from service/types only.
- Providers only import from types (or nothing).

## How To Add Features

- Start with new schema/type in `types/` and export in barrel.
- Add config knobs if behavior needs tuning.
- Extend `TaskRepository` interface and implementation.
- Add service method with business validation.
- Wire new behavior in `runtime/` if dependencies change.
- Expose operation via `ui/` handlers with mapped error codes.
- Add and update tests in each impacted layer.
- Keep imports through each layer's `index.ts` barrel.
