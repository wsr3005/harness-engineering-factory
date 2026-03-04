# Design Philosophy

## Why This Design Exists

Harness Engineering Factory is built for reliable autonomous execution.
The design emphasizes strong boundaries, explicit contracts, and docs-as-navigation so agents can reason safely before writing code.

Three goals drive the design:

1. Prevent accidental cross-layer coupling.
2. Keep product behavior explicit and testable.
3. Make the codebase discoverable through progressive documentation.

## Layered Architecture Rationale

The repository uses a strict layered model:

`Types -> Config -> Repo -> Providers -> Service -> Runtime -> UI`

Rationale by concern:

- **Predictability**: dependencies flow in one direction only.
- **Testability**: service logic can be tested without transport or storage wiring.
- **Replaceability**: providers and repos can change implementations behind stable interfaces.
- **Safety**: boundary parsing and typed contracts prevent hidden runtime assumptions.

Key outcomes:

- Domain invariants stay in service modules.
- Entry points stay thin and transport-specific.
- Infra concerns remain cross-cutting but isolated.

See `ARCHITECTURE.md` for full layer definitions and dependency constraints.

## Progressive Disclosure Pattern

Documentation follows a tiered knowledge hierarchy:

### Tier 1: System Navigation (Root)

- `AGENTS.md` is the table of contents and reading order.
- `ARCHITECTURE.md` defines global boundaries and layer rules.

### Tier 2: Shared Standards (`docs/`)

- Design, frontend conventions, reliability, security, product sense, and quality score templates.
- Execution-plan index and debt tracker for planning and governance.

### Tier 3: Domain-Specific Knowledge (`docs/product-specs/`, domain docs)

- Product specs and domain-level docs define concrete behavior and acceptance criteria.
- Each domain should maintain its own local `AGENTS.md` for focused navigation.

This hierarchy lets an agent move from broad principles to exact behavioral requirements without guesswork.

## Domain Boundary Model

Domain boundaries are intentional seams for ownership and change isolation.

Boundary rules:

- A domain owns its entities, invariants, and use-case orchestration.
- Cross-domain calls should traverse explicit interfaces.
- Shared utility code belongs in packages, not copied into domains.
- Product specs define behavior before implementation details are introduced.

For the current tasks domain:

- Entity contract lives in `docs/product-specs/tasks-domain.md`.
- Lifecycle transition rules are service-owned.
- Repo and provider behavior must not bypass service invariants.

## Design Decision Guardrails

When evaluating a design change, prefer options that:

- preserve one-way layer dependency flow,
- keep parsing at boundaries using Zod,
- increase determinism and idempotency,
- minimize public API surface area,
- improve observability without leaking transport details into services.

Reject options that:

- couple UI directly to persistence,
- hide business logic inside handlers or scripts,
- introduce implicit side effects without explicit interfaces,
- duplicate domain rules across multiple layers.

## Documentation Coupling Rules

Behavior-changing code and docs should ship together.

Minimum doc updates for behavior changes:

- Product behavior changes -> update domain product spec.
- Boundary/rule changes -> update `ARCHITECTURE.md` and `docs/DESIGN.md`.
- Operational requirement changes -> update reliability/security docs.

This keeps design intent queryable by both humans and autonomous agents.
