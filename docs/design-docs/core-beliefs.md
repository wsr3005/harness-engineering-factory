# Core Beliefs

Harness Engineering Factory is optimized for agent-assisted delivery and human-guided stewardship.
The principles below define non-negotiable engineering behavior.

## 1) Repository Is the System of Record

- Specifications, plans, architecture, and operational rules live in the repository.
- Verbal agreements are incomplete until captured in docs or code.

## 2) Agents Read Docs First, Code Second

- Agents should establish product and architecture context before implementing.
- Documentation is the intent layer; code is the execution layer.

## 3) Enforce Invariants, Not Incidental Implementations

- Services should protect domain rules even if internals change.
- Tests should validate behavior and contracts, not private mechanics.

## 4) Parse at Boundaries with Zod

- Inputs and outputs crossing process or layer boundaries must be validated.
- Parsed schemas become trusted internal types; unchecked payloads never do.

## 5) Small Files, Atomic Modules, Barrel Exports

- Keep modules focused and replaceable.
- Export stable APIs at package and domain boundaries via barrels.

## 6) Structured Logging, Never `console.log`

- Runtime observability must emit structured, queryable events.
- Logging primitives come from `@harness/observability`.

## 7) Tests Co-Located with Source

- Unit and integration tests live near the module they verify.
- This keeps behavior and verification synchronized during changes.

## 8) Progressive Disclosure in Documentation

- Root docs define global standards.
- Domain docs carry localized details, decisions, and acceptance criteria.
- Readers should move from broad context to specific implementation intent.
