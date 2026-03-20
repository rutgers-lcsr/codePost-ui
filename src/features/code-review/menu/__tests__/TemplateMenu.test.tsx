// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, waitFor, fireEvent, within, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock react-spring so animated.div is a plain div — the animated wrapper
// doesn't reliably forward click events in all JSDOM versions.
vi.mock('react-spring', () => ({
  useSpring: () => ({}),
  animated: { div: 'div' },
}));

import TemplateMenu from '../TemplateMenu';
import { commentTemplatesApi } from '../../../../api-client/clients';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

import '@testing-library/jest-dom';

describe('TemplateMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Explicit cleanup — auto-cleanup can be unreliable with vitest isolate: false
  afterEach(() => {
    cleanup();
  });

  const mockThemeContext = {
    consoleTheme: consoleThemes.light,
    setConsoleTheme: vi.fn(),
    toggleConsoleTheme: vi.fn(),
  };

  const renderWithTheme = (component: React.ReactNode) => {
    return render(<ConsoleThemeContext.Provider value={mockThemeContext}>{component}</ConsoleThemeContext.Provider>);
  };

  it('renders templates', async () => {
    const templates = [
      { id: 1, text: 'Template 1', isGlobal: false, owner: 'me' },
      { id: 2, text: 'Template 2', isGlobal: true, owner: 'admin' },
    ];
    vi.spyOn(commentTemplatesApi, 'list').mockResolvedValue(templates as any);

    const { container } = renderWithTheme(
      <TemplateMenu assignmentId={1} onApplyTemplate={vi.fn()} currentUserEmail="me" />,
    );

    await waitFor(() => {
      expect(within(container).getByText('Template 1')).toBeInTheDocument();
      expect(within(container).getByText('Template 2')).toBeInTheDocument();
    });
  });

  it('calls onApplyTemplate when clicked', async () => {
    const templates = [{ id: 1, text: 'Template 1', isGlobal: false, owner: 'me' }];
    vi.spyOn(commentTemplatesApi, 'list').mockResolvedValue(templates as any);
    const onApply = vi.fn();

    const { container } = renderWithTheme(
      <TemplateMenu assignmentId={1} onApplyTemplate={onApply} currentUserEmail="me" />,
    );

    await waitFor(() => {
      expect(within(container).getByText('Template 1')).toBeInTheDocument();
    });

    // Click the Card element directly — scope to container to avoid stale DOM
    // from previous tests (vitest isolate: false shares module state across files)
    const card = within(container).getByText('Template 1').closest('.ant-card')!;
    fireEvent.click(card);
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ text: 'Template 1' }));
  });
});
