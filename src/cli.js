#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { analyzeAction } from './analyze.js';
import { formatJson, formatMarkdown } from './report.js';

async function main(argv) {
  const [fixturePath, ...rest] = argv;
  if (!fixturePath) {
    throw new Error('usage: connector-data-minimizer <action.json> [--policy policy.json] [--format markdown|json] [--strict]');
  }

  const flags = parseFlags(rest);
  const action = JSON.parse(await readFile(fixturePath, 'utf8'));
  const policy = flags.policy ? JSON.parse(await readFile(flags.policy, 'utf8')) : {};
  const report = analyzeAction(action, policy);
  const format = validateFormat(flags.format);

  process.stdout.write(format === 'json' ? formatJson(report) : formatMarkdown(report));
  if (flags.strict === true && report.unsafe) {
    process.exitCode = 2;
  }
}

function validateFormat(format) {
  if (format === true) {
    throw new Error('--format requires a value');
  }
  const selected = format ?? 'markdown';
  if (!['markdown', 'json'].includes(selected)) {
    throw new Error('--format must be one of: markdown, json');
  }
  return selected;
}

function parseFlags(args) {
  const flags = {};
  const valueFlags = new Set(['policy', 'format']);
  const booleanFlags = new Set(['strict']);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      throw new Error(`unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    if (!valueFlags.has(key) && !booleanFlags.has(key)) {
      throw new Error(`unknown option: --${key}`);
    }
    if (booleanFlags.has(key)) {
      flags[key] = true;
      continue;
    }
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`--${key} requires a value`);
    }
    flags[key] = next;
    index += 1;
  }
  return flags;
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
