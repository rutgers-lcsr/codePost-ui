// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import '@testing-library/jest-dom/vitest';

import RubricUI from '../RubricUI';
import { usePermissionsStore, type Capabilities } from '../../../../../stores/usePermissionsStore';

const COURSE_ID = 7;
const ASSIGNMENT_ID = 11;

const category = {
  id: 1,
  name: 'Style',
  pointLimit: null,
  assignment: ASSIGNMENT_ID,
  rubricComments: [],
  sortKey: 0,
  helpText: '',
  atMostOnce: false,
};

const comment = (id: number, text: string, isApplied: boolean | null | undefined) => ({
  id,
  text,
  category: 1,
  pointDelta: -1,
  sortKey: id,
  explanation: '',
  instructionText: '',
  templateTextOn: false,
  isApplied,
});

const comments = [comment(1, 'applied one', true), comment(2, 'unapplied one', false), comment(-1, 'brand new', undefined)];

function buildProps(): { props: any; state: any; helpers: any } {
  const savedComments = { 1: comments };
  return {
    props: {
      assignment: { id: ASSIGNMENT_ID, course: COURSE_ID, name: 'HW1', commentFeedback: false },
      submissions: [],
      breadcrumbs: [],
      baseURL: 'rubrics/HW1',
      history: { push: vi.fn() },
    },
    state: {
      loadComplete: true,
      changeLock: false,
      isSaving: false,
      errorObjects: [],
      unsavedComments: [],
      deletedComments: [],
      unsavedCategories: [],
      deletedCategories: [],
      hasMoved: false,
      activeComment: undefined,
      linkedComments: [],
      resolutions: {},
      confirmedPropagation: false,
      showConfirmDialog: false,
      rubricCategories: [category],
      rubricComments: savedComments,
      savedRubricCategories: [category],
      savedRubricComments: savedComments,
      newObjectCounter: 0,
      feedbackScores: undefined,
      instanceLists: { 1: [], 2: [], [-1]: [] },
    },
    helpers: new Proxy({ changesMade: () => false }, { get: (t: any, k) => t[k] ?? vi.fn() }),
  };
}

function seed(course: Capabilities, assignment: Capabilities = {}) {
  usePermissionsStore.getState().setCapabilities(`course:${COURSE_ID}`, course);
  usePermissionsStore.getState().setCapabilities(`assignment:${ASSIGNMENT_ID}`, assignment);
}

function renderUI() {
  const { props, state, helpers } = buildProps();
  return render(
    <MemoryRouter>
      <RubricUI props={props} state={state} helpers={helpers} />
    </MemoryRouter>,
  );
}

/** The visible comment textarea holding `text` (antd also renders a hidden measuring textarea). */
const box = (text: string) =>
  screen.getAllByPlaceholderText('Enter comment text...').find((el) => (el as HTMLTextAreaElement).value === text)!;
const card = (text: string) => box(text).closest('div[style*="border-radius: 8px"]') as HTMLElement;

describe('RubricUI capabilities', () => {
  beforeEach(() => usePermissionsStore.getState().reset());
  afterEach(cleanup);

  it('limited grader: can add, edits only unapplied comments, no delete or category controls', () => {
    seed({ edit_unapplied_rubric_comments: true, edit_rubric: false });
    renderUI();

    expect(screen.getByText('Add Criteria')).toBeInTheDocument();

    expect(box('applied one')).toBeDisabled();
    expect(box('unapplied one')).toBeEnabled();
    expect(box('brand new')).toBeEnabled();
    expect(within(card('applied one')).getByLabelText(/already used in grading/i)).toBeInTheDocument();
    expect(within(card('unapplied one')).queryByLabelText(/already used in grading/i)).toBeNull();

    expect(screen.queryByLabelText(/delete/i)).toBeNull();
    expect(screen.queryByLabelText(/add new category/i)).toBeNull();
    expect(screen.queryByText(/create (a )?category/i)).toBeNull();
    expect(screen.getByPlaceholderText('Category Name')).toBeDisabled();
  });

  it('limited grader: a null isApplied (unknown) is read-only', () => {
    seed({ edit_unapplied_rubric_comments: true });
    const { props, state, helpers } = buildProps();
    state.rubricComments = { 1: [comment(3, 'unknown one', null)] };
    state.savedRubricComments = state.rubricComments;
    render(
      <MemoryRouter>
        <RubricUI props={props} state={state} helpers={helpers} />
      </MemoryRouter>,
    );
    expect(box('unknown one')).toBeDisabled();
  });

  it('edit_rubric holder keeps every control', () => {
    seed({ edit_unapplied_rubric_comments: true, edit_rubric: true });
    renderUI();

    expect(screen.getByText('Add Criteria')).toBeInTheDocument();
    expect(box('applied one')).toBeEnabled();
    expect(screen.getAllByLabelText(/delete/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/add new category/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Category Name')).toBeEnabled();
    expect(screen.queryByLabelText(/already used in grading/i)).toBeNull();
  });

  it('collaborative rubric (assignment edit_rubric) keeps full controls for a limited course role', () => {
    seed({ edit_unapplied_rubric_comments: true, edit_rubric: false }, { edit_rubric: true });
    renderUI();

    expect(box('applied one')).toBeEnabled();
    expect(screen.getAllByLabelText(/delete/i).length).toBeGreaterThan(0);
  });

  it('no capability loaded (e.g. admin console before fetch): unchanged full controls', () => {
    seed({});
    renderUI();
    expect(box('applied one')).toBeEnabled();
    expect(screen.getAllByLabelText(/delete/i).length).toBeGreaterThan(0);
  });
});
