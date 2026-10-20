// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import type { AssignmentFileType } from '../../../../utils/file';

// Monaco doesn't run in jsdom; a textarea stands in so the Raw view is observable.
vi.mock('../../../../lib/monaco', () => ({
  default: ({ value }: { value: string }) => <textarea data-testid="raw-editor" readOnly value={value} />,
}));

import AssignmentFilesForm from './AssignmentFilesForm';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

const makeFile = (overrides: Partial<AssignmentFileType>): AssignmentFileType =>
  ({
    id: 1,
    name: 'plot.png',
    extension: 'png',
    path: 'images',
    required: false,
    assignment: 1,
    data: PNG,
    created: '',
    modified: '',
    description: '',
    ...overrides,
  }) as AssignmentFileType;

const openViewer = (file: AssignmentFileType) => {
  render(<AssignmentFilesForm value={[file]} />);
  fireEvent.click(screen.getByRole('button', { name: /View/ }));
};

// Each viewer test mounts the full antd modal: 1-2s locally, over the default 5s cap on a
// loaded CI runner.
const slow = { timeout: 15000 };
// waitFor keeps its own 1s default regardless of the test timeout above — the async
// FileReader round-trips (one per dropped file, chained) need the same headroom on a
// starved runner (seen failing inside the Docker deploy job while the plain test job passed).
const WAIT = { timeout: 10_000 };

describe('AssignmentFilesForm file viewer', () => {
  it('opens images in Preview mode as a rendered image, not the data URI', slow, () => {
    openViewer(makeFile({}));
    expect(screen.getByAltText('Preview of plot.png')).toHaveAttribute('src', PNG);
    expect(screen.queryByTestId('raw-editor')).not.toBeInTheDocument();
  });

  it('switches to the raw data URI with the Raw toggle', slow, () => {
    openViewer(makeFile({}));
    fireEvent.click(screen.getByText('Raw'));
    expect(screen.getByTestId('raw-editor')).toHaveValue(PNG);
  });

  it('previews SVG stored as raw markup', slow, () => {
    openViewer(makeFile({ name: 'icon.svg', extension: 'svg', data: '<svg xmlns="http://www.w3.org/2000/svg"/>' }));
    expect(screen.getByAltText('Preview of icon.svg').getAttribute('src')).toMatch(
      /^data:image\/svg\+xml;charset=utf-8,/,
    );
  });

  it('keeps the code editor for source files', slow, () => {
    openViewer(makeFile({ name: 'main.py', extension: 'py', data: 'print(1)' }));
    expect(screen.getByTestId('raw-editor')).toHaveValue('print(1)');
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
  });
});

describe('AssignmentFilesForm uploads', () => {
  const upload = (file: File) => {
    const onChange = vi.fn();
    const { container } = render(<AssignmentFilesForm value={[]} onChange={onChange} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    return onChange;
  };

  it('stores an uploaded image as a data URI instead of rejecting it', async () => {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])], 'covariance.jpg', {
      type: 'image/jpeg',
    });
    const onChange = upload(jpeg);
    await waitFor(() => expect(onChange).toHaveBeenCalled(), WAIT);
    const [added] = onChange.mock.calls[0][0] as AssignmentFileType[];
    expect(added.name).toBe('covariance.jpg');
    expect(added.data).toMatch(/^data:image\/jpeg;base64,/);
    expect(screen.queryByText('Unsupported File Type')).not.toBeInTheDocument();
  });

  it('still stores source files as plain text', async () => {
    const onChange = upload(new File(['print(1)\n'], 'main.py', { type: 'text/x-python' }));
    await waitFor(() => expect(onChange).toHaveBeenCalled(), WAIT);
    const [added] = onChange.mock.calls[0][0] as AssignmentFileType[];
    expect(added.data).toBe('print(1)\n');
  });
});

describe('AssignmentFilesForm drop zone', () => {
  const dropAll = (files: File[], existing: AssignmentFileType[] = []) => {
    const onChange = vi.fn();
    const { container } = render(<AssignmentFilesForm value={existing} onChange={onChange} />);
    // The drop zone's input, not a table row's Replace input.
    const input = container.querySelector('.ant-upload-drag input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });
    return onChange;
  };

  it('adds every file from a multi-file drop, none lost to a stale state', slow, async () => {
    const onChange = dropAll([
      new File(['a'], 'a.py', { type: 'text/x-python' }),
      new File(['b'], 'b.py', { type: 'text/x-python' }),
      new File(['c'], 'c.py', { type: 'text/x-python' }),
    ]);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(3), WAIT);
    const last = onChange.mock.calls[2][0] as AssignmentFileType[];
    expect(last.map((f) => f.name)).toEqual(['a.py', 'b.py', 'c.py']);
  });

  it('expands a zip into its folder structure', slow, async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('src/main.py', 'print(1)');
    zip.file('README.md', '# hi');
    zip.file('__MACOSX/._junk', 'x');
    const blob = await zip.generateAsync({ type: 'blob' });
    const onChange = dropAll([new File([blob], 'project.zip', { type: 'application/zip' })]);
    await waitFor(() => expect(onChange).toHaveBeenCalled(), WAIT);
    const added = onChange.mock.calls[0][0] as AssignmentFileType[];
    expect(added.map((f) => `${f.path ? f.path + '/' : ''}${f.name}`).sort()).toEqual(['README.md', 'src/main.py']);
    expect(added.find((f) => f.name === 'main.py')?.data).toBe('print(1)');
  });

  it('skips a plain file whose name already exists', slow, async () => {
    const existing = makeFile({ id: 1, name: 'main.py', extension: 'py', data: 'old' });
    const onChange = dropAll([new File(['new'], 'main.py', { type: 'text/x-python' })], [existing]);
    // Give the async reader a tick; nothing should have been appended.
    await new Promise((r) => setTimeout(r, 50));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('AssignmentFilesForm rename', () => {
  it('renames through the modal and refuses a duplicate name', slow, async () => {
    const onChange = vi.fn();
    render(
      <AssignmentFilesForm
        value={[
          makeFile({ id: 1, name: 'a.py', extension: 'py', data: 'a' }),
          makeFile({ id: 2, name: 'b.py', extension: 'py', data: 'b' }),
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Rename/ })[0]);
    const nameInput = await screen.findByLabelText('File name');
    fireEvent.change(nameInput, { target: { value: 'b.py' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('A file with this name already exists')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(nameInput, { target: { value: 'c.py' } });
    fireEvent.change(screen.getByLabelText('Directory'), { target: { value: 'src' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const updated = onChange.mock.calls[0][0] as AssignmentFileType[];
    expect(updated[0]).toMatchObject({ id: 1, name: 'c.py', path: 'src', extension: 'py' });
  });
});
