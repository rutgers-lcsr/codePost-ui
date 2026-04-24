// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import * as React from 'react';
import { message, Modal } from 'antd';
import { commentTemplatesApi } from '../../../api-client/clients';
import type { CommentTemplateType, CommentType } from '../../../types/models';
import type { FileWithId } from '../../../utils/file';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { updateCommentsState } from '../codeConsoleUtils';
import { fileTypeRegistry } from '../formats';

type CursorSnapshot = { startLine: number; endLine?: number; startChar?: number; endChar?: number };

interface UseTemplateActionsOptions {
  userEmail: string;
  addComment: (comment: CommentType, file: FileWithId) => void;
  saveComment: (comment: CommentType) => Promise<void>;
  lastCursorRef: React.RefObject<CursorSnapshot | null>;
  setTemplateForceUpdates: React.Dispatch<React.SetStateAction<{ [id: number]: number }>>;
  setTemplateRefresh: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Encapsulates pinned comment creation, template application, and comment location updates.
 */
export function useTemplateActions({
  userEmail,
  addComment,
  saveComment,
  lastCursorRef,
  setTemplateForceUpdates,
  setTemplateRefresh,
}: UseTemplateActionsOptions) {
  const handlePinComment = React.useCallback(
    async (data: {
      text: string;
      pointDelta: number | null;
      rubricComment: number | null;
      sourceComment: number;
      startLine?: number;
    }) => {
      const s = useCodeConsoleStore.getState();
      if (!s.assignment) return;

      const selectedFile = s.selectedFile as FileWithId | undefined;
      let cellId: string | undefined;

      if (
        selectedFile &&
        fileTypeRegistry.detect(selectedFile).id === 'jupyter' &&
        data.startLine !== undefined &&
        selectedFile.data
      ) {
        try {
          const nb = JSON.parse(selectedFile.data);
          if (nb.cells && Array.isArray(nb.cells)) {
            const cell = nb.cells[data.startLine];
            if (cell) {
              cellId = cell.id || (cell.metadata ? cell.metadata.id : undefined) || undefined;
            }
          }
        } catch (e) {
          console.warn('Failed to parse notebook for cell ID', e);
        }
      }

      try {
        await commentTemplatesApi.create({
          commentTemplate: {
            text: data.text,
            isGlobal: false,
            assignment: s.assignment.id,
            pointDelta: data.pointDelta,
            rubricComment: data.rubricComment,
            sourceComment: data.sourceComment,
            cellId: cellId,
            filePath: selectedFile?.name,
          },
        });
        message.success('Comment pinned');
        setTemplateRefresh((prev) => prev + 1);
      } catch (error) {
        const detail =
          typeof error === 'object' && error !== null && 'data' in error
            ? (error as { data?: { detail?: string } }).data?.detail
            : undefined;
        if (detail) {
          message.error(`Failed to pin: ${detail}`);
        } else {
          message.error('Failed to pin comment.');
        }
      }
    },
    [setTemplateRefresh],
  );

  const handleUpdateCommentLocation = React.useCallback(
    async (
      commentId: number,
      newStartLine: number,
      newEndLine: number,
      newStartChar: number,
      newEndChar: number,
    ) => {
      const s = useCodeConsoleStore.getState();
      const fileId = (s.selectedFile as FileWithId | undefined)?.id;
      if (!fileId) return;

      const currentComments = s.comments[fileId] || [];
      const comment = currentComments.find((c) => c.id === commentId);

      if (!comment) return;

      // Don't save if position hasn't changed
      if (
        comment.startLine === newStartLine &&
        comment.endLine === newEndLine &&
        comment.startChar === newStartChar &&
        comment.endChar === newEndChar
      )
        return;

      const newComment = {
        ...comment,
        startLine: newStartLine,
        endLine: newEndLine,
        startChar: newStartChar,
        endChar: newEndChar,
      };

      // Prevent negative lines
      if (newComment.startLine < 1) return;
      if (newComment.startChar < 0) return;

      await saveComment(newComment);
      message.success('Comment updated');

      // Re-focus the comment text area after move
      requestAnimationFrame(() => {
        const textArea = document.getElementById('comment-text-area');
        textArea?.focus();
      });
    },
    [saveComment],
  );

  const handleApplyTemplate = React.useCallback(
    (template: CommentTemplateType) => {
      const s = useCodeConsoleStore.getState();
      const selectedFile = s.selectedFile as FileWithId | undefined;

      if (!selectedFile) {
        message.warning('Select a file first.');
        return;
      }

      const fileID = selectedFile.id;

      // If there's an active comment, apply template to it
      if (s.activeCommentID !== undefined) {
        const currentComments = s.comments[fileID] || [];
        const comment = currentComments.find((c) => c.id === s.activeCommentID);

        if (comment) {
          const newText = comment.text ? comment.text + '\n' + template.text : template.text;

          let newPointDelta = comment.pointDelta;
          if (template.pointDelta !== null && template.pointDelta !== undefined) {
            newPointDelta = template.pointDelta;
          }

          let newRubricComment = comment.rubricComment;
          if (template.rubricComment !== null && template.rubricComment !== undefined) {
            newRubricComment = template.rubricComment;
          }

          const newCommentsObj = updateCommentsState(s.comments, comment.id, {
            ...comment,
            text: newText,
            pointDelta: newPointDelta,
            rubricComment: newRubricComment,
          });

          useCodeConsoleStore.setState({ comments: newCommentsObj });

          setTemplateForceUpdates((prev) => ({
            ...prev,
            [comment.id]: (prev[comment.id] || 0) + 1,
          }));
          return;
        }
      }

      // No active comment - create a new comment with the template
      const existingComments = s.comments[fileID] || [];
      let targetLine: number | undefined;

      // Check if template has a Cell ID and we are in a notebook
      if (template.cellId && fileTypeRegistry.detect(selectedFile).id === 'jupyter' && selectedFile.data) {
        try {
          const nb = JSON.parse(selectedFile.data) as {
            cells?: Array<{ id?: string; metadata?: { id?: string } }>;
          };
          if (nb.cells && Array.isArray(nb.cells)) {
            const cellIndex = nb.cells.findIndex(
              (cell) => cell.id === template.cellId || (cell.metadata && cell.metadata.id === template.cellId),
            );

            if (cellIndex !== -1) {
              targetLine = cellIndex;

              const existingComment = existingComments.find((c) => c.startLine === cellIndex);
              if (existingComment) {
                Modal.confirm({
                  title: 'Overwrite existing comment?',
                  content:
                    'A comment already exists on this cell. Do you want to overwrite it with the pinned comment? Cancel to abort.',
                  onOk: async () => {
                    const updatedComment = {
                      ...existingComment,
                      text: template.text,
                      pointDelta:
                        template.pointDelta !== null && template.pointDelta !== undefined
                          ? template.pointDelta
                          : existingComment.pointDelta,
                      rubricComment:
                        template.rubricComment !== null && template.rubricComment !== undefined
                          ? template.rubricComment
                          : existingComment.rubricComment,
                    };
                    await saveComment(updatedComment);
                    message.success('Comment overwritten');
                  },
                });
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to parse notebook for cell ID', e);
        }
      }

      if (targetLine === undefined) {
        if (lastCursorRef.current !== null) {
          targetLine = lastCursorRef.current.startLine;
        }
      }

      if (targetLine === undefined) {
        const usedLines = new Set(existingComments.map((c) => c.startLine));
        targetLine = 1;
        for (let i = 1; i <= 1000; i++) {
          if (!usedLines.has(i)) {
            targetLine = i;
            break;
          }
        }
      }

      const newComment: CommentType = {
        id: s.commentCounter,
        file: fileID,
        startLine: targetLine,
        endLine: targetLine,
        startChar: 0,
        endChar: 1,
        text: template.text,
        pointDelta: template.pointDelta ?? 0,
        rubricComment: template.rubricComment ?? null,
        author: userEmail,
        feedback: 0,
        tags: [],
        color: '',
      };
      addComment(newComment, selectedFile);
      message.success('Created new comment from pinned comment');
    },
    [userEmail, addComment, saveComment, lastCursorRef, setTemplateForceUpdates],
  );

  return {
    handlePinComment,
    handleUpdateCommentLocation,
    handleApplyTemplate,
  };
}
