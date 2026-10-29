// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';

import { jupyterToMarkdown } from '../Jupyter';

const notebook = (cells: Array<{ cell_type: string; source: string | string[] }>) =>
  JSON.stringify({
    nbformat: 4,
    nbformat_minor: 5,
    metadata: { kernelspec: { language: 'python' } },
    cells: cells.map((c) => ({ ...c, metadata: {} })),
  });

describe('jupyterToMarkdown raw cells', () => {
  it('renders raw cells verbatim and keeps every cell at its original index', () => {
    const md = jupyterToMarkdown(
      notebook([
        { cell_type: 'markdown', source: '### Task 4.10 - Discussion' },
        { cell_type: 'raw', source: ['From the heatmap, ', 'we can see **this**'] },
        { cell_type: 'markdown', source: '### Feedback' },
      ]),
    );
    expect(md).not.toBeNull();
    expect(md).toContain('From the heatmap, we can see **this**');
    expect(md).toContain('data-cell-index="1" data-cell-type="raw"');
    expect(md!.match(/data-cell-index="(\d+)"/g)).toEqual([
      'data-cell-index="0"',
      'data-cell-index="1"',
      'data-cell-index="2"',
    ]);
    // Verbatim: raw text is fenced, not interpreted as markdown.
    expect(md).toMatch(/```text\nFrom the heatmap/);
  });
});
