// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { courseKeys, assignmentKeys, studentKeys, graderKeys, submissionKeys } from '../queryKeys';
import { queryClient } from '../queryClient';

describe('queryKeys', () => {
  describe('courseKeys', () => {
    it('has a stable "all" key', () => {
      expect(courseKeys.all).toEqual(['courses']);
    });

    it('builds roster key with courseId', () => {
      expect(courseKeys.roster(42)).toEqual(['courses', 42, 'roster']);
    });

    it('builds sections key with courseId', () => {
      expect(courseKeys.sections(7)).toEqual(['courses', 7, 'sections']);
    });
  });

  describe('assignmentKeys', () => {
    it('has a stable "all" key', () => {
      expect(assignmentKeys.all).toEqual(['assignments']);
    });

    it('builds list key', () => {
      expect(assignmentKeys.list(3)).toEqual(['assignments', 'list', 3]);
    });

    it('builds detail key', () => {
      expect(assignmentKeys.detail(10)).toEqual(['assignments', 'detail', 10]);
    });

    it('builds analytics key with default buckets', () => {
      expect(assignmentKeys.analytics(5)).toEqual(['assignments', 'analytics', 5, 10]);
    });

    it('builds analytics key with custom buckets', () => {
      expect(assignmentKeys.analytics(5, 20)).toEqual(['assignments', 'analytics', 5, 20]);
    });

    it('builds rubric key', () => {
      expect(assignmentKeys.rubric(8)).toEqual(['assignments', 'rubric', 8]);
    });

    it('builds submissions key', () => {
      expect(assignmentKeys.submissions(3)).toEqual(['assignments', 'submissions', 3]);
    });

    it('builds viewHistories key', () => {
      expect(assignmentKeys.viewHistories(3)).toEqual(['assignments', 'viewHistories', 3]);
    });

    it('builds regradeSubmissions key with default grader', () => {
      expect(assignmentKeys.regradeSubmissions(5)).toEqual(['assignments', 'regrades', 5, 'all']);
    });

    it('builds regradeSubmissions key with specific grader', () => {
      expect(assignmentKeys.regradeSubmissions(5, 'test@test.com')).toEqual([
        'assignments',
        'regrades',
        5,
        'test@test.com',
      ]);
    });

    it('builds apiKeys key', () => {
      expect(assignmentKeys.apiKeys(3)).toEqual(['courses', 3, 'apiKeys']);
    });
  });

  describe('studentKeys', () => {
    it('builds courseData key', () => {
      expect(studentKeys.courseData(1)).toEqual(['student', 'courseData', 1]);
    });

    it('builds assignments key', () => {
      expect(studentKeys.assignments(2)).toEqual(['student', 'assignments', 2]);
    });

    it('builds submissions key', () => {
      expect(studentKeys.submissions(3)).toEqual(['student', 'submissions', 3]);
    });

    it('builds histories key', () => {
      expect(studentKeys.histories(4)).toEqual(['student', 'histories', 4]);
    });
  });

  describe('graderKeys', () => {
    it('builds submissions key', () => {
      expect(graderKeys.submissions(1, 'grader@test.com')).toEqual(['grader', 'submissions', 1, 'grader@test.com']);
    });

    it('builds sections key', () => {
      expect(graderKeys.sections(5)).toEqual(['grader', 'sections', 5]);
    });

    it('builds queueLength key without sectionIds', () => {
      expect(graderKeys.queueLength(10)).toEqual(['grader', 'queueLength', 10]);
    });

    it('builds queueLength key with sectionIds', () => {
      expect(graderKeys.queueLength(10, [1, 2, 3])).toEqual(['grader', 'queueLength', 10, 1, 2, 3]);
    });
  });

  describe('submissionKeys', () => {
    it('builds detail key', () => {
      expect(submissionKeys.detail(100)).toEqual(['submission', 'detail', 100]);
    });

    it('builds files key', () => {
      expect(submissionKeys.files(100)).toEqual(['submission', 'files', 100]);
    });

    it('builds permissions key', () => {
      expect(submissionKeys.permissions(100)).toEqual(['submission', 'permissions', 100]);
    });
  });
});

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.prefetchQuery).toBe('function');
    expect(typeof queryClient.getQueryData).toBe('function');
  });

  it('has default options configured', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(5 * 60_000);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });
});
