/**
 * PackageMapping.ts
 *
 * Maps common import names to their PyPI package names.
 * This is used to auto-correct manifests generated from source code analysis.
 *
 * Sources:
 * - https://github.com/bndr/pipreqs/blob/master/pipreqs/mapping
 * - Common user issues (sklearn, cv2, PIL)
 */
export const PACKAGE_ALIASES: Record<string, string> = {
  // Common aliases
  sklearn: 'scikit-learn',
  cv2: 'opencv-python',
  PIL: 'Pillow',
  yaml: 'PyYAML',
  bs4: 'beautifulsoup4',
  dateutil: 'python-dateutil',
  dotenv: 'python-dotenv',
  mysqldb: 'mysql-python',
  serial: 'pyserial',
  telegram: 'python-telegram-bot',
  websocket: 'websocket-client',
  xlsxwriter: 'XlsxWriter',

  // Crypto libraries
  Crypto: 'pycryptodome',

  // Testing
  pytest: 'pytest',

  // ML/Data Science
  numpy: 'numpy',
  pandas: 'pandas',
  matplotlib: 'matplotlib',
  scipy: 'scipy',
  torch: 'torch',
  tensorflow: 'tensorflow',
  keras: 'keras',
};

/**
 * Resolves a package name from an import statement.
 * @param importName The name used in code (e.g. "import sklearn")
 * @returns The PyPI package name (e.g. "scikit-learn") or the original import name if no alias exists.
 */
export const resolvePackageName = (importName: string): string => {
  return PACKAGE_ALIASES[importName] || importName;
};
