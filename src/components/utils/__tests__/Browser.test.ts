// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyTextToClipboard } from '../Browser';

describe('copyTextToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('copies text using navigator.clipboard.writeText', () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    copyTextToClipboard('hello world');

    expect(writeTextMock).toHaveBeenCalledWith('hello world');
  });

  it('creates and removes a textarea from the DOM', () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    copyTextToClipboard('test');

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    const appended = appendSpy.mock.calls[0][0] as HTMLTextAreaElement;
    expect(appended.tagName).toBe('TEXTAREA');
  });

  it('handles clipboard failure gracefully', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: () => {
          throw new Error('denied');
        },
      },
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => copyTextToClipboard('fail')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('Oops, unable to copy');
  });
});
