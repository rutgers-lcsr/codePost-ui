export interface ScannedFile {
  name: string;
  code?: string;
  data?: string;
}

import { File as CodePostFile } from '../../../../../../utils/file';

export interface ManifestResult {
  content: string;
  detected: boolean;
  packages: Set<string>;
}

const resolvePackageName = (name: string): string => {
  // Add common aliases here if needed
  const ALIASES: { [key: string]: string } = {
    sklearn: 'scikit-learn',
    bs4: 'beautifulsoup4',
    PIL: 'Pillow',
    cv2: 'opencv-python',
    yaml: 'PyYAML',
    dotenv: 'python-dotenv',
  };
  return ALIASES[name] || name;
};

// Abstract Base
export abstract class LanguageScanner {
  abstract supportedLanguages: string[]; // e.g. ['python', 'python-3.7', 'python-3.12'] (prefixes or exact)
  abstract fileExtensions: string[]; // e.g. ['.py', '.ipynb']
  abstract stdLib: Set<string>;

  abstract scanCode(code: string, packages: Set<string>): void;
  abstract generateManifest(packages: Set<string>): string;

  public supports(language: string): boolean {
    return this.supportedLanguages.some((l) => language === l || language.startsWith(l + '-'));
  }

  public scan(files: ScannedFile[], _language: string): ManifestResult {
    const packages = new Set<string>();

    files.forEach((f) => {
      if (this.fileExtensions.some((ext) => f.name.endsWith(ext))) {
        let code = f.code || f.data || '';

        // Handle Notebooks
        if (f.name.endsWith('.ipynb')) {
          code = CodePostFile.extractNotebookCode(code);
        }

        this.scanCode(code, packages);
      }
    });

    // Filter StdLib
    const filtered = new Set<string>();
    packages.forEach((p) => {
      if (!this.stdLib.has(p)) filtered.add(p);
    });

    return {
      content: this.generateManifest(filtered),
      detected: filtered.size > 0,
      packages: filtered,
    };
  }
}

// --- PYTHON ---
export class PythonScanner extends LanguageScanner {
  supportedLanguages = ['python'];
  fileExtensions = ['.py', '.ipynb'];
  stdLib = new Set([
    'os',
    'sys',
    're',
    'math',
    'random',
    'collections',
    'json',
    'datetime',
    'time',
    'subprocess',
    'typing',
    'pathlib',
    'argparse',
    'string',
    'itertools',
    'functools',
    'copy',
    'io',
    'shutil',
    'glob',
    'pickle',
    'logging',
    'unittest',
    'contextlib',
    'threading',
    'multiprocessing',
  ]);

  scanCode(code: string, packages: Set<string>): void {
    const importMatches = code.matchAll(/^import\s+([\w, ]+)/gm);
    const fromMatches = code.matchAll(/^from\s+([\w]+)\s+import/gm);
    console.log(code);
    for (const m of importMatches) {
      m[1].split(',').forEach((p) => {
        const pkg = p.trim().split(/\s+/)[0];
        packages.add(resolvePackageName(pkg.split('.')[0]));
      });
    }
    for (const m of fromMatches) {
      packages.add(resolvePackageName(m[1].trim().split('.')[0]));
    }
  }

  generateManifest(packages: Set<string>): string {
    return Array.from(packages).join('\n');
  }
}

// --- NODE / JS ---
export class NodeScanner extends LanguageScanner {
  supportedLanguages = ['node', 'javascript'];
  fileExtensions = ['.js', '.mjs', '.cjs', '.ts'];
  stdLib = new Set([
    'fs',
    'path',
    'os',
    'http',
    'https',
    'crypto',
    'util',
    'events',
    'child_process',
    'stream',
    'buffer',
    'zlib',
    'url',
    'querystring',
    'assert',
    'dns',
    'net',
  ]);

