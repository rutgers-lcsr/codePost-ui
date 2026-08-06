// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { PromptVariable } from '../../../api-client';
import TemplateTextArea from '../TemplateTextArea';

const VARS = [
  {
    token: '{assignment_name}',
    name: 'assignment_name',
    argument: null,
    label: 'Assignment name',
    description: 'The name of the attached assignment.',
    kind: 'static',
  },
  {
    token: '{submission_files}',
    name: 'submission_files',
    argument: null,
    label: "All the student's submitted files",
    description: 'Every file of the submission.',
    kind: 'static',
  },
  {
    token: '{assignment_file:starter.py}',
    name: 'assignment_file',
    argument: 'starter.py',
    label: 'Assignment file: starter.py',
    description: 'The contents of one assignment file.',
    kind: 'file',
  },
] as PromptVariable[];

/** Stateful wrapper so the controlled editor behaves like it does under a Form. */
const Harness: React.FC<
  Partial<React.ComponentProps<typeof TemplateTextArea>> & { onChange?: (v: string) => void }
> = ({ value: initial = '', onChange, ...rest }) => {
  const [value, setValue] = React.useState(initial);
  return (
    <TemplateTextArea
      variables={VARS}
      {...rest}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
};

describe('TemplateTextArea', () => {
  it('opens the { autocomplete and inserts the full token', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const ta = screen.getByRole('textbox');
    fireEvent.change(ta, { target: { value: '{' } });
    fireEvent.keyUp(ta, { key: '{' });

    // The dropdown lists tokens with their labels.
    fireEvent.click(await screen.findByText("All the student's submitted files"));
    expect(onChange).toHaveBeenLastCalledWith('{submission_files}');
  });

  it('tints known variables and flags unknown ones', () => {
    const { container } = render(<Harness value="Use {submission_files} and {nope} here." />);

    const marks = container.querySelectorAll('.cp-tta-var');
    expect([...marks].map((m) => m.textContent)).toEqual(['{submission_files}', '{nope}']);
    const unknown = container.querySelectorAll('.cp-tta-var-unknown');
    expect([...unknown].map((m) => m.textContent)).toEqual(['{nope}']);
  });

  it('does not flag anything while the variable list is still loading', () => {
    const { container } = render(<TemplateTextArea variables={[]} value="Uses {whatever}." />);
    expect(container.querySelectorAll('.cp-tta-var')).toHaveLength(1);
    expect(container.querySelectorAll('.cp-tta-var-unknown')).toHaveLength(0);
  });

  it('splices the picked variable in at the caret, not at the end', async () => {
    const onChange = vi.fn();
    render(<Harness value="Hello world" onChange={onChange} />);

    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    ta.setSelectionRange(6, 6);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Insert variable' }));
    fireEvent.click(await screen.findByText('Assignment name'));

    expect(onChange).toHaveBeenLastCalledWith('Hello {assignment_name}world');
  });

  it('shows the character count', () => {
    render(<Harness value="12345" />);
    expect(screen.getByText('5 characters')).toBeInTheDocument();
  });

  it('expands into a modal editor whose edits survive closing', async () => {
    const onChange = vi.fn();
    render(<Harness value="draft" onChange={onChange} label="Prompt" />);

    fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));

    // The inline slot collapses while the modal hosts the (single) editor.
    expect(screen.getByText('Editing in expanded view…')).toBeInTheDocument();
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Prompt');

    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.value).toBe('draft');
    fireEvent.change(ta, { target: { value: 'draft, refined' } });
    expect(onChange).toHaveBeenLastCalledWith('draft, refined');

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    const inline = (await screen.findAllByRole('textbox'))[0] as HTMLTextAreaElement;
    expect(inline.value).toBe('draft, refined');
  });

  it('hides the expand button when expandable is off', () => {
    render(<Harness expandable={false} />);
    expect(screen.queryByRole('button', { name: 'Full screen' })).toBeNull();
  });
});
