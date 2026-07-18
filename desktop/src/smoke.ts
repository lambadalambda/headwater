export const electronSmokeArguments = (input: {
  appDir: string;
  userData: string;
  marker: string;
}): string[] => [
  `--user-data-dir=${input.userData}`,
  `--headwater-desktop-smoke-marker=${input.marker}`,
  input.appDir,
];
