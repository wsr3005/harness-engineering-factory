# Domain Template

Use this guide when creating a new domain that follows Harness layering.

1. Create folder `apps/<app>/src/domains/<domain>`.
2. Add required layer folders: `types`, `config`, `repo`, `service`, `runtime`, `ui`, `providers`.
3. Add `index.ts` barrel file in every layer.
4. Define Zod schemas and inferred types in `types/`.
5. Define validated defaults in `config/`.
6. Implement repository contract in `repo/`.
7. Implement business rules in `service/`.
8. Build runtime composition in `runtime/`.
9. Add pure framework-agnostic handlers in `ui/`.
10. Add provider interfaces and stubs in `providers/`.
11. Add `AGENTS.md` in domain root with purpose and rules.
12. Add tests next to source files.
13. Keep imports directed from lower layer to higher layer only.
14. Use `.js` extensions in imports for NodeNext ESM compatibility.
15. Run `pnpm --filter @harness/<app> run typecheck` and `pnpm --filter @harness/<app> test`.
