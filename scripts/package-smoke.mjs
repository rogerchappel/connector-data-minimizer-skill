import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workspace = mkdtempSync(join(tmpdir(), 'connector-data-minimizer-package-'));

try {
  const publish = spawnSync(
    'npx',
    ['--yes', 'npm@11.16.0', 'publish', '--dry-run', '--json'],
    { encoding: 'utf8' },
  );
  if (publish.status !== 0) {
    throw new Error(`npm publish --dry-run failed: ${publish.stderr || publish.stdout}`);
  }
  if (/auto-corrected|invalid and removed/i.test(publish.stderr)) {
    throw new Error(`publish manifest required normalization: ${publish.stderr}`);
  }

  const packOutput = execFileSync(
    'npm',
    ['pack', '--json', '--pack-destination', workspace],
    { encoding: 'utf8' },
  );
  const [{ filename }] = JSON.parse(packOutput);
  const consumer = join(workspace, 'consumer');

  mkdirSync(consumer);
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ name: 'package-smoke-consumer', private: true, type: 'module' }),
  );
  writeFileSync(
    join(consumer, 'verify.mjs'),
    `import assert from 'node:assert/strict';
import { analyzeAction, validateAction, formatJson, formatMarkdown } from 'connector-data-minimizer-skill';

const library = { analyzeAction, validateAction, formatJson, formatMarkdown };
for (const [name, value] of Object.entries(library)) {
  assert.equal(typeof value, 'function', \`${'${name}'} must be a function\`);
}
console.log(\`Packed-package import passed: ${'${Object.keys(library).join(\', \')}'}\`);
`,
  );
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(workspace, filename)],
    { cwd: consumer, stdio: 'inherit' },
  );

  execFileSync(process.execPath, ['verify.mjs'], { cwd: consumer, stdio: 'inherit' });

  const bin = join(consumer, 'node_modules', '.bin', 'connector-data-minimizer');
  const fixture = join(consumer, 'action.json');
  writeFileSync(fixture, JSON.stringify({
    connector: 'crm',
    operation: 'create-contact',
    requiredFields: ['email'],
    requestedFields: ['email', 'private_note'],
  }));

  const runBin = (...args) => spawnSync(bin, args, { cwd: consumer, encoding: 'utf8' });
  const usage = runBin();
  if (usage.status !== 1 || !usage.stderr.includes('usage: connector-data-minimizer')) {
    throw new Error(`installed bin usage check failed: ${usage.stderr}`);
  }

  const markdown = runBin(fixture);
  if (markdown.status !== 0 || !markdown.stdout.startsWith('# Connector Data Minimization Report')) {
    throw new Error(`installed bin markdown check failed: ${markdown.stderr}`);
  }

  const json = runBin(fixture, '--format', 'json');
  if (json.status !== 0 || JSON.parse(json.stdout).unsafe !== true) {
    throw new Error(`installed bin JSON check failed: ${json.stderr}`);
  }

  const strict = runBin(fixture, '--format', 'json', '--strict');
  if (strict.status !== 2 || JSON.parse(strict.stdout).unsafe !== true) {
    throw new Error(`installed bin strict check failed: ${strict.stderr}`);
  }

  const duplicate = runBin(fixture, '--strict', '--strict');
  if (duplicate.status !== 1 || duplicate.stderr !== 'duplicate option: --strict\n') {
    throw new Error(`installed bin argument check failed: ${duplicate.stderr}`);
  }

  console.log('Packed-package CLI passed: usage, markdown, JSON, strict, argument errors');
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
