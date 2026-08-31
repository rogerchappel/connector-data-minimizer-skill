# Release Candidate Notes

## Classification

ship

## Verification

- GitHub Actions - pass on the declared minimum Node.js 20.0.0 and Node.js 24,
  using immutable action revisions and read-only repository permissions
- `npm ci` - pass
- `npm test` - pass
- `npm run check` - pass
- `npm run smoke` - pass, fixture recommends `block` for excessive and blocked fields
- `npm run package-smoke` - pass; npm 11.16.0 accepts the publish manifest
  without correction, and the packed package exposes its root API and installed
  `connector-data-minimizer` command

## Known Limits

- Name-based field matching only
- No connector-specific schema discovery
- No report file writer beyond shell redirection
