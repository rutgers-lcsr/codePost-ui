// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import {
  encodeForLink,
  encodeForRoute,
  getRubricURL,
  getUploadSubmissionsURL,
  getRosterURL,
  getTestsURL,
  getSettingsURL,
} from '../URLutils';

describe('encodeForLink', () => {
  it('encodes forward slashes', () => {
    expect(encodeForLink('foo/bar')).toBe('foo%2Fbar');
  });

  it('encodes hash symbols', () => {
    expect(encodeForLink('foo#bar')).toBe('foo%23bar');
  });

  it('encodes question marks', () => {
    expect(encodeForLink('foo?bar')).toBe('foo%3Fbar');
  });

  it('encodes ampersands', () => {
    expect(encodeForLink('foo&bar')).toBe('foo%26bar');
  });

  it('encodes plus signs', () => {
    expect(encodeForLink('foo+bar')).toBe('foo%2Bbar');
  });

  it('encodes commas', () => {
    expect(encodeForLink('foo,bar')).toBe('foo%2Cbar');
  });

  it('encodes parentheses', () => {
    expect(encodeForLink('foo(bar)')).toBe('foo%28bar%29');
  });

  it('encodes percent signs', () => {
    expect(encodeForLink('100%')).toBe('100%25');
  });

  it('handles multiple special characters', () => {
    expect(encodeForLink('a/b#c?d')).toBe('a%2Fb%23c%3Fd');
  });

  it('returns the same string when no special characters', () => {
    expect(encodeForLink('hello')).toBe('hello');
  });
});

describe('encodeForRoute', () => {
  it('delegates to encodeForLink', () => {
    expect(encodeForRoute('foo/bar')).toBe(encodeForLink('foo/bar'));
  });
});

describe('getRubricURL', () => {
  it('builds correct rubric URL', () => {
    const course = { name: 'CS101', period: 'Fall 2025' };
    const assignment = { name: 'HW1' };
    expect(getRubricURL(course, assignment)).toBe('admin/CS101/Fall 2025/assignments/rubrics/HW1');
  });

  it('encodes special characters in course and assignment names', () => {
    const course = { name: 'CS/101', period: 'Fall#2025' };
    const assignment = { name: 'HW (1)' };
    expect(getRubricURL(course, assignment)).toBe('admin/CS%2F101/Fall%232025/assignments/rubrics/HW %281%29');
  });
});

describe('getUploadSubmissionsURL', () => {
  it('builds correct upload URL', () => {
    const course = { name: 'CS101', period: 'Fall 2025' };
    const assignment = { name: 'HW1' };
    expect(getUploadSubmissionsURL(course, assignment)).toBe('admin/CS101/Fall 2025/assignments/HW1/upload/single');
  });
});

describe('getRosterURL', () => {
  it('builds correct roster URL', () => {
    const course = { name: 'CS101', period: 'Fall 2025' };
    expect(getRosterURL(course)).toBe('admin/CS101/Fall 2025/roster');
  });
});

describe('getTestsURL', () => {
  it('builds correct tests URL', () => {
    const course = { name: 'CS101', period: 'Fall 2025' };
    const assignment = { name: 'HW1' };
    expect(getTestsURL(course, assignment)).toBe('admin/CS101/Fall 2025/assignments/tests/HW1/edit/environment');
  });
});

describe('getSettingsURL', () => {
  it('builds correct settings URL', () => {
    const course = { name: 'CS101', period: 'Fall 2025' };
    const assignment = { name: 'HW1' };
    expect(getSettingsURL(course, assignment)).toBe('admin/CS101/Fall 2025/assignments/HW1/settings');
  });
});
