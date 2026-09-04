// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const { write } = vi.hoisted(() => ({ write: vi.fn() }));

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
});
