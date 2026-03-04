# Frontend and UI Layer Conventions

This document defines entrypoint conventions for the UI layer (Layer 5), including HTTP handlers and CLI commands.

## Scope of UI Layer

- Parse inbound payloads and flags.
- Invoke service-layer use cases.
- Convert domain results/errors into transport-safe responses.
- Emit structured request/command logs through approved providers.

UI layer must not:

- access repositories directly,
- embed business invariants,
- bypass domain services for status transitions.

## Entry Point Types

### HTTP Handlers

- Accept request payloads and headers.
- Validate request body/query/path using Zod schemas.
- Call service methods with parsed input only.
- Return a stable response envelope.

### CLI Commands

- Parse argv/options into typed input.
- Validate parsed values with the same domain-safe schemas or adapters.
- Return structured output object plus process exit code mapping.

## Response Envelope Standards

All UI responses should use one of two envelope forms:

### Success Envelope

```json
{
  "ok": true,
  "data": {}
}
```

### Error Envelope

```json
{
  "ok": false,
  "error": {
    "code": "string_code",
    "message": "Human-readable summary"
  }
}
```

Envelope rules:

- `ok` is always present.
- Success payloads live under `data`.
- Failures use `error.code` and `error.message`.
- Do not mix `data` and `error` in the same response.

## Error Handling Patterns

Error classes should map into explicit transport-safe codes:

- validation failures -> `validation_error`
- not found -> `not_found`
- conflict/invariant failures -> `conflict`
- unauthorized/forbidden -> `unauthorized` or `forbidden`
- unexpected internal failures -> `internal_error`

Pattern guidance:

- Preserve machine-readable `code` stability over time.
- Keep `message` concise and user-oriented.
- Avoid leaking stack traces or secret values in responses.

## HTTP Mapping Guidance

Recommended status mappings:

- `ok: true` create -> `201`
- `ok: true` read/update/list/delete -> `200`
- `validation_error` -> `400`
- `unauthorized` -> `401`
- `forbidden` -> `403`
- `not_found` -> `404`
- `conflict` -> `409`
- `internal_error` -> `500`

## CLI Mapping Guidance

Recommended process exit behavior:

- Success -> `0`
- Validation or usage issues -> `2`
- Domain conflict/not-found -> `3`
- Unexpected internal failures -> `1`

CLI output should still follow envelope shape for machine parsing.

## Observability in UI

- Include request/command correlation identifiers when available.
- Log one structured event per completed request/command.
- Record latency and outcome (`ok`, `error.code`) for quality/reliability reporting.
- Use `@harness/observability`; avoid `console.log` in runtime paths.

## Compatibility and Evolution

- Treat envelope schema as a versioned contract.
- Add optional fields before introducing breaking changes.
- Document response changes in domain specs and release notes/plan docs.
