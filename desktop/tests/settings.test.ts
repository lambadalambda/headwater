import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readDesktopSettings, writeDesktopSettings } from '../src/settings.js';

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('desktop settings', () => {
  it('defaults safely and persists the stable port and backup gate atomically', () => {
    const dir = mkdtempSync(join(tmpdir(), 'headwater-desktop-settings-'));
    dirs.push(dir);
    const path = join(dir, 'desktop-settings.json');

    expect(readDesktopSettings(path)).toEqual({ version: 1, port: 0, backupRequired: true });
    writeDesktopSettings(path, { version: 1, port: 43123, backupRequired: true });
    expect(readDesktopSettings(path)).toEqual({ version: 1, port: 43123, backupRequired: true });
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({ version: 1, port: 43123, backupRequired: true });
  });

  it('fails closed on malformed or unsupported persisted settings', () => {
    const dir = mkdtempSync(join(tmpdir(), 'headwater-desktop-settings-'));
    dirs.push(dir);
    const path = join(dir, 'desktop-settings.json');
    expect(() => writeDesktopSettings(path, { version: 1, port: 70000, backupRequired: false })).toThrow(/settings/i);
  });
});
