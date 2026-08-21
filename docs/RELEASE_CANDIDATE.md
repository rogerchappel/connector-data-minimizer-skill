# Release Candidate Notes

## Classification

ship

## Verification

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
