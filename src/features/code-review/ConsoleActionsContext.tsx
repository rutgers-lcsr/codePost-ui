// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import type { CommentType, SuggestedCommentType, SubmissionSummaryType } from '../../types/models';
import type { FileType, FileWithId } from '../../utils/file';
import type { RubricComment } from '../../api-client';
import type { ExecutionResult } from '../../utils/fileExecution';
import type { CURSOR_DOMAIN } from '../../types/CodeConsole.types';
import type { PromptMeta } from './hooks/useAiAssistance';

// ─── Action groups ────────────────────────────────────────────

export interface CommentActions {
  addComment: (comment: CommentType, file: FileType) => void;
  saveComment: (comment: CommentType) => Promise<void>;
  deleteComment: (comment: CommentType) => Promise<void>;
  updateFeedback: (fileID: number, commentID: number, feedbackNum: number) => void;
  removeRubricComment: (comment: CommentType, rubricComment: RubricComment) => void;
  onRubricCommentClick: (rubricComment: RubricComment) => void;
  changeActiveComment: (id: number | undefined) => void;
}

export interface SubmissionActions {
  calculateGradeFromState: () => number | undefined;
  getPointsInFile: (file: FileWithId) => number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addLateDayCreditComment: (...args: any[]) => any;
  toggleFinalized: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateGrader: (...args: any[]) => any;
  claimSubmission: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setRubric: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitStudentQuestion: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteStudentQuestion: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateRegrade: (...args: any[]) => any;
  turnOnReload: () => void;
  turnOffReload: () => void;
}

export interface TemplateActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlePinComment: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdateCommentLocation: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleApplyTemplate: (...args: any[]) => any;
}

export interface AiActions {
  handleAcceptSuggestion: (suggestion: SuggestedCommentType) => Promise<void>;
  handleRejectSuggestion: (suggestion: SuggestedCommentType) => Promise<void>;
  handleGenerateFileSuggestions: (fileId: number) => void;
  handleGenerateSummary: () => Promise<void>;
}

export interface UiCallbacks {
  handleHighlightSelect: (commentId: number, event?: React.MouseEvent) => void;
  changeSelectedFile: (fileID: number) => void;
  showInlineTestsModal: () => void;
  hideInlineTestsModal: () => void;
  toggleCustomCommentExplorer: () => void;
  toggleEditRubricMode: () => void;
  setZoom: (zoom: number) => void;
  setVerticalOffset: (fn: (old: number) => number) => void;
  toggleCursorMode: (cursorMode: boolean) => void;
  updateCursorDomain: (domain: CURSOR_DOMAIN) => void;
}

export interface ExecutionCallbacks {
  handleExecutionComplete: (result: ExecutionResult) => void;
  handleClearOutputs: () => void;
  handleContentChange: (content: string) => void;
  handleCursorChange: (cursor: { startLine: number; endLine?: number; startChar?: number; endChar?: number } | null) => void;
  handleScrolledToComment: () => void;
}

// ─── Combined context ─────────────────────────────────────────

/**
 * Read-only state that lives outside the Zustand store.
 * Provided alongside actions so panels don't need separate contexts.
 */
export interface ConsoleSessionState {
  userEmail: string;
  inDemoMode: boolean;
  /** AI-generated suggested comments (local state in useAiAssistance) */
  suggestedComments: SuggestedCommentType[];
  isGeneratingFileSuggestions: boolean;
  suggestionsMeta: PromptMeta;
  /** AI submission summary */
  submissionSummary: SubmissionSummaryType | null;
  isGeneratingSummary: boolean;
  summaryMeta: PromptMeta;
  /** Template state (local state in CodeConsole) */
  templateRefresh: number;
  templateForceUpdates: Record<number, number>;
}

export interface ConsoleActionsContextType {
  comment: CommentActions;
  submission: SubmissionActions;
  template: TemplateActions;
  ai: AiActions;
  ui: UiCallbacks;
  execution: ExecutionCallbacks;
  /** Read-only state not in the Zustand store */
  session: ConsoleSessionState;
}

const ConsoleActionsContext = React.createContext<ConsoleActionsContextType | null>(null);

/**
 * Access console actions from any component in the code-review tree.
 * Must be called within <ConsoleActionsProvider>.
 */
export function useConsoleActions(): ConsoleActionsContextType {
  const ctx = React.useContext(ConsoleActionsContext);
  if (!ctx) {
    throw new Error('useConsoleActions must be used within <ConsoleActionsProvider>');
  }
  return ctx;
}

/**
 * Provider that makes all console action callbacks available to
 * the component tree without prop drilling.
 */
export function ConsoleActionsProvider({
  value,
  children,
}: {
  value: ConsoleActionsContextType;
  children: React.ReactNode;
}) {
  return <ConsoleActionsContext.Provider value={value}>{children}</ConsoleActionsContext.Provider>;
}
