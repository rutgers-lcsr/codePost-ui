// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';
import {
  ICodeConsoleProps,
  ICodeConsoleState,
  PANEL_TYPE,
  PERMISSION_LEVEL,
} from '../../types/CodeConsole.types';
import { getStoreSnapshot, useCodeConsoleStore } from '../../stores/useCodeConsoleStore';
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Empty, Tag } from 'antd';
import flatten from 'lodash/flatten';
import debounce from 'lodash/debounce';
import queryString from 'query-string';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

/* codePost imports */
import Loading from '../../components/core/Loading';

import {
  Assignment,
} from '../../types/common';



import { usePrefetchNextSubmission } from './hooks/usePrefetchNextSubmission';
import { usePrefetchFileRenderers } from './hooks/usePrefetchFileRenderers';
import { useCommentActions } from './hooks/useCommentActions';
import { useAiAssistance } from './hooks/useAiAssistance';
import { useConsoleHotkeys } from './hooks/useConsoleHotkeys';
import { useSubmissionActions } from './hooks/useSubmissionActions';
import { useTemplateActions } from './hooks/useTemplateActions';
import { useConsoleLoader } from './hooks/useConsoleLoader';
import type {
  TestCaseType,
} from '../../types/models';
import { FileWithId } from '../../utils/file';
import type { ExecutionResult } from '../../utils/fileExecution';
import { usePermissionsStore, selectCaps } from '../../stores/usePermissionsStore';
import { EMPTY_CAPS } from '../../stores/usePermissionsStore';
import { useShallow } from 'zustand/react/shallow';

type CursorSnapshot = { startLine: number; endLine?: number; startChar?: number; endChar?: number };
type RubricMenuUIProps = React.ComponentProps<typeof RubricMenuUI>['props'];

import CPButton from '../../components/core/CPButton';
import CPFlex from '../../components/core/CPFlex';
import StandardConsoleLayout from '../../components/core/layouts/StandardConsoleLayout';

import { GradeCode, StudentCode } from './code-panel/CodeContent';
import CodePanelLayout from './code-panel/CodePanelLayout';
import { CommentHighlightProvider } from './code-panel/CommentHighlightContext';
import { GradeComments, StudentComments } from './code-panel/Comments';
import ConsoleToolbar from './components/ConsoleToolbar';

import CursorToggle from '../../components/core/CursorToggle';
import ThemeToggle from '../../components/core/ThemeToggle';

import FileMenu, { FileMenuTitle, FileMenuTooltip } from './menu/FileMenu';
import HelpModal from './menu/HelpModal';
import TemplateMenu, { PinnedCommentsTooltip } from './menu/TemplateMenu';

const RubricMenuUI = React.lazy(() => import('./menu/RubricMenuUI'));

import InlineTestsModal from './components/InlineTestsModal';

import { ReadOnlySubmissionInfo, SubmissionInfo, SubmissionInfoTooltip } from './menu/SubmissionInfoMenu';
import SubmissionSummaryPanel, { SubmissionSummaryTooltip } from './menu/SubmissionSummaryPanel';
import ABComparisonModal from '../../components/core/ABComparisonModal';

import layoutVars from '../../styles/layout/_layoutVars';


import { LOCAL_SETTINGS } from '../../components/utils/LocalSettings';



import {
  Controls,
  DownloadCode,
  FinalizeButton,
  GradeButton,
  HeaderMenu,
  StatusTags,
  SubheaderTitle,
  ViewAsStudent,
} from './Header';

import { CodeConsoleOnboardingSelector } from '../../components/core/OnboardingSelector';

import { getDemoPinnedTemplates } from './demo';
import DemoBanner from './DemoBanner';
import { CODE_DEMO } from '../../routes';

import RubricManager, { IRubricManagerParams, RubricTooltip } from '../../components/core/rubric/RubricManager';

import TestsMenu, { TestsMenuTooltip } from './menu/TestsMenu';

import { CourseContext, defaultCourse } from '../../components/core/Contexts';

import CustomCommentExplorer from './components/CustomCommentExplorer';

/**********************************************************************************************************************/

/* f(logged in user, submission) */

/**
 * Connected wrapper for GradeCode to isolate high-frequency updates
 */
const ConnectedGradeCode = React.memo((props: React.ComponentProps<typeof GradeCode> & { fileId: number }) => {
  const temporaryContent = useCodeConsoleStore((s) => s.temporaryFileContent[props.fileId]);
  return <GradeCode {...props} temporaryContent={temporaryContent} />;
});

/**
 * Connected wrapper for TestsMenu to isolate high-frequency updates
 */
const ConnectedTestsMenu = React.memo((props: React.ComponentProps<typeof TestsMenu>) => {
  const temporaryFileContent = useCodeConsoleStore((s) => s.temporaryFileContent);
  const isEditMode = useCodeConsoleStore((s) => s.isEditMode);
  return <TestsMenu {...props} fileOverrides={isEditMode ? temporaryFileContent : undefined} />;
});

