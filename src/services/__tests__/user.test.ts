// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClientsMock } from '@test-utils/mocks';

vi.mock('../../api-client/clients', () => createApiClientsMock());

import { UserIO } from '../user';
import { usersApi, dashboardApi } from '../../api-client/clients';

describe('UserIO service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('read calls retrieve with email', async () => {
    vi.mocked(usersApi.retrieve).mockResolvedValue({ id: 1, email: 'a@b.com' } as any);
    const result = await UserIO.read('a@b.com');
    expect(usersApi.retrieve).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(result.email).toBe('a@b.com');
  });

  it('list unwraps paginated results', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({ results: [{ id: 1 }, { id: 2 }] } as any);
    const result = await UserIO.list();
    expect(usersApi.list).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it('create calls with user data', async () => {
    const user = { email: 'new@b.com' } as any;
    vi.mocked(usersApi.create).mockResolvedValue({ id: 3, ...user } as any);
    const result = await UserIO.create(user);
    expect(usersApi.create).toHaveBeenCalledWith({ user });
    expect(result.id).toBe(3);
  });

  it('update calls partialUpdate', async () => {
    vi.mocked(usersApi.partialUpdate).mockResolvedValue({ id: 1 } as any);
    await UserIO.update('a@b.com', { canCreateCourses: true } as any);
    expect(usersApi.partialUpdate).toHaveBeenCalledWith({
      email: 'a@b.com',
      patchedUser: { canCreateCourses: true },
    });
  });

  it('delete calls destroy', async () => {
    vi.mocked(usersApi.destroy).mockResolvedValue(undefined as any);
    await UserIO.delete('a@b.com');
    expect(usersApi.destroy).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('getDashboardStats calls statsRetrieve', async () => {
    const stats = { totalCourses: 5 };
    vi.mocked(dashboardApi.statsRetrieve).mockResolvedValue(stats as any);
    const result = await UserIO.getDashboardStats();
    expect(dashboardApi.statsRetrieve).toHaveBeenCalled();
    expect(result).toEqual(stats);
  });
});
