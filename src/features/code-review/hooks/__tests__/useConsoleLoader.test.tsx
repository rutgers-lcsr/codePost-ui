// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClientsMock } from '@test-utils/mocks';

vi.mock('../../../../api-client/clients', () => createApiClientsMock());

import { submissionsApi } from '../../../../api-client/clients';
import { ResponseError } from '../../../../api-client/runtime';
import { PERMISSION_LEVEL } from '../../../../types/common';
import type { ICodeConsoleState } from '../../../../types/CodeConsole.types';
import { useConsoleLoader } from '../useConsoleLoader';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/code/42']}>
        <Routes>
          <Route path="/code/:submissionId" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

/** Run the loader against a checkPermission failure and return the permission level it settled on. */
const permissionLevelFor = async (status: number): Promise<PERMISSION_LEVEL> => {
  vi.mocked(submissionsApi.checkPermissionRetrieve).mockRejectedValue(new ResponseError({ status } as Response));
  const setState = vi.fn();
  const { result } = renderHook(
    () =>
      useConsoleLoader({
        userEmail: 'u@x.edu',
        courseadminCourses: [],
        superGraderCourses: [],
        inDemoMode: false,
        setState,
      }),
    { wrapper: makeWrapper() },
  );
  await act(async () => {
    await result.current.componentDidMountLogic();
  });
  const updater = setState.mock.calls.at(-1)![0] as (prev: Partial<ICodeConsoleState>) => Partial<ICodeConsoleState>;
  return updater({}).permissionLevel!;
};

describe('useConsoleLoader permission failures', () => {
  beforeEach(() => {
    vi.mocked(submissionsApi.checkPermissionRetrieve).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('maps a 503 to UNAVAILABLE', async () => {
    expect(await permissionLevelFor(503)).toBe(PERMISSION_LEVEL.UNAVAILABLE);
  });

  it('maps a 404 to NOT_FOUND', async () => {
    expect(await permissionLevelFor(404)).toBe(PERMISSION_LEVEL.NOT_FOUND);
  });

  it('maps a 403 to NONE', async () => {
    expect(await permissionLevelFor(403)).toBe(PERMISSION_LEVEL.NONE);
  });
});
