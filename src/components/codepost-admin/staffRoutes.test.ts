// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';

import { personPath, resolveStaffLocation, staffPath } from './staffRoutes';

describe('resolveStaffLocation', () => {
  it('reads a person under People and keeps the list filter', () => {
    expect(resolveStaffLocation('/dashboard/people/12', '?role=student')).toEqual({
      page: 'People',
      tab: 'people',
      person: 12,
    });
  });

  it('strips a legacy ?tab= from a person address', () => {
    expect(resolveStaffLocation('/dashboard/people/12', '?tab=x&q=a').canonical).toBe('/dashboard/people/12?q=a');
  });

  it('keeps the person when the old Users slug is used', () => {
    expect(resolveStaffLocation('/dashboard/users/12', '?role=grader')).toMatchObject({
      page: 'People',
      person: 12,
      canonical: '/dashboard/people/12?role=grader',
    });
  });

  it('rewrites a non-numeric person segment to the list', () => {
    expect(resolveStaffLocation('/dashboard/people/abc').canonical).toBe('/dashboard/people');
  });

  it('leaves the console root alone', () => {
    expect(resolveStaffLocation('/dashboard')).toEqual({ page: 'Inbox', tab: undefined });
  });
});

describe('paths', () => {
  it('omits the first tab', () => {
    expect(staffPath('People', 'people', '?q=a')).toBe('/dashboard/people?q=a');
    expect(staffPath('People', 'requests')).toBe('/dashboard/people/requests');
  });

  it('addresses a person by id only', () => {
    expect(personPath(564)).toBe('/dashboard/people/564');
  });
});
