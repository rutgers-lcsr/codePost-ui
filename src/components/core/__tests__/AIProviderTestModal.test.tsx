// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIProviderTestModal from '../AIProviderTestModal';
import type { AIProviderTestResult } from '../../../api-client';

const baseProps = {
  open: true,
  onClose: vi.fn(),
  provider: 'portkey',
  savedModel: 'default',
  modelOptions: [{ label: 'Default (gateway-configured) ★', value: 'default' }],
  loadingModels: false,
};

const successResult: AIProviderTestResult = {
  success: true,
  provider: 'portkey',
  model: 'default',
  reportedModel: 'gemini-3-flash-preview',
  latencyMs: 2400.5,
  requestSystemPrompt: 'You are a helpful assistant. Answer briefly in plain text.',
  requestUserPrompt: 'What is 2+2?',
  response: '4',
};

describe('AIProviderTestModal', () => {
  it('shows an empty state before any run', () => {
    render(<AIProviderTestModal {...baseProps} runTest={vi.fn()} />);
    expect(screen.getByText('No test run yet')).toBeTruthy();
  });

  it('runs the test with the saved model and renders the success result', async () => {
    const runTest = vi.fn().mockResolvedValue(successResult);
    render(<AIProviderTestModal {...baseProps} runTest={runTest} />);

    fireEvent.click(screen.getByText('Run test'));
    // Model field is seeded with savedModel; no prompt typed.
    expect(runTest).toHaveBeenCalledWith(undefined, 'default');

    await waitFor(() => expect(screen.getByText('Connection OK')).toBeTruthy());
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('reported: gemini-3-flash-preview')).toBeTruthy();
  });

  it('passes a typed prompt through to runTest', async () => {
    const runTest = vi.fn().mockResolvedValue(successResult);
    render(<AIProviderTestModal {...baseProps} runTest={runTest} />);

    fireEvent.change(screen.getByLabelText('Test prompt'), { target: { value: 'What is 2+2?' } });
    fireEvent.click(screen.getByText('Run test'));
    expect(runTest).toHaveBeenCalledWith('What is 2+2?', 'default');
    await waitFor(() => expect(screen.getByText('Connection OK')).toBeTruthy());
  });

  it('renders error and raw detail on failure', async () => {
    const runTest = vi.fn().mockResolvedValue({
      success: false,
      provider: 'portkey',
      model: 'default',
      error: 'Invalid API key. Please check your AI settings.',
      errorDetail: 'HTTPStatusError: 401 unauthorized',
    } as AIProviderTestResult);
    render(<AIProviderTestModal {...baseProps} runTest={runTest} />);

    fireEvent.click(screen.getByText('Run test'));
    await waitFor(() => expect(screen.getByText('Connection failed')).toBeTruthy());
    expect(screen.getByText('Invalid API key. Please check your AI settings.')).toBeTruthy();
    expect(screen.getByText('HTTPStatusError: 401 unauthorized')).toBeTruthy();
  });
});
