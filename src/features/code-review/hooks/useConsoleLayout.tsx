// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import { Empty, Tag } from 'antd';

import type { SubmissionFile } from '../../../api-client';

import { PANEL_TYPE, PERMISSION_LEVEL } from '../../../types/CodeConsole.types';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { FileWithId } from '../../../utils/file';
import type { ExecutionResult as ExecutionResultType } from '../../../utils/fileExecution';
import type { TestCaseType, SuggestedCommentType } from '../../../types/models';
import type { PromptMeta } from './useAiAssistance';
import layoutVars from '../../../styles/layout/_layoutVars';

import CPButton from '../../../components/core/CPButton';

import { StudentCode } from '../code-panel/CodeContent';
import ConnectedGradeCode from '../code-panel/ConnectedGradeCode';
import CodePanelLayout from '../code-panel/CodePanelLayout';
import { CommentHighlightProvider } from '../code-panel/CommentHighlightContext';
import { GradeComments, StudentComments } from '../code-panel/Comments';

import CursorToggle from '../../../components/core/CursorToggle';
import ThemeToggle from '../../../components/core/ThemeToggle';
import ConsoleToolbar from '../components/ConsoleToolbar';
import CustomCommentExplorer from '../components/CustomCommentExplorer';

import {
  Controls,
  DownloadCode,
  FinalizeButton,
  GradeButton,
  HeaderMenu,
  StatusTags,
  SubheaderTitle,
  ViewAsStudent,
} from '../Header';

import type { LayoutConfig } from '../sidebar/SidebarRegistry';
import { getVisiblePanels } from '../sidebar/panels';

type CursorSnapshot = { startLine: number; endLine?: number; startChar?: number; endChar?: number };

export interface UseConsoleLayoutProps {
  // User
  userEmail: string;
  userId: number;
  inDemoMode: boolean;

  // Capabilities (pre-computed from submissionCaps)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissionCaps: Record<string, any>;

  // Comment state
  comments: ReturnType<typeof useCodeConsoleStore.getState>['comments'];
  commentRubricComments: ReturnType<typeof useCodeConsoleStore.getState>['commentRubricComments'];
  activeCommentID: number | undefined;
  rubricCategories: ReturnType<typeof useCodeConsoleStore.getState>['rubricCategories'];
  rubricComments: ReturnType<typeof useCodeConsoleStore.getState>['rubricComments'];
  isCommentReadOnly: boolean;
  oldCommentIDs: { [currentID: number]: number };

