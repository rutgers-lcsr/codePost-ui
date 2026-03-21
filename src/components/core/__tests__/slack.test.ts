// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { slack, sendSlack } from '../slack';

vi.mock('../../../utils/logger', () => ({
  Logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { Logger } from '../../../utils/logger';

describe('slack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
  });

  it('calls Logger.error when url contains logError', () => {
    slack('https://example.com/logError', { error: 'test error', errorDetail: 'details' });
    expect(Logger.error).toHaveBeenCalledWith('test error', 'details');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('calls fetch for non-logError urls', () => {
    slack('https://example.com/webhook', { text: 'hello' });
    expect(Logger.error).not.toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'hello' }),
      }),
    );
  });
});

describe('sendSlack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls Logger.info with the correct shape', () => {
    sendSlack('test message', 'some text', '#ff0000', '#channel', 42);
    expect(Logger.info).toHaveBeenCalledWith('test message', {
      text: 'some text',
      color: '#ff0000',
      channel: '#channel',
      courseID: 42,
    });
  });

  it('uses default parameter values', () => {
    sendSlack('msg');
    expect(Logger.info).toHaveBeenCalledWith('msg', {
      text: '',
      color: expect.any(String),
      channel: '#user_notifications_everything',
      courseID: 0,
    });
  });
});
