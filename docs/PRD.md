# Product Requirements

## Goal

Give agents a reusable way to demonstrate data minimization for connector action
plans before a human approves external side effects.

## Non-Goals

- Live connector introspection
- Credential handling
- Automatic approval or action execution

## User Stories

- As an agent, I can compare requested fields with required fields so I can
  remove unnecessary data before asking for approval.
- As a reviewer, I can see sensitive and blocked fields in one compact report.
- As a maintainer, I can run strict checks in CI against connector fixtures.

## MVP Requirements

- Parse action and policy JSON fixtures
- Identify missing required fields, extra fields, sensitive fields, blocked
  fields, and policy-disallowed fields
- Recommend `pass`, `review`, or `block`
- Render markdown and JSON reports
- Exit non-zero in strict mode for unsafe plans

