import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAction } from '../src/analyze.js';

test('flags extra sensitive and blocked fields', () => {
  const report = analyzeAction(
    {
      connector: 'crm',
      operation: 'create-contact',
      requiredFields: ['email', 'name'],
      optionalFields: ['company'],
      requestedFields: ['email', 'name', 'company', 'ssn']
    },
    {
      allowedFields: ['email', 'name', 'company'],
      sensitiveFields: ['ssn'],
      blockedFields: ['ssn']
    }
  );

  assert.equal(report.recommendation, 'block');
  assert.deepEqual(report.extraFields, ['ssn']);
  assert.deepEqual(report.sensitiveFields, ['ssn']);
  assert.deepEqual(report.blockedFields, ['ssn']);
});

test('passes minimal fixture', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'update-contact',
    requiredFields: ['email'],
    requestedFields: ['email']
  });

  assert.equal(report.recommendation, 'pass');
  assert.equal(report.unsafe, false);
});

test('blocks missing required fields', () => {
  const report = analyzeAction({
    connector: 'ticketing',
    operation: 'assign-ticket',
    requiredFields: ['ticket_id', 'assignee'],
    requestedFields: ['ticket_id']
  });

  assert.equal(report.recommendation, 'block');
  assert.deepEqual(report.missingRequired, ['assignee']);
});

