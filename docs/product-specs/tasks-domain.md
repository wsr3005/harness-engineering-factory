# Tasks Domain Product Specification

## Scope

The Tasks domain manages lightweight work items from creation through completion.
This spec defines externally visible behavior and the invariants services must enforce.

## Product Goals

- Provide a reliable, minimal task tracker for agent and human workflows.
- Keep task lifecycle transitions explicit and auditable.
- Expose deterministic CRUD behavior across CLI and HTTP entrypoints.

## Primary Entity: Task

Task shape:

| Field         | Type                              | Required | Notes                               |
| ------------- | --------------------------------- | -------- | ----------------------------------- |
| `id`          | string                            | yes      | Stable unique identifier.           |
| `title`       | string                            | yes      | Human-readable short summary.       |
| `description` | string                            | no       | Optional detail text; may be empty. |
| `status`      | `todo` \| `in_progress` \| `done` | yes      | Lifecycle state.                    |
| `createdAt`   | string (ISO 8601)                 | yes      | Creation timestamp in UTC.          |
| `updatedAt`   | string (ISO 8601)                 | yes      | Last mutation timestamp in UTC.     |

Invariant rules:

- `id` is immutable after create.
- `title` must be non-empty after trimming.
- `status` must be one of `todo`, `in_progress`, `done`.
- `createdAt` is immutable after create.
- `updatedAt` changes on every successful mutation.

## CRUD Operations

### Create Task

Input:

- `title` (required)
- `description` (optional)

Behavior:

- Generate a new `id`.
- Initialize `status` to `todo` unless explicitly allowed by caller policy.
- Set `createdAt` and `updatedAt` to the same current UTC timestamp.
- Return the created Task.

Failure conditions:

- Validation error for empty/invalid `title`.
- Validation error for malformed optional fields.

### Read Task (Single)

Input:

- `id`

Behavior:

- Return Task for `id` when present.
- Return not-found error when absent.

### List Tasks

Input:

- Optional filters (`status`, search text, pagination controls) when supported.

Behavior:

- Return collection of Tasks sorted by deterministic ordering contract.
- Default ordering recommendation: `updatedAt` descending, then `id` ascending.

### Update Task

Input:

- `id`
- mutable fields: `title`, `description`, and/or `status`

Behavior:

- Validate requested mutation.
- Apply legal field updates.
- Set `updatedAt` to current UTC timestamp.
- Return updated Task.

Failure conditions:

- Not-found error for unknown `id`.
- Validation error for illegal data.
- Conflict error when mutation violates status transition rules.

### Delete Task

Input:

- `id`

Behavior:

- Remove task by `id`.
- Return success acknowledgement with deleted `id` or deleted entity snapshot.

Failure conditions:

- Not-found error for unknown `id`.

## Status Lifecycle and Transition Rules

Allowed transitions:

- `todo -> in_progress`
- `in_progress -> done`
- `in_progress -> todo`
- `done -> in_progress` (reopen)

Disallowed transitions:

- `todo -> done` (must move through `in_progress`)
- `done -> todo` (must reopen to `in_progress` first)

No-op transitions:

- Transitioning to the current status should be treated as idempotent success or explicit no-op, based on API contract.

Transition policy notes:

- Domain services own transition validation.
- UI layer should never bypass service transition logic.

## API/Transport Contract Expectations

- External payloads are parsed with Zod at UI boundaries.
- Success responses should return stable envelopes.
- Failure responses should return explicit machine-readable error codes.

See `docs/FRONTEND.md` for envelope and error surface conventions.

## Non-Functional Requirements

- Deterministic behavior for repeated identical requests.
- Structured logs for create/update/delete and transition events.
- Co-located tests covering invariants and transition matrices.

## Acceptance Criteria Patterns

A feature/change in Tasks is accepted when:

1. CRUD behavior matches this spec for valid and invalid inputs.
2. Status transitions enforce allowed/disallowed rules.
3. Response envelopes match UI conventions.
4. Tests demonstrate invariant enforcement.
5. Docs are updated when behavior changes.

## Out of Scope (Current Iteration)

- Hierarchical subtasks and dependencies.
- Multi-user ownership and assignment semantics.
- Priority scheduling and SLA automation.
- Soft-delete/restore semantics.
