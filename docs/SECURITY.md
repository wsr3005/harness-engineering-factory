# Security Baseline

This document defines baseline security expectations for application and tooling layers in the monorepo.

## Input Validation

All external and boundary-crossing input must be parsed and validated with Zod.

Rules:

- Validate HTTP body/query/path inputs before service invocation.
- Validate CLI args/options before use-case execution.
- Validate provider payloads crossing trust boundaries.
- Reject invalid payloads with explicit error envelopes.

Validated data becomes trusted internal state; unparsed data must never propagate.

## Auth Provider Patterns

Authentication and authorization should be provider-driven and policy-aware.

Guidelines:

- Keep auth implementation behind provider interfaces.
- Pass identity context into services as typed inputs, not raw headers/tokens.
- Enforce permission checks in service layer for domain actions.
- Separate authentication (who) from authorization (allowed action).

## Secrets Management

Use environment variables for secrets and sensitive runtime configuration.

Rules:

- Never hardcode secrets in source or docs.
- Avoid printing secret values in logs, errors, or test output.
- Keep `.env`-style files out of version control unless sanitized examples.
- Rotate credentials on compromise or scheduled policy cadence.

## Dependency Audit and Supply Chain

Maintain dependency hygiene across workspace packages.

Practices:

- Run dependency audits on a recurring cadence and before releases.
- Keep lockfile changes reviewed and intentional.
- Prefer pinned or constrained versions for security-critical packages.
- Track unresolved advisories with owners and remediation dates.

## Logging and Data Exposure

- Use structured logs via `@harness/observability`.
- Redact or omit sensitive fields by default.
- Ensure error responses do not expose internals (stack traces, tokens, SQL details).
- Log security-relevant events with stable event names and context IDs.

## Security Verification Checklist

Before merge of security-relevant changes:

1. Boundary validation added or updated with Zod.
2. Auth/permission paths covered by tests.
3. Secrets handling reviewed for leak vectors.
4. Dependency impact assessed.
5. Security docs updated when policy or behavior changes.
