// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageEnum, type Environment } from '../../../../../../../api-client';
import { useEnvironmentSpecs } from '../useEnvironmentSpecs';

vi.mock('../../../../../../../api-client/clients', () => ({ autograderApi: {} }));

const env = (over: Partial<Environment>): Environment => ({ id: 7, language: 'python-3.12', ...over }) as Environment;

describe('useEnvironmentSpecs build logs', () => {
  it('shows the logs of the last build when the page opens on an already-built environment', () => {
    const logs = 'Step 1/15 : FROM python:3.12-slim\nERROR: No matching distribution found for nope==1.0\n';
    // Stable props: the hook re-runs its load effect whenever the env object changes identity.
    const props = { env: env({ buildLogs: logs, buildStatus: 3 }), updateEnv: vi.fn() };
    const { result } = renderHook(() => useEnvironmentSpecs(props, LanguageEnum.Python312));
    expect(result.current.buildLogs).toBe(logs);
  });
});
