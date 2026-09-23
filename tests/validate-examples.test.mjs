import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { portabilityErrors, validateExamples } from '../scripts/validate-examples.mjs';

test('rejects machine-local paths and dependency protocols in distributed text', () => {
  for (const source of [
    '/home/timogo/dev/trim', '/Users/developer/trim', '/tmp/trim.tgz', '/opt/local/trim',
    'C:\\Users\\developer\\trim', 'D:/projects/trim', '\\\\server\\share\\trim',
    'specifier: file:../../trim', 'version: link:../..', 'specifier: workspace:*',
    '"@theharborproject/trim": "file:./trim.tgz"',
    'theharborproject-trim-0.1.3.tgz',
  ]) assert.ok(portabilityErrors(source, 'pnpm-lock.yaml').length, source);
});

test('rejects bare local dependency paths and accepts published dependencies', () => {
  for (const dependency of ['/custom/trim', '../trim', '~/trim', 'workspace:^', 'link:../..', 'file:./trim.tgz']) {
    assert.ok(portabilityErrors(JSON.stringify({ dependencies: { '@theharborproject/trim': dependency } }), 'package.json').length);
  }
  for (const source of [
    JSON.stringify({ dependencies: { '@theharborproject/trim': '^0.1.3' } }),
    'resolution: {integrity: sha512-example, tarball: https://registry.npmjs.org/@theharborproject/trim/-/trim-0.1.3.tgz}',
    'link: "text-primary underline-offset-4 hover:underline"',
    'excludeLinksFromLockfile: false',
  ]) assert.deepEqual(portabilityErrors(source, 'fixture.txt'), []);
});

test('checks every distributed file, including docs and nested lockfiles', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'trim-portability-test-'));
  try {
    await mkdir(path.join(directory, 'examples/demo/nested'), { recursive: true });
    await writeFile(path.join(directory, 'registry.json'), JSON.stringify({ examples: { demo: { path: 'examples/demo', files: ['README.md', 'nested/pnpm-lock.yaml'] } } }));
    await writeFile(path.join(directory, 'examples/demo/README.md'), 'Portable example');
    await writeFile(path.join(directory, 'examples/demo/nested/pnpm-lock.yaml'), 'specifier: ^0.1.3');
    assert.deepEqual(await validateExamples(directory), { examples: 1, files: 2 });
    await writeFile(path.join(directory, 'examples/demo/nested/pnpm-lock.yaml'), 'specifier: file:../..');
    await assert.rejects(validateExamples(directory), /nested\/pnpm-lock.yaml:1: local dependency protocol/);
    await writeFile(path.join(directory, 'examples/demo/nested/pnpm-lock.yaml'), 'specifier: ^0.1.3');
    await writeFile(path.join(directory, 'examples/demo/README.md'), 'Install from /home/timogo/trim');
    await assert.rejects(validateExamples(directory), /README.md:1: machine-local absolute path/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects npm lockfile links even when the package specifier is published', () => {
  const source = JSON.stringify({ packages: {
    '': { dependencies: { '@theharborproject/trim': '^0.1.3' } },
    'node_modules/@theharborproject/trim': { resolved: '../..', link: true },
  } });
  assert.ok(portabilityErrors(source, 'package-lock.json').some(error => error.includes('local package resolution')));
});
