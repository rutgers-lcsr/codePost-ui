// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { createDirectoryStructure, sortFiles, buildFolderMenu, type IFolder } from '../fileMenuUtils';

const makeFile = (id: number, name: string, path?: string | null) => ({
  id,
  name,
  path,
});

describe('createDirectoryStructure', () => {
  it('places files without a path in root files', () => {
    const files = [makeFile(1, 'main.py'), makeFile(2, 'README.md')];
    const result = createDirectoryStructure(files);
    expect(result.files).toHaveLength(2);
    expect(result.folders).toHaveLength(0);
  });

  it('places files with null/undefined path in root files', () => {
    const files = [makeFile(1, 'a.txt', null), makeFile(2, 'b.txt', undefined)];
    const result = createDirectoryStructure(files);
    expect(result.files).toHaveLength(2);
    expect(result.folders).toHaveLength(0);
  });

  it('creates a folder for files with a path', () => {
    const files = [makeFile(1, 'index.ts', 'src')];
    const result = createDirectoryStructure(files);
    expect(result.files).toHaveLength(0);
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].name).toBe('src');
    expect(result.folders[0].files).toHaveLength(1);
    expect(result.folders[0].files[0].name).toBe('index.ts');
  });

  it('creates nested folders for multi-level paths', () => {
    const files = [makeFile(1, 'util.ts', 'src/utils')];
    const result = createDirectoryStructure(files);
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].name).toBe('src');
    expect(result.folders[0].folders).toHaveLength(1);
    expect(result.folders[0].folders[0].name).toBe('utils');
    expect(result.folders[0].folders[0].files[0].name).toBe('util.ts');
  });

  it('groups files in the same folder together', () => {
    const files = [makeFile(1, 'a.ts', 'src'), makeFile(2, 'b.ts', 'src')];
    const result = createDirectoryStructure(files);
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].files).toHaveLength(2);
  });

  it('strips leading and trailing slashes from path', () => {
    const files = [makeFile(1, 'app.ts', '/src/')];
    const result = createDirectoryStructure(files);
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].name).toBe('src');
  });

  it('handles mix of root files and folder files', () => {
    const files = [makeFile(1, 'root.txt'), makeFile(2, 'nested.ts', 'lib')];
    const result = createDirectoryStructure(files);
    expect(result.files).toHaveLength(1);
    expect(result.folders).toHaveLength(1);
  });
});

describe('sortFiles', () => {
  it('returns root files sorted alphabetically', () => {
    const structure = createDirectoryStructure([makeFile(1, 'z.txt'), makeFile(2, 'a.txt')]);
    const sorted = sortFiles(structure);
    expect(sorted.map((f) => f.name)).toEqual(['a.txt', 'z.txt']);
  });

  it('includes folder files after root files', () => {
    const files = [makeFile(1, 'root.txt'), makeFile(2, 'nested.ts', 'src')];
    const structure = createDirectoryStructure(files);
    const sorted = sortFiles(structure);
    expect(sorted).toHaveLength(2);
    expect(sorted[0].name).toBe('root.txt');
    expect(sorted[1].name).toBe('nested.ts');
  });

  it('includes deeply nested files', () => {
    const files = [makeFile(1, 'deep.ts', 'a/b/c')];
    const structure = createDirectoryStructure(files);
    const sorted = sortFiles(structure);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].name).toBe('deep.ts');
  });

  it('returns empty array for empty input', () => {
    const structure = createDirectoryStructure([]);
    const sorted = sortFiles(structure);
    expect(sorted).toEqual([]);
  });
});

describe('buildFolderMenu', () => {
  const buildFileMenu = (files: ReturnType<typeof makeFile>[]) =>
    files.map((f) => ({ key: String(f.id), label: f.name }));

  it('builds a submenu item for a folder', () => {
    const folder: IFolder<ReturnType<typeof makeFile>> = {
      name: 'src',
      files: [makeFile(1, 'index.ts')],
      folders: [],
    };
    const result = buildFolderMenu('', folder, buildFileMenu);
    expect(result).toMatchObject({ type: 'submenu', key: '/src' });
    expect((result as { children: unknown[] }).children).toHaveLength(1);
  });

  it('includes subfolders recursively', () => {
    const folder: IFolder<ReturnType<typeof makeFile>> = {
      name: 'src',
      files: [],
      folders: [{ name: 'utils', files: [makeFile(1, 'helper.ts')], folders: [] }],
    };
    const result = buildFolderMenu('', folder, buildFileMenu);
    const children = (result as { children: unknown[] }).children;
    expect(children).toHaveLength(1);
    expect(children[0]).toMatchObject({ type: 'submenu', key: '/src/utils' });
  });

  // Drive getFolderIcon branches for various folder names
  const iconFolderNames = [
    'src',
    'lib',
    'test',
    'docs',
    'assets',
    'api',
    'components',
    'utils',
    'dist',
    'styles',
    'unknown-folder',
  ];

  iconFolderNames.forEach((name) => {
    it(`renders icon for folder name "${name}"`, () => {
      const folder: IFolder<ReturnType<typeof makeFile>> = { name, files: [], folders: [] };
      const result = buildFolderMenu('', folder, buildFileMenu);
      expect(result).toMatchObject({ type: 'submenu', key: `/${name}` });
      // The label is JSX containing the icon — just verify it exists
      expect((result as { label: unknown }).label).toBeTruthy();
    });
  });
});
