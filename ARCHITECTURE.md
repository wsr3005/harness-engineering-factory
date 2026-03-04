# Harness Engineering Factory Architecture

## Intent

Harness Engineering Factory is a monorepo organized for agent-first development, strict layering, and deterministic delivery.
The architecture is optimized for two workflows:

1. Fast, safe code generation by autonomous agents.
2. Predictable maintenance by humans reviewing and extending generated systems.

The model is intentionally explicit: every module belongs to a layer, every layer has dependency boundaries,
and every boundary is validated through typing, tests, and runtime parsing.

## Layered System

The canonical layer flow is:

`Types (0) -> Config (1) -> Repo (2) -> Providers (2.5) -> Service (3) -> Runtime (4) -> UI (5)`

```mermaid
flowchart LR
  L0["Layer 0: Types\nSchemas, literals, domain models"] -->
  L1["Layer 1: Config\nEnv, feature flags, policy switches"] -->
  L2["Layer 2: Repo\nPersistence ports and implementations"] -->
  L25["Layer 2.5: Providers\nCross-cutting adapters"] -->
  L3["Layer 3: Service\nUse cases and business invariants"] -->
  L4["Layer 4: Runtime\nComposition, lifecycle, orchestration"] -->
  L5["Layer 5: UI\nHTTP/CLI transport and response shaping"]

  L25 -. telemetry .-> OBS[@harness/observability]
  L25 -. validation .-> VAL[@harness/ui-validation]
  L25 -. lifecycle .-> PR[@harness/pr-lifecycle]
  L25 -. quality .-> Q[@harness/quality]

  style L0 fill:#eef7ff,stroke:#3e6a8a,stroke-width:1px
  style L1 fill:#eef7ff,stroke:#3e6a8a,stroke-width:1px
  style L2 fill:#eef7ff,stroke:#3e6a8a,stroke-width:1px
  style L25 fill:#fff8e8,stroke:#8a6a3e,stroke-width:1px
  style L3 fill:#eef7ff,stroke:#3e6a8a,stroke-width:1px
  style L4 fill:#eef7ff,stroke:#3e6a8a,stroke-width:1px
  style L5 fill:#eef7ff,stroke:#3e6a8a,stroke-width:1px
```

## Layer Responsibilities

### Layer 0 - Types

- Owns domain nouns, enums, branded IDs, and protocol-safe shared primitives.
- Declares Zod schemas used at boundaries and narrow helpers for inferred types.
- Contains no I/O and no transport assumptions.
- Can be imported by any layer.

### Layer 1 - Config

- Reads and normalizes environment configuration once.
- Encodes defaults, feature gates, and policy constants.
- Exposes typed configuration objects.
- Never reads request context directly.

### Layer 2 - Repo

- Implements persistence and retrieval contracts.
- Converts storage records into domain-safe shapes.
- Handles optimistic concurrency and basic persistence-level constraints.
- Does not encode business workflows.

### Layer 2.5 - Providers

- Hosts cross-cutting infrastructure adapters.
- Examples: logging, tracing, quality metrics, PR lifecycle hooks, UI validation bridges.
- Provides interfaces consumed by service/runtime rather than direct package leakage.
- Keeps vendor-specific mechanics isolated.

### Layer 3 - Service

- Owns business use cases and invariant enforcement.
- Coordinates repo calls and provider side effects.
- Implements status transitions, idempotency, and domain-level authorization checks.
- Returns domain results, not transport-formatted payloads.

### Layer 4 - Runtime

- Wires concrete dependencies for process execution.
- Creates composition roots for command handlers and HTTP registries.
- Manages startup/shutdown lifecycle and readiness checks.
- Enforces process-level policies such as retries and backoff wiring.

### Layer 5 - UI

- Defines transport contracts for HTTP and CLI entrypoints.
- Parses external input and maps outputs to response envelopes.
- Converts domain failures into explicit API/CLI error surfaces.
- Holds no direct persistence logic.

