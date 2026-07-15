import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAction } from '../src/analyze.js';
import { formatMarkdown } from '../src/report.js';

test('renders approval-ready markdown', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: ['email'],
    requestedFields: ['email', 'note']
  });
  const markdown = formatMarkdown(report);

  assert.match(markdown, /Connector Data Minimization Report/);
  assert.match(markdown, /Extra requested: note/);
  assert.match(markdown, /Recommendation: review/);
});

