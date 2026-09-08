import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.github/workflows/ci.yml', import.meta.url);

test('CI uses immutable, least-privilege dependencies across the supported Node matrix', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /node-version: \['20\.0\.0', '24'\]/);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/);
  assert.match(workflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/);
  assert.match(workflow, /- run: npm ci/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:checkout|setup-node)@v\d/);
});