## Domain Map

| Domain | Purpose                                                 | Primary Entity | Current State   | Canonical Spec                       | Domain Docs                   |
| ------ | ------------------------------------------------------- | -------------- | --------------- | ------------------------------------ | ----------------------------- |
| tasks  | Track and execute work items through a strict lifecycle | Task           | active scaffold | `docs/product-specs/tasks-domain.md` | `docs/product-specs/index.md` |

## Providers Cross-Cutting Pattern

Providers are intentionally positioned at layer 2.5 to avoid two failure modes:

1. Polluting business services with vendor SDK specifics.
2. Forcing runtime/UI layers to implement operational concerns repeatedly.

Provider pattern rules:

- Services depend on provider interfaces, not package internals.
- Providers emit structured telemetry and metrics in a uniform shape.
- Provider errors are normalized before they cross into Service.
- Providers never own core domain decisions.
- Provider configuration is supplied by Config/Runtime, not by Service call sites.

Common provider families in this repo:

- Observability provider via `@harness/observability`.
- Validation/interaction provider via `@harness/ui-validation`.
- Lifecycle automation provider via `@harness/pr-lifecycle`.
- Quality signal provider via `@harness/quality`.

## Dependency Rules

Hard dependency constraints:

- Layer 0 imports nothing from layers 1-5.
- Layer 1 may import only Layer 0.
- Layer 2 may import Layers 0-1.
- Layer 2.5 may import Layers 0-2 and external SDKs.
- Layer 3 may import Layers 0-2.5.
- Layer 4 may import Layers 0-3.
- Layer 5 may import Layers 0-4.

Disallowed patterns:

- Reverse imports from lower layers to higher layers.
- UI directly importing repo implementations.
- Repo importing runtime composition roots.
- Service importing concrete HTTP request/response types.
- Provider modules bypassing typed config contract.

Boundary and safety rules:

- Parse external input/output with Zod at each boundary.
- Keep side effects explicit and injectable.
- Prefer deterministic, idempotent service operations.
- Use package barrel exports at layer/domain boundaries.
- Co-locate tests next to the module under test.
- Use structured logs only; avoid `console.log` in runtime paths.

## Package Placement

The monorepo packages are organized to support layering and cross-cutting concerns:

- `packages/observability` - structured telemetry and logging primitives.
- `packages/ui-validation` - UI and interaction validation helpers.
- `packages/pr-lifecycle` - lifecycle automation helpers for review/execution loops.
- `packages/quality` - quality scoring and signal primitives.
- `packages/eslint-plugin-harness` - lint rules that encode architectural expectations.

Application entrypoint package:

- `apps/example` - example runtime/UI scaffold for domain composition.

## Domain Composition Guidance

Each domain should follow progressive disclosure:

- Root-level references describe global architecture and standards.
- Domain spec defines product behavior and acceptance criteria.
- Domain-level design docs capture decisions and trade-offs.
- Execution plans and debt trackers capture active change streams.

For the tasks domain:

- Product spec is the behavioral source of truth.
- Services enforce status transition invariants.
- Repo preserves durable task state.
- UI exposes safe response envelopes.

## Operational Quality Gates

Architectural compliance should be validated continuously:

- `pnpm typecheck` ensures layer contracts stay strongly typed.
- `pnpm test` verifies behavior and invariants.
- `npx tsx scripts/validate-architecture.ts` checks dependency boundaries.
- `npx tsx scripts/entropy-scan.ts` flags coupling drift.
- `npx tsx scripts/doc-validate.ts` keeps docs linked and complete.

## Change Management Rules

When changing architecture, update in the same pull request:

1. `ARCHITECTURE.md` for system-level boundary changes.
2. `docs/DESIGN.md` for rationale and principle updates.
3. Domain spec/design docs for behavior-impacting changes.
4. `docs/PLANS.md` and active/completed plan records where applicable.

This keeps the repository as the system of record for both behavior and intent.
