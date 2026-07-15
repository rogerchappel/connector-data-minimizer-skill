export function formatJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatMarkdown(report) {
  const lines = [
    `# Connector Data Minimization Report`,
    ``,
    `- Connector: ${report.connector}`,
    `- Operation: ${report.operation}`,
    `- Destination: ${report.destination}`,
    `- Approval mode: ${report.approval}`,
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
  return values.length === 0 ? 'none' : values.join(', ');
}

function list(values) {
  if (values.length === 0) {
    return '- none';
  }
  return values.map((value) => `- ${value}`).join('\n');
}

