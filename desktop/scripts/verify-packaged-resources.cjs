const { accessSync, constants, existsSync } = require('node:fs');
const { join } = require('node:path');

module.exports = async ({ appOutDir, electronPlatformName, packager }) => {
  const resources = electronPlatformName === 'darwin'
    ? join(appOutDir, `${packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
    : join(appOutDir, 'resources');
  const helper = join(
    resources,
    'native',
    electronPlatformName === 'win32' ? 'deltachat-rpc-server.exe' : 'deltachat-rpc-server',
  );
  const required = [
    join(resources, 'daemon', 'dist', 'daemon.js'),
    join(resources, 'frontend', 'index.html'),
    join(resources, 'utility', 'worker.mjs'),
    join(resources, 'node_modules', 'hono', 'package.json'),
    helper,
  ];
  for (const path of required) {
    if (!existsSync(path)) throw new Error(`packaged desktop resource is missing: ${path}`);
  }
  if (electronPlatformName !== 'win32') accessSync(helper, constants.X_OK);
};
