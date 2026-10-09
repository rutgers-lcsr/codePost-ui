// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import { createApiClientsMock } from '../../../../test-utils/mocks';
import type { AssignmentDataSetType } from '../../../../types/models';

vi.mock('../../../../api-client/clients', () => createApiClientsMock());
vi.mock('../../../../stores/usePermissionsStore', () => ({
  useAssignmentCapabilities: () => ({ manage_datasets: true }),
}));
vi.mock('../../../../utils/auth', () => ({ getAuthToken: () => 'tok' }));

import AssignmentDataSetsForm, {
  containerPath,
  defaultMountPath,
  displayMountPath,
  mountPathAliases,
  normalizeMountPath,
} from './AssignmentDataSetsForm';

const okResponse = { ok: true, status: 201, statusText: 'Created', json: async () => ({}) };

const existing = (overrides: Partial<AssignmentDataSetType>): AssignmentDataSetType =>
  ({
    id: 1,
    assignment: 9,
    name: 'a.csv',
    description: '',
    file: 'x',
    fileUrl: null,
    fileSize: 10,
    fileName: 'a.csv',
    mountPath: 'shared/a.csv',
    isActive: true,
    hidden: false,
    isTestResource: false,
    isStudentVariant: false,
    autogradeAllVariants: false,
    created: '',
    modified: '',
    ...overrides,
  }) as AssignmentDataSetType;

/** Drop files onto the first (or only) file input currently in the document. */
const dropFiles = (files: File[], within: ParentNode = document) => {
  const input = within.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};

// Each test mounts the full antd modal: slow on a loaded CI runner.
const slow = { timeout: 15000 };

describe('dataset path helpers', () => {
  it('mirrors the API default mount path', () => {
    expect(defaultMountPath('My Data (v2).CSV')).toBe('shared/my_data_v2.csv');
  });

  it('resolves the container location like the executor', () => {
    expect(containerPath('shared/a.csv', 'a.csv')).toBe('/shared/a.csv');
    expect(containerPath('data/', 'a.csv')).toBe('/shared/data/a.csv');
    expect(containerPath('/etc/conf.json', 'conf.json')).toBe('/etc/conf.json');
    expect(containerPath('', 'B.csv')).toBe('/shared/b.csv');
    // ./ is the working directory where student code runs; ~/ is the codepost user's home.
    expect(containerPath('./a.csv', 'a.csv')).toBe('/work/a.csv');
    expect(containerPath('~/data/', 'a.csv')).toBe('/home/codepost/data/a.csv');
    expect(containerPath('.', 'a.csv')).toBe('/work/a.csv');
  });

  it('treats the relative spellings of the shared folder as the same place', () => {
    for (const typed of ['shared/pdf', '~/shared/pdf', './shared/pdf']) {
      expect(normalizeMountPath(typed)).toBe('shared/pdf');
      expect(containerPath(typed, 'pdf')).toBe('/shared/pdf');
    }
    expect(normalizeMountPath('~/shared')).toBe('shared/');
    expect(normalizeMountPath('./a.csv')).toBe('./a.csv');
  });

  it('never rewrites an absolute path', () => {
    for (const typed of ['/srv/shared/pdf', '/home/codepost/shared/pdf', '/shared/pdf', '/opt/data/pdf']) {
      expect(normalizeMountPath(typed)).toBe(typed);
      expect(containerPath(typed, 'pdf')).toBe(typed);
      expect(displayMountPath(typed, 'pdf')).toBe(typed);
      expect(mountPathAliases(typed, 'pdf')).toEqual([]);
    }
    expect(containerPath('/srv/shared/', 'pdf')).toBe('/srv/shared/pdf');
  });

  it('shows ~/shared as the primary location of a shared-folder mount, with aliases', () => {
    expect(displayMountPath('shared/pdf', 'pdf')).toBe('~/shared/pdf');
    expect(displayMountPath('./shared/data/', 'a.csv')).toBe('~/shared/data/a.csv');
    expect(displayMountPath('', 'B.csv')).toBe('~/shared/b.csv');
    expect(mountPathAliases('shared/pdf', 'pdf')).toEqual(['/shared/pdf', './shared/pdf']);
    expect(displayMountPath('./a.csv', 'a.csv')).toBe('/work/a.csv');
    expect(mountPathAliases('./a.csv', 'a.csv')).toEqual([]);
  });
});

