export function formatJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
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
