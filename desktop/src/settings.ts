import { closeSync, fsyncSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export type DesktopSettings = Readonly<{
  version: 1;
  port: number;
  backupRequired: boolean;
}>;

const defaults = (): DesktopSettings => Object.freeze({ version: 1, port: 0, backupRequired: true });

const validate = (value: unknown): DesktopSettings => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('invalid desktop settings');
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(',') !== 'backupRequired,port,version'
    || record['version'] !== 1
    || !Number.isSafeInteger(record['port'])
    || (record['port'] as number) < 0
    || (record['port'] as number) > 65535
    || typeof record['backupRequired'] !== 'boolean') {
    throw new Error('invalid desktop settings');
  }
  return Object.freeze({ version: 1, port: record['port'] as number, backupRequired: record['backupRequired'] });
};

export const readDesktopSettings = (path: string): DesktopSettings => {
  try {
    if (statSync(path).size > 4096) throw new Error('invalid desktop settings');
    return validate(JSON.parse(readFileSync(path, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return defaults();
    if (error instanceof Error && error.message === 'invalid desktop settings') throw error;
    throw new Error('invalid desktop settings', { cause: error });
  }
};

export const writeDesktopSettings = (path: string, settings: DesktopSettings): void => {
  const valid = validate(settings);
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(valid)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600, flush: true });
    renameSync(temporary, path);
    if (process.platform !== 'win32') {
      const directory = openSync(dirname(path), 'r');
      try { fsyncSync(directory); } finally { closeSync(directory); }
    }
  } catch (error) {
    throw new Error('desktop settings could not be saved', { cause: error });
  } finally {
    try { unlinkSync(temporary); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('desktop settings could not be saved', { cause: error });
    }
  }
};
