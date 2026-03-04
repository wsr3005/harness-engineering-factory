# Product Sense

This document defines product-thinking principles and acceptance patterns for the monorepo.
It aligns delivery decisions across humans and autonomous agents.

## Feature Thinking Principles

- Start from user outcome, not implementation novelty.
- Prefer smallest coherent increment that proves value.
- Keep behavior deterministic so users can trust repeatability.
- Make failure modes explicit and recoverable.
- Optimize for maintainable velocity over one-off speed.

## Quality Mindset

Quality is not a final gate; it is a design property.

Quality expectations:

- Domain invariants are service-enforced and test-proven.
- Boundaries parse external data with Zod.
- Transport contracts are stable and explicit.
- Observability is structured and sufficient for diagnosis.
- Docs change in the same PR as behavior changes.

## Acceptance Criteria Patterns

Use acceptance criteria that are behavioral and testable.

Recommended template:

1. **Given** a valid/invalid input context,
2. **When** a specific action is performed,
3. **Then** expected state and response outcomes are observed.

Criteria should include:

- happy path behavior,
- validation failures,
- invariant/conflict failures,
- idempotency or repeat-call behavior,
- observability expectations for key actions.

## Change Evaluation Heuristics

Favor a change when it:

- clarifies product behavior,
- reduces ambiguity at boundaries,
- tightens domain invariants,
- improves diagnosability,
- lowers long-term maintenance complexity.

Rework a change when it:

- leaks implementation details into product requirements,
- bypasses service-layer rules,
- introduces inconsistent error semantics,
- increases coupling across domains without explicit contracts.

## Product-Architecture Alignment

Product specs define what must happen.
Architecture defines where logic must live.
Both must evolve together to keep autonomous execution safe.

See:

- `ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/product-specs/index.md`
