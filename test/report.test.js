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
  assert.match(markdown, /Extra requested: ` note `/);
  assert.match(markdown, /Recommendation: review/);
});

test('keeps markdown punctuation and controls inside metadata values', () => {
  const report = analyzeAction({
    connector: '# crm\n- injected',
    operation: '[create](https://example.test) **contact**',
    destination: 'sandbox\t| production',
    approval: 'dry`run\u0007',
    requiredFields: ['email'],
    requestedFields: ['email']
  });
  const markdown = formatMarkdown(report);

  assert.match(markdown, /Connector: ` # crm\\n- injected `/);
  assert.match(markdown, /Operation: ` \[create\]\(https:\/\/example\.test\) \*\*contact\*\* `/);
  assert.match(markdown, /Destination: ` sandbox\\t\| production `/);
  assert.match(markdown, /Approval mode: `` dry`run\\u0007 ``/);
  assert.equal(markdown.match(/^# /gm)?.length, 1);
  assert.equal(markdown.includes('\n- injected\n'), false);
});

test('keeps field names inside inline findings and field lists', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: ['# required\n1. injected'],
    optionalFields: ['[optional](https://example.test)'],
    requestedFields: ['[optional](https://example.test)', '**extra**\r\n> quote']
  });
  const markdown = formatMarkdown(report);

  assert.match(markdown, /- ` # required\\n1\. injected `/);
  assert.match(markdown, /- ` \[optional\]\(https:\/\/example\.test\) `/);
  assert.match(markdown, /Missing required: ` # required\\n1\. injected `/);
  assert.match(markdown, /Extra requested: ` \*\*extra\*\*\\r\\n> quote `/);
  assert.equal(markdown.includes('\n1. injected\n'), false);
  assert.equal(markdown.includes('\n> quote\n'), false);
});
