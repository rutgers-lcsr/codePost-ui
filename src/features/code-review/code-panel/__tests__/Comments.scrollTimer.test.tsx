// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Comments from '../Comments';
import { CommentHighlightProvider } from '../CommentHighlightContext';

// Opening a `?comment=<id>` link scrolls to that comment, then (1s later) calls
// onScrolledToComment, which strips the param with a navigate() relative to the console route.
// If the console unmounts first (the grader leaves within a second), that late call would send
// them straight back to /code/:id.
const FILE = { id: 1, name: 'main.py', code: 'print(1)\n', comments: [] };

const renderComments = (onScrolledToComment: () => void) =>
  render(
    <CommentHighlightProvider
      file={FILE as never}
      comments={[]}
      readOnly
      user="grader@x.edu"
      onHighlightClick={vi.fn()}
    >
      <Comments {...props(onScrolledToComment)} />
    </CommentHighlightProvider>,
  );

const props = (onScrolledToComment: () => void) =>
  ({
    additiveGrading: false,
    comments: [],
    rubricComments: {},
    file: FILE,
    fileIDs: [1],
    verticalOffset: 0,
    isStudent: false,
    updateFeedback: vi.fn(),
    studentFeedbackOn: false,
    hideAuthor: false,
    rubricCategories: [],
    scrollToCommentID: 5,
    onScrolledToComment,
    readOnly: true,
    changeActive: vi.fn(),
    saveComment: vi.fn(),
    deleteComment: vi.fn(),
    removeRubricComment: vi.fn(),
    forcedRubricMode: false,
    oldCommentIDs: {},
    showCursor: 0,
    showExplanations: false,
  }) as never;

describe('Comments scroll-to-comment callback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the scroll once when the console stays open', () => {
    const onScrolled = vi.fn();
    renderComments(onScrolled);
    vi.advanceTimersByTime(1000);
    expect(onScrolled).toHaveBeenCalledTimes(1);
  });

  it('does not report it after the console has unmounted', () => {
    const onScrolled = vi.fn();
    const { unmount } = renderComments(onScrolled);
    unmount();
    vi.advanceTimersByTime(1000);
    expect(onScrolled).not.toHaveBeenCalled();
  });
});