  scanCode(code: string, packages: Set<string>): void {
    const requireMatches = code.matchAll(/require\(['"]([\w\-@/]+)['"]\)/g);
    const importMatches = code.matchAll(/from\s+['"]([\w\-@/]+)['"]/g);

    for (const m of requireMatches) packages.add(m[1]);
    for (const m of importMatches) packages.add(m[1]);
  }

  generateManifest(packages: Set<string>): string {
    const deps: any = {};
    packages.forEach((k) => (deps[k] = '*'));
    return JSON.stringify({ dependencies: deps }, null, 2);
  }
}

// --- JAVA ---
export class JavaScanner extends LanguageScanner {
  supportedLanguages = ['java'];
  fileExtensions = ['.java', '.ipynb'];
  stdLib = new Set(['java', 'javax', 'sun', 'jdk']);

  scanCode(code: string, packages: Set<string>): void {
    const matches = code.matchAll(/^import\s+([\w.]+);/gm);
    for (const m of matches) {
      // Only add the top-level or second-level domain/group
      // e.g. com.google.gson -> com.google.gson (or we filter later)
      packages.add(m[1]);
    }
  }

  // Override scan to handle filtering properly: Java needs to filter based on prefix
  public scan(files: ScannedFile[], language: string): ManifestResult {
    // Use base logic first
    const result = super.scan(files, language);
    return result;
  }

  // Custom StdLib filter for Java (prefix based)
  generateManifest(packages: Set<string>): string {
    // Filter out java.* etc. which is done in base but bases uses strict set check.
    // We need custom filter here if we want prefix check?
    // Actually let's just do it in scanCode or override basic filter.

    const filtered = new Set<string>();
    packages.forEach((p) => {
      const root = p.split('.')[0];
      if (!this.stdLib.has(root)) filtered.add(p);
    });

    // Simple heuristic mapping
    let depsXML = '';
    const addedArtifacts = new Set<string>();

    filtered.forEach((imp) => {
      if (imp.startsWith('org.junit') && !addedArtifacts.has('junit')) {
        depsXML += `\n    <dependency><groupId>junit</groupId><artifactId>junit</artifactId><version>4.13.2</version><scope>test</scope></dependency>`;
        addedArtifacts.add('junit');
      } else if (imp.startsWith('com.google.gson') && !addedArtifacts.has('gson')) {
        depsXML += `\n    <dependency><groupId>com.google.code.gson</groupId><artifactId>gson</artifactId><version>2.8.9</version></dependency>`;
        addedArtifacts.add('gson');
      } else if (imp.startsWith('org.testng') && !addedArtifacts.has('testng')) {
        depsXML += `\n    <dependency><groupId>org.testng</groupId><artifactId>testng</artifactId><version>7.4.0</version><scope>test</scope></dependency>`;
        addedArtifacts.add('testng');
      }
    });

    if (depsXML === '') return ''; // No ext deps found

    return `<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.codepost</groupId>
  <artifactId>submission</artifactId>
  <version>1.0</version>
  <dependencies>${depsXML}
  </dependencies>
</project>`;
  }
}

// --- R ---
export class RScanner extends LanguageScanner {
  supportedLanguages = ['r'];
  fileExtensions = ['.R', '.r', '.ipynb'];
  stdLib = new Set([
    'base',
    'compiler',
    'datasets',
    'graphics',
    'grDevices',
    'grid',
    'methods',
    'parallel',
    'splines',
    'stats',
    'stats4',
    'tcltk',
    'tools',
    'utils',
  ]);

  scanCode(code: string, packages: Set<string>): void {
    const libMatches = code.matchAll(/library\s*\(['"]?(\w+)['"]?\)/g);
    const reqMatches = code.matchAll(/require\s*\(['"]?(\w+)['"]?\)/g);
    for (const m of libMatches) packages.add(m[1]);
    for (const m of reqMatches) packages.add(m[1]);
  }

  generateManifest(packages: Set<string>): string {
    return Array.from(packages).join('\n');
  }
}

export const scanners = [new PythonScanner(), new NodeScanner(), new JavaScanner(), new RScanner()];

export const getScanner = (language: string): LanguageScanner | undefined => {
  return scanners.find((s) => s.supports(language));
};