describe('AssignmentDataSetsForm upload modal', () => {
  const fetchMock = vi.fn();
  const onDatasetsChange = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(okResponse);
    onDatasetsChange.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('REACT_APP_API_URL', 'http://api.test');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('queues dropped files with names and mount paths prefilled from the filenames', slow, async () => {
    render(<AssignmentDataSetsForm assignmentId={9} datasets={[]} onDatasetsChange={onDatasetsChange} />);
    dropFiles([new File(['1'], 'Train Set.csv'), new File(['2'], 'b.csv')]);

    const nameInput = await screen.findByLabelText('Dataset name for Train Set.csv');
    expect(nameInput).toHaveValue('Train Set.csv');
    expect(screen.getByLabelText('Mount path for Train Set.csv')).toHaveValue('shared/train_set.csv');
    expect(screen.getByLabelText('Dataset name for b.csv')).toHaveValue('b.csv');
    expect(screen.getByRole('button', { name: 'Upload 2 files' })).toBeEnabled();
  });

  it('posts one multipart request per file reflecting the delivery controls', slow, async () => {
    render(<AssignmentDataSetsForm assignmentId={9} datasets={[]} onDatasetsChange={onDatasetsChange} />);
    dropFiles([new File(['1'], 'a.csv'), new File(['2'], 'b.csv')]);
    await screen.findByLabelText('Dataset name for a.csv');

    // Untick "include in download" → hidden=true; mounting stays on → is_active=true.
    fireEvent.click(screen.getByLabelText("Include in students' assignment download"));
    fireEvent.click(screen.getByRole('button', { name: 'Upload 2 files' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const bodies = fetchMock.mock.calls.map((c) => c[1].body as FormData);
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/assignmentDataSets/');
    expect(bodies.map((b) => b.get('name'))).toEqual(['a.csv', 'b.csv']);
    expect(bodies[0].get('assignment')).toBe('9');
    expect(bodies[0].get('mount_path')).toBe('shared/a.csv');
    expect(bodies[0].get('hidden')).toBe('true');
    expect(bodies[0].get('is_active')).toBe('true');
    expect(bodies[0].get('is_student_variant')).toBe('false');
    expect(bodies[0].get('file')).toBeInstanceOf(File);
    await waitFor(() => expect(onDatasetsChange).toHaveBeenCalled());
  });

  it('sends the variant pool flag and one shared mount path when the pool option is chosen', slow, async () => {
    render(<AssignmentDataSetsForm assignmentId={9} datasets={[]} onDatasetsChange={onDatasetsChange} />);
    dropFiles([new File(['1'], 'v1.csv'), new File(['2'], 'v2.csv')]);
    await screen.findByLabelText('Dataset name for v1.csv');

    fireEvent.click(screen.getByLabelText(/Per-student variant pool/));
    // Per-file mount paths collapse into one pool path, prefilled from the first file.
    await waitFor(() => expect(screen.queryByLabelText('Mount path for v1.csv')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Mount path (shared by every variant)')).toHaveValue('shared/v1.csv');

    fireEvent.click(screen.getByRole('button', { name: 'Upload 2 files' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const bodies = fetchMock.mock.calls.map((c) => c[1].body as FormData);
    expect(bodies.every((b) => b.get('is_student_variant') === 'true')).toBe(true);
    expect(bodies.map((b) => b.get('mount_path'))).toEqual(['shared/v1.csv', 'shared/v1.csv']);
  });

  it('keeps a failed file in the list with its error and leaves the modal open', slow, async () => {
    fetchMock.mockResolvedValueOnce(okResponse).mockResolvedValueOnce({
      ok: false,
      status: 413,
      statusText: 'Request Entity Too Large',
      json: async () => {
        throw new Error('html body');
      },
    });
    render(<AssignmentDataSetsForm assignmentId={9} datasets={[]} onDatasetsChange={onDatasetsChange} />);
    dropFiles([new File(['1'], 'ok.csv'), new File(['2'], 'big.csv')]);
    await screen.findByLabelText('Dataset name for ok.csv');

    fireEvent.click(screen.getByRole('button', { name: 'Upload 2 files' }));

    await screen.findByText('File too large for the server (limit 1 GB).');
    expect(screen.getByText('Upload datasets')).toBeInTheDocument(); // modal title still up
    expect(screen.queryByLabelText('Dataset name for ok.csv')).not.toBeInTheDocument(); // success dropped out
    expect(screen.getByLabelText('Dataset name for big.csv')).toBeInTheDocument();
    expect(onDatasetsChange).toHaveBeenCalled();
  });

  it('blocks the upload while a queued name collides with an existing dataset', slow, async () => {
    render(
      <AssignmentDataSetsForm
        assignmentId={9}
        datasets={[existing({ name: 'a.csv' })]}
        onDatasetsChange={onDatasetsChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Upload Datasets/ }));
    const modal = await waitFor(() => document.querySelector('.ant-modal') as HTMLElement);
    dropFiles([new File(['1'], 'a.csv')], modal);

    const nameInput = await screen.findByLabelText('Dataset name for a.csv');
    expect(screen.getByRole('button', { name: 'Upload 1 file' })).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: 'a2.csv' } });
    expect(screen.getByRole('button', { name: 'Upload 1 file' })).toBeEnabled();
    // The mount path tracked the rename because it was still the default for the old name.
    expect(screen.getByLabelText('Mount path for a.csv')).toHaveValue('shared/a2.csv');
  });
});

describe('AssignmentDataSetsForm download', () => {
  const fetchMock = vi.fn();
  const clickSpy = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    clickSpy.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('REACT_APP_API_URL', 'http://api.test');
    // jsdom has neither object URLs nor real anchor navigation.
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:ds'), revokeObjectURL: vi.fn() }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fetches the file with the auth token and saves it under its file name', slow, async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(['a,b']) });
    render(
      <AssignmentDataSetsForm
        assignmentId={9}
        datasets={[existing({ id: 4, name: 'housing', fileName: 'housing_v2.csv' })]}
        onDatasetsChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Download/ }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/assignmentDataSets/4/download/', {
      headers: { Authorization: 'Bearer tok' },
    });
    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('housing_v2.csv');
    expect(anchor.href).toBe('blob:ds');
  });

  it('reports a failed download instead of opening a broken tab', slow, async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ detail: 'You do not have permission.' }),
    });
    render(<AssignmentDataSetsForm assignmentId={9} datasets={[existing({ id: 4 })]} onDatasetsChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Download/ }));

    await screen.findByText(/Download failed: You do not have permission\./);
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
