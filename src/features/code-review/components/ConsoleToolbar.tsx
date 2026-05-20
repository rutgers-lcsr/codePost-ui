// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import * as React from 'react';
import { Button, Tooltip } from 'antd';
import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { submissionKeys } from '../../../lib/queryKeys';
import { Submission as SubmissionService } from '../../../services/submission';
import type { SubmissionConsoleData, SubmissionFile, SubmissionFileEdit } from '../../../api-client';
import { fileTypeRegistry } from '../formats';
import { brandColors } from '../../../theme/colors';
import ExecuteFileButton from './ExecuteFileButton';
import type { FileWithId } from '../../../utils/file';
import type { ExecutionResult } from '../../../utils/fileExecution';
import type { ICodeConsoleState } from '../../../types/CodeConsole.types';
import type { Capabilities } from '../../../stores/usePermissionsStore';

interface ConsoleToolbarProps {
  selectedFile: FileWithId | undefined;
  isEditMode: boolean;
  wordWrap: boolean;
  executionResults: ICodeConsoleState['executionResults'];
  submissionCaps: Capabilities;
  capIsAdmin: boolean;
  assignment: { gradersCanEditSubmissions?: boolean | null } | undefined;
  onExecutionComplete: (result: ExecutionResult) => void;
  onClearOutputs: () => void;
}

/**
 * Toolbar rendered above the code panel with edit toggle, execute button,
 * clear outputs, and word wrap controls.
 */
