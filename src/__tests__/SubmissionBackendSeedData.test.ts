// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import fs from 'fs';
import path from 'path';

// JS module without type declarations
const { buildSeedData } = require('./test_submission/build_backend_seed_data.js');

type ScenarioMatrix = {
  version: number;
  description: string;
  languages: string[];
  requiredScenarios: string[];
};

const ROOT = path.resolve(__dirname, 'test_submission');
const matrixPath = path.join(ROOT, 'scenario_matrix.json');

describe('backend seed data builder', () => {
  it('builds assignment payloads for all languages', () => {
    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8')) as ScenarioMatrix;
    const seedData = buildSeedData() as {
      assignments: Array<{
        key: string;
        assignmentName: string;
        assignmentFiles: Array<{ name: string; relativePath: string; content: string; encoding: string }>;
        assignmentDataSets: Array<{ name: string; mountPath: string; content: string; encoding: string }>;
        fakeSubmissions: Array<{ key: string; scenario: string; files: Array<{ name: string; relativePath: string }> }>;
      }>;
    };

    expect(seedData.assignments).toHaveLength(matrix.languages.length);

    for (const language of matrix.languages) {
      const assignment = seedData.assignments.find((item) => item.key === language);
      expect(assignment).toBeDefined();

      expect(assignment!.assignmentName.length).toBeGreaterThan(0);
      expect(assignment!.assignmentFiles.length).toBeGreaterThan(0);
      expect(assignment!.assignmentFiles.some((f) => f.name.endsWith('.ipynb'))).toBe(true);
      expect(assignment!.assignmentFiles.every((f) => f.relativePath.length > 0)).toBe(true);
      expect(assignment!.assignmentFiles.some((f) => f.name === 'existing_data.txt')).toBe(true);
      expect(assignment!.assignmentFiles.every((f) => !f.content.includes('../existing_data.txt'))).toBe(true);

      const notebookFiles = assignment!.assignmentFiles.filter((f) => f.name.endsWith('.ipynb'));
      notebookFiles.forEach((file) => {
        const notebook = JSON.parse(file.content) as {
          metadata?: { language_info?: { name?: string } };
        };

        if (language === 'node') {
          expect(notebook.metadata?.language_info?.name).toBe('javascript');
        } else {
          expect(notebook.metadata?.language_info?.name).toBe(language);
        }
      });

      expect(assignment!.assignmentDataSets.length).toBeGreaterThan(0);
      expect(assignment!.assignmentDataSets.some((d) => d.name === 'existing_data.txt')).toBe(true);
      expect(assignment!.assignmentDataSets.every((d) => d.mountPath.startsWith('shared/'))).toBe(true);

      const scenariosPresent = new Set(assignment!.fakeSubmissions.map((s) => s.scenario));
      matrix.requiredScenarios.forEach((scenario) => {
        expect(scenariosPresent.has(scenario)).toBe(true);
      });

      expect(assignment!.fakeSubmissions.length).toBeGreaterThanOrEqual(matrix.requiredScenarios.length);
      expect(assignment!.fakeSubmissions.every((submission) => submission.files.length > 0)).toBe(true);
    }
  });
});
