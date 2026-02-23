// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import RubricCategoryManager, {
  IRubricCategoryManagerParams,
  IRubricCategoryManagerProps,
} from '../RubricCategoryManager';
import { describe, it, expect, vi } from 'vitest';

describe('RubricCategoryManager', () => {
  const baseCategory = {
    id: 1,
    name: 'Original name',
    pointLimit: null,
    assignment: 123,
    rubricComments: [],
    sortKey: 0,
    helpText: '',
    atMostOnce: false,
  };

  const defaultProps: IRubricCategoryManagerProps = {
    rubricCategory: baseCategory,
    rubricComments: [],
    savedRubricCategory: baseCategory,
    savedRubricComments: [],
    index: 0,
    numCategories: 1,
    instanceLists: {},
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    moveCategory: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
    updateComment: vi.fn(),
    activateCommentExplorer: vi.fn(),
    onEdit: vi.fn(),
    onUndo: vi.fn(),
    onCommentEdit: vi.fn(),
    onCommentUndo: vi.fn(),
    onCommentDragEnd: vi.fn(),
    otherCategories: [],
    commentFeedbackOn: false,
    showPointLimits: true,
    showHelpText: true,
    showExplanations: true,
    showInstructions: true,
    showAtMostOnce: true,
    windowwidth: 1000,
    windowheight: 800,
    children: () => null,
  };

  it('calls onEdit when category values change', async () => {
    const onEdit = vi.fn();
    const props = { ...defaultProps, onEdit };

    render(
      <RubricCategoryManager {...props}>
        {({ helperz }: IRubricCategoryManagerParams) => {
          React.useEffect(() => {
            helperz.changeName('Updated name');
          }, [helperz]);
          return null;
        }}
      </RubricCategoryManager>,
    );

    await waitFor(() => {
      expect(onEdit).toHaveBeenCalled();
    });
  });

  it('calls onCommentEdit when a rubric comment changes', async () => {
    const baseComment = {
      id: 42,
      text: 'Original comment',
      pointDelta: 0,
      category: baseCategory.id,
      comments: [],
      sortKey: 0,
      explanation: '',
      instructionText: '',
      templateTextOn: false,
    };

    const onCommentEdit = vi.fn();
    const props: IRubricCategoryManagerProps = {
      ...defaultProps,
      rubricComments: [baseComment],
      savedRubricComments: [baseComment],
      onCommentEdit,
    };

    render(
      <RubricCategoryManager {...props}>
        {({ helperz }: IRubricCategoryManagerParams) => {
          React.useEffect(() => {
            helperz.updateRubricComment(baseComment.id, 'text', { target: { value: 'Updated comment' } });
          }, [helperz]);
          return null;
        }}
      </RubricCategoryManager>,
    );

    await waitFor(() => {
      expect(onCommentEdit).toHaveBeenCalled();
    });
  });
});
