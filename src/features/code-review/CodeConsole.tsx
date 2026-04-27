// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';
import {
  ICodeConsoleProps,
  ICodeConsoleState,
} from '../../types/CodeConsole.types';
import { getStoreSnapshot, useCodeConsoleStore } from '../../stores/useCodeConsoleStore';
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { useParams } from 'react-router-dom';

/* codePost imports */
import Loading from '../../components/core/Loading';

import { usePrefetchNextSubmission } from './hooks/usePrefetchNextSubmission';
import { usePrefetchFileRenderers } from './hooks/usePrefetchFileRenderers';
import { useCommentActions } from './hooks/useCommentActions';
import { useAiAssistance } from './hooks/useAiAssistance';
import { useConsoleHotkeys } from './hooks/useConsoleHotkeys';
import { useSubmissionActions } from './hooks/useSubmissionActions';
import { useTemplateActions } from './hooks/useTemplateActions';
import { useConsoleLoader } from './hooks/useConsoleLoader';
import { useConsoleLayout } from './hooks/useConsoleLayout';
import { useConsoleCallbacks } from './hooks/useConsoleCallbacks';
import { useExecutionHandlers } from './hooks/useExecutionHandlers';
import { ConsoleActionsProvider, ConsoleActionsContextType } from './ConsoleActionsContext';
import { FileWithId } from '../../utils/file';
import { usePermissionsStore, selectCaps } from '../../stores/usePermissionsStore';
import { EMPTY_CAPS } from '../../stores/usePermissionsStore';
import { useShallow } from 'zustand/react/shallow';

import CPFlex from '../../components/core/CPFlex';
import StandardConsoleLayout from '../../components/core/layouts/StandardConsoleLayout';

import HelpModal from './menu/HelpModal';

import InlineTestsModal from './components/InlineTestsModal';

import ABComparisonModal from '../../components/core/ABComparisonModal';

import { CodeConsoleOnboardingSelector } from '../../components/core/OnboardingSelector';

import DemoBanner from './DemoBanner';
import { CODE_DEMO } from '../../routes';

import { CourseContext, defaultCourse } from '../../components/core/Contexts';

/**********************************************************************************************************************/

