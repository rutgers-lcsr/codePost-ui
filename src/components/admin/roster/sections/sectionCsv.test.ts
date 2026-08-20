// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { parseSectionsCsv } from './sectionCsv';

describe('parseSectionsCsv', () => {
  it('parses a legacy two-column file exactly as before (all students)', () => {
    const rows = parseSectionsCsv('S01,a@x.edu\nS01,b@x.edu\nS02,c@x.edu');
    expect(rows).toEqual([
      { section: 'S01', students: ['a@x.edu', 'b@x.edu'], leaders: [] },
      { section: 'S02', students: ['c@x.edu'], leaders: [] },
    ]);
  });

  it('routes leader/ta/grader roles (any case) to leaders', () => {
    const rows = parseSectionsCsv(
      'S01,a@x.edu,student\nS01,ta@x.edu,Leader\nS01,tb@x.edu,TA\nS02,tc@x.edu,grader',
    );
    expect(rows).toEqual([
      { section: 'S01', students: ['a@x.edu'], leaders: ['ta@x.edu', 'tb@x.edu'] },
      { section: 'S02', students: [], leaders: ['tc@x.edu'] },
    ]);
  });

  it('treats an unknown role as student', () => {
    expect(parseSectionsCsv('S01,a@x.edu,observer')).toEqual([
      { section: 'S01', students: ['a@x.edu'], leaders: [] },
    ]);
  });

  it('handles headers, tabs, quotes, and blank/invalid lines', () => {
    const rows = parseSectionsCsv('section\temail\trole\nS01\ta@x.edu\tleader\n\nS01\tnot-an-email\t\n');
    expect(rows).toEqual([{ section: 'S01', students: [], leaders: ['a@x.edu'] }]);
  });

  it('dedupes emails within a section and lowercases them', () => {
    const rows = parseSectionsCsv('S01,A@X.edu\nS01,a@x.edu');
    expect(rows).toEqual([{ section: 'S01', students: ['a@x.edu'], leaders: [] }]);
  });

  it('returns [] for empty input', () => {
    expect(parseSectionsCsv('')).toEqual([]);
  });
});
