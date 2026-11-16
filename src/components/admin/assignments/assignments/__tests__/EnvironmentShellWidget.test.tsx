// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

import { createApiClientsMock } from '../../../../../test-utils/mocks';

const { write } = vi.hoisted(() => ({ write: vi.fn() }));

vi.mock('../../../../../api-client/clients', () => createApiClientsMock());

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    open = vi.fn();
    loadAddon = vi.fn();
    writeln = vi.fn();
    write = write;
    onData = vi.fn(() => ({ dispose: vi.fn() }));
    dispose = vi.fn();
    focus = vi.fn();
    reset = vi.fn();
  },
}));
vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class {
    fit = vi.fn();
  },
}));
vi.mock('@xterm/xterm/css/xterm.css', () => ({}));

import { assignmentsApi } from '../../../../../api-client/clients';
import { EnvironmentShellWidget } from '../EnvironmentShellWidget';

/** Minimal WebSocket stand-in: captures the last instance so tests can fire its handlers. */
class FakeWebSocket {
  static OPEN = 1;
  static last: FakeWebSocket;
  binaryType = '';
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: unknown) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  constructor(public url: string) {
    FakeWebSocket.last = this;
  }
}

const startShell = async () => {
  render(<EnvironmentShellWidget environmentId={5} hasAssignmentFiles />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
  });
  return FakeWebSocket.last;
};

describe('EnvironmentShellWidget connection messages', () => {
  beforeEach(() => {
    write.mockClear();
    vi.mocked(localStorage.getItem).mockReturnValue('token');
    // handleStart derives the ws:// URL from this before opening the socket.
    vi.stubEnv('REACT_APP_API_URL', 'http://api.test');
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('takes no room for the terminal until a session is started', async () => {
    render(<EnvironmentShellWidget environmentId={5} hasAssignmentFiles />);
    expect(screen.queryByRole('textbox', { name: 'Shell terminal' })).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    });
    expect(screen.getByRole('textbox', { name: 'Shell terminal' })).toBeTruthy();
  });

  it('reports a connection error without echoing the socket URL', async () => {
    const ws = await startShell();
    act(() => ws.onerror?.());
    expect(write).toHaveBeenCalledWith('\r\nConnection error.\r\n');
    expect(write.mock.calls.some(([text]) => String(text).includes('URL:'))).toBe(false);
  });

  it('explains an abnormal close and points at Start', async () => {
    const ws = await startShell();
    act(() => ws.onclose?.({ code: 1006 }));
    expect(write).toHaveBeenCalledWith('\r\nConnection lost — press Start to open a new shell.\r\n');
  });

  it('keeps the plain closed message for a normal close', async () => {
    const ws = await startShell();
    act(() => ws.onclose?.({ code: 1000 }));
    expect(write).toHaveBeenCalledWith('\r\nShell session closed (code 1000)\r\n');
  });

  it('sends no dataset selection when the widget has no assignment to load datasets from', async () => {
    const ws = await startShell();
    const params = new URL(ws.url).searchParams;
    expect(params.get('includeDatasets')).toBe('true');
    expect(params.has('datasetIds')).toBe(false);
  });
});

describe('EnvironmentShellWidget dataset picker', () => {
  const ds = (id: number, overrides: Record<string, unknown> = {}) => ({
    id,
    name: `d${id}.csv`,
    mountPath: `shared/d${id}.csv`,
    isActive: true,
    isStudentVariant: false,
    isTestResource: false,
    ...overrides,
  });

  const startWithDatasets = async (list: unknown[]) => {
    vi.mocked(assignmentsApi.datasetsList).mockResolvedValue(list as never);
    render(<EnvironmentShellWidget environmentId={5} hasAssignmentFiles assignmentId={7} />);
    await screen.findByText('Datasets to mount');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    });
    return new URL(FakeWebSocket.last.url).searchParams;
  };

  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue('token');
    vi.stubEnv('REACT_APP_API_URL', 'http://api.test');
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('defaults to the shared datasets and sends their ids', async () => {
    const params = await startWithDatasets([
      ds(1),
      ds(2, { isStudentVariant: true }),
      ds(3, { isTestResource: true }),
      ds(4, { isActive: false }),
    ]);
    await waitFor(() => expect(assignmentsApi.datasetsList).toHaveBeenCalledWith({ id: 7 }));
    expect(params.get('datasetIds')).toBe('1');
    expect(params.get('includeDatasets')).toBe('true');
  });

  it('sends an explicit empty selection when nothing is shared by default', async () => {
    const params = await startWithDatasets([ds(2, { isStudentVariant: true }), ds(3, { isStudentVariant: true })]);
    expect(params.get('datasetIds')).toBe('');
    expect(params.get('includeDatasets')).toBe('false');
  });
});
