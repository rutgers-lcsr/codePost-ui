// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { sortAssignments, SortableAssignment } from '../assignments';

describe('sortAssignments', () => {
  it('sorts by sortKey ascending', () => {
    const input: SortableAssignment[] = [
      { id: 1, sortKey: 3 },
      { id: 2, sortKey: 1 },
      { id: 3, sortKey: 2 },
    ];
    const result = sortAssignments(input);
    expect(result.map((a) => a.id)).toEqual([2, 3, 1]);
  });

  it('breaks ties on sortKey by id ascending', () => {
    const input: SortableAssignment[] = [
      { id: 5, sortKey: 1 },
      { id: 2, sortKey: 1 },
      { id: 8, sortKey: 1 },
    ];
    const result = sortAssignments(input);
    expect(result.map((a) => a.id)).toEqual([2, 5, 8]);
  });

  it('treats null sortKey as 0', () => {
    const input: SortableAssignment[] = [
      { id: 1, sortKey: 1 },
      { id: 2, sortKey: null },
      { id: 3, sortKey: -1 },
    ];
    const result = sortAssignments(input);
    expect(result.map((a) => a.id)).toEqual([3, 2, 1]);
  });

  it('treats undefined sortKey as 0', () => {
    const input: SortableAssignment[] = [{ id: 1, sortKey: 1 }, { id: 2 }];
    const result = sortAssignments(input);
    expect(result.map((a) => a.id)).toEqual([2, 1]);
  });

  it('returns empty array for empty input', () => {
    expect(sortAssignments([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const input: SortableAssignment[] = [
      { id: 2, sortKey: 2 },
      { id: 1, sortKey: 1 },
    ];
    const original = [...input];
    sortAssignments(input);
    expect(input).toEqual(original);
  });

  it('preserves extra properties on the objects', () => {
    type ExtendedAssignment = SortableAssignment & { name: string };
    const input: ExtendedAssignment[] = [
      { id: 2, sortKey: 2, name: 'HW2' },
      { id: 1, sortKey: 1, name: 'HW1' },
    ];
    const result = sortAssignments(input);
    expect(result[0].name).toBe('HW1');
    expect(result[1].name).toBe('HW2');
  });

  it('handles single-element array', () => {
    const result = sortAssignments([{ id: 42, sortKey: 5 }]);
    expect(result).toEqual([{ id: 42, sortKey: 5 }]);
  });

  it('handles negative sortKeys', () => {
    const input: SortableAssignment[] = [
      { id: 1, sortKey: 0 },
      { id: 2, sortKey: -5 },
      { id: 3, sortKey: -2 },
    ];
    const result = sortAssignments(input);
    expect(result.map((a) => a.id)).toEqual([2, 3, 1]);
  });
});
