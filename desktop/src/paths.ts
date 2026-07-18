import { join } from 'node:path';

export const nativeHelperFilename = (platform: NodeJS.Platform): string =>
  platform === 'win32' ? 'deltachat-rpc-server.exe' : 'deltachat-rpc-server';

export type DesktopPaths = Readonly<{
  preload: string;
  worker: string;
  daemonModule: string;
  staticDir: string;
  nativeHelper: string;
  dataDir: string;
  accountsFile: string;
  authFile: string;
  restoreJournal: string;
  daemonLock: string;
}>;

export const desktopPaths = (input: {
  appDir: string;
  resourcesPath: string;
  userData: string;
  platform?: NodeJS.Platform;
}): DesktopPaths => {
  const resourceRoot = input.resourcesPath;
  const stateRoot = join(input.userData, 'daemon');
  const dataDir = join(stateRoot, 'main');
  return {
    preload: join(input.appDir, 'dist', 'preload.cjs'),
    worker: join(resourceRoot, 'utility', 'worker.mjs'),
    daemonModule: join(resourceRoot, 'daemon', 'dist', 'daemon.js'),
    staticDir: join(resourceRoot, 'frontend'),
    nativeHelper: join(resourceRoot, 'native', nativeHelperFilename(input.platform ?? process.platform)),
    dataDir,
    accountsFile: join(stateRoot, 'accounts.local.json'),
    authFile: join(stateRoot, 'main.auth.json'),
    restoreJournal: `${dataDir}.sidecar-restore-journal.json`,
    daemonLock: `${dataDir}.daemon.lock`,
  };
};
