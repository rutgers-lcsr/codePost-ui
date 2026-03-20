// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { formatSub, getViewIcon, sortByGrade, type ISubDataBasic } from '../GraderUtils';

describe('GraderUtils', () => {
  describe('sortByGrade', () => {
    it('puts null grades first', () => {
      const a = { grade: null, isFinalized: true };
      const b = { grade: 80, isFinalized: true };
      expect(sortByGrade(a, b)).toBe(-1);
    });

    it('puts null grades first (reversed)', () => {
      const a = { grade: 80, isFinalized: true };
      const b = { grade: null, isFinalized: true };
      expect(sortByGrade(a, b)).toBe(1);
    });

    it('puts unfinalized before finalized', () => {
      const a = { grade: 90, isFinalized: false };
      const b = { grade: 80, isFinalized: true };
      expect(sortByGrade(a, b)).toBe(-1);
    });

    it('puts unfinalized before finalized (reversed)', () => {
      const a = { grade: 80, isFinalized: true };
      const b = { grade: 90, isFinalized: false };
      expect(sortByGrade(a, b)).toBe(1);
    });

    it('sorts by grade ascending when both finalized', () => {
      const a = { grade: 70, isFinalized: true };
      const b = { grade: 90, isFinalized: true };
      expect(sortByGrade(a, b)).toBeLessThan(0);
    });

    it('returns 0 for equal grades', () => {
      const a = { grade: 80, isFinalized: true };
      const b = { grade: 80, isFinalized: true };
      expect(sortByGrade(a, b)).toBe(0);
    });
  });

  describe('formatSub', () => {
    it('returns placeholder for null submission', () => {
      const result = formatSub(null);
      expect(result.gradeText).toBe('--');
      expect(result.grade).toBeNull();
      expect(result.isFinalized).toBe(false);
      expect(result.grader).toBe('--');
      expect(result.lastEdited).toBe('--');
    });

    it('returns placeholder for undefined submission', () => {
      const result = formatSub(undefined);
      expect(result.gradeText).toBe('--');
    });

    it('formats finalized submission without assignment', () => {
      const sub = {
        grade: 85,
        isFinalized: true,
        grader: 'grader@test.com',
        dateEdited: '2024-01-15T10:00:00Z',
      } as any;
      const result = formatSub(sub);
      expect(result.grade).toBe(85);
      expect(result.isFinalized).toBe(true);
      // gradeText is a React element showing "85"
      const { container } = render(result.gradeText as React.ReactElement);
      expect(container.textContent).toBe('85');
    });

    it('formats finalized submission with assignment', () => {
      const sub = {
        grade: 85,
        isFinalized: true,
        grader: 'grader@test.com',
        dateEdited: '2024-01-15T10:00:00Z',
      } as any;
      const assignment = { points: 100 } as any;
      const result = formatSub(sub, assignment);
      const { container } = render(result.gradeText as React.ReactElement);
      expect(container.textContent).toBe('85/100');
    });

    it('formats unfinalized submission with grader', () => {
      const sub = {
        grade: 50,
        isFinalized: false,
        grader: 'grader@test.com',
        dateEdited: '2024-01-15T10:00:00Z',
      } as any;
      const result = formatSub(sub);
      const { container } = render(result.gradeText as React.ReactElement);
      expect(container.textContent).toBe('Unfinalized');
    });

    it('formats unclaimed submission', () => {
      const sub = {
        grade: null,
        isFinalized: false,
        grader: null,
        dateEdited: '2024-01-15T10:00:00Z',
      } as any;
      const result = formatSub(sub);
      const { container } = render(result.gradeText as React.ReactElement);
      expect(container.textContent).toBe('Unclaimed');
    });

    it('formats grader name when present', () => {
      const sub = {
        grade: 80,
        isFinalized: true,
        grader: 'prof@university.edu',
        dateEdited: '2024-01-15T10:00:00Z',
      } as any;
      const result = formatSub(sub);
      expect(result.grader).toBe('prof@university.edu');
    });

    it('shows Unclaimed when grader is null', () => {
      const sub = {
        grade: null,
        isFinalized: false,
        grader: null,
        dateEdited: '2024-01-15T10:00:00Z',
      } as any;
      const result = formatSub(sub);
      const { container } = render(result.grader as React.ReactElement);
      expect(container.textContent).toBe('Unclaimed');
    });

    it('formats date correctly', () => {
      const sub = {
        grade: 0,
        isFinalized: true,
        grader: 'g@t.com',
        dateEdited: '2024-06-15T14:30:00Z',
      } as any;
      const result = formatSub(sub);
      // Should contain some date string, not '--'
      expect(result.lastEdited).not.toBe('--');
      expect(result.lastEdited.length).toBeGreaterThan(5);
    });
  });

  describe('getViewIcon', () => {
    it('returns -- for null submission', () => {
      expect(getViewIcon(null, {})).toBe('--');
    });

    it('returns -- when submission not in viewsBySubmission', () => {
      const sub = { id: 1, isFinalized: true, students: ['s@t.com'] } as any;
      expect(getViewIcon(sub, {})).toBe('--');
    });

    it('returns -- when submission not finalized', () => {
      const sub = { id: 1, isFinalized: false, students: ['s@t.com'] } as any;
      const views = { 1: { 's@t.com': '2024-01-01T00:00:00Z' } };
      expect(getViewIcon(sub, views)).toBe('--');
    });

    it('renders EyeFilled when specific student has viewed', () => {
      const sub = { id: 1, isFinalized: true, students: ['s@t.com'] } as any;
      const views = { 1: { 's@t.com': '2024-01-01T00:00:00Z' } };
      const icon = getViewIcon(sub, views, 's@t.com');
      const { container } = render(icon as React.ReactElement);
      // Should render an icon (span with anticon class)
      expect(container.querySelector('[aria-label="eye"]') || container.querySelector('svg')).toBeTruthy();
    });

    it('renders EyeInvisibleOutlined when specific student has not viewed', () => {
      const sub = { id: 1, isFinalized: true, students: ['s@t.com'] } as any;
      const views = { 1: {} };
      const icon = getViewIcon(sub, views, 's@t.com');
      const { container } = render(icon as React.ReactElement);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('renders EyeInvisibleOutlined when no students have viewed', () => {
      const sub = { id: 1, isFinalized: true, students: ['s1@t.com', 's2@t.com'] } as any;
      const views = { 1: {} };
      const icon = getViewIcon(sub, views);
      const { container } = render(icon as React.ReactElement);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('renders EyeFilled when all students have viewed', () => {
      const sub = { id: 1, isFinalized: true, students: ['s1@t.com', 's2@t.com'] } as any;
      const views = { 1: { 's1@t.com': '2024-01-01T00:00:00Z', 's2@t.com': '2024-01-02T00:00:00Z' } };
      const icon = getViewIcon(sub, views);
      const { container } = render(icon as React.ReactElement);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('renders EyeTwoTone when some students have viewed', () => {
      const sub = { id: 1, isFinalized: true, students: ['s1@t.com', 's2@t.com'] } as any;
      const views = { 1: { 's1@t.com': '2024-01-01T00:00:00Z' } };
      const icon = getViewIcon(sub, views);
      const { container } = render(icon as React.ReactElement);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('handles single student tooltip format', () => {
      const sub = { id: 1, isFinalized: true, students: ['s@t.com'] } as any;
      const views = { 1: { 's@t.com': '2024-06-01T12:00:00Z' } };
      const icon = getViewIcon(sub, views, 's@t.com');
      expect(React.isValidElement(icon)).toBe(true);
    });

    it('handles multi-student tooltip format', () => {
      const sub = { id: 1, isFinalized: true, students: ['s1@t.com', 's2@t.com'] } as any;
      const views = { 1: { 's1@t.com': '2024-01-01T00:00:00Z', 's2@t.com': '2024-02-01T00:00:00Z' } };
      const icon = getViewIcon(sub, views);
      expect(React.isValidElement(icon)).toBe(true);
    });

    it('handles student with null value in students array', () => {
      const sub = { id: 1, isFinalized: true, students: [null] } as any;
      const views = { 1: {} };
      const icon = getViewIcon(sub, views);
      const { container } = render(icon as React.ReactElement);
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });
});
