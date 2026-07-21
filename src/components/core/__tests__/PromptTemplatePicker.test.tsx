// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromptTemplatePicker from '../PromptTemplatePicker';

const templates = [
  { key: 'basic', label: 'Basic (default)', description: 'The built-in default.', text: 'BASIC TEXT' },
  { key: 'concise', label: 'Concise', description: 'Short and warm.', text: 'CONCISE TEXT' },
];

describe('PromptTemplatePicker', () => {
  it('lists templates with their descriptions and returns the chosen one', () => {
    const onSelect = vi.fn();
    render(<PromptTemplatePicker templates={templates} onSelect={onSelect} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));

    // Descriptions render alongside labels to help the instructor pick.
    // getByText throws if absent, so reaching the assertion already proves presence.
    expect(screen.getByText('Short and warm.')).toBeTruthy();

    fireEvent.click(screen.getByText('Concise'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(templates[1]);
  });

  it('renders a label when provided', () => {
    render(<PromptTemplatePicker templates={templates} onSelect={vi.fn()} label="Start from a template" />);
    expect(screen.getByText('Start from a template')).toBeTruthy();
  });
});
