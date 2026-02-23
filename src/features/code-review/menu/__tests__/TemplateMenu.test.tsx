// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TemplateMenu from '../TemplateMenu';
import { commentTemplatesApi } from '../../../../api-client/clients';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

import '@testing-library/jest-dom'; // Add this for toBeInTheDocument

describe('TemplateMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockThemeContext = {
    consoleTheme: consoleThemes.light,
    setConsoleTheme: vi.fn(),
    toggleConsoleTheme: vi.fn(), // Added this
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

    renderWithTheme(<TemplateMenu assignmentId={1} onApplyTemplate={vi.fn()} currentUserEmail="me" />);

    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
      expect(screen.getByText('Template 2')).toBeInTheDocument();
    });
  });

  it('calls onApplyTemplate when clicked', async () => {
    const templates = [{ id: 1, text: 'Template 1', isGlobal: false, owner: 'me' }];
    vi.spyOn(commentTemplatesApi, 'list').mockResolvedValue(templates as any);
    const onApply = vi.fn();

    renderWithTheme(<TemplateMenu assignmentId={1} onApplyTemplate={onApply} currentUserEmail="me" />);

    await waitFor(() => expect(screen.getByText('Template 1')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Template 1'));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ text: 'Template 1' }));
  });
});
