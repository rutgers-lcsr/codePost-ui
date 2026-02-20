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

    expect(state.rubricCategories.length).toBe(3);
    expect(Object.values(state.rubricComments).flat().length).toBeGreaterThanOrEqual(5);
    expect(state.testCategories.length).toBe(3);
    expect(Object.values(state.testCases).flat().length).toBeGreaterThanOrEqual(7);
    expect(state.tests.length).toBeGreaterThanOrEqual(7);
  });

  it('loads student demo with mapped rubric comments and tests visible', () => {
    const state = loadDemoStudent([], 'student@example.edu');

    expect(state.files.length).toBe(4);
    expect(state.comments[1].length).toBeGreaterThan(0);
    expect(state.comments[2].length).toBeGreaterThan(0);
    expect(state.comments[3].length).toBeGreaterThan(0);
    expect(Object.keys(state.commentRubricComments).length).toBeGreaterThan(0);
    expect(state.testCategories.length).toBe(3);
    expect(Object.values(state.testCases).flat().length).toBeGreaterThanOrEqual(7);

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
});
