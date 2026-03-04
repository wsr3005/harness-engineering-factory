# Reliability Baseline

This document defines baseline reliability expectations for services and tooling in the Harness Engineering Factory.

## Reliability Objectives

- Keep startup behavior predictable and measurable.
- Maintain clear failure signals and bounded blast radius.
- Favor graceful degradation over total failure when dependencies are impaired.

## Startup Targets

Recommended process-level targets for domain runtimes:

- Cold startup target: under 2 seconds for local development runtime.
- Warm restart target: under 1 second when dependency graph is unchanged.
- Readiness declaration only after critical dependencies pass health checks.

Target guidance is intentionally strict to preserve fast feedback loops for agents and developers.

## Error Budget Framing

For user-facing or automation-facing endpoints:

- Initial availability objective: 99.5% successful request handling over a rolling 30-day window.
- Error budget: 0.5% failed requests excluding client-caused validation errors.
- Track by endpoint/use-case, not only global aggregate, to avoid masking hotspots.

When budget burn accelerates:

- pause non-essential feature rollout,
- prioritize reliability remediation,
- document action plan in execution plans.

## Graceful Degradation

Services should degrade predictably when non-critical dependencies fail.

Guidelines:

- Continue serving core CRUD flows if optional telemetry sinks are unavailable.
- Return explicit degraded mode metadata where applicable.
- Use retries with bounded attempts and backoff for transient provider errors.
- Fail fast for critical dependency outages that would corrupt invariants.

## Health Checks

Each runtime should provide at least:

- **Liveness check**: process is running and event loop is responsive.
- **Readiness check**: required dependencies are reachable and initialized.
- **Dependency detail**: per-provider state for diagnostics.

Health response should be machine-readable and stable for automation.

## Reliability Telemetry

Emit structured metrics and traces for:

- request/command throughput,
- success/failure counts by error code,
- p50/p95 latency by operation,
- dependency failure rates,
- startup and shutdown duration.

Use scripts under `scripts/query-*.ts` and observability package primitives for inspection.

## Incident Handling Expectations

- Detect: alert on sustained error rate or latency breaches.
- Triage: identify failing dependency, scope, and affected operations.
- Mitigate: disable non-critical features or apply fallback routes.
- Recover: restore service and verify budget burn returns to baseline.
- Learn: capture follow-ups in `docs/exec-plans/tech-debt-tracker.md`.
