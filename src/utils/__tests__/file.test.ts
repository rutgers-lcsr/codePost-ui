// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import {
  File,
  getFileContent,
  MarkdownExtensions,
  JupyterExtensions,
  ImageExtensions,
  PDFExtensions,
  BinaryExtensions,
} from '../file';
import type { FileLike } from '../file';

// ---------------------------------------------------------------------------
// Helper to build a minimal FileLike
// ---------------------------------------------------------------------------
function makeFile(overrides: Partial<FileLike> = {}): FileLike {
  return { name: 'main.py', extension: 'py', ...overrides };
}

// ---------------------------------------------------------------------------
// File.extension — extracts the extension from a filename
// ---------------------------------------------------------------------------
describe('File.extension', () => {
  it('returns the extension from a dotted filename', () => {
    expect(File.extension('main.py')).toBe('py');
  });

  it('returns the last extension when there are multiple dots', () => {
    expect(File.extension('archive.tar.gz')).toBe('gz');
  });

  it('returns empty string for a filename without a dot', () => {
    expect(File.extension('Makefile')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(File.extension('')).toBe('');
  });

  it('lowercases the extension', () => {
    expect(File.extension('README.MD')).toBe('md');
  });
});

// ---------------------------------------------------------------------------
// File.normalizedExtension — normalizes extensions from files or strings
// ---------------------------------------------------------------------------
describe('File.normalizedExtension', () => {
  it('extracts and lowercases from a FileLike object', () => {
    expect(File.normalizedExtension(makeFile({ name: 'App.TSX', extension: 'tsx' }))).toBe('tsx');
  });

  it('falls back to .extension field when name has no dots', () => {
    expect(File.normalizedExtension(makeFile({ name: 'Makefile', extension: '.PY' }))).toBe('py');
  });

  it('strips leading dot from extension field', () => {
    expect(File.normalizedExtension(makeFile({ name: 'Makefile', extension: '.java' }))).toBe('java');
  });

  it('handles a plain string filename', () => {
    expect(File.normalizedExtension('hello.java')).toBe('java');
  });

  it('handles a plain extension string (no dot)', () => {
    expect(File.normalizedExtension('py')).toBe('py');
  });

  it('handles a dotted extension string', () => {
    expect(File.normalizedExtension('.JS')).toBe('js');
  });

  it('returns empty string for null/undefined', () => {
    expect(File.normalizedExtension(null)).toBe('');
    expect(File.normalizedExtension(undefined)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// File.codeType — classifies a file into a rendering category
// ---------------------------------------------------------------------------
describe('File.codeType', () => {
  it('returns "jupyter" for .ipynb files', () => {
    expect(File.codeType(makeFile({ name: 'nb.ipynb', extension: 'ipynb' }))).toBe('jupyter');
  });

  it('returns "markdown" for .md files', () => {
    expect(File.codeType(makeFile({ name: 'README.md', extension: 'md' }))).toBe('markdown');
  });

  it('returns "image" for image files', () => {
    expect(File.codeType(makeFile({ name: 'logo.png', extension: 'png' }))).toBe('image');
    expect(File.codeType(makeFile({ name: 'photo.jpg', extension: 'jpg' }))).toBe('image');
  });

  it('returns "pdf" for pdf files', () => {
    expect(File.codeType(makeFile({ name: 'doc.pdf', extension: 'pdf' }))).toBe('pdf');
  });

  it('returns "code" for regular source files', () => {
    expect(File.codeType(makeFile({ name: 'main.py', extension: 'py' }))).toBe('code');
    expect(File.codeType(makeFile({ name: 'App.tsx', extension: 'tsx' }))).toBe('code');
  });
});

// ---------------------------------------------------------------------------
// File.isNotebookFile
// ---------------------------------------------------------------------------
describe('File.isNotebookFile', () => {
  it('returns true for ipynb', () => {
    expect(File.isNotebookFile(makeFile({ name: 'nb.ipynb', extension: 'ipynb' }))).toBe(true);
  });

  it('returns false for non-notebook files', () => {
    expect(File.isNotebookFile(makeFile({ name: 'main.py', extension: 'py' }))).toBe(false);
  });

  it('works with a plain string', () => {
    expect(File.isNotebookFile('notebook.ipynb')).toBe(true);
    expect(File.isNotebookFile('main.py')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(File.isNotebookFile(null)).toBe(false);
    expect(File.isNotebookFile(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// File.parseNotebook
// ---------------------------------------------------------------------------
describe('File.parseNotebook', () => {
  it('parses valid notebook JSON', () => {
    const nb = JSON.stringify({ cells: [{ cell_type: 'code', source: ['print(1)'] }], nbformat: 4 });
    const result = File.parseNotebook(nb);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0].cell_type).toBe('code');
  });

  it('returns empty notebook for blank content', () => {
    const result = File.parseNotebook('   ');
    expect(result.cells).toEqual([]);
    expect(result.nbformat).toBe(4);
  });

  it('throws for invalid JSON', () => {
    expect(() => File.parseNotebook('{bad')).toThrow();
  });

  it('throws when cells array is missing', () => {
    expect(() => File.parseNotebook(JSON.stringify({ metadata: {} }))).toThrow(/cells/i);
  });
});

// ---------------------------------------------------------------------------
// File.extractNotebookCode
// ---------------------------------------------------------------------------
describe('File.extractNotebookCode', () => {
  it('extracts only code cells, skipping markdown', () => {
    const nb = JSON.stringify({
      cells: [
        { cell_type: 'markdown', source: ['# Title'] },
        { cell_type: 'code', source: ['x = 1\n', 'y = 2'] },
        { cell_type: 'code', source: ['print(x + y)'] },
      ],
    });
    const code = File.extractNotebookCode(nb);
    expect(code).toBe('x = 1\ny = 2\nprint(x + y)');
  });

  it('returns empty string for empty notebook', () => {
    expect(File.extractNotebookCode('  ')).toBe('');
  });

  it('returns empty string for invalid content', () => {
    expect(File.extractNotebookCode('{bad')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// getFileContent
// ---------------------------------------------------------------------------
describe('getFileContent', () => {
  it('returns file data when present', () => {
    expect(getFileContent(makeFile({ data: 'hello world' }))).toBe('hello world');
  });

  it('returns empty string when data is null', () => {
    expect(getFileContent(makeFile({ data: null }))).toBe('');
  });

  it('returns empty string when data is undefined', () => {
    expect(getFileContent(makeFile())).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Extension arrays — sanity checks
// ---------------------------------------------------------------------------
describe('extension arrays', () => {
  it('MarkdownExtensions includes md variants', () => {
    expect(MarkdownExtensions).toContain('md');
    expect(MarkdownExtensions).toContain('.md');
  });

  it('JupyterExtensions includes ipynb variants', () => {
    expect(JupyterExtensions).toContain('ipynb');
    expect(JupyterExtensions).toContain('.ipynb');
  });

  it('ImageExtensions includes common image types', () => {
    expect(ImageExtensions).toContain('png');
    expect(ImageExtensions).toContain('jpg');
    expect(ImageExtensions).toContain('gif');
  });

  it('PDFExtensions includes pdf', () => {
    expect(PDFExtensions).toContain('pdf');
  });

  it('BinaryExtensions includes class files', () => {
    expect(BinaryExtensions).toContain('class');
    expect(BinaryExtensions).toContain('.class');
  });
});
