import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { desktopPaths, nativeHelperFilename } from '../src/paths.js';

describe('desktop resource paths', () => {
  it('uses the native executable name for each platform', () => {
    expect(nativeHelperFilename('darwin')).toBe('deltachat-rpc-server');
    expect(nativeHelperFilename('linux')).toBe('deltachat-rpc-server');
    expect(nativeHelperFilename('win32')).toBe('deltachat-rpc-server.exe');
  });

  it('derives packaged Windows paths without changing mutable state paths', () => {
    expect(desktopPaths({
      appDir: '/app',
      resourcesPath: '/resources',
      userData: '/user-data',
      platform: 'win32',
    })).toMatchObject({
      nativeHelper: join('/resources', 'native', 'deltachat-rpc-server.exe'),
      dataDir: join('/user-data', 'daemon', 'main'),
    });
  });
});