const ConsoleToolbar: React.FC<ConsoleToolbarProps> = ({
  selectedFile,
  isEditMode,
  wordWrap,
  executionResults,
  submissionCaps,
  capIsAdmin,
  assignment,
  onExecutionComplete,
  onClearOutputs,
}) => {
  const context = React.useContext(ConsoleThemeContext);
  const queryClient = useQueryClient();
  const isDark = consoleThemes.dark === context.consoleTheme;
  const currentTheme = context.consoleTheme;
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  const leftActions: React.ReactElement[] = [];
  const rightActions: React.ReactElement[] = [];

  const isDiffMode = useCodeConsoleStore((s) => s.isDiffMode);
  const currentSubmissionId = useCodeConsoleStore((s) => s.submission?.id ?? s.readOnlySubmission?.id);
  const selectedSubmissionFile = selectedFile as SubmissionFile | undefined;
  const hasSavedInstructorEdit = selectedSubmissionFile?.edit?.data !== undefined;
  const canEditSubmission =
    !!submissionCaps.grade_submission && (capIsAdmin || !!assignment?.gradersCanEditSubmissions);

  const handleSaveEdit = React.useCallback(async () => {
    if (!selectedFile || !currentSubmissionId) {
      return;
    }

    const content = useCodeConsoleStore.getState().temporaryFileContent[selectedFile.id] ?? selectedFile.data ?? '';

    setIsSavingEdit(true);
    try {
      const savedEdit = await SubmissionService.saveInstructorEdit(currentSubmissionId, selectedFile.id, content);

      queryClient.setQueryData(
        submissionKeys.consoleData(currentSubmissionId),
        (old: SubmissionConsoleData | undefined) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            files: old.files.map((file) =>
              file.id === selectedFile.id
                ? { ...file, edit: savedEdit as SubmissionFileEdit }
                : file,
            ),
          };
        },
      );

      useCodeConsoleStore.getState().setTemporaryFileContent(selectedFile.id, content);
    } finally {
      setIsSavingEdit(false);
    }
  }, [currentSubmissionId, queryClient, selectedFile]);

  const handleToggleEditMode = React.useCallback(() => {
    if (!selectedFile) {
      useCodeConsoleStore.getState().setIsEditMode(!isEditMode);
      return;
    }

    const store = useCodeConsoleStore.getState();
    if (!isEditMode && store.temporaryFileContent[selectedFile.id] === undefined) {
      store.setTemporaryFileContent(
        selectedFile.id,
        selectedSubmissionFile?.edit?.data ?? selectedFile.data ?? '',
      );
    }

    if (isEditMode) {
      store.setIsDiffMode(false);
    }
    store.setIsEditMode(!isEditMode);
  }, [isEditMode, selectedFile, selectedSubmissionFile?.edit?.data]);

  // Track whether edit mode was already active before diff turned it on,
  // so we can restore the prior state when diff is toggled off.
  const editWasActiveBeforeDiff = React.useRef(false);

  const handleToggleDiffMode = React.useCallback(() => {
    const store = useCodeConsoleStore.getState();
    const nextIsDiffMode = !store.isDiffMode;

    if (nextIsDiffMode && canEditSubmission && !store.isEditMode && selectedFile) {
      // Entering diff mode and edit was NOT already on — auto-enable edit mode
      editWasActiveBeforeDiff.current = false;
      if (store.temporaryFileContent[selectedFile.id] === undefined) {
        store.setTemporaryFileContent(
          selectedFile.id,
          selectedSubmissionFile?.edit?.data ?? selectedFile.data ?? '',
        );
      }
      store.setIsEditMode(true);
    } else if (nextIsDiffMode && store.isEditMode) {
      // Entering diff mode and edit was already on — remember that
      editWasActiveBeforeDiff.current = true;
    }

    if (!nextIsDiffMode && canEditSubmission && store.isEditMode && !editWasActiveBeforeDiff.current) {
      // Leaving diff mode and we auto-enabled edit — turn it back off
      store.setIsEditMode(false);
    }

    store.setIsDiffMode(nextIsDiffMode);
  }, [canEditSubmission, selectedFile, selectedSubmissionFile?.edit?.data]);

  const tbBtnBase: React.CSSProperties = {
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    fontSize: 12,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const tbDivider = (key: string) => (
    <div
      key={key}
      style={{
        width: 1,
        height: 16,
        backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  );

  if (selectedFile) {
    const ext = selectedFile.extension.toLowerCase().replace(/^\./, '');

    if (fileTypeRegistry.isExecutableExtension(ext)) {
      if (canEditSubmission) {
        leftActions.push(
          <Tooltip key="edit-toggle" title={isEditMode ? 'Exit edit mode' : 'Edit file'} placement="bottom">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={handleToggleEditMode}
              style={{
                ...tbBtnBase,
                padding: '0 10px',
                gap: 4,
                color: isEditMode ? '#fff' : isDark ? currentTheme.text : undefined,
                backgroundColor: isEditMode
                  ? brandColors.primary
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 500 }}>{isEditMode ? 'Editing' : 'Edit'}</span>
            </Button>
          </Tooltip>,
        );

        if (isEditMode && currentSubmissionId) {
          leftActions.push(
            <Tooltip key="save-edit" title="Save edit for students" placement="bottom">
              <Button
                type="text"
                size="small"
                icon={<SaveOutlined />}
                loading={isSavingEdit}
                onClick={() => void handleSaveEdit()}
                style={{
                  ...tbBtnBase,
                  padding: '0 10px',
                  gap: 4,
                  color: '#fff',
                  backgroundColor: brandColors.primary,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500 }}>Save</span>
              </Button>
            </Tooltip>,
          );
          leftActions.push(tbDivider('div-save-edit'));
        }
      }

      if (hasSavedInstructorEdit || (canEditSubmission && isEditMode)) {
        leftActions.push(
          <Tooltip key="diff-toggle" title={isDiffMode ? 'Hide changes' : 'Show changes'} placement="bottom">
            <Button
              type="text"
              size="small"
              onClick={handleToggleDiffMode}
              style={{
                ...tbBtnBase,
                padding: '0 10px',
                gap: 4,
                color: isDiffMode ? '#fff' : isDark ? currentTheme.text : undefined,
                backgroundColor: isDiffMode
                  ? brandColors.primary
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 500 }}>{isDiffMode ? 'Comparing' : 'Diff'}</span>
            </Button>
          </Tooltip>,
        );
        leftActions.push(tbDivider('div-diff'));
      }

      if (canEditSubmission) {
        leftActions.push(tbDivider('div-edit'));
      }

      // Execute button
      leftActions.push(
        <ExecuteFileButton
          key="execute-file-button"
          file={selectedFile}
          disabled={false}
          onExecutionComplete={onExecutionComplete}
          canWrite={submissionCaps.run_code === true}
          codeOverride={
            isEditMode && selectedFile
              ? useCodeConsoleStore.getState().temporaryFileContent[selectedFile.id]
              : undefined
          }
        />,
      );

      // Clear outputs — right side
      const executionResult = executionResults[selectedFile.id];
      const selectedFileType = fileTypeRegistry.detect(selectedFile);
      if (selectedFileType.capabilities.clearableOutputs && executionResult) {
        rightActions.push(
          <Tooltip key="execution-clear-button" title="Clear execution outputs" placement="bottom">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined style={{ fontSize: 13 }} />}
              onClick={onClearOutputs}
              style={{
                ...tbBtnBase,
                padding: '0 6px',
                color: isDark ? '#f5827a' : '#ff4d4f',
              }}
            />
          </Tooltip>,
        );
      }
    }

    // Word wrap toggle
    const selectedFileType = fileTypeRegistry.detect(selectedFile);
    if (selectedFileType.capabilities.wordWrap) {
      rightActions.push(
        <Tooltip key="word-wrap-toggle" title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'} placement="bottom">
          <Button
            type="text"
            size="small"
            onClick={() => useCodeConsoleStore.getState().setWordWrap(!wordWrap)}
            style={{
              ...tbBtnBase,
              padding: '0 6px',
              color: wordWrap ? brandColors.primary : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
              backgroundColor: wordWrap
                ? isDark
                  ? 'rgba(25, 134, 101, 0.15)'
                  : 'rgba(25, 134, 101, 0.08)'
                : undefined,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
            >
              <path
                d="M2 3h12M2 7h9.5a2.5 2.5 0 0 1 0 5H10m0 0 1.5-1.5M10 12l1.5 1.5M2 11h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </Tooltip>,
      );
    }
  }

  if (leftActions.length === 0 && rightActions.length === 0) {
    return null;
  }

  return (
    <div
      key="toolbar-layout"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{leftActions}</div>
      {rightActions.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{rightActions}</div>}
    </div>
  );
};

export default React.memo(ConsoleToolbar);
