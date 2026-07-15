# Connector Data Minimizer Skill

Use this skill when an agent has a connector action plan or dry-run fixture and
needs to prove that the action requests only the data needed for the task.

## Required Inputs

- Connector action fixture in JSON
- Optional policy fixture in JSON
- No live connector credentials

## Side-Effect Boundaries

This skill is read-only. It may inspect local fixture files and write reports
only when the caller redirects output. It must not call external APIs, approve
actions, send messages, update records, or publish artifacts.

## Approval Requirements

External connector writes remain human-approved. A `pass` recommendation means
the fixture has no obvious minimization finding; it is not permission to execute
the action.

## Workflow

1. Capture the planned connector action as a fixture.
2. Run `connector-data-minimizer <fixture> --policy <policy>`.
3. Review extra, missing, sensitive, and blocked fields.
4. Re-run with `--strict` before release or handoff.
5. Include the markdown report in the approval packet.

## Examples

```bash
node src/cli.js fixtures/action.json --policy fixtures/policy.json
node src/cli.js fixtures/action.json --policy fixtures/policy.json --format json --strict
```

## Verification

Run `npm test`, `npm run check`, and `npm run smoke`.

