// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { ICodeConsoleState, PANEL_TYPE } from '../../../types/CodeConsole.types';
import { FileWithId } from '../../../utils/file';
import { LOCAL_SETTINGS } from '../../../components/utils/LocalSettings';

interface UseConsoleCallbacksOptions {
  setState: (updater: React.SetStateAction<ICodeConsoleState>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissionCaps: Record<string, any>;
  changeActiveComment: (id: number | undefined) => void;
}

/**
 * Bundles simple UI interaction callbacks that update store state.
 *
 * Extracted from CodeConsole to reduce its handler surface area.
 */
export function useConsoleCallbacks({ setState, submissionCaps, changeActiveComment }: UseConsoleCallbacksOptions) {
  const handleHighlightSelect = React.useCallback(
    (commentId: number, _event?: React.MouseEvent) => {
      if (commentId === 0 || commentId === Number.MAX_SAFE_INTEGER) {
        return;
      }

      if (submissionCaps.comment_on_submission) {
        changeActiveComment(commentId);
      }

      window.requestAnimationFrame(() => {
        const commentElement = document.getElementById(`comment-${commentId}`);
        commentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [changeActiveComment, submissionCaps.comment_on_submission],
  );

  const changeSelectedFile = React.useCallback(
    (fileID: number): void => {
      setState((prev) => {
        const selectedFile = (prev.files as FileWithId[]).find((file) => file.id === fileID);
        if (selectedFile) {
          LOCAL_SETTINGS.mostRecentFile.setter(selectedFile.id);
        }
        return {
          ...prev,
          selectedFile,
          activeCommentID: undefined,
          panelType: PANEL_TYPE.FILE,
          activeSiderKey: 'file-menu',
        };
      });
    },
    [setState],
  );

  const showInlineTestsModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, showInlineTestsModal: true }));
  }, [setState]);

  const hideInlineTestsModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, showInlineTestsModal: false }));
  }, [setState]);

  const toggleCustomCommentExplorer = React.useCallback(() => {
    setState((oldState) => ({
      ...oldState,
      showCustomCommentExplorer: !oldState.showCustomCommentExplorer,
    }));
  }, [setState]);

  const toggleEditRubricMode = React.useCallback(() => {
    setState((prev) => ({ ...prev, editRubricMode: !prev.editRubricMode }));
  }, [setState]);

  const setZoom = React.useCallback(
    (newZoom: number) => {
      setState((prev) => ({ ...prev, codeZoom: newZoom }));
    },
    [setState],
  );

  const setVerticalOffset = React.useCallback(
    (oldToNew: (oldValue: number) => number) => {
      setState((oldState: ICodeConsoleState) => ({
        ...oldState,
        codeVerticalOffset: oldToNew(oldState.codeVerticalOffset),
      }));
    },
    [setState],
  );

  return {
    handleHighlightSelect,
    changeSelectedFile,
    showInlineTestsModal,
    hideInlineTestsModal,
    toggleCustomCommentExplorer,
    toggleEditRubricMode,
    setZoom,
    setVerticalOffset,
  };
}
