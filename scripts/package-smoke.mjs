import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workspace = mkdtempSync(join(tmpdir(), 'connector-data-minimizer-package-'));

try {
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
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
