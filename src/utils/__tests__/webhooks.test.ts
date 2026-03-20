// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { VALID_WEBHOOKS } from '../webhooks';

describe('VALID_WEBHOOKS', () => {
  it('contains all expected resource types', () => {
    const expectedKeys = [
      'course',
      'section',
      'assignment',
      'rubricCategory',
      'rubricComment',
      'submission',
      'file',
      'fileTemplate',
      'comment',
      'testCategory',
      'testCase',
      'submissionHistory',
      'environment',
      'solutionFile',
      'helperFile',
    ];
    expect(Object.keys(VALID_WEBHOOKS)).toEqual(expect.arrayContaining(expectedKeys));
    expect(Object.keys(VALID_WEBHOOKS)).toHaveLength(expectedKeys.length);
  });

  it('every resource has at least one event', () => {
    for (const [key, events] of Object.entries(VALID_WEBHOOKS)) {
      expect(events.length, `${key} should have events`).toBeGreaterThan(0);
    }
  });

  it('course includes changed event', () => {
    expect(VALID_WEBHOOKS.course).toContain('changed');
  });

  it('submission includes isFinalized event', () => {
    expect(VALID_WEBHOOKS.submission).toContain('isFinalized');
  });

  it('testCase includes all CRUD and property events', () => {
    expect(VALID_WEBHOOKS.testCase).toContain('added');
    expect(VALID_WEBHOOKS.testCase).toContain('removed');
    expect(VALID_WEBHOOKS.testCase).toContain('description');
    expect(VALID_WEBHOOKS.testCase).toContain('exposed');
  });

  it('all event arrays contain only strings', () => {
    for (const events of Object.values(VALID_WEBHOOKS)) {
      for (const event of events) {
        expect(typeof event).toBe('string');
      }
    }
  });
});
