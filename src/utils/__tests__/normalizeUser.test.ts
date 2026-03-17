// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { normalizeUser } from '../normalizeUser';

describe('normalizeUser', () => {
  it('normalizes a well-formed user object', () => {
    const raw = {
      id: 42,
      email: 'student@university.edu',
      password: 'secret',
      organization: 1,
      studentCourses: [{ id: 1 }],
      graderCourses: [],
      superGraderCourses: [],
      courseadminCourses: [],
      leaderSections: [],
      codePostAdmin: false,
      canCreateCourses: true,
      canModifyRosters: false,
      isOrgStaff: false,
      showProductTips: true,
      apiToken: 'tok_123',
      studentSections: [1, 2],
      hasCredentials: true,
      token: 'jwt-token',
    };

    const result = normalizeUser(raw);
    expect(result.id).toBe(42);
    expect(result.email).toBe('student@university.edu');
    expect(result.apiToken).toBe('tok_123');
    expect(result.studentSections).toEqual([1, 2]);
    expect(result.canCreateCourses).toBe(true);
  });

  it('normalizes snake_case fields to camelCase equivalents', () => {
    const raw = {
      id: 1,
      email: 'test@test.com',
      api_token: 'snake_tok',
      student_sections: [3, 4],
    };

    const result = normalizeUser(raw);
    expect(result.apiToken).toBe('snake_tok');
    expect(result.studentSections).toEqual([3, 4]);
  });

  it('prefers camelCase over snake_case when both are present', () => {
    const raw = {
      id: 1,
      apiToken: 'camel_tok',
      api_token: 'snake_tok',
      studentSections: [10],
      student_sections: [20],
    };

    const result = normalizeUser(raw);
    expect(result.apiToken).toBe('camel_tok');
    expect(result.studentSections).toEqual([10]);
  });

  it('provides defaults for missing fields', () => {
    const result = normalizeUser({});
    expect(result.id).toBe(0);
    expect(result.email).toBeUndefined();
    expect(result.password).toBe('');
    expect(result.organization).toBeNull();
    expect(result.studentCourses).toEqual([]);
    expect(result.graderCourses).toEqual([]);
    expect(result.superGraderCourses).toEqual([]);
    expect(result.courseadminCourses).toEqual([]);
    expect(result.leaderSections).toEqual([]);
    expect(result.codePostAdmin).toBe(false);
    expect(result.canCreateCourses).toBe(false);
    expect(result.canModifyRosters).toBe(false);
    expect(result.isOrgStaff).toBe(false);
    expect(result.showProductTips).toBe(false);
    expect(result.studentSections).toEqual([]);
    expect(result.hasCredentials).toBe(false);
    expect(result.token).toBeNull();
  });

  it('handles null input', () => {
    const result = normalizeUser(null);
    expect(result.id).toBe(0);
  });

  it('handles undefined input', () => {
    const result = normalizeUser(undefined);
    expect(result.id).toBe(0);
  });

  it('handles non-object input gracefully', () => {
    const result = normalizeUser('string-input');
    expect(result.id).toBe(0);
  });

  it('handles apiToken being null', () => {
    const raw = { id: 1, apiToken: null };
    const result = normalizeUser(raw);
    expect(result.apiToken).toBeNull();
  });
});
