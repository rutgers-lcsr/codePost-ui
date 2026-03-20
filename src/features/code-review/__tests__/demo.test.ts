// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';

import { getDemoPinnedTemplates, loadDemoGrader, loadDemoStudent } from '../demo';

describe('code console demo fixtures', () => {
  it('loads grader demo with files, rubric, and complete tests', () => {
    const state = loadDemoGrader([], 'grader@example.edu');

    expect(state.files.length).toBeGreaterThanOrEqual(4);
    expect(state.files[0].data).toContain('def max_value');

    const notebookFile = state.files.find((file) => file.name === 'analysis_notebook.ipynb');
    expect(notebookFile).toBeDefined();
    const notebook = JSON.parse(notebookFile!.data || '{}');
    expect(Array.isArray(notebook.cells)).toBe(true);
    expect(notebook.cells.length).toBeGreaterThanOrEqual(3);
    expect(notebook.cells[2].outputs.some((output: any) => output.output_type === 'display_data')).toBe(true);

    expect(state.rubricCategories.length).toBe(4);
    expect(Object.values(state.rubricComments).flat().length).toBeGreaterThanOrEqual(7);
    expect(state.testCategories.length).toBe(4);
    const allTestCases = Object.values(state.testCases).flat();
    expect(allTestCases.length).toBeGreaterThanOrEqual(9);
    expect(allTestCases.every((testCase: any) => (testCase.pointsPass ?? 0) > 0)).toBe(true);
    expect(state.tests.length).toBeGreaterThanOrEqual(9);

    const pdfFile = state.files.find((file) => file.name === 'assignment.pdf');
    expect(pdfFile).toBeDefined();
    expect(pdfFile!.data?.startsWith('data:application/pdf;base64,')).toBe(true);

    const pdfBase64 = pdfFile!.data!.split(',')[1];
    const pdfHeader = Buffer.from(pdfBase64, 'base64').toString('latin1', 0, 8);
    expect(pdfHeader.startsWith('%PDF-')).toBe(true);
  });

  it('loads student demo with mapped rubric comments and tests visible', () => {
    const state = loadDemoStudent([], 'student@example.edu');

    expect(state.files.length).toBe(5);

    const pdfFile = state.files.find((file) => file.name === 'assignment.pdf');
    expect(pdfFile).toBeDefined();
    expect(pdfFile!.data?.startsWith('data:application/pdf;base64,')).toBe(true);

    expect(state.comments[1].length).toBeGreaterThan(0);
    expect(state.comments[2].length).toBeGreaterThan(0);
    expect(state.comments[3].length).toBeGreaterThan(0);
    expect(Object.keys(state.commentRubricComments).length).toBeGreaterThan(0);
    expect(state.testCategories.length).toBe(4);
    const allTestCases = Object.values(state.testCases).flat();
    expect(allTestCases.length).toBeGreaterThanOrEqual(9);
    expect(allTestCases.every((testCase: any) => (testCase.pointsPass ?? 0) > 0)).toBe(true);

    const notebookFile = state.files.find((file) => file.name === 'analysis_notebook.ipynb');
    expect(notebookFile).toBeDefined();
    const notebook = JSON.parse(notebookFile!.data || '{}');
    const graphCell = notebook.cells.find((cell: any) => cell.metadata?.id === 'demo-cell-plot');
    expect(graphCell).toBeDefined();
    expect(graphCell.outputs.some((output: any) => output.data?.['image/svg+xml'])).toBe(true);
  });

  it('provides built-in pinned comments for demo mode', () => {
    const templates = getDemoPinnedTemplates('grader@example.edu');

    expect(templates.length).toBeGreaterThanOrEqual(3);
    expect(templates.length).toBeGreaterThanOrEqual(4);
    expect(templates.some((template) => template.isGlobal)).toBe(true);
    expect(templates.some((template) => template.filePath === 'Loops.py')).toBe(true);
    expect(templates.some((template) => template.filePath === 'analysis_notebook.ipynb')).toBe(true);
  });

  it('normalizes uploaded demo files and keeps submission file IDs in sync', () => {
    const uploadedFiles = [
      {
        name: 'LegacyFile.PY',
        code: 'print("legacy data path")',
      },
      {
        data: 'console.log("missing name fallback")',
      },
    ];

    const graderState = loadDemoGrader(uploadedFiles as any[], 'grader@example.edu');
    const studentState = loadDemoStudent(uploadedFiles as any[], 'student@example.edu');

    expect(graderState.files.length).toBe(2);
    expect(studentState.files.length).toBe(2);

    expect(graderState.files[0].name).toBe('LegacyFile.PY');
    expect(graderState.files[0].extension).toBe('py');
    expect(graderState.files[0].data).toContain('legacy data path');

    expect(graderState.files[1].name).toBe('uploaded_file_2.txt');
    expect(graderState.files[1].extension).toBe('txt');

    expect(graderState.submission?.files).toEqual([1, 2]);
    expect(studentState.submission?.files).toEqual([1, 2]);
    expect(Object.keys(graderState.comments)).toEqual(['1', '2']);
    expect(Object.keys(studentState.comments)).toEqual(['1', '2']);
  });
});
