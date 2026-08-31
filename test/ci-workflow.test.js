import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.github/workflows/ci.yml', import.meta.url);

test('CI uses immutable, least-privilege dependencies across the supported Node matrix', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /node-version: \['20\.0\.0', '24'\]/);
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40} # v4\.2\.2/);
  assert.match(workflow, /actions\/setup-node@[0-9a-f]{40} # v4\.4\.0/);
  assert.match(workflow, /- run: npm ci/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:checkout|setup-node)@v\d/);
});
