// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { arrayInsert, arrayAdd, arrayRemove, arrayUpdate } from '../immutable';

describe('arrayInsert', () => {
  it('inserts at the beginning', () => {
    expect(arrayInsert([1, 2, 3], 0, 0)).toEqual([0, 1, 2, 3]);
  });

  it('inserts in the middle', () => {
    expect(arrayInsert([1, 2, 3], 99, 1)).toEqual([1, 99, 2, 3]);
  });

  it('inserts at the end', () => {
    expect(arrayInsert([1, 2, 3], 4, 3)).toEqual([1, 2, 3, 4]);
  });

  it('works on empty array', () => {
    expect(arrayInsert([], 'x', 0)).toEqual(['x']);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    arrayInsert(arr, 99, 1);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('arrayAdd', () => {
  it('appends item to the end', () => {
    expect(arrayAdd([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it('works on empty array', () => {
    expect(arrayAdd([], 'a')).toEqual(['a']);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2];
    arrayAdd(arr, 3);
    expect(arr).toEqual([1, 2]);
  });
});

describe('arrayRemove', () => {
  it('removes item at given index', () => {
    expect(arrayRemove([1, 2, 3], 1)).toEqual([1, 3]);
  });

  it('removes first item', () => {
    expect(arrayRemove([1, 2, 3], 0)).toEqual([2, 3]);
  });

  it('removes last item', () => {
    expect(arrayRemove([1, 2, 3], 2)).toEqual([1, 2]);
  });

  it('returns the original array for negative index', () => {
    const arr = [1, 2, 3];
    expect(arrayRemove(arr, -1)).toBe(arr);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    arrayRemove(arr, 1);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('arrayUpdate', () => {
  it('updates object at the given index by merging', () => {
    const arr = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = arrayUpdate(arr, { id: 2, name: 'Bobby' }, 1);
    expect(result[1]).toEqual({ id: 2, name: 'Bobby' });
  });

  it('does not modify other items', () => {
    const arr = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = arrayUpdate(arr, { id: 2, name: 'Bobby' }, 1);
    expect(result[0]).toEqual({ id: 1, name: 'Alice' });
  });

  it('does not mutate the original array', () => {
    const arr = [{ id: 1, name: 'Alice' }];
    arrayUpdate(arr, { id: 1, name: 'Updated' }, 0);
    expect(arr[0].name).toBe('Alice');
  });

  it('returns array of same length', () => {
    const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
    const result = arrayUpdate(arr, { a: 99 }, 1);
    expect(result).toHaveLength(3);
  });
});
