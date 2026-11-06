// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
// Drives the real RubricManager + RubricUI as a grader who only has edit_unapplied_rubric_comments and
// records every write the API client is asked to make: the API refuses anything else with a 403.
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import '@testing-library/jest-dom/vitest';

const { writes, record } = vi.hoisted(() => {
  const writes: Array<{ op: string; args: any }> = [];
  const record = (op: string) =>
    vi.fn(async (args: any) => {
      writes.push({ op, args });
      return { ...(args?.rubricComment ?? {}), id: 99 };
    });
  return { writes, record };
});

const rubric = {
  rubricCategories: [
    {
      id: 1,
      name: 'Style',
      pointLimit: null,
      assignment: 11,
      rubricComments: [],
      sortKey: 0,
      helpText: '',
      atMostOnce: false,
    },
  ],
  rubricComments: [
    {
      id: 1,
      text: 'applied one',
      category: 1,
      pointDelta: -1,
      sortKey: 0,
      explanation: 'applied explanation',
      instructionText: 'applied instructions',
      templateTextOn: false,
      isApplied: true,
    },
    {
      id: 2,
      text: 'unapplied one',
      category: 1,
      pointDelta: -2,
      sortKey: 1,
      explanation: '',
      instructionText: '',
      templateTextOn: false,
      isApplied: false,
    },
  ],
};

vi.mock('../../../../../api-client/clients', () => ({
  assignmentsApi: { rubricRetrieve: vi.fn(async () => JSON.parse(JSON.stringify(rubric))) },
  commentsApi: { destroy: vi.fn(), partialUpdate: vi.fn() },
  rubricCategoriesApi: {
    create: record('category.create'),
    partialUpdate: record('category.patch'),
    destroy: record('category.delete'),
  },
  rubricCommentsApi: {
    retrieve: vi.fn(async () => ({ comments: [] })),
    feedbackScoreRetrieve: vi.fn(),
    create: record('comment.create'),
    partialUpdate: record('comment.patch'),
    destroy: record('comment.delete'),
  },
}));

import RubricManager from '../../../../core/rubric/RubricManager';
import { useRubricStore } from '../../../../../stores/useRubricStore';
import { usePermissionsStore } from '../../../../../stores/usePermissionsStore';
import RubricUI from '../RubricUI';

const assignment: any = { id: 11, course: 7, name: 'HW1', commentFeedback: false };

async function renderLimitedGrader() {
  usePermissionsStore
    .getState()
    .setCapabilities('course:7', { edit_unapplied_rubric_comments: true, edit_rubric: false });
  usePermissionsStore.getState().setCapabilities('assignment:11', {});
  render(
    <MemoryRouter>
      <RubricManager
        assignment={assignment}
        submissions={[]}
        shouldLoadFeedback={false}
        shouldLoadInstanceLists={false}
        onCancel={() => {}}
      >
        {(params: any) => (
          <RubricUI
            props={{ ...params.props, breadcrumbs: [], baseURL: 'rubrics/HW1', history: { push: vi.fn() } }}
            state={params.state}
            helpers={params.helpers}
          />
        )}
      </RubricManager>
    </MemoryRouter>,
  );
  await screen.findByText('Add Criteria');
}

const box = (text: string) =>
  screen.getAllByPlaceholderText('Enter comment text...').find((el) => (el as HTMLTextAreaElement).value === text)!;
const saveButton = () => screen.getByText('Save').closest('button')!;

describe('RubricUI writes for a grader limited to unapplied comments', () => {
  beforeEach(() => {
    writes.length = 0;
    usePermissionsStore.getState().reset();
    useRubricStore.setState({ loadComplete: false });
  });
  afterEach(cleanup);

  it('adding a comment and saving sends only a comment POST', async () => {
    await renderLimitedGrader();
    await userEvent.click(screen.getByText('Add Criteria'));
    const fresh = screen
      .getAllByPlaceholderText('Enter comment text...')
      .find((el) => (el as HTMLTextAreaElement).value === '')!;
    await userEvent.type(fresh, 'a brand new comment');
    fireEvent.blur(fresh);
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await userEvent.click(saveButton());

    await waitFor(() => expect(writes.length).toBeGreaterThan(0));
    expect(writes.map((w) => w.op)).toEqual(['comment.create']);
  });

  it('editing an unapplied comment and saving sends only a PATCH of that comment', async () => {
    await renderLimitedGrader();
    const el = box('unapplied one');
    await userEvent.type(el, ' edited');
    fireEvent.blur(el);
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await userEvent.click(saveButton());

    await waitFor(() => expect(writes.length).toBeGreaterThan(0));
    expect(writes.map((w) => w.op)).toEqual(['comment.patch']);
    expect(writes[0].args.id).toBe(2);
  });

  it('every way of editing an applied comment is inert and nothing is sent', async () => {
    await renderLimitedGrader();
    const applied = box('applied one');

    // text and points are disabled
    await userEvent.type(applied, ' nope');
    expect(applied).toBeDisabled();
    expect(applied).toHaveValue('applied one');

    // existing explanation / instructions can be read but never saved or cleared
    const card = applied.closest('div[style*="border-radius: 8px"]') as HTMLElement;
    expect(within(card).queryByText(/^(Add|Edit) (Explanation|Instructions)$/)).toBeNull();
    expect(within(card).getByText('View Explanation')).toBeInTheDocument();
    await userEvent.click(within(card).getByText('View Instructions'));
    const textarea = await screen.findByDisplayValue('applied instructions');
    expect(textarea).toHaveAttribute('readonly');
    expect(screen.queryByText('Save', { selector: '.ant-modal *' })).toBeNull();
    const template = screen.getByRole('switch');
    expect(template).toBeDisabled();
    await userEvent.click(template);

    expect(saveButton()).toBeDisabled();
    expect(writes).toEqual([]);
  });

  it('never offers a category write or any delete', async () => {
    await renderLimitedGrader();
    await userEvent.type(box('unapplied one'), ' x');
    fireEvent.blur(box('unapplied one x'));
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await userEvent.click(saveButton());
    await waitFor(() => expect(writes.length).toBeGreaterThan(0));
    expect(writes.filter((w) => w.op.startsWith('category') || w.op.endsWith('delete'))).toEqual([]);
    expect(screen.queryByLabelText(/delete/i)).toBeNull();
  });
});
