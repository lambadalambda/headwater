import { describe, expect, it } from 'vitest';
import {
  electronSmokeArguments,
  electronSmokeEnvironment,
  validateDesktopSmokePaths,
} from '../src/smoke.js';

describe('Electron smoke launcher', () => {
  it('places Chromium switches before the application directory', () => {
    expect(electronSmokeArguments({
      appDir: '/repo/desktop',
      userData: '/tmp/headwater-smoke',
      marker: '/tmp/headwater-smoke/result.json',
    })).toEqual([
      '--user-data-dir=/tmp/headwater-smoke',
      '--headwater-desktop-smoke-marker=/tmp/headwater-smoke/result.json',
      '/repo/desktop',
    ]);
    expect(electronSmokeArguments({
      userData: '/tmp/headwater-smoke',
      marker: '/tmp/headwater-smoke/result.json',
    })).toEqual([
      '--user-data-dir=/tmp/headwater-smoke',
      '--headwater-desktop-smoke-marker=/tmp/headwater-smoke/result.json',
    ]);
  });

  it('passes the isolated smoke root and marker through the child environment', () => {
    expect(electronSmokeEnvironment({
      PATH: '/usr/bin',
    }, {
      userData: '/tmp/headwater-smoke',
      marker: '/tmp/headwater-smoke/result.json',
    })).toMatchObject({
      PATH: '/usr/bin',
      HEADWATER_DESKTOP_SMOKE_ROOT: '/tmp/headwater-smoke',
      HEADWATER_DESKTOP_SMOKE_MARKER: '/tmp/headwater-smoke/result.json',
    });
  });

  it('accepts only markers directly inside the isolated root', () => {
    const input = { root: '/tmp/headwater-smoke', marker: '/tmp/headwater-smoke/result.json' };
    expect(validateDesktopSmokePaths(input)).toEqual(input);
    expect(validateDesktopSmokePaths({ ...input, marker: '/tmp/outside.json' })).toBeNull();
    expect(validateDesktopSmokePaths({ ...input, root: 'relative' })).toBeNull();
    expect(validateDesktopSmokePaths({ ...input, marker: 'relative' })).toBeNull();
    expect(validateDesktopSmokePaths({ ...input, marker: '/tmp/headwater-smoke/nested/result.json' })).toBeNull();
    expect(validateDesktopSmokePaths({ ...input, marker: '/tmp/headwater-smoke/../outside.json' })).toBeNull();
  });
});