  // Actions — passthrough callbacks from extracted hooks; typed loosely to avoid
  // coupling this interface to every concrete parameter type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addComment: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveComment: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteComment: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFeedback: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeRubricComment: (...args: any[]) => any;
  changeActiveComment: (id: number | undefined) => void;
  handleHighlightSelect: (commentId: number, event?: React.MouseEvent) => void;
  toggleCursorMode: (cursorMode: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleFinalized: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  claimSubmission: (...args: any[]) => any;
  calculateGradeFromState: () => number | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateCursorDomain: (...args: any[]) => any;
  toggleCustomCommentExplorer: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlePinComment: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdateCommentLocation: (...args: any[]) => any;
  handleCursorChange: (cursor: CursorSnapshot | null) => void;
  handleScrolledToComment: () => void;

  // Execution
  handleExecutionComplete: (result: ExecutionResultType) => void;
  handleClearOutputs: () => void;
  handleContentChange: (content: string) => void;

  // AI
  suggestedComments: SuggestedCommentType[];
  isGeneratingFileSuggestions: boolean;
  suggestionsMeta: PromptMeta;
  handleAcceptSuggestion: (suggestion: SuggestedCommentType) => Promise<void>;
  handleRejectSuggestion: (suggestion: SuggestedCommentType) => Promise<void>;
  handleGenerateFileSuggestions: (fileId: number) => void;

  // Template
  templateForceUpdates: Record<number, number>;

  // UI controls
  setVerticalOffset: (fn: (old: number) => number) => void;
  setZoom: (zoom: number) => void;
}

export interface ConsoleLayout {
  leftHeader: React.ReactNode[];
  middleHeader: React.ReactNode[];
  rightHeader: React.ReactNode[];
  content: React.ReactNode;
  sider: React.ReactElement[];
  siderIcons: Array<React.ComponentType<{ style?: React.CSSProperties }>>;
  siderTitles: Array<React.ReactNode | string>;
  siderTooltips: Array<React.ReactNode | string>;
  panelDefaultWidths: Record<string, number>;
}

export function useConsoleLayout(props: UseConsoleLayoutProps): ConsoleLayout | null {
  const location = useLocation();

  // Store selectors
  const permissionLevel = useCodeConsoleStore((s) => s.permissionLevel);
  const assignment = useCodeConsoleStore((s) => s.assignment);
  const selectedFile = useCodeConsoleStore((s) => s.selectedFile) as FileWithId | undefined;
  const submission = useCodeConsoleStore((s) => s.submission);
  const readOnlySubmission = useCodeConsoleStore((s) => s.readOnlySubmission);
  const graders = useCodeConsoleStore((s) => s.graders);
  const tests = useCodeConsoleStore((s) => s.tests);
  const testCases = useCodeConsoleStore((s) => s.testCases);
  const testCategories = useCodeConsoleStore((s) => s.testCategories);
  const codeZoom = useCodeConsoleStore((s) => s.codeZoom);
  const codeVerticalOffset = useCodeConsoleStore((s) => s.codeVerticalOffset);
  const isStudent = useCodeConsoleStore((s) => s.isStudent);
  const commentCounter = useCodeConsoleStore((s) => s.commentCounter);
  const cursorMode = useCodeConsoleStore((s) => s.cursorMode);
  const showCursor = useCodeConsoleStore((s) => s.showCursor);
  const showCustomCommentExplorer = useCodeConsoleStore((s) => s.showCustomCommentExplorer);
  const panelType = useCodeConsoleStore((s) => s.panelType);
  const hideGrades = useCodeConsoleStore((s) => s.hideGrades);
  const executionResults = useCodeConsoleStore((s) => s.executionResults);
  const aiEnabled = useCodeConsoleStore((s) => s.aiEnabled);
  const aiFeatureStatus = useCodeConsoleStore((s) => s.aiFeatureStatus);
  const course = useCodeConsoleStore((s) => s.course);
  const files = useCodeConsoleStore((s) => s.files) as FileWithId[];
  const fileIDs = React.useMemo(() => files.map((file) => file.id), [files]);
  const isEditMode = useCodeConsoleStore((s) => s.isEditMode);
  const wordWrap = useCodeConsoleStore((s) => s.wordWrap);
  const isDiffMode = useCodeConsoleStore((s) => s.isDiffMode);

  // Capability shortcuts
  const caps = props.submissionCaps;
  const capIsAdmin = !!caps.edit_course_settings;
  const capIsSuperGrader = !!caps.manage_global_templates;
  const capDownloadFiles = caps.download_assignment_files !== false;
  const capViewFeedback = caps.view_feedback !== false;
  const capViewRubric = caps.view_rubric !== false;
  const capCommentOnSubmission = caps.comment_on_submission !== false;
  const capViewTestResults = caps.view_test_results !== false;
  const capGenerateAiComments = caps.generate_ai_comments;

  const toolbar = (
    <ConsoleToolbar
      selectedFile={selectedFile}
      isEditMode={isEditMode}
      wordWrap={wordWrap}
      executionResults={executionResults}
      submissionCaps={caps}
      capIsAdmin={capIsAdmin}
      assignment={assignment}
      onExecutionComplete={props.handleExecutionComplete}
      onClearOutputs={props.handleClearOutputs}
    />
  );
  const toolbarWidgets: React.ReactElement[] = [toolbar];

  const controls = (
    <Controls
      key="controls"
      updateVerticalOffset={props.setVerticalOffset}
      updateZoom={props.setZoom}
      fallbackWidth={layoutVars.breakpoints.smallScreen.grade}
    />
  );

  // Precomputed values
  const hideAuthor = assignment
    ? assignment.studentsCanSeeGraders !== null
      ? !assignment.studentsCanSeeGraders
      : course
        ? !course.studentsCanSeeGraders
        : true
    : true;

  const fileSuggestedComments =
    selectedFile && aiFeatureStatus.suggested_comments !== false && capGenerateAiComments !== false
      ? props.suggestedComments.filter((s) => s.file === selectedFile.id)
      : [];

  const executionResult = selectedFile ? executionResults[selectedFile.id] || null : null;

  // ─── Build LayoutConfig ──────────────────────────────────────
  const isWrite =
    permissionLevel === PERMISSION_LEVEL.WRITE || (props.inDemoMode && permissionLevel !== PERMISSION_LEVEL.READ);
  const isRead = permissionLevel === PERMISSION_LEVEL.READ;
  const isFilesOnly = permissionLevel === PERMISSION_LEVEL.READ_FILES_ONLY;

  const config: LayoutConfig = {
    isReadOnly: !isWrite,
    isStudentView: isRead || isFilesOnly,
    isFilesOnly,
    isDemoMode: props.inDemoMode,
    canWrite: isWrite,
    isAdmin: capIsAdmin,
    isSuperGrader: capIsSuperGrader,
    showTests: capViewTestResults,
    showRubric: capViewRubric,
    showTemplates: !!assignment && capCommentOnSubmission,
    aiEnabled,
    aiFeatureStatus: aiFeatureStatus as Record<string, boolean>,
    showAiAssistance: caps.view_ai_assistance !== false,
    canTriggerAi: caps.trigger_ai_assistance !== false,
    showFeedback: capViewFeedback && !hideGrades,
    showDownload: capDownloadFiles,
    hasTestCategories: testCategories.length > 0,
  };

  // ─── NONE / NOT_FOUND early return ──────────────────────────
  if (permissionLevel === PERMISSION_LEVEL.NONE || permissionLevel === PERMISSION_LEVEL.NOT_FOUND) {
    const theme = 'light'; // safe fallback for empty state
    return {
      leftHeader: [],
      middleHeader: [],
      rightHeader: [<ThemeToggle key="theme-toggle" small={true} />, controls],
      content: (
        <Empty
          styles={{ image: { marginTop: '200px', height: '60px' } }}
          description={
            <span style={{ color: theme === 'light' ? 'black' : 'white', fontSize: 'larger' }}>
              {permissionLevel === PERMISSION_LEVEL.NOT_FOUND
                ? "Whoops! This submission doesn't exist...😔"
                : "Whoops! Looks like you don't have access to this submission...😔, If you submitted this assignment, your submission might still be under review. please check back later after its finalized!"}
            </span>
          }
        />
      ),
      sider: [],
      siderIcons: [],
      siderTitles: [],
      siderTooltips: [],
      panelDefaultWidths: {},
    };
  }

  // Demo mode without assignment — show onboarding selector only
  if (props.inDemoMode && !assignment) {
    return {
      leftHeader: [],
      middleHeader: [],
      rightHeader: [
        <CursorToggle
          key="cursor-toggle"
          toggleCursorMode={props.toggleCursorMode}
          cursorMode={cursorMode}
          small={true}
        />,
        <ThemeToggle key="theme-toggle" small={true} />,
        controls,
      ],
      content: undefined,
      sider: [],
      siderIcons: [],
      siderTitles: [],
      siderTooltips: [],
      panelDefaultWidths: {},
    };
  }

  if (!assignment) {
    return null; // signals "should not get here"
  }

  // ─── Build header ────────────────────────────────────────────

  const middleHeader: React.ReactNode[] = config.showFeedback
    ? [
        <GradeButton
          key="subheader-grade"
          assignment={assignment}
          submission={submission === undefined ? readOnlySubmission! : submission}
          calculateGrade={props.calculateGradeFromState}
          rubricCategories={props.rubricCategories}
          comments={props.comments}
          commentRubricComments={props.commentRubricComments}
          files={files}
          submissionTests={tests}
          testCases={Object.values(testCases).flat() as TestCaseType[]}
        />,
      ]
    : [];

  let leftHeader: React.ReactNode[];
  let rightHeader: React.ReactNode[];

  if (config.canWrite) {
    // Grader / admin header
    const demoSignup =
      props.inDemoMode && props.userId === -1 ? (
        <CPButton key="sign-up" cpType="primary">
          <a href="/signup/create" target="_blank">
            Sign up!
          </a>
        </CPButton>
      ) : null;

    leftHeader = [
      <HeaderMenu
        key="menu"
        claimSubmission={props.claimSubmission}
        course={course}
        assignment={assignment}
        submission={props.inDemoMode ? readOnlySubmission : submission}
      />,
      <SubheaderTitle key="subheader-title" assignment={assignment} />,
      ...(!props.inDemoMode
        ? [
            <StatusTags
              key="tag"
              assignment={assignment}
              submission={submission!}
              fallbackWidth={layoutVars.breakpoints.smallScreen.gradeHeader}
            />,
          ]
        : []),
    ];

    rightHeader = [
      demoSignup,
      <CursorToggle
        key="cursor-toggle"
        toggleCursorMode={props.toggleCursorMode}
        cursorMode={cursorMode}
        small={true}
      />,
      <ThemeToggle key="theme-toggle" small={true} />,
      ...(!props.inDemoMode && config.showDownload
        ? [<DownloadCode key="download-code" submission={submission!} />]
        : []),
      controls,
      ...(!props.inDemoMode && config.showFeedback
        ? [<ViewAsStudent key="view-as-student" pathname={location.pathname} />]
        : []),
      <FinalizeButton
        key="subheader-finalize"
        course={course!}
        submission={submission!}
        toggleFinalized={props.toggleFinalized}
        numComments={Object.values(props.comments).flat().length}
        minComments={course?.minComments ?? 0}
        canUnfinalize={true}
        isOnlyGrader={graders.length === 1}
      />,
    ].filter(Boolean);
  } else if (config.isFilesOnly) {
    // Files-only header
    leftHeader = [
      <SubheaderTitle key="subheader-title" assignment={assignment} />,
      <Tag key="files-only-notice" color="warning">
        Files Only - Feedback not yet available
      </Tag>,
    ];
    rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];
  } else {
    // Student / read-only header
    leftHeader = [
      <HeaderMenu
        key="menu"
        claimSubmission={props.claimSubmission}
        course={course}
        assignment={assignment}
        submission={readOnlySubmission}
      />,
      <SubheaderTitle key="subheader-title" assignment={assignment} />,
    ];
    rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];
  }

  // ─── Build content (code panel) — unified path ─────────────
  // All 3 modes (write, filesOnly, read) share CommentHighlightProvider + CodePanelLayout.
  // We build the inner code/comments components conditionally, then wrap once.
  const showCodePanel =
    selectedFile && (config.canWrite || config.isFilesOnly || panelType === PANEL_TYPE.FILE || !props.inDemoMode);

  let content: React.ReactNode = undefined;

  if (showCodePanel && selectedFile) {
    const fileComments = config.isFilesOnly ? [] : props.comments[selectedFile.id];

    // Code component: grader gets ConnectedGradeCode, everyone else gets StudentCode
    const code = config.canWrite
      ? (onHighlightClick: (e: React.MouseEvent) => void) => (
          <ConnectedGradeCode
            onCursorChange={props.handleCursorChange}
            onUpdateCommentLocation={props.handleUpdateCommentLocation}
            fileId={selectedFile.id}
            file={selectedFile}
            comments={props.comments[selectedFile.id]}
            readOnly={props.isCommentReadOnly}
            addComment={props.addComment}
            user={props.userEmail}
            onHighlightClick={onHighlightClick}
            commentCounter={commentCounter}
            assignmentFile={undefined}
            cursorMode={cursorMode}
            showCursor={showCursor}
            updateCursorDomain={props.updateCursorDomain}
            executionResult={executionResult}
            onClearOutputs={props.handleClearOutputs}
            isEditMode={useCodeConsoleStore.getState().isEditMode}
            isDiffMode={isDiffMode}
            onContentChange={props.handleContentChange}
          />
        )
      : (onHighlightClick: (e: React.MouseEvent) => void) => (
          <StudentCode
            file={selectedFile}
            comments={fileComments}
            readOnly={true}
            user={props.userEmail}
            onHighlightClick={config.isFilesOnly ? (_e) => {} : onHighlightClick}
            executionResult={executionResult}
            onClearOutputs={props.handleClearOutputs}
            temporaryContent={(selectedFile as SubmissionFile | undefined)?.edit?.data}
            isDiffMode={isDiffMode}
          />
        );

    // Comments panel: GradeComments for write, StudentComments for read, null for filesOnly
    const commentsPanel = config.canWrite ? (
      <GradeComments
        isStudent={isStudent}
        showExplanations={true}
        comments={props.comments[selectedFile.id]}
        rubricComments={props.commentRubricComments}
        readOnly={props.isCommentReadOnly}
        file={selectedFile}
        fileIDs={fileIDs}
        activeCommentID={props.activeCommentID}
        changeActive={props.changeActiveComment}
        deleteComment={props.deleteComment}
        saveComment={props.saveComment}
        removeRubricComment={props.removeRubricComment}
        oldCommentIDs={props.oldCommentIDs}
        verticalOffset={codeVerticalOffset}
        updateFeedback={props.updateFeedback.bind(null, selectedFile.id)}
        studentFeedbackOn={assignment.commentFeedback ?? false}
        hideAuthor={hideAuthor}
        additiveGrading={assignment.additiveGrading ?? false}
        forcedRubricMode={assignment.forcedRubricMode ?? false}
        rubricCategories={props.rubricCategories}
        {...(!props.inDemoMode
          ? {
              allRubricComments: Object.values(props.rubricComments).flat(),
              scrollToCommentID: parseInt(queryString.parse(location.search).comment as string),
              onScrolledToComment: props.handleScrolledToComment,
            }
          : {})}
        showCursor={showCursor}
        aiEnabled={aiEnabled && aiFeatureStatus.comment_generation !== false && capGenerateAiComments !== false}
        onPin={props.handlePinComment}
        forcedUpdates={props.templateForceUpdates}
        suggestedComments={fileSuggestedComments}
        onAcceptSuggestion={props.handleAcceptSuggestion}
        onRejectSuggestion={props.handleRejectSuggestion}
        onGenerateFileSuggestions={
          aiFeatureStatus.suggested_comments !== false && capGenerateAiComments !== false
            ? async () => props.handleGenerateFileSuggestions(selectedFile.id)
            : undefined
        }
        isGeneratingFileSuggestions={props.isGeneratingFileSuggestions}
        suggestionsMeta={props.suggestionsMeta}
      />
    ) : config.isFilesOnly ? null : (
      <StudentComments
        isStudent={isStudent}
        comments={props.comments[selectedFile.id]}
        rubricComments={props.commentRubricComments}
        file={selectedFile}
        fileIDs={fileIDs}
        verticalOffset={codeVerticalOffset}
        updateFeedback={props.updateFeedback.bind(null, selectedFile.id)}
        studentFeedbackOn={assignment.commentFeedback ?? false}
        hideAuthor={hideAuthor}
        additiveGrading={false}
        rubricCategories={props.rubricCategories}
        {...(!props.inDemoMode
          ? {
              scrollToCommentID: parseInt(queryString.parse(location.search).comment as string),
              onScrolledToComment: props.handleScrolledToComment,
            }
          : {})}
      />
    );

    content = (
      <div style={{ height: '100%' }}>
        <CommentHighlightProvider
          file={selectedFile}
          comments={fileComments}
          suggestions={config.canWrite && !props.inDemoMode ? fileSuggestedComments : undefined}
          readOnly={config.canWrite ? props.isCommentReadOnly : true}
          user={props.userEmail}
          onHighlightClick={(_e: React.MouseEvent) => {}}
          addComment={config.canWrite ? props.addComment : undefined}
          onHighlightSelect={config.isFilesOnly ? (_sel) => {} : props.handleHighlightSelect}
          focusedCommentId={config.isFilesOnly ? undefined : props.activeCommentID}
        >
          <CodePanelLayout
            comments={commentsPanel}
            code={code}
            toolbarWidgets={toolbarWidgets}
            file={selectedFile}
            zoom={codeZoom}
            updateVerticalOffset={props.setVerticalOffset}
            isEditMode={config.canWrite ? useCodeConsoleStore.getState().isEditMode : undefined}
            isDiffMode={isDiffMode}
          />
        </CommentHighlightProvider>
        {config.canWrite && !props.inDemoMode && (
          <CustomCommentExplorer
            graders={graders}
            user={props.userEmail}
            isAdmin={capIsAdmin}
            assignment={assignment}
            rubricComments={Object.values(props.rubricComments).flat()}
            rubricCategories={props.rubricCategories}
            open={showCustomCommentExplorer}
            onCancel={props.toggleCustomCommentExplorer}
          />
        )}
      </div>
    );
  }

  // ─── Build sidebar panels via registry ───────────────────────
  // Panels are now self-contained components that read from
  // useCodeConsoleStore + ConsoleActionsContext directly.
  // Only the LayoutConfig is needed to build definitions.
  const visiblePanels = getVisiblePanels(config);

  const sider = visiblePanels.map((p) => React.cloneElement(p.render(), { key: p.key }));
  const siderIcons = visiblePanels.map((p) => p.icon);
  const siderTitles = visiblePanels.map((p) => p.title);
  const siderTooltips = visiblePanels.map((p) => p.tooltip);
  const panelDefaultWidths: Record<string, number> = {};
  for (const p of visiblePanels) {
    if (p.defaultWidth) {
      panelDefaultWidths[p.key] = p.defaultWidth;
    }
  }

  return {
    leftHeader,
    middleHeader,
    rightHeader,
    content,
    sider,
    siderIcons,
    siderTitles,
    siderTooltips,
    panelDefaultWidths,
  };
}