/* f(logged in user, submission) */

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
  const params = useParams<{ submissionId?: string }>();
  const [templateForceUpdates, setTemplateForceUpdates] = React.useState<{ [id: number]: number }>({});
  const [templateRefresh, setTemplateRefresh] = React.useState(0);

  // Refs for intervals (replacing instance variables)
  const checkNewFilesInterval = React.useRef<number | undefined>(undefined);
  const reloadCommentsInterval = React.useRef<number | undefined>(undefined);
  const lastCursorRef = React.useRef<{ startLine: number; endLine?: number; startChar?: number; endChar?: number } | null>(null);
  // Note: LIVE_FEEDBACK_*_RELOAD_INTERVAL constants removed as live feedback features are deprecated

  // State management - now uses Zustand store
  // Import useCodeConsoleStore and use getState() for sync access

  // Granular Selectors - Optimization Phase 4
  const files = useCodeConsoleStore((s) => s.files) as FileWithId[];
  const assignment = useCodeConsoleStore((s) => s.assignment);
  const selectedFile = useCodeConsoleStore((s) => s.selectedFile) as FileWithId | undefined;
  const submission = useCodeConsoleStore((s) => s.submission);
  const isLoading = useCodeConsoleStore((s) => s.isLoading);
  const inlineTestsModalVisible = useCodeConsoleStore((s) => s.showInlineTestsModal);
  const isStudent = useCodeConsoleStore((s) => s.isStudent);
  const editRubricMode = useCodeConsoleStore((s) => s.editRubricMode);
  const oldCommentIDs = useCodeConsoleStore((s) => s.oldCommentIDs);
  const aiEnabled = useCodeConsoleStore((s) => s.aiEnabled);
  const aiFeatureStatus = useCodeConsoleStore((s) => s.aiFeatureStatus);
  const course = useCodeConsoleStore((s) => s.course);
  const activeSiderKey = useCodeConsoleStore((s) => s.activeSiderKey);

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
	/* Handlers (extracted to hooks)
	/**********************************************************************************/

  // --- UI interaction callbacks ---
  const {
    handleHighlightSelect,
    changeSelectedFile,
    showInlineTestsModal,
    hideInlineTestsModal,
    toggleCustomCommentExplorer,
    toggleEditRubricMode,
    setZoom,
    setVerticalOffset,
  } = useConsoleCallbacks({ setState, submissionCaps, changeActiveComment });

  // --- Execution & cursor callbacks ---
  const {
    handleExecutionComplete,
    handleClearOutputs,
    handleContentChange,
    handleCursorChange,
    handleScrolledToComment,
  } = useExecutionHandlers({ setState, lastCursorRef });

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

  /***********************************************************************************
	/* Render
	/**********************************************************************************/

  // Build the actions context from all hook returns
  const consoleActions = React.useMemo<ConsoleActionsContextType>(
    () => ({
      comment: {
        addComment,
        saveComment,
        deleteComment,
        updateFeedback,
        removeRubricComment,
        onRubricCommentClick,
        changeActiveComment,
      },
      submission: {
        calculateGradeFromState,
        getPointsInFile,
        addLateDayCreditComment,
        toggleFinalized,
        updateGrader,
        claimSubmission,
        setRubric,
        submitStudentQuestion,
        deleteStudentQuestion,
        updateRegrade,
        turnOnReload,
        turnOffReload,
      },
      template: {
        handlePinComment,
        handleUpdateCommentLocation,
        handleApplyTemplate,
      },
      ai: {
        handleAcceptSuggestion,
        handleRejectSuggestion,
        handleGenerateFileSuggestions,
        handleGenerateSummary,
      },
      ui: {
        handleHighlightSelect,
        changeSelectedFile,
        showInlineTestsModal,
        hideInlineTestsModal,
        toggleCustomCommentExplorer,
        toggleEditRubricMode,
        setZoom,
        setVerticalOffset,
        toggleCursorMode,
        updateCursorDomain,
      },
      execution: {
        handleExecutionComplete,
        handleClearOutputs,
        handleContentChange,
        handleCursorChange,
        handleScrolledToComment,
      },
      session: {
        userEmail: props.user.email!,
        inDemoMode: props.inDemoMode,
        suggestedComments,
        isGeneratingFileSuggestions,
        suggestionsMeta,
        submissionSummary,
        isGeneratingSummary,
        summaryMeta,
        templateRefresh,
        templateForceUpdates,
      },
    }),
    // All hook returns are stable (memoized inside their hooks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      addComment, saveComment, deleteComment, updateFeedback, removeRubricComment,
      onRubricCommentClick, changeActiveComment,
      calculateGradeFromState, getPointsInFile, addLateDayCreditComment, toggleFinalized,
      updateGrader, claimSubmission, setRubric, submitStudentQuestion, deleteStudentQuestion,
      updateRegrade, turnOnReload, turnOffReload,
      handlePinComment, handleUpdateCommentLocation, handleApplyTemplate,
      handleAcceptSuggestion, handleRejectSuggestion, handleGenerateFileSuggestions, handleGenerateSummary,
      handleHighlightSelect, changeSelectedFile, showInlineTestsModal, hideInlineTestsModal,
      toggleCustomCommentExplorer, toggleEditRubricMode, setZoom, setVerticalOffset,
      toggleCursorMode, updateCursorDomain,
      handleExecutionComplete, handleClearOutputs, handleContentChange, handleCursorChange, handleScrolledToComment,
      props.user.email, props.inDemoMode,
      suggestedComments, isGeneratingFileSuggestions, suggestionsMeta,
      submissionSummary, isGeneratingSummary, summaryMeta,
      templateRefresh, templateForceUpdates,
    ],
  );

  const theme =
    consoleThemes.light === (context as React.ContextType<typeof ConsoleThemeContext>).consoleTheme ? 'light' : 'dark';

  // Capability-based (caps are always loaded before this code runs)
  const capViewTestResults = submissionCaps.view_test_results !== false;

  const layout = useConsoleLayout({
    userEmail: props.user.email!,
    userId: props.user.id,
    inDemoMode: props.inDemoMode,
    submissionCaps,
    comments,
    commentRubricComments,
    activeCommentID,
    rubricCategories,
    rubricComments,
    isCommentReadOnly,
    oldCommentIDs,
    addComment,
    saveComment,
    deleteComment,
    updateFeedback,
    removeRubricComment,
    changeActiveComment,
    handleHighlightSelect,
    toggleCursorMode,
    toggleFinalized,
    claimSubmission,
    calculateGradeFromState,
    updateCursorDomain,
    toggleCustomCommentExplorer,
    handlePinComment,
    handleUpdateCommentLocation,
    handleCursorChange,
    handleScrolledToComment,
    handleExecutionComplete,
    handleClearOutputs,
    handleContentChange,
    suggestedComments,
    isGeneratingFileSuggestions,
    suggestionsMeta,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    handleGenerateFileSuggestions,
    templateForceUpdates,
    setVerticalOffset,
    setZoom,
  });

  if (isLoading) {
    return <Loading />;
  }

  // layout === null means we hit an unexpected state
  if (layout === null) {
    return <div>We're not supposed to get here..</div>;
  }

  const {
    leftHeader,
    middleHeader,
    rightHeader,
    content,
    sider,
    siderIcons,
    siderTitles,
    siderTooltips,
    panelDefaultWidths,
  } = layout;

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
        <ConsoleActionsProvider value={consoleActions}>
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
            siderIcons={siderIcons}
            siderTitles={siderTitles}
            siderTooltips={siderTooltips}
            content={content}
            editRubricMode={editRubricMode}
            panelDefaultWidths={panelDefaultWidths}
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
        </ConsoleActionsProvider>
      </CourseContext.Provider>
    </div>
  );
};

export default CodeConsole;
