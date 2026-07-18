import { describe, expect, it } from 'vitest';
import { electronSmokeArguments } from '../src/smoke.js';

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
  });
});
