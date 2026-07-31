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

test('normalizes and deduplicates action and policy field names', () => {
  const report = analyzeAction(
    {
      connector: 'crm',
      operation: 'create-contact',
      destination: ' production ',
      requiredFields: [' email ', 'email'],
      optionalFields: [' ssn '],
      requestedFields: ['email', ' ssn ', 'ssn']
    },
    {
      allowedFields: [' email ', 'ssn', 'ssn '],
      sensitiveFields: [' ssn '],
      blockedFields: [' ssn ', 'ssn'],
      manualReviewApprovals: [' production ']
    }
  );

  assert.deepEqual(report.minimalFields, ['email']);
  assert.deepEqual(report.requestedFields, ['email', 'ssn']);
  assert.deepEqual(report.sensitiveFields, ['ssn']);
  assert.deepEqual(report.blockedFields, ['ssn']);
  assert.equal(report.manualReview, true);
  assert.equal(report.recommendation, 'block');
});

test('rejects a malformed optional field list', () => {
  assert.throws(
    () => analyzeAction({
      connector: 'crm',
      operation: 'update-contact',
      requiredFields: ['email'],
      optionalFields: 'company',
      requestedFields: ['email']
    }),
    { message: 'optionalFields must be an array' }
  );
});

for (const property of ['allowedFields', 'sensitiveFields', 'blockedFields', 'manualReviewApprovals']) {
  test(`rejects a malformed policy ${property} list`, () => {
    assert.throws(
      () => analyzeAction({
        connector: 'crm',
        operation: 'update-contact',
        requiredFields: ['email'],
        requestedFields: ['email']
      }, { [property]: 'email' }),
      { message: `policy.${property} must be an array` }
    );
  });
}

for (const [property, value] of [
  ['requiredFields', 42],
  ['optionalFields', '   '],
  ['requestedFields', null]
]) {
  test(`rejects malformed action ${property} entries`, () => {
    assert.throws(
      () => analyzeAction({
        connector: 'crm',
        operation: 'update-contact',
        requiredFields: property === 'requiredFields' ? [value] : ['email'],
        optionalFields: property === 'optionalFields' ? [value] : [],
        requestedFields: property === 'requestedFields' ? [value] : ['email']
      }),
      { message: `${property}[0] must be a non-empty string` }
    );
  });
}

test('rejects malformed policy list entries with their location', () => {
  assert.throws(
    () => analyzeAction({
      connector: 'crm',
      operation: 'update-contact',
      requiredFields: ['email'],
      requestedFields: ['email']
    }, { blockedFields: ['ssn', false] }),
    { message: 'policy.blockedFields[1] must be a non-empty string' }
  );
});

for (const [property, value] of [
  ['connector', ''],
  ['connector', 42],
  ['operation', '   '],
  ['operation', {}],
  ['destination', []],
  ['approval', false]
]) {
  test(`rejects malformed action ${property} metadata`, () => {
    assert.throws(
      () => analyzeAction({
        connector: 'crm',
        operation: 'update-contact',
        requiredFields: ['email'],
        requestedFields: ['email'],
        [property]: value
      }),
      { message: `${property} must be a non-empty string` }
    );
  });
}

test('rejects unknown policy properties', () => {
  assert.throws(
    () => analyzeAction({
      connector: 'crm',
      operation: 'update-contact',
      requiredFields: ['email'],
      requestedFields: ['email', 'ssn']
    }, { blockedField: ['ssn'] }),
    { message: 'unknown policy property: blockedField' }
  );
});