const CodeConsole: React.FC<ICodeConsoleProps> = (props) => {
  /***********************************************************************************************/
  /* Static Methods - Now imported from codeConsoleUtils (can be used as utility functions)
	/***********************************************************************************************/

  // Note: Static methods have been extracted to codeConsoleUtils.ts
  // They can be imported and used directly: addCommentToState, removeCommentFromState, etc.

  /***********************************************************************************************/
  /* Hooks and State
	/***********************************************************************************************/

  const context = React.useContext(ConsoleThemeContext);
  /* hooks */
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ submissionId?: string }>();
  const [templateForceUpdates, setTemplateForceUpdates] = React.useState<{ [id: number]: number }>({});
  const [templateRefresh, setTemplateRefresh] = React.useState(0);

  // Refs for intervals (replacing instance variables)
  const checkNewFilesInterval = React.useRef<number | undefined>(undefined);
  const reloadCommentsInterval = React.useRef<number | undefined>(undefined);
  const lastCursorRef = React.useRef<CursorSnapshot | null>(null);
  // Note: LIVE_FEEDBACK_*_RELOAD_INTERVAL constants removed as live feedback features are deprecated

  // State management - now uses Zustand store
  // Import useCodeConsoleStore and use getState() for sync access

  // Granular Selectors - Optimization Phase 4
  const files = useCodeConsoleStore((s) => s.files) as FileWithId[];
  const fileIDs = React.useMemo(() => files.map((file) => file.id), [files]);
  const permissionLevel = useCodeConsoleStore((s) => s.permissionLevel);
  const assignment = useCodeConsoleStore((s) => s.assignment);
  const selectedFile = useCodeConsoleStore((s) => s.selectedFile) as FileWithId | undefined;
  const submission = useCodeConsoleStore((s) => s.submission);
  const readOnlySubmission = useCodeConsoleStore((s) => s.readOnlySubmission);
  const graders = useCodeConsoleStore((s) => s.graders);
  const isLoading = useCodeConsoleStore((s) => s.isLoading);
  const tests = useCodeConsoleStore((s) => s.tests);
  const testCases = useCodeConsoleStore((s) => s.testCases);
  const testCategories = useCodeConsoleStore((s) => s.testCategories);
  const inlineTestsModalVisible = useCodeConsoleStore((s) => s.showInlineTestsModal);
  const oldCommentIDs = useCodeConsoleStore((s) => s.oldCommentIDs);
  const codeZoom = useCodeConsoleStore((s) => s.codeZoom);
  const codeVerticalOffset = useCodeConsoleStore((s) => s.codeVerticalOffset);
  const isStudent = useCodeConsoleStore((s) => s.isStudent);
  const editRubricMode = useCodeConsoleStore((s) => s.editRubricMode);
  const commentCounter = useCodeConsoleStore((s) => s.commentCounter);
  const rubricReload = useCodeConsoleStore((s) => s.rubricReload);
  const cursorMode = useCodeConsoleStore((s) => s.cursorMode);
  const showCursor = useCodeConsoleStore((s) => s.showCursor);
  const showCustomCommentExplorer = useCodeConsoleStore((s) => s.showCustomCommentExplorer);
  const panelType = useCodeConsoleStore((s) => s.panelType);
  const hideGrades = useCodeConsoleStore((s) => s.hideGrades);
  const executionResults = useCodeConsoleStore((s) => s.executionResults);
  const aiEnabled = useCodeConsoleStore((s) => s.aiEnabled);
  const aiFeatureStatus = useCodeConsoleStore((s) => s.aiFeatureStatus);
  const course = useCodeConsoleStore((s) => s.course);
  const noSave = useCodeConsoleStore((s) => s.noSave);
  const activeSiderKey = useCodeConsoleStore((s) => s.activeSiderKey);
  const isEditMode = useCodeConsoleStore((s) => s.isEditMode);
  const wordWrap = useCodeConsoleStore((s) => s.wordWrap);

  // Capabilities from the permissions store (populated during mount via checkPermission)
  const submissionId = params.submissionId ? +params.submissionId : undefined;
  const submissionCaps = usePermissionsStore(
    useShallow((s) => (submissionId ? selectCaps(s, `submission:${submissionId}`) : EMPTY_CAPS)),
  );

  // Prefetch next submission for faster grading flow
  usePrefetchNextSubmission(submissionId, assignment, course, props.user.email, isLoading);

  // Prefetch vendor chunks for file-type renderers (PDF, Markdown, etc.) based on actual files
  usePrefetchFileRenderers(files);

  // --- Comment actions hook ---
  // Callbacks passed to the hook use refs so the hook's memoized actions stay stable.
  const recalculateGradeRef = React.useRef(() => {});
  const autoAssignGraderRef = React.useRef(() => {});

  const {
    comments,
    commentRubricComments,
    activeCommentID,
    rubricCategories,
    rubricComments,
    addComment,
    saveComment,
    deleteComment,
    updateFeedback,
    removeRubricComment,
    onRubricCommentClick,
    changeActiveComment,
  } = useCommentActions({
    inDemoMode: props.inDemoMode,
    recalculateGrade: () => recalculateGradeRef.current(),
    autoAssignGrader: () => autoAssignGraderRef.current(),
  });

  // --- AI assistance hook ---
  const {
    suggestedComments,
    submissionSummary,
    isGeneratingFileSuggestions,
    isGeneratingSummary,
    abModal,
    suggestionsMeta,
    summaryMeta,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    handleGenerateFileSuggestions,
    handleGenerateSummary,
    closeAbModal,
  } = useAiAssistance({
    submissionId: submission?.id,
    canGenerate: !!submissionCaps.generate_ai_comments,
    aiEnabled,
    aiFeatureStatus,
  });

  // Commenting readOnly: finalized OR capability denied
  const isCommentReadOnly = !!submission?.isFinalized || submissionCaps.comment_on_submission === false;

  // --- Submission actions hook ---
  const {
    addLateDayCreditComment,
    calculateGradeFromState,
    getPointsInFile,
    updateSubmissionGrade,
    toggleFinalized,
    updateGrader,
    claimSubmission,
    setRubric,
    submitStudentQuestion,
    deleteStudentQuestion,
    updateRegrade,
    turnOnReload,
    turnOffReload,
  } = useSubmissionActions({
    userEmail: props.user.email!,
    inDemoMode: props.inDemoMode,
    deleteComment,
    addComment,
    saveComment,
  });

  // --- Template actions hook ---
  const { handlePinComment, handleUpdateCommentLocation, handleApplyTemplate } = useTemplateActions({
    userEmail: props.user.email!,
    addComment,
    saveComment,
    lastCursorRef,
    setTemplateForceUpdates,
    setTemplateRefresh,
  });

  // Backwards-compatible setState that updates Zustand store
  const setState = React.useCallback((updater: React.SetStateAction<ICodeConsoleState>) => {
    const stateObj = getStoreSnapshot();
    const newState = typeof updater === 'function' ? updater(stateObj) : updater;
    useCodeConsoleStore.getState().setState(newState);
  }, []);

  /***********************************************************************************************/
  /* Helper functions (converted from class methods)
	/***********************************************************************************************/

  // --- Console hotkeys hook ---
  const { toggleCursorMode, updateCursorDomain, handleHotkeys, handleCursor } = useConsoleHotkeys({ setState });

  // --- Console loader hook ---
  const { loadDemoData, componentDidMountLogic } = useConsoleLoader({
    userEmail: props.user.email!,
    courseadminCourses: props.user.courseadminCourses,
    superGraderCourses: props.user.superGraderCourses,
    inDemoMode: props.inDemoMode,
    setState,
  });

  // useEffect to call componentDidMount logic on component mount - ONLY ONCE
  React.useEffect(() => {
    componentDidMountLogic();

    // Add event listeners
    document.addEventListener('keydown', handleCursor);
    document.addEventListener('keydown', handleHotkeys);

    const checkFilesInterval = checkNewFilesInterval.current;
    const reloadInterval = reloadCommentsInterval.current;

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleCursor);
      document.removeEventListener('keydown', handleHotkeys);
      if (checkFilesInterval) {
        clearInterval(checkFilesInterval);
      }
      if (reloadInterval) {
        clearInterval(reloadInterval);
      }
    };
  }, [componentDidMountLogic, handleCursor, handleHotkeys]);

  const selectedFileId = (selectedFile as FileWithId | undefined)?.id;

  React.useEffect(() => {
    lastCursorRef.current = null;
  }, [selectedFileId]);

  // NOTE: URL sync effect was removed.
  // - URL params (tab, file) are only read on initial load in componentDidMountLogic
  // - URL is only updated when claiming a new submission (same assignment)
  // - Internal state (panelType, selectedFile, activeSiderKey) is now the source of truth

  /***********************************************************************************
	/* Loading methods
	/**********************************************************************************/

  // Note: setNewFilesWarning, checkForNewFiles, and onEscKeyPress functions are
  // currently unused in the functional component implementation.

  /***********************************************************************************
	/* Handlers
	/**********************************************************************************/

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
        // NOTE: URL is NOT updated here - internal state is the source of truth
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

  /***********************************************************************************
	/* Helper functions
	/**********************************************************************************/

  const toggleCustomCommentExplorer = () => {
    setState((oldState) => ({
      ...oldState,
      showCustomCommentExplorer: !oldState.showCustomCommentExplorer,
    }));
  };

  // Wire callback refs for useCommentActions hook
  recalculateGradeRef.current = updateSubmissionGrade;
  autoAssignGraderRef.current = () => {
    try {
      if (submission && submission.grader === null) {
        updateGrader(submission, props.user.email);
      }
    } catch {
      console.log('comment author isnt enrolled as a grader');
    }
  };

  // Note: onEscKeyPress removed - functionality handled elsewhere

  const setZoom = (newZoom: number) => {
    setState((prev) => ({ ...prev, codeZoom: newZoom }));
  };

  const setVerticalOffset = (oldToNew: (oldValue: number) => number) => {
    setState((oldState: ICodeConsoleState) => ({
      ...oldState,
      codeVerticalOffset: oldToNew(oldState.codeVerticalOffset),
    }));
  };

  /***********************************************************************************************/
  /* Demo data
	/***********************************************************************************************/
  const toggleEditRubricMode = () => {
    setState((prev) => ({ ...prev, editRubricMode: !editRubricMode }));
  };

  /***********************************************************************************************/
  /* Execution Handlers
	/***********************************************************************************************/
  /**
   * Callback to handle execution completion
   *
   * Stores execution results per file ID in a cache map. This allows:
   * - Switching between files without losing execution results
   * - Each file maintaining its own execution state
   * - No cross-contamination between notebook and code file results
   *
   * @param result - Execution result with file_id, success status, and output data
   */
  const handleExecutionComplete = React.useCallback(
    (result: ExecutionResult) => {
      const fileId = result.file_id || selectedFile?.id;
      if (fileId) {
        const normalizedResult = {
          success: result.success,
          output_data: result.output_data ?? undefined,
          error: result.error ?? undefined,
        };
        setState((prev) => ({
          ...prev,
          executionResults: {
            ...prev.executionResults,
            [fileId]: normalizedResult,
          },
        }));
      }
    },
    [selectedFile?.id, setState],
  );

  /**
   * Callback to clear execution outputs for the currently selected file
   *
   * Removes the execution result from the cache for the current file only,
   * preserving results for other files.
   */
  const handleClearOutputs = React.useCallback(() => {
    setState((prev) => {
      const selected = prev.selectedFile as FileWithId | undefined;
      if (!selected?.id) return prev;
      const newResults = { ...prev.executionResults };
      delete newResults[selected.id];
      return { ...prev, executionResults: newResults };
    });
  }, [setState]);

  /**
   * Callback to handle temporary content changes in edit mode
   */
  const handleContentChange = React.useMemo(
    () =>
      debounce((content: string) => {
        const currentSelectedFile = useCodeConsoleStore.getState().selectedFile as FileWithId | undefined;
        if (currentSelectedFile) {
          useCodeConsoleStore.getState().setTemporaryFileContent(currentSelectedFile.id, content);
        }
      }, 500),
    [],
  );

  const handleCursorChange = React.useCallback((cursor: CursorSnapshot | null) => {
    lastCursorRef.current = cursor;
  }, []);

  const handleScrolledToComment = React.useCallback(() => {
    const currentQuery = queryString.parse(location.search);
    delete currentQuery.comment;
    navigate({ search: queryString.stringify(currentQuery) }, { replace: true });
  }, [location.search, navigate]);

  /***********************************************************************************
	/* Render
	/**********************************************************************************/

  if (isLoading) {
    return <Loading />;
  }

  const theme =
    consoleThemes.light === (context as React.ContextType<typeof ConsoleThemeContext>).consoleTheme ? 'light' : 'dark';

  let leftHeader: React.ReactNode[] = [];
  let middleHeader: React.ReactNode[] = [];
  // initializer required for TypeScript control-flow analysis
  let rightHeader: React.ReactNode[] = [];
  let content;
  let siderTitles: Array<React.ReactNode | string> = [];
  let siderTooltips: Array<React.ReactNode | string> = []; // Added for shortcuts
  let sider: React.ReactElement[] = [];

  // Capability-based admin/supergrader (caps are always loaded before this code runs)
  const capIsAdmin = !!submissionCaps.edit_course_settings;
  const capIsSuperGrader = !!submissionCaps.manage_global_templates;
  const capCanEditRubric = !!submissionCaps.edit_rubric;
  const capDownloadFiles = submissionCaps.download_assignment_files !== false;
  const capViewFeedback = submissionCaps.view_feedback !== false;
  const capViewRubric = submissionCaps.view_rubric !== false;
  const capCommentOnSubmission = submissionCaps.comment_on_submission !== false;
  const capViewTestResults = submissionCaps.view_test_results !== false;
  const capGenerateAiComments = submissionCaps.generate_ai_comments;

  const toolbar = (
    <ConsoleToolbar
      selectedFile={selectedFile}
      isEditMode={isEditMode}
      wordWrap={wordWrap}
      executionResults={executionResults}
      submissionCaps={submissionCaps}
      capIsAdmin={capIsAdmin}
      assignment={assignment}
      onExecutionComplete={handleExecutionComplete}
      onClearOutputs={handleClearOutputs}
    />
  );
  const toolbarWidgets: React.ReactElement[] = toolbar ? [toolbar] : [];

  const controls = (
    <Controls
      updateVerticalOffset={setVerticalOffset}
      updateZoom={setZoom}
      fallbackWidth={layoutVars.breakpoints.smallScreen.grade}
    />
  );

  const testsTitle = 'Tests';

  // Computed values used across multiple render branches
  const hideAuthor = assignment
    ? assignment.studentsCanSeeGraders !== null
      ? !assignment.studentsCanSeeGraders
      : course
        ? !course.studentsCanSeeGraders
        : true
    : true;

  const fileSuggestedComments =
    selectedFile &&
    aiFeatureStatus.suggested_comments !== false &&
    capGenerateAiComments !== false
      ? suggestedComments.filter((s) => s.file === selectedFile.id)
      : [];

  const executionResult = selectedFile ? executionResults[selectedFile.id] || null : null;

  if (permissionLevel === PERMISSION_LEVEL.NONE || permissionLevel === PERMISSION_LEVEL.NOT_FOUND) {
    rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

    content = (
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
    );
  } else if (props.inDemoMode && !assignment) {
    rightHeader = [
      <CursorToggle
        key="cursor-toggle"
        toggleCursorMode={toggleCursorMode}
        cursorMode={cursorMode}
        small={true}
      />,
      <ThemeToggle key="theme-toggle" small={true} />,
      controls,
    ];
  } else {
    if (!assignment) {
      return <div>We're not supposed to get here..</div>;
    }

    // At this stage, we're going to render the Code Review Console, so we can
    // build the elements that are common between read-level and write-level

    /*********************************************************
			/* Build header
			/*********************************************************/

    middleHeader =
      hideGrades || submissionCaps.view_feedback === false
        ? []
        : [
            <GradeButton
              key="subheader-grade"
              assignment={assignment!}
              submission={submission === undefined ? readOnlySubmission! : submission}
              calculateGrade={calculateGradeFromState}
              rubricCategories={rubricCategories}
              comments={comments}
              commentRubricComments={commentRubricComments}
              files={files}
              submissionTests={tests}
              testCases={Object.values(testCases).flat() as TestCaseType[]}
            />,
          ];

    const fileMenuTitle = <FileMenuTitle key="files" files={files} />;
    if (props.inDemoMode) {
      if (permissionLevel === PERMISSION_LEVEL.READ) {
        if (panelType === PANEL_TYPE.FILE && selectedFile) {
          const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
            <StudentCode
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={true}
              user={props.user.email!}
              onHighlightClick={onHighlightClick}
              executionResult={executionResult}
              onClearOutputs={handleClearOutputs}
            />
          );

          const commentsPanel = (
            <StudentComments
              isStudent={isStudent}
              comments={comments[selectedFile!.id]}
              rubricComments={commentRubricComments}
              file={selectedFile!}
              fileIDs={fileIDs}
              verticalOffset={codeVerticalOffset}
              updateFeedback={updateFeedback.bind(null, selectedFile!.id)}
              studentFeedbackOn={assignment.commentFeedback ?? false}
              hideAuthor={hideAuthor}
              additiveGrading={false}
              rubricCategories={rubricCategories}
            />
          );

          content = (
            <CommentHighlightProvider
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={true}
              user={props.user.email!}
              onHighlightClick={(_e: React.MouseEvent) => {
                // Highlight clicks are handled by CodePanelLayout for scroll sync in demo student mode.
              }}
              onHighlightSelect={handleHighlightSelect}
              focusedCommentId={activeCommentID}
            >
              <CodePanelLayout
                comments={commentsPanel}
                code={code}
                toolbarWidgets={toolbarWidgets}
                file={selectedFile}
                zoom={codeZoom}
                updateVerticalOffset={setVerticalOffset}
              />
            </CommentHighlightProvider>
          );
        }

        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={claimSubmission}
            course={course}
            assignment={assignment}
            submission={readOnlySubmission}
          />,
          <SubheaderTitle key="subheader-title" assignment={assignment!} />,
        ];

        rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

        sider = [
          <ReadOnlySubmissionInfo
            key="submission-info"
            title="Submission Info"
            assignment={assignment}
            readOnlySubmission={readOnlySubmission!}
            submitStudentQuestion={submitStudentQuestion}
            deleteStudentQuestion={deleteStudentQuestion}
            isStudentMode={readOnlySubmission!.students!.find((el) => el === props.user.email) === undefined}
          />,
          <FileMenu
            key="file-menu"
            title="Files"
            files={files}
            comments={comments}
            selectedFile={selectedFile}
            getPointsInFile={getPointsInFile}
            changeSelectedFile={changeSelectedFile}
          />,
        ];

        siderTitles = ['Submission Info', fileMenuTitle];
      } else {
        if (panelType === PANEL_TYPE.FILE && selectedFile) {
          const demoCode = (onHighlightClick: (e: React.MouseEvent) => void) => (
            <ConnectedGradeCode
              onCursorChange={handleCursorChange}
              onUpdateCommentLocation={handleUpdateCommentLocation}
              fileId={selectedFile!.id}
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={isCommentReadOnly}
              addComment={addComment}
              user={props.user.email!}
              onHighlightClick={onHighlightClick}
              commentCounter={commentCounter}
              assignmentFile={undefined}
              cursorMode={cursorMode}
              showCursor={showCursor}
              updateCursorDomain={updateCursorDomain}
              executionResult={executionResult}
              onClearOutputs={handleClearOutputs}
              isEditMode={isEditMode}
              onContentChange={handleContentChange}
              // temporaryContent handled by wrapper
            />
          );

          const demoComments = (
            <GradeComments
              isStudent={isStudent}
              showExplanations={true}
              comments={comments[selectedFile!.id]}
              rubricComments={commentRubricComments}
              readOnly={isCommentReadOnly}
              file={selectedFile!}
              fileIDs={fileIDs}
              activeCommentID={activeCommentID}
              changeActive={changeActiveComment}
              deleteComment={deleteComment}
              saveComment={saveComment}
              removeRubricComment={removeRubricComment}
              oldCommentIDs={oldCommentIDs}
              verticalOffset={codeVerticalOffset}
              updateFeedback={updateFeedback.bind(null, selectedFile!.id)}
              studentFeedbackOn={assignment.commentFeedback ?? false}
              hideAuthor={hideAuthor}
              additiveGrading={assignment.additiveGrading ?? false}
              forcedRubricMode={assignment.forcedRubricMode ?? false}
              rubricCategories={rubricCategories}
              showCursor={showCursor}
              aiEnabled={aiEnabled && aiFeatureStatus.comment_generation !== false}
              onPin={handlePinComment}
              forcedUpdates={templateForceUpdates}
            />
          );

          content = (
            <CommentHighlightProvider
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={isCommentReadOnly}
              user={props.user.email!}
              onHighlightClick={(_e: React.MouseEvent) => {
                // Highlight clicks are handled by CodePanelLayout for scroll sync in demo grader mode.
              }}
              addComment={addComment}
              onHighlightSelect={handleHighlightSelect}
            >
              <CodePanelLayout
                comments={demoComments}
                code={demoCode}
                toolbarWidgets={toolbarWidgets}
                file={selectedFile}
                zoom={codeZoom}
                updateVerticalOffset={setVerticalOffset}
              />
            </CommentHighlightProvider>
          );
        }

        const onCancel = () => {
          return;
        };

        sider = [
          <SubmissionInfo
            key="submission-info"
            title="Submission Info"
            assignment={assignment!}
            submission={submission!}
            courseLateDayCreditsAllowable={course?.lateDayCreditsAllowable ?? null}
            graders={graders}
            isCourseAdmin={capIsAdmin}
            updateGrader={updateGrader}
            addLateDayCreditComment={addLateDayCreditComment}
            isStudentMode={false}
            graderEmail={props.user.email}
            onUpdateRegrade={updateRegrade}
          />,
          <ConnectedTestsMenu
            key="tests-menu"
            submissionId={submission!.id}
            tests={Object.values(testCases).flat() as TestCaseType[]}
            rubricCategories={rubricCategories}
            testCategories={testCategories}
            demoMode={true}
            initialResults={tests}
          />,
          <FileMenu
            key="file-menu"
            title="Files"
            files={files}
            comments={comments}
            selectedFile={selectedFile}
            getPointsInFile={getPointsInFile}
            changeSelectedFile={changeSelectedFile}
          />,
          <RubricManager
            key="rubric-menu"
            shouldLoadFeedback={false}
            shouldLoadInstanceLists={!!assignment.showFrequentlyUsedRubricComments}
            assignment={assignment as Assignment}
            submissions={[]}
            onCancel={onCancel}
            defaultRubric={{
              categories: rubricCategories,
              comments: flatten(Object.values(rubricComments)),
            }}
          >
            {({ props, state: rubricState, helpers }: IRubricManagerParams) => {
              const propz = {
                ...props,
                handleRubricCommentClick: onRubricCommentClick,
                hasActiveComment: activeCommentID !== undefined,
                toggleEditRubricMode: toggleEditRubricMode,
                editRubricMode: editRubricMode,
                setRubric: setRubric,
                turnOnReload: turnOnReload,
                turnOffReload: turnOffReload,
                canUserEdit: true, // showcase in-console rubric editing in demo
                demoMode: true,
                showCursor: showCursor,
                updateCursorDomain: updateCursorDomain,
                showFrequent: !!(assignment !== undefined
                  ? assignment.showFrequentlyUsedRubricComments
                  : false),
                course: course!,
              };
              return (
                <React.Suspense fallback={<Loading />}>
                  <RubricMenuUI props={propz} state={rubricState} helpers={helpers} />
                </React.Suspense>
              );
            }}
          </RubricManager>,
          <TemplateMenu
            key="template-menu"
            assignmentId={assignment!.id}
            onApplyTemplate={handleApplyTemplate}
            currentUserEmail={props.user.email!}
            refreshTrigger={templateRefresh}
            currentFilePath={selectedFile?.name}
            isSuperGrader={capIsSuperGrader}
            demoTemplates={getDemoPinnedTemplates(props.user.email!)}
          />,
        ];

        siderTitles = ['Submission Info', testsTitle, fileMenuTitle, 'Rubric', 'Pinned Comments'];

        siderTooltips = [
          <SubmissionInfoTooltip
            key="submission-info-tooltip"
            submission={readOnlySubmission || submission}
            assignment={assignment}
          />,
          <TestsMenuTooltip
            key="tests-info-tooltip"
            title={testsTitle}
            testCount={Object.values(testCases).flat().length}
          />,
          <FileMenuTooltip key="files-tooltip" files={files} />,
          <RubricTooltip key="rubric-tooltip" itemsApplied={Object.values(rubricComments).flat().length} />,
          <PinnedCommentsTooltip key="pinned-comments-tooltip" />,
        ];

        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={claimSubmission}
            course={course}
            assignment={assignment}
            submission={readOnlySubmission}
          />,
          <SubheaderTitle key="subheader-title" assignment={assignment} />,
        ];

        const signupButton =
          props.user.id === -1 ? (
            <CPButton key="sign-up" cpType="primary">
              <a href="/signup/create" target="_blank">
                Sign up!
              </a>
            </CPButton>
          ) : null;

        rightHeader = [
          signupButton,
          <CursorToggle
            key="cursor-toggle"
            toggleCursorMode={toggleCursorMode}
            cursorMode={cursorMode}
            small={true}
          />,
          <ThemeToggle key="theme-toggle" small={true} />,

          controls,
          <FinalizeButton
            key="subheader-finalize"
            course={course!}
            submission={submission!}
            toggleFinalized={toggleFinalized}
            numComments={Object.values(comments).flat().length}
            minComments={course?.minComments ?? 0}
            canUnfinalize={true}
            isOnlyGrader={graders.length === 1}
          />,
        ];
      }
    } else if (permissionLevel === PERMISSION_LEVEL.READ) {
      if (selectedFile) {
        const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
          <StudentCode
            file={selectedFile!}
            comments={comments[selectedFile!.id]}
            readOnly={true}
            user={props.user.email!}
            onHighlightClick={onHighlightClick}
            executionResult={executionResult}
            onClearOutputs={handleClearOutputs}
          />
        );

        const commentsPanel = (
          <StudentComments
            isStudent={isStudent}
            comments={comments[selectedFile!.id]}
            rubricComments={commentRubricComments}
            file={selectedFile!}
            fileIDs={fileIDs}
            verticalOffset={codeVerticalOffset}
            updateFeedback={updateFeedback.bind(null, selectedFile!.id)}
            studentFeedbackOn={assignment.commentFeedback ?? false}
            hideAuthor={hideAuthor}
            additiveGrading={false}
            rubricCategories={rubricCategories}
            scrollToCommentID={parseInt(queryString.parse(location.search).comment as string)}
            onScrolledToComment={handleScrolledToComment}
          />
        );

        content = (
          <CommentHighlightProvider
            file={selectedFile!}
            comments={comments[selectedFile!.id]}
            readOnly={true}
            user={props.user.email!}
            onHighlightClick={(_e: React.MouseEvent) => {
              // Highlight clicks are handled by CodePanelLayout for scroll sync in student mode.
            }}
            onHighlightSelect={handleHighlightSelect}
            focusedCommentId={activeCommentID}
          >
            <CodePanelLayout
              comments={commentsPanel}
              code={code}
              toolbarWidgets={toolbarWidgets}
              file={selectedFile}
              zoom={codeZoom}
              updateVerticalOffset={setVerticalOffset}
            />
          </CommentHighlightProvider>
        );
      }

      leftHeader = [
        <HeaderMenu
          key="menu"
          claimSubmission={claimSubmission}
          course={course}
          assignment={assignment}
          submission={readOnlySubmission}
        />,
        <SubheaderTitle key="subheader-title" assignment={assignment!} />,
      ];

      rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

      sider = [
        <ReadOnlySubmissionInfo
          key="submission-info"
          title="Submission Info"
          assignment={assignment}
          readOnlySubmission={readOnlySubmission!}
          submitStudentQuestion={submitStudentQuestion}
          deleteStudentQuestion={deleteStudentQuestion}
          isStudentMode={isStudent}
          courseStudentsCanSeeGraders={course?.studentsCanSeeGraders}
        />,
        <ConnectedTestsMenu
          key="tests-menu"
          submissionId={readOnlySubmission!.id}
          tests={Object.values(testCases).flat() as TestCaseType[]}
          rubricCategories={rubricCategories}
          testCategories={testCategories}
          demoMode={props.inDemoMode}
          initialResults={tests}
        />,
        <FileMenu
          key="file-menu"
          title="Files"
          files={files}
          comments={comments}
          selectedFile={selectedFile}
          getPointsInFile={getPointsInFile}
          changeSelectedFile={changeSelectedFile}
        />,
      ];

      siderTitles = ['Submission Info', testsTitle, fileMenuTitle];
      siderTooltips = [
        <SubmissionInfoTooltip key="submission-info-tooltip" submission={readOnlySubmission} assignment={assignment} />,
        <TestsMenuTooltip
          key="tests-info-tooltip"
          title={testsTitle}
          testCount={Object.values(testCases).flat().length}
        />,
        <FileMenuTooltip key="files-tooltip" files={files} />,
      ];
    } else if (permissionLevel === PERMISSION_LEVEL.READ_FILES_ONLY) {
      // Files-only mode: show files but no comments, rubrics, or grades
      if (selectedFile) {
        const code = (_onHighlightClick: (e: React.MouseEvent) => void) => (
          <StudentCode
            file={selectedFile!}
            comments={[]} // No comments in files-only mode
            readOnly={true}
            user={props.user.email!}
            onHighlightClick={(_e) => {}}
            executionResult={executionResult}
            onClearOutputs={handleClearOutputs}
          />
        );

        content = (
          <CommentHighlightProvider
            file={selectedFile!}
            comments={[]} // No comments in files-only mode
            readOnly={true}
            user={props.user.email!}
            onHighlightClick={(_e: React.MouseEvent) => {}}
            onHighlightSelect={(_sel) => {}}
            focusedCommentId={undefined}
          >
            <CodePanelLayout
              comments={null} // No comments panel
              code={code}
              toolbarWidgets={toolbarWidgets}
              file={selectedFile}
              zoom={codeZoom}
              updateVerticalOffset={setVerticalOffset}
            />
          </CommentHighlightProvider>
        );
      }

      leftHeader = [
        <SubheaderTitle key="subheader-title" assignment={assignment!} />,
        <Tag key="files-only-notice" color="warning">
          Files Only - Feedback not yet available
        </Tag>,
      ];

      rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

      sider = [
        <ReadOnlySubmissionInfo
          key="submission-info"
          title="Submission Info"
          assignment={assignment}
          readOnlySubmission={readOnlySubmission!}
          submitStudentQuestion={undefined} // No regrade requests in files-only mode
          deleteStudentQuestion={undefined}
          isStudentMode={true}
          courseStudentsCanSeeGraders={course?.studentsCanSeeGraders}
        />,
        <FileMenu
          key="file-menu"
          title="Files"
          files={files}
          comments={{}} // No comments to show
          selectedFile={selectedFile}
          getPointsInFile={getPointsInFile}
          changeSelectedFile={changeSelectedFile}
        />,
      ];

      siderTitles = ['Submission Info', fileMenuTitle];
      siderTooltips = [
        <SubmissionInfoTooltip key="submission-info-tooltip" submission={readOnlySubmission} assignment={assignment} />,
        <FileMenuTooltip key="files-tooltip" files={files} />,
      ];
    } else {
      leftHeader = [
        <HeaderMenu
          key="menu"
          claimSubmission={claimSubmission}
          course={course}
          assignment={assignment}
          submission={submission}
        />,
        <SubheaderTitle key="subheader-title" assignment={assignment!} />,
        <StatusTags
          key="tag"
          assignment={assignment!}
          submission={submission!}
          fallbackWidth={layoutVars.breakpoints.smallScreen.gradeHeader}
        />,
      ];

      rightHeader = [
        <CursorToggle
          key="cursor-toggle"
          toggleCursorMode={toggleCursorMode}
          cursorMode={cursorMode}
          small={true}
        />,
        <ThemeToggle key="theme-toggle" small={true} />,
        ...(capDownloadFiles ? [<DownloadCode key="download-code" submission={submission!} />] : []),
        controls,
        ...(capViewFeedback ? [<ViewAsStudent key="view-as-student" pathname={location.pathname} />] : []),
        <FinalizeButton
          key="subheader-finalize"
          course={course!}
          submission={submission!}
          toggleFinalized={toggleFinalized}
          numComments={Object.values(comments).flat().length}
          minComments={course?.minComments ?? 0}
          canUnfinalize={true}
          isOnlyGrader={graders.length === 1}
        />,
      ];

      if (selectedFile !== undefined) {
        // assignmentFile logic removed as it was unused and causing warnings
        const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
          <ConnectedGradeCode
            onCursorChange={handleCursorChange}
            onUpdateCommentLocation={handleUpdateCommentLocation}
            fileId={selectedFile!.id}
            file={selectedFile!}
            comments={comments[selectedFile!.id]}
            readOnly={isCommentReadOnly}
            addComment={addComment}
            user={props.user.email!}
            onHighlightClick={onHighlightClick}
            commentCounter={commentCounter}
            assignmentFile={undefined}
            cursorMode={cursorMode}
            showCursor={showCursor}
            updateCursorDomain={updateCursorDomain}
            executionResult={executionResult}
            onClearOutputs={handleClearOutputs}
            isEditMode={isEditMode}
            onContentChange={handleContentChange}
            // temporaryContent handled by wrapper
          />
        );

        const commentsPanel = (
          <GradeComments
            isStudent={isStudent}
            showExplanations={true}
            comments={comments[selectedFile!.id]}
            rubricComments={commentRubricComments}
            readOnly={isCommentReadOnly}
            file={selectedFile!}
            fileIDs={fileIDs}
            activeCommentID={activeCommentID}
            changeActive={changeActiveComment}
            deleteComment={deleteComment}
            saveComment={saveComment}
            removeRubricComment={removeRubricComment}
            oldCommentIDs={oldCommentIDs}
            verticalOffset={codeVerticalOffset}
            updateFeedback={updateFeedback.bind(null, selectedFile!.id)}
            studentFeedbackOn={assignment.commentFeedback ?? false}
            hideAuthor={hideAuthor}
            additiveGrading={assignment.additiveGrading ?? false}
            forcedRubricMode={assignment.forcedRubricMode ?? false}
            rubricCategories={rubricCategories}
            allRubricComments={Object.values(rubricComments).flat()}
            showCursor={showCursor}
            scrollToCommentID={parseInt(queryString.parse(location.search).comment as string)}
            onScrolledToComment={handleScrolledToComment}
            aiEnabled={
              aiEnabled && aiFeatureStatus.comment_generation !== false && capGenerateAiComments !== false
            }
            onPin={handlePinComment}
            forcedUpdates={templateForceUpdates}
            suggestedComments={fileSuggestedComments}
            onAcceptSuggestion={handleAcceptSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
            onGenerateFileSuggestions={
              aiFeatureStatus.suggested_comments !== false && capGenerateAiComments !== false
                ? () => handleGenerateFileSuggestions(selectedFile!.id)
                : undefined
            }
            isGeneratingFileSuggestions={isGeneratingFileSuggestions}
            suggestionsMeta={suggestionsMeta}
          />
        );

        content = (
          <div style={{ height: '100%' }}>
            <CommentHighlightProvider
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              suggestions={fileSuggestedComments}
              readOnly={isCommentReadOnly}
              user={props.user.email!}
              onHighlightClick={(_e: React.MouseEvent) => {
                // This is called from CodePanelLayout's scroll sync handler
                // The event already has the comment ID in e.currentTarget.id
                // This is a no-op for now - the scroll sync happens in CodePanelLayout
              }}
              addComment={addComment}
              onHighlightSelect={handleHighlightSelect}
              focusedCommentId={activeCommentID}
            >
              <CodePanelLayout
                comments={commentsPanel}
                code={code}
                toolbarWidgets={toolbarWidgets}
                file={selectedFile}
                zoom={codeZoom}
                updateVerticalOffset={setVerticalOffset}
                isEditMode={isEditMode}
              />
            </CommentHighlightProvider>
            <CustomCommentExplorer
              graders={graders}
              user={props.user.email!}
              isAdmin={capIsAdmin}
              assignment={assignment}
              rubricComments={Object.values(rubricComments).flat()}
              rubricCategories={rubricCategories}
              open={showCustomCommentExplorer}
              onCancel={toggleCustomCommentExplorer}
            />
          </div>
        );
      }

      const onCancel = () => {
        return;
      };

      sider = [];
      siderTitles = [];
      siderTooltips = [];

      // 1. Submission Info
      sider.push(
        <SubmissionInfo
          key="submission-info"
          title="Submission Info"
          assignment={assignment}
          courseLateDayCreditsAllowable={course?.lateDayCreditsAllowable ?? null}
          submission={submission!}
          graders={graders}
          isCourseAdmin={capIsAdmin}
          updateGrader={updateGrader}
          addLateDayCreditComment={addLateDayCreditComment}
          isStudentMode={isStudent}
          courseStudentsCanSeeGraders={course?.studentsCanSeeGraders}
          graderEmail={props.user.email}
          onUpdateRegrade={updateRegrade}
        />,
      );
      siderTitles.push('Submission Info');
      siderTooltips.push(
        <SubmissionInfoTooltip key="submission-info-tooltip" submission={submission!} assignment={assignment} />,
      );

      // 2. Tests (visible if user can view test results and there are test categories, or user is admin)
      if (capViewTestResults && (capIsAdmin || testCategories.length > 0)) {
        sider.push(
          <ConnectedTestsMenu
            key="tests-menu"
            submissionId={submission!.id}
            tests={Object.values(testCases).flat() as TestCaseType[]}
            rubricCategories={rubricCategories}
            testCategories={testCategories}
            demoMode={props.inDemoMode}
            initialResults={tests}
          />,
        );
        siderTitles.push(testsTitle);
        siderTooltips.push(
          <TestsMenuTooltip
            key="tests-info-tooltip"
            title={testsTitle}
            testCount={Object.values(testCases).flat().length}
          />,
        );
      }
      // 3. Files
      sider.push(
        <FileMenu
          key="file-menu"
          title="Files"
          files={files}
          comments={comments}
          selectedFile={selectedFile}
          getPointsInFile={getPointsInFile}
          changeSelectedFile={changeSelectedFile}
        />,
      );
      siderTitles.push(fileMenuTitle);
      siderTooltips.push(<FileMenuTooltip key="files-tooltip" files={files} />);

      // 4. Rubric
      if (capViewRubric) {
        sider.push(
          <RubricManager
            key="rubric-menu"
            assignment={assignment as Assignment}
            submissions={[]}
            onCancel={onCancel}
            reloadInterval={rubricReload}
            setRubric={setRubric}
            shouldLoadFeedback={false}
            shouldLoadInstanceLists={!!assignment.showFrequentlyUsedRubricComments}
          >
            {({ props, state: rubricState, helpers }: IRubricManagerParams) => {
              const propz: RubricMenuUIProps = {
                ...props,
                handleRubricCommentClick: onRubricCommentClick,
                hasActiveComment: activeCommentID !== undefined,
                toggleEditRubricMode: toggleEditRubricMode,
                editRubricMode: editRubricMode,
                setRubric: setRubric,
                turnOnReload: turnOnReload,
                turnOffReload: turnOffReload,
                canUserEdit:
                  capCanEditRubric ||
                  assignment!.collaborativeRubricMode ||
                  (course?.isRubricEditor ?? false),
                showCursor: showCursor,
                updateCursorDomain: updateCursorDomain,
                demoMode: noSave === true,
                showFrequent: !!(assignment !== undefined
                  ? assignment.showFrequentlyUsedRubricComments
                  : false),
                course: course!,
              };
              return <RubricMenuUI props={propz} state={rubricState} helpers={helpers} />;
            }}
          </RubricManager>,
        );
        siderTitles.push('Rubric');
        siderTooltips.push(
          <RubricTooltip key="rubric-tooltip" itemsApplied={Object.values(rubricComments).flat().length} />,
        );
      }

      // 5. Templates
      if (assignment && capCommentOnSubmission) {
        sider.push(
          <TemplateMenu
            key="template-menu"
            assignmentId={assignment.id}
            onApplyTemplate={handleApplyTemplate}
            currentUserEmail={props.user.email!}
            refreshTrigger={templateRefresh}
            currentFilePath={selectedFile?.name}
            isSuperGrader={capIsSuperGrader}
          />,
        );
        siderTitles.push('Pinned Comments');
        siderTooltips.push(<PinnedCommentsTooltip key="pinned-comments-tooltip" />);
      }

      // 6. AI Summary (only when AI is enabled and submission_summary feature is on)
      if (
        aiEnabled &&
        aiFeatureStatus.submission_summary !== false &&
        submissionCaps.view_ai_assistance !== false
      ) {
        sider.push(
          <SubmissionSummaryPanel
            key="ai-summary"
            title="AI Summary"
            summary={submissionSummary}
            onGenerateSummary={submissionCaps.trigger_ai_assistance !== false ? handleGenerateSummary : undefined}
            isGenerating={isGeneratingSummary}
            isAdmin={capIsAdmin}
            promptVariantId={summaryMeta.promptVariantId}
            experimentId={summaryMeta.experimentId}
            isCustomContext={summaryMeta.isCustomContext}
          />,
        );
        siderTitles.push('AI Summary');
        siderTooltips.push(<SubmissionSummaryTooltip key="ai-summary-tooltip" hasSummary={!!submissionSummary} />);
      }
    }
  }

  const cancelFunc = () => {
    return;
  };

  (window as { foobarIsActive?: boolean }).foobarIsActive = false; // lift off // MODIFIED ON 2020-01-20 for CommandBar

  /*************************************************************************************/
  return (
    <div id="Grade">
      {props.inDemoMode && assignment && (
        <DemoBanner
          isStudentView={isStudent}
          switchLabel={isStudent ? 'Switch to Grader' : 'Switch to Student'}
          switchTo={isStudent ? `${CODE_DEMO}/grader-console` : `${CODE_DEMO}/student`}
        />
      )}
      <CodeConsoleOnboardingSelector
        open={props.inDemoMode && !assignment}
        onUploadConfirm={loadDemoData}
        onCancel={cancelFunc}
      />
      <CourseContext.Provider value={course ?? defaultCourse}>
        {localStorage.getItem('source') !== 'codePost' ? (
          <main id="demo-main-content" style={{ height: '100%' }}>
            {content}
          </main>
        ) : (
          <StandardConsoleLayout
            consoleTypes={['grade']}
            activePanel={(() => {
              const idx = sider.findIndex((s) => s.key === activeSiderKey);
              return idx !== -1 ? idx : null;
            })()}
            onActivePanelChange={(index) => {
              // Sidebar panel changes should NOT affect the main content (selectedFile)
              // Just update which sidebar panel is expanded
              if (index === null) {
                setState((prev) => ({ ...prev, activeSiderKey: null }));
              } else {
                const key = sider[index]?.key;
                setState((prev) => ({ ...prev, activeSiderKey: key ?? null }));
              }
            }}
            header={
              <CPFlex
                style={{
                  padding: '0 14px',
                  height: 49,
                  fontSize: 12,
                  flexWrap: 'nowrap',
                  minWidth: 'max-content',
                }}
                left={leftHeader}
                right={rightHeader}
                middle={middleHeader}
                gutterSize={20}
                className={theme}
              />
            }
            sider={sider}
            siderTitles={siderTitles}
            siderTooltips={siderTooltips}
            content={content}
            editRubricMode={editRubricMode}
            panelDefaultWidths={{ 'tests-menu': 500, 'ai-summary': 500 }}
          />
        )}
        {/* KeyboardShortcuts drawer removed - consolidated into HelpModal */}
        <HelpModal />
        {capViewTestResults && assignment !== undefined && submission !== undefined ? (
          <InlineTestsModal
            key="inline-tests-modal"
            open={inlineTestsModalVisible}
            show={showInlineTestsModal}
            hide={hideInlineTestsModal}
            files={files}
            assignment={assignment}
            submission={submission}
          />
        ) : null}

        {/* A/B Comparison Modal for prompt experiments */}
        {abModal?.open && (
          <ABComparisonModal
            open
            onClose={closeAbModal}
            promptType={abModal.promptType}
            experimentId={abModal.experimentId}
            variantAId={abModal.variantAId}
            variantBId={abModal.variantBId}
            resultA={abModal.resultA}
            resultB={abModal.resultB}
            isCustomContext={abModal.isCustomContext}
          />
        )}
      </CourseContext.Provider>
    </div>
  );
};

export default CodeConsole;
