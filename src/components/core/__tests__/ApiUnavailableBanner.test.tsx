// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApiUnavailableBanner from '../ApiUnavailableBanner';
import { useApiStatusStore } from '../../../stores/useApiStatusStore';

const renderBanner = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <ApiUnavailableBanner />
    </QueryClientProvider>,
  );
  return { invalidate };
};

describe('ApiUnavailableBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useApiStatusStore.setState({ status: 'ok' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders nothing while the API is ok', () => {
    renderBanner();
    expect(screen.queryByTestId('api-unavailable-banner')).toBeNull();
  });

  it('shows the banner and polls readiness with backoff until the API answers', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 503 }).mockResolvedValueOnce({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const { invalidate } = renderBanner();

    act(() => useApiStatusStore.getState().markUnavailable());
    expect(screen.getByTestId('api-unavailable-banner')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    // First probe after 2s: still down.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/health-check\/ready\/$/);
    expect(screen.getByTestId('api-unavailable-banner')).toBeInTheDocument();
    expect(useApiStatusStore.getState().status).toBe('unavailable');

    // Second probe after a doubled 4s wait: back up.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(useApiStatusStore.getState().status).toBe('ok');
    expect(screen.queryByTestId('api-unavailable-banner')).toBeNull();
    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
