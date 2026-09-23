import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Inspect distributed text, including lockfiles and documentation. Binary assets
// are decoded for scanning too; none of these patterns is valid asset content.
export function portabilityErrors(source, filename) {
  const errors = [];
  const rules = [
    ['machine-local absolute path', /\/(?:home|Users|root|tmp|private|var|opt|mnt|media|Volumes|srv|usr)\/[^\s"'`<>]+|\b[A-Za-z]:[\\/][^\s"'`<>]+|\\\\[A-Za-z0-9_.-]+\\[^\s"'`<>]+/],
    ['local dependency protocol', /\b(?:file|link|workspace):[^\s"'`,}]+/],
    ['local Trim tarball', /theharborproject-trim-[^\s"'`/\\]*\.tgz/i],
  ];
  for (const [index, line] of source.split('\n').entries()) {
    for (const [reason, pattern] of rules) {
      if (pattern.test(line)) errors.push(`${filename}:${index + 1}: ${reason}`);
    }
  }
  if (path.basename(filename) === 'package.json') {
    const manifest = JSON.parse(source);
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
        if (typeof specifier !== 'string' || /^(?:file:|link:|workspace:|\.{1,2}[\\/]|[\\/~]|[A-Za-z]:)/.test(specifier)) {
          errors.push(`${filename}: ${section}.${name} must use a portable registry dependency`);
        }
      }
    }
  }
  if (['package-lock.json', 'npm-shrinkwrap.json'].includes(path.basename(filename))) {
    const lockfile = JSON.parse(source);
    for (const [location, entry] of Object.entries(lockfile.packages ?? {})) {
      if (entry.link || /^(?:\.{1,2}[\\/]|[\\/~]|[A-Za-z]:)/.test(location) ||
          (entry.resolved && !/^https?:\/\//.test(entry.resolved))) {
        errors.push(`${filename}: ${location} has a local package resolution`);
      }
    }
  }
  return errors;
}

export async function validateExamples(registryDirectory) {
  const manifest = JSON.parse(await readFile(path.join(registryDirectory, 'registry.json'), 'utf8'));
  const errors = [];
  let count = 0;
  for (const [name, example] of Object.entries(manifest.examples)) {
    if (!Array.isArray(example.files)) throw new Error(`Missing inventory for ${name}; run npm run registry:generate`);
    for (const file of example.files) {
      const relative = `${example.path}/${file}`;
      if (relative.split('/').some(part => !part || part === '.' || part === '..' || /[\\:\x00-\x1f]/.test(part))) throw new Error(`Invalid inventory path: ${relative}`);
      const source = await readFile(path.join(registryDirectory, relative), 'utf8');
      errors.push(...portabilityErrors(source, relative));
      count++;
    }
  }
  if (errors.length) throw new Error(`Non-portable registry examples:\n${errors.join('\n')}`);
  return { examples: Object.keys(manifest.examples).length, files: count };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await validateExamples(fileURLToPath(new URL('../registry/', import.meta.url)));
    console.log(`Portable registry: ${result.examples} examples, ${result.files} distributed files checked.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
