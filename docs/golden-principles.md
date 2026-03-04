# Golden Principles

These principles are opinionated and mechanically enforceable across the repository.

## Shared Utilities Over Hand-Rolled Helpers

- Reuse shared behavior from `@harness/*` packages or a single canonical utility module.
- Avoid cloning equivalent helper logic across multiple domains.
- Extract repeated function names and signatures into one shared module.

## Parse at Boundaries

- Validate external input/output at boundary modules before domain logic runs.
- Treat `as unknown as` and unchecked `JSON.parse()` as violations unless schema-guarded.
- Keep Zod parse/safeParse close to transport, persistence, and provider edges.

## No YOLO Probing

- Do not access untyped payloads with ad-hoc `(value as any)` probing.
- Narrow unknown data through adapters and validated schemas first.
- Favor deterministic typed mapping over optional-chain exploration on uncertain shapes.

## Structured Logging Only

- Emit runtime logs through structured logger interfaces.
- Ban `console.log`, `console.warn`, and `console.error` in app/package source paths.
- Include machine-readable fields so events can be queried and aggregated.

## One Domain One Directory

- Keep domain implementation confined to one `domains/<domain>/` directory tree.
- Prevent direct domain-to-domain imports that bypass provider boundaries.
- Route shared or cross-domain behavior through explicit interfaces.

## Barrel Exports at Every Boundary

- Maintain `index.ts` barrel exports at each layer boundary directory.
- Import from boundary barrels instead of deep file paths.
- Keep barrel files exporting only public layer surface.

## Tests Co-Located with Source

- Place tests as sibling `<module>.test.ts` files next to implementation modules.
- Require non-index source files to have a co-located test unless explicitly exempted.
- Keep test fixtures local to the domain layer they validate.

## Documentation References Real Paths

- Ensure markdown links to repository files resolve to existing paths.
- Treat stale links to `.ts`, `.js`, and `.md` files as cleanup debt.
- Prefer relative links rooted at the document location for portability.
