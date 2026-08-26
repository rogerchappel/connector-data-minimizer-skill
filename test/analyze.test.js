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

test('passes empty field lists and an empty policy', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: [],
    optionalFields: [],
    requestedFields: []
  });

  assert.equal(report.recommendation, 'pass');
  assert.equal(report.unsafe, false);
  assert.deepEqual(report.minimalFields, []);
  assert.deepEqual(report.optionalFields, []);
  assert.deepEqual(report.requestedFields, []);
  assert.deepEqual(report.extraFields, []);
  assert.deepEqual(report.missingRequired, []);
  assert.deepEqual(report.disallowedFields, []);
  assert.deepEqual(report.sensitiveFields, []);
  assert.deepEqual(report.blockedFields, []);
});

test('empty policy lists leave requested fields unrestricted', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: ['email'],
    requestedFields: ['email', 'anything']
  }, {
    allowedFields: [],
    sensitiveFields: [],
    blockedFields: [],
    manualReviewApprovals: []
  });

  assert.equal(report.recommendation, 'review');
  assert.deepEqual(report.disallowedFields, []);
  assert.deepEqual(report.sensitiveFields, []);
  assert.deepEqual(report.blockedFields, []);
  assert.deepEqual(report.extraFields, ['anything']);
});

test('omitted optional fields, destination, and approval default safely', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: ['email'],
    requestedFields: ['email']
  });

  assert.deepEqual(report.optionalFields, []);
  assert.equal(report.destination, 'unspecified');
  assert.equal(report.approval, 'unspecified');
  assert.equal(report.recommendation, 'pass');
});

test('null optional fields are rejected', () => {
  assert.throws(
    () => analyzeAction({
      connector: 'crm',
      operation: 'update-contact',
      requiredFields: ['email'],
      optionalFields: null,
      requestedFields: ['email']
    }),
    { message: 'optionalFields must be an array' }
  );
});

for (const [property, value] of [
  ['destination', null],
  ['approval', null]
]) {
  test(`rejects null action ${property} metadata`, () => {
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

test('blocked fields win over allowed fields', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: ['email'],
    requestedFields: ['email', 'government_id']
  }, {
    allowedFields: ['email', 'government_id'],
    blockedFields: ['government_id']
  });

  assert.equal(report.recommendation, 'block');
  assert.deepEqual(report.blockedFields, ['government_id']);
  assert.deepEqual(report.disallowedFields, []);
});

test('sensitive fields still require review when also allowed', () => {
  const report = analyzeAction({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: ['email'],
    requestedFields: ['email', 'government_id']
  }, {
    allowedFields: ['email', 'government_id'],
    sensitiveFields: ['government_id']
  });

  assert.equal(report.recommendation, 'review');
  assert.deepEqual(report.sensitiveFields, ['government_id']);
  assert.deepEqual(report.disallowedFields, []);
  assert.deepEqual(report.blockedFields, []);
});

for (const [label, value] of [
  ['null', null],
  ['an array', []],
  ['a string', 'crm']
]) {
  test(`rejects ${label} action input`, () => {
    assert.throws(
      () => analyzeAction(value),
      { message: 'action fixture must be an object' }
    );
  });
}

for (const key of ['connector', 'operation', 'requiredFields', 'requestedFields']) {
  test(`rejects an action fixture missing ${key}`, () => {
    const action = {
      connector: 'crm',
      operation: 'create-contact',
      requiredFields: ['email'],
      requestedFields: ['email']
    };
    delete action[key];
    assert.throws(
      () => analyzeAction(action),
      { message: `action fixture missing ${key}` }
    );
  });
}

for (const [label, value] of [
  ['null', null],
  ['an array', []],
  ['a string', 'policy']
]) {
  test(`rejects ${label} policy input`, () => {
    assert.throws(
      () => analyzeAction({
        connector: 'crm',
        operation: 'create-contact',
        requiredFields: ['email'],
        requestedFields: ['email']
      }, value),
      { message: 'policy fixture must be an object' }
    );
  });
}
