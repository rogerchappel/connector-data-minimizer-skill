# connector-data-minimizer-skill

`connector-data-minimizer-skill` helps agents review connector action plans before
approval. It reads a dry-run fixture, compares requested fields with required
fields and policy, and returns a concise minimization report.

The tool is local-first and read-only. It does not call live connectors, mutate
external systems, or approve actions.

## Quickstart

```bash
npm install
npm test
npm run smoke
node src/cli.js fixtures/action.json --policy fixtures/policy.json --format json
```

## CLI

```bash
connector-data-minimizer <action.json> [--policy policy.json] [--format markdown|json] [--strict]
```

`--format` defaults to `markdown` and accepts only `markdown` or `json`. Supplying
the flag without a value, or using another format name, exits with an error.
Unknown options and unexpected positional arguments are also rejected.

Use `--strict` in CI or release gates when extra fields, missing required fields,
blocked policy fields, or high-risk approval modes should fail the command.

## Fixture Shape

Action fixtures include the connector, operation, destination, approval mode, and
field lists:

```json
{
  "connector": "crm",
  "operation": "create-contact",
  "destination": "sandbox",
  "approval": "dry-run",
  "requiredFields": ["email", "name"],
  "optionalFields": ["company"],
  "requestedFields": ["email", "name", "company", "private_note"]
}
```

Policy fixtures can define allowed fields, sensitive fields, blocked fields, and
approval modes that require manual review. `requiredFields`, `optionalFields`,
`requestedFields`, and every policy field list must be JSON arrays, including
when a list contains only one field. Every list entry must be a non-empty string.
Surrounding whitespace is ignored and duplicate names are collapsed before
action fields are compared with policy fields.

## Limitations

- Field comparison is name-based and intentionally deterministic.
- The tool does not infer schema semantics from live APIs.
- Reports are advisory unless `--strict` is used by the caller.

## Safety Notes

- Never pass live credentials or secrets into fixtures.
- Review the generated minimal field set before executing any real action.
- Treat sensitive-field findings as approval blockers unless a human explicitly
  accepts the risk.
