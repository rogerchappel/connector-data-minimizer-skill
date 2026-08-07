import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function runCli(...args) {
  return spawnSync(process.execPath, ['src/cli.js', 'fixtures/action.json', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

function runCliWithFixture(fixturePath, ...args) {
  return spawnSync(process.execPath, ['src/cli.js', fixturePath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

test('rejects an unsupported output format', () => {
  const result = runCli('--format', 'yaml');

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /--format must be one of: markdown, json/);
});

test('rejects a missing output format value', () => {
  const result = runCli('--format');

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /--format requires a value/);
});

test('rejects unknown options', () => {
  const result = runCli('--bogus');

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'unknown option: --bogus\n');
});

test('rejects unexpected positional arguments', () => {
  const result = runCli('extra.json');

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'unexpected argument: extra.json\n');
});

for (const [option, values] of [
  ['--format', ['json', '--format', 'markdown']],
  ['--policy', ['fixtures/policy.json', '--policy', 'fixtures/policy.json']],
  ['--strict', ['--strict']]
]) {
  test(`rejects duplicate ${option} options`, () => {
    const result = runCli(option, ...values);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `duplicate option: ${option}\n`);
  });
}

test('validates the output format before reading fixture files', () => {
  const result = runCliWithFixture('/definitely/missing/action.json', '--format', 'html');

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '--format must be one of: markdown, json\n');
});

test('preserves policy and strict behavior', () => {
  const result = runCli('--policy', 'fixtures/policy.json', '--format', 'json', '--strict');

  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).unsafe, true);
  assert.equal(result.stderr, '');
});

test('preserves documented output formats', () => {
  const markdown = runCli('--format', 'markdown');
  const json = runCli('--format', 'json');

  assert.equal(markdown.status, 0);
  assert.match(markdown.stdout, /^# Connector Data Minimization Report/);
  assert.equal(json.status, 0);
  assert.doesNotThrow(() => JSON.parse(json.stdout));
});

test('malformed action metadata cannot pass strict mode', () => {
  const directory = mkdtempSync(join(tmpdir(), 'connector-data-minimizer-'));
  const fixture = join(directory, 'action.json');
  writeFileSync(fixture, JSON.stringify({
    connector: '',
    operation: 42,
    requiredFields: ['email'],
    requestedFields: ['email']
  }));

  const result = spawnSync(process.execPath, ['src/cli.js', fixture, '--format', 'json', '--strict'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'connector must be a non-empty string\n');
});

test('policy typos cannot pass strict mode', () => {
  const directory = mkdtempSync(join(tmpdir(), 'connector-data-minimizer-'));
  const policy = join(directory, 'policy.json');
  writeFileSync(policy, JSON.stringify({ blockedField: ['ssn'] }));

  const result = runCli('--policy', policy, '--format', 'json', '--strict');

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'unknown policy property: blockedField\n');
});
