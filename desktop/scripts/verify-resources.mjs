import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { nativeHelperFilename } from '../dist/paths.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const resources = join(root, 'resources');
const required = [
  join(resources, 'daemon', 'dist', 'daemon.js'),
  join(resources, 'frontend', 'index.html'),
  join(resources, 'utility', 'worker.mjs'),
  join(resources, 'utility', 'protocol.js'),
  join(resources, 'runtime-packages.json'),
  join(resources, 'native', nativeHelperFilename(process.platform)),
];
for (const path of required) {
  if (!existsSync(path)) throw new Error(`missing staged desktop resource: ${path}`);
}
if (process.platform !== 'win32') accessSync(required.at(-1), constants.X_OK);
const packages = JSON.parse(readFileSync(join(resources, 'runtime-packages.json'), 'utf8'));
for (const name of ['@deltachat/jsonrpc-client', '@deltachat/stdio-rpc-server', '@hono/node-server', 'hono', 'ws']) {
  if (!Array.isArray(packages[name]) || packages[name].length === 0) throw new Error(`missing staged runtime package: ${name}`);
}
const daemon = await import(pathToFileURL(join(resources, 'daemon', 'dist', 'daemon.js')).href);
if (typeof daemon.startDaemon !== 'function') throw new Error('staged daemon does not export startDaemon');
