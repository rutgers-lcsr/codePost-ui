// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Tests for Submission service — specifically the pure `filesByVersion` utility.
 *
 * filesByVersion groups files by canonical path (path + name), keeping the
 * newest file in `new` and moving older versions to `old[path]`.
 */
import { describe, it, expect } from 'vitest';
import { Submission } from '../submission';

/** Helper to build a minimal FileType-compatible object. */
const makeFile = (overrides: { id?: number; name?: string; path?: string; created?: string }) =>
  ({
    id: overrides.id ?? 1,
    name: overrides.name ?? 'main.py',
    path: overrides.path ?? '',
    created: overrides.created ?? '2024-01-01T00:00:00Z',
  }) as any;

describe('Submission.filesByVersion', () => {
  it('should return empty arrays for no files', () => {
    const result = Submission.filesByVersion([]);
    expect(result.new).toEqual([]);
    expect(result.old).toEqual({});
  });

  it('should return a single file as new with no old versions', () => {
    const file = makeFile({ id: 1, name: 'main.py' });
    const result = Submission.filesByVersion([file]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(1);
    expect(Object.keys(result.old)).toHaveLength(0);
  });

  it('should keep the newest file when two versions share the same path', () => {
    const older = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const newer = makeFile({ id: 2, name: 'main.py', created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([older, newer]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
    expect(result.old['/main.py']).toHaveLength(1);
    expect(result.old['/main.py'][0].id).toBe(1);
  });

  it('should handle multiple versions of the same file', () => {
    const v1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const v2 = makeFile({ id: 2, name: 'main.py', created: '2024-03-01T00:00:00Z' });
    const v3 = makeFile({ id: 3, name: 'main.py', created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([v1, v2, v3]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(3);
    expect(result.old['/main.py']).toHaveLength(2);
  });

  it('should treat files with different names as separate groups', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'util.py', created: '2024-01-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    expect(result.new).toHaveLength(2);
    expect(Object.keys(result.old)).toHaveLength(0);
  });

  it('should treat files with different paths as separate groups', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', path: 'src/', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'main.py', path: 'tests/', created: '2024-01-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    expect(result.new).toHaveLength(2);
    expect(Object.keys(result.old)).toHaveLength(0);
  });

  it('should strip leading/trailing slashes from path when computing canonical path', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', path: '/src/', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'main.py', path: 'src', created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    // Both resolve to "src/main.py" so only one should be in new
    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
  });

  it('should handle files with empty/undefined path', () => {
    const file1 = makeFile({ id: 1, name: 'readme.txt', path: '', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'readme.txt', path: undefined, created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
  });

  it('should keep old versions sorted by insertion order (not date)', () => {
    const v1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const v3 = makeFile({ id: 3, name: 'main.py', created: '2024-06-01T00:00:00Z' });
    const v2 = makeFile({ id: 2, name: 'main.py', created: '2024-03-01T00:00:00Z' });

    // Input order: v1, v3, v2
    const result = Submission.filesByVersion([v1, v3, v2]);

    expect(result.new[0].id).toBe(3);
    // Old should contain v1 and v2
    const oldIds = result.old['/main.py'].map((f: any) => f.id);
    expect(oldIds).toContain(1);
    expect(oldIds).toContain(2);
  });

  it('should handle files with same created date (uses <=, later in array wins)', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'main.py', created: '2024-01-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    // When dates are equal (<=), later file replaces earlier
    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
  });

  it('should handle mixed scenario: multiple files with versions', () => {
    const files = [
      makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' }),
      makeFile({ id: 2, name: 'util.py', created: '2024-01-01T00:00:00Z' }),
      makeFile({ id: 3, name: 'main.py', created: '2024-06-01T00:00:00Z' }),
      makeFile({ id: 4, name: 'test.py', created: '2024-02-01T00:00:00Z' }),
    ];

    const result = Submission.filesByVersion(files);

    expect(result.new).toHaveLength(3); // main.py(v3), util.py, test.py
    expect(result.old['/main.py']).toHaveLength(1);
  });
});
