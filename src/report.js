export function formatJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatSarif(report) {
  const findings = [
    ['MISSING_REQUIRED', report.missingRequired, 'Required field was not requested'],
    ['EXTRA_FIELD', report.extraFields, 'Unnecessary field was requested'],
    ['DISALLOWED_FIELD', report.disallowedFields, 'Field is not allowed by policy'],
    ['SENSITIVE_FIELD', report.sensitiveFields, 'Sensitive field was requested'],
    ['BLOCKED_FIELD', report.blockedFields, 'Blocked field was requested']
  ];
  const results = findings.flatMap(([ruleId, fields, message]) => fields.map((field) => ({
    ruleId,
    level: ruleId === 'MISSING_REQUIRED' || ruleId === 'DISALLOWED_FIELD' || ruleId === 'BLOCKED_FIELD' ? 'error' : 'warning',
    message: { text: `${message}: ${field}` },
    locations: [{ logicalLocations: [{ name: `${report.connector}.${report.operation}`, kind: 'function' }] }]
  })));
  if (report.manualReview) results.push({
    ruleId: 'MANUAL_REVIEW', level: 'warning', message: { text: 'Action requires manual review' },
    locations: [{ logicalLocations: [{ name: `${report.connector}.${report.operation}`, kind: 'function' }] }]
  });
  const rules = [...new Set(results.map((result) => result.ruleId))].map((id) => ({ id, shortDescription: { text: id.replaceAll('_', ' ').toLowerCase() } }));
  return `${JSON.stringify({ $schema: 'https://json.schemastore.org/sarif-2.1.0.json', version: '2.1.0', runs: [{ tool: { driver: { name: 'connector-data-minimizer', rules } }, results }] }, null, 2)}\n`;
}

export function formatMarkdown(report) {
  const lines = [
    `# Connector Data Minimization Report`,
    ``,
    `- Connector: ${markdownValue(report.connector)}`,
    `- Operation: ${markdownValue(report.operation)}`,
    `- Destination: ${markdownValue(report.destination)}`,
    `- Approval mode: ${markdownValue(report.approval)}`,
    `- Recommendation: ${report.recommendation}`,
    ``,
    `## Minimal Field Set`,
    list(report.minimalFields),
    ``,
    `## Optional Fields Kept`,
    list(report.optionalFields),
    ``,
    `## Findings`,
    `- Missing required: ${inline(report.missingRequired)}`,
    `- Extra requested: ${inline(report.extraFields)}`,
    `- Sensitive requested: ${inline(report.sensitiveFields)}`,
    `- Blocked requested: ${inline(report.blockedFields)}`,
    `- Policy-disallowed: ${inline(report.disallowedFields)}`,
    `- Manual review mode: ${report.manualReview ? 'yes' : 'no'}`,
    ``,
    `## Approval Summary`,
    approvalSummary(report)
  ];
  return `${lines.join('\n')}\n`;
}

function approvalSummary(report) {
  if (report.recommendation === 'pass') {
    return 'No minimization findings were detected in this fixture.';
  }
  if (report.recommendation === 'block') {
    return 'Do not execute this action until blocking field findings are resolved.';
  }
  return 'Human review is required before this connector action should run.';
}

function inline(values) {
  return values.length === 0 ? 'none' : values.map(markdownValue).join(', ');
}

function list(values) {
  if (values.length === 0) {
    return '- none';
  }
  return values.map((value) => `- ${markdownValue(value)}`).join('\n');
}

function markdownValue(value) {
  const visible = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, (character) => {
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === '\t') return '\\t';
    return `\\u${character.codePointAt(0).toString(16).padStart(4, '0')}`;
  });
  const longestBacktickRun = Math.max(0, ...Array.from(visible.matchAll(/`+/g), (match) => match[0].length));
  const fence = '`'.repeat(longestBacktickRun + 1);
  return `${fence} ${visible} ${fence}`;
}
