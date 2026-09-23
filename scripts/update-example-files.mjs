import { readdir, readFile, writeFile, rename, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const registryDirectory = fileURLToPath(new URL('../registry/', import.meta.url));
const manifestPath = path.join(registryDirectory, 'registry.json');
// Source examples only: never publish installed dependencies, build output,
// repository metadata, local secrets, or machine-generated caches.
const excludedDirectories = new Set(['node_modules', '.git', '.next', 'out', 'build', 'dist', 'coverage', '.vercel', '.turbo']);
const excludedFile = (name) => name === '.DS_Store' || name.endsWith('.tsbuildinfo') || /^(npm-debug|yarn-debug|yarn-error|\.pnpm-debug)\.log/.test(name) || (/^\.env(?:\.|$)/.test(name) && !/\.(example|sample|template)$/.test(name));
const validatePath = (value) => {
  if (typeof value !== 'string' || value.split('/').some(part => !part || part === '.' || part === '..' || /[\\:\x00-\x1f]/.test(part))) throw new Error(`Invalid example path: ${JSON.stringify(value)}`);
};
async function walk(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name) || excludedFile(entry.name)) continue;
    const relative = prefix + entry.name;
    validatePath(relative);
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative + '/'));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported example entry: ${path.join(directory, entry.name)} (symlinks are not published)`);
  }
  return files.sort();
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!manifest.examples || typeof manifest.examples !== 'object' || Array.isArray(manifest.examples)) throw new Error('Expected manifest.examples');
for (const example of Object.values(manifest.examples)) {
  validatePath(example.path);
  let directory = registryDirectory;
  for (const part of example.path.split('/')) {
    directory = path.join(directory, part);
    if (!(await lstat(directory)).isDirectory()) throw new Error(`Expected regular directory: ${directory}`);
  }
  example.files = await walk(directory);
}
// Leave the old manifest intact if walking or writing fails.
const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
try {
  await writeFile(temporaryPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  await rename(temporaryPath, manifestPath);
} finally {
  await rm(temporaryPath, { force: true });
}
console.log(`Updated inventories for ${Object.keys(manifest.examples).length} examples.`);
