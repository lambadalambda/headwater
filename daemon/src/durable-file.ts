import { randomUUID } from 'node:crypto';
import {
  chmodSync,
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';

const directorySyncUnsupported = (error: unknown): boolean => {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return code !== undefined && ['EBADF', 'EINVAL', 'EISDIR', 'ENOTSUP', 'EPERM'].includes(code);
};

export const pathExists = (path: string): boolean => {
  try {
    statSync(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
};

export const syncDirectory = (path: string): void => {
  let fd: number | null = null;
  let failure: unknown;
  try {
    fd = openSync(path, 'r');
    fsyncSync(fd);
  } catch (error) {
    if (!directorySyncUnsupported(error)) failure = error;
  }
  if (fd !== null) {
    try {
      closeSync(fd);
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure) throw failure;
};

export const atomicWriteText = (path: string, contents: string, mode = 0o600): void => {
  const parent = dirname(path);
  const existed = pathExists(parent);
  if (!existed) {
    const missing: string[] = [];
    let cursor = parent;
    while (!pathExists(cursor)) {
      missing.push(cursor);
      const next = dirname(cursor);
      if (next === cursor) break;
      cursor = next;
    }
    mkdirSync(parent, { recursive: true, mode: 0o700 });
    for (const created of missing.reverse()) syncDirectory(dirname(created));
  }
  const temporary = join(parent, `.${basename(path)}.tmp-${process.pid}-${randomUUID()}`);
  let fd: number | null = null;
  const failures: unknown[] = [];
  try {
    fd = openSync(temporary, 'wx', mode);
    writeFileSync(fd, contents, 'utf8');
    fsyncSync(fd);
    closeSync(fd);
    fd = null;
    renameSync(temporary, path);
    chmodSync(path, mode);
    syncDirectory(parent);
  } catch (error) {
    failures.push(error);
  }
  if (fd !== null) {
    try {
      closeSync(fd);
    } catch (error) {
      failures.push(error);
    }
  }
  try {
    rmSync(temporary, { force: true });
  } catch (error) {
    failures.push(error);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    const first = failures[0] instanceof Error ? failures[0].message : 'unknown failure';
    throw new AggregateError(failures, `atomic write failed: ${first}`);
  }
};

export const durableRemove = (path: string): void => {
  if (!pathExists(path)) return;
  rmSync(path);
  syncDirectory(dirname(path));
};

export const readOptionalText = (path: string): string | null =>
  pathExists(path) ? readFileSync(path, 'utf8') : null;

export const replaceOptionalText = (path: string, contents: string | null): void => {
  if (contents === null) durableRemove(path);
  else atomicWriteText(path, contents);
};
