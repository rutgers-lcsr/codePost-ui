// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import fs from 'fs';
import path from 'path';

type ScenarioMatrix = {
  version: number;
  description: string;
  languages: string[];
  requiredScenarios: string[];
};

const ROOT = path.resolve(__dirname, 'test_submission');
const matrixPath = path.join(ROOT, 'scenario_matrix.json');

const SOURCE_EXTENSIONS = new Set(['.py', '.R', '.js', '.rb', '.php', '.cpp', '.java', '.hpp']);

const listFilesRecursively = (dirPath: string): string[] => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(absolute));
    } else {
      files.push(absolute);
    }
  }
  return files;
};

const hasScriptSource = (dirPath: string): boolean =>
  listFilesRecursively(dirPath).some((filePath) => SOURCE_EXTENSIONS.has(path.extname(filePath)));

describe('submission process compatibility fixtures', () => {
  it('has a valid scenario matrix file', () => {
    expect(fs.existsSync(matrixPath)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(matrixPath, 'utf8')) as ScenarioMatrix;
    expect(parsed.version).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(parsed.languages)).toBe(true);
    expect(parsed.languages.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.requiredScenarios)).toBe(true);
    expect(parsed.requiredScenarios).toEqual(['multi_file_import', 'nested_paths', 'failure_cases']);
  });

  it('ensures each language has template + complete in script and notebook formats', () => {
    const parsed = JSON.parse(fs.readFileSync(matrixPath, 'utf8')) as ScenarioMatrix;

    parsed.languages.forEach((language) => {
      const languageRoot = path.join(ROOT, language);
      expect(fs.existsSync(languageRoot)).toBe(true);

      ['template', 'complete'].forEach((variant) => {
        const variantRoot = path.join(languageRoot, variant);
        expect(fs.existsSync(variantRoot)).toBe(true);

        const variantFiles = fs.readdirSync(variantRoot);
        expect(variantFiles.some((name) => name.endsWith('.ipynb'))).toBe(true);
        expect(
          variantFiles.some((name) =>
            ['.py', '.R', '.js', '.rb', '.php', '.cpp', '.java'].includes(path.extname(name)),
          ),
        ).toBe(true);
      });
    });
  });

  it('ensures each language includes robust submission-process scenarios', () => {
    const parsed = JSON.parse(fs.readFileSync(matrixPath, 'utf8')) as ScenarioMatrix;

    parsed.languages.forEach((language) => {
      const scenariosRoot = path.join(ROOT, language, 'scenarios');
      expect(fs.existsSync(scenariosRoot)).toBe(true);

      const multiFileRoot = path.join(scenariosRoot, 'multi_file_import');
      const nestedRoot = path.join(scenariosRoot, 'nested_paths');
      const failureRoot = path.join(scenariosRoot, 'failure_cases');

      expect(fs.existsSync(multiFileRoot)).toBe(true);
      expect(fs.existsSync(nestedRoot)).toBe(true);
      expect(fs.existsSync(failureRoot)).toBe(true);

      const multiFileSources = listFilesRecursively(multiFileRoot).filter((filePath) =>
        SOURCE_EXTENSIONS.has(path.extname(filePath)),
      );
      expect(multiFileSources.length).toBeGreaterThanOrEqual(2);

      const nestedSrcRoot = path.join(nestedRoot, 'src');
      const nestedLibRoot = path.join(nestedRoot, 'lib');
      expect(fs.existsSync(nestedSrcRoot)).toBe(true);
      expect(fs.existsSync(nestedLibRoot)).toBe(true);
      expect(hasScriptSource(nestedSrcRoot)).toBe(true);
      expect(hasScriptSource(nestedLibRoot)).toBe(true);

      const failureFiles = fs.readdirSync(failureRoot);
      expect(failureFiles.some((name) => name.startsWith('runtime_error.'))).toBe(true);
      expect(failureFiles.some((name) => name.startsWith('syntax_error.') && name.endsWith('.txt'))).toBe(true);
    });
  });

  it('ensures complete scripts include code-console render markers', () => {
    const parsed = JSON.parse(fs.readFileSync(matrixPath, 'utf8')) as ScenarioMatrix;

    parsed.languages.forEach((language) => {
      const completeRoot = path.join(ROOT, language, 'complete');
      const scriptFile = fs
        .readdirSync(completeRoot)
        .find((name) => ['.py', '.R', '.js', '.rb', '.php', '.cpp', '.java'].includes(path.extname(name)));

      expect(scriptFile).toBeDefined();

      const scriptContent = fs.readFileSync(path.join(completeRoot, scriptFile as string), 'utf8');
      expect(scriptContent).toContain('RENDER TEST');
      expect(scriptContent.toLowerCase()).toContain('stderr');
      expect(scriptContent).toContain('idx | value');
    });
  });
});
