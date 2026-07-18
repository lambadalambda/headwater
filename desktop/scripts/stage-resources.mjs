import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRPCServerPath } from '@deltachat/stdio-rpc-server';
import { nativeHelperFilename } from '../dist/paths.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const resolvePackageRoot = (name, from) => {
  const candidates = [join(from, 'node_modules', ...name.split('/'))];
  for (let current = from; current !== dirname(current); current = dirname(current)) {
    if (basename(current) === 'node_modules') candidates.push(join(current, ...name.split('/')));
  }
  for (const candidate of candidates) {
    const manifest = join(candidate, 'package.json');
    if (existsSync(manifest) && readJson(manifest).name === name) return realpathSync(candidate);
  }
  let current = dirname(createRequire(join(from, 'package.json')).resolve(name));
  while (current !== dirname(current)) {
    const manifest = join(current, 'package.json');
    if (existsSync(manifest) && readJson(manifest).name === name) return current;
    current = dirname(current);
  }
  throw new Error(`could not locate runtime package ${name}`);
};
const stageRuntimePackages = (destination) => {
  const rootManifest = readJson(join(root, 'package.json'));
  const versions = new Map();
  const copied = new Set();
  const stagePackage = (name, from, nodeModules) => {
    const source = resolvePackageRoot(name, from);
    const manifest = readJson(join(source, 'package.json'));
    const target = join(nodeModules, ...name.split('/'));
    const key = `${target}\0${manifest.version}`;
    if (copied.has(key)) return;
    copied.add(key);
    const packageVersions = versions.get(name) ?? new Set();
    packageVersions.add(manifest.version);
    versions.set(name, packageVersions);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target, { recursive: true, dereference: true });
    const requiredPeers = Object.keys(manifest.peerDependencies ?? {})
      .filter((peer) => manifest.peerDependenciesMeta?.[peer]?.optional !== true);
    for (const dependency of new Set([...Object.keys(manifest.dependencies ?? {}), ...requiredPeers])) {
      stagePackage(dependency, source, join(target, 'node_modules'));
    }
  };
  for (const dependency of Object.keys(rootManifest.dependencies ?? {})) {
    stagePackage(dependency, root, destination);
  }
  return Object.fromEntries([...versions]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, packageVersions]) => [name, [...packageVersions].sort()]));
};
const resources = join(root, 'resources');
const resourceName = basename(resources);
const orphanedBackups = readdirSync(root)
  .filter((entry) => entry.startsWith(`${resourceName}.backup-`))
  .map((entry) => join(root, entry));
if (!existsSync(resources) && orphanedBackups[0]) renameSync(orphanedBackups.shift(), resources);
for (const orphan of orphanedBackups) rmSync(orphan, { recursive: true, force: true });
for (const entry of readdirSync(root).filter((name) => name.startsWith(`${resourceName}.tmp-`))) {
  rmSync(join(root, entry), { recursive: true, force: true });
}
const staging = `${resources}.tmp-${process.pid}`;
const backup = `${resources}.backup-${process.pid}`;
rmSync(staging, { recursive: true, force: true });
rmSync(backup, { recursive: true, force: true });
try {
  mkdirSync(join(staging, 'utility'), { recursive: true });
  mkdirSync(join(staging, 'native'), { recursive: true });
  cpSync(resolve(root, '../daemon/dist'), join(staging, 'daemon', 'dist'), { recursive: true });
  copyFileSync(resolve(root, '../daemon/package.json'), join(staging, 'daemon', 'package.json'));
  cpSync(resolve(root, '../frontend/build'), join(staging, 'frontend'), { recursive: true });
  copyFileSync(join(root, 'dist', 'worker.mjs'), join(staging, 'utility', 'worker.mjs'));
  copyFileSync(join(root, 'dist', 'protocol.js'), join(staging, 'utility', 'protocol.js'));
  const runtimePackages = stageRuntimePackages(join(staging, 'node_modules'));
  writeFileSync(join(staging, 'runtime-packages.json'), `${JSON.stringify(runtimePackages, null, 2)}\n`);
  const native = getRPCServerPath({ disableEnvPath: true });
  const nativeTarget = join(staging, 'native', nativeHelperFilename(process.platform));
  copyFileSync(native, nativeTarget);
  if (process.platform !== 'win32') chmodSync(nativeTarget, 0o755);
  if (existsSync(resources)) renameSync(resources, backup);
  try {
    renameSync(staging, resources);
  } catch (error) {
    if (existsSync(backup)) renameSync(backup, resources);
    throw error;
  }
  rmSync(backup, { recursive: true, force: true });
} catch (error) {
  rmSync(staging, { recursive: true, force: true });
  if (!existsSync(resources) && existsSync(backup)) renameSync(backup, resources);
  throw error;
}
