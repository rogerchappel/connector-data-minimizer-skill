import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function runCli(...args) {
  return spawnSync(process.execPath, ['src/cli.js', 'fixtures/action.json', ...args], {
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

test('preserves documented output formats', () => {
  const markdown = runCli('--format', 'markdown');
  const json = runCli('--format', 'json');

  assert.equal(markdown.status, 0);
  assert.match(markdown.stdout, /^# Connector Data Minimization Report/);
  assert.equal(json.status, 0);
  assert.doesNotThrow(() => JSON.parse(json.stdout));
});
