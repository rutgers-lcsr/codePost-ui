import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';
import {
  CURSOR_DOMAIN,
  ICodeConsoleProps,
  ICodeConsoleState,
  PANEL_TYPE,
  PERMISSION_LEVEL,
} from '../../types/CodeConsole.types';
import { useCodeConsoleStore } from '../../stores/useCodeConsoleStore';
import { compareRubricCategories, compareRubricComments } from '../../components/admin/assignments/rubric/RubricUtils';
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { CloseOutlined, EditOutlined } from '@ant-design/icons';

/* other library imports */
import { Button, Divider, Empty, message, Modal, Tag } from 'antd';
import _ from 'lodash';
import queryString from 'query-string';
import { useLocation, useParams } from 'react-router-dom';

/* codePost imports */
import Loading from '../../components/core/Loading';

import { getOsTriggerKeyFromEvent } from '../../components/core/operatingSystem';

import {
  Assignment,
  ICommentToRubricCommentMap,
  IFileToCommentsMap,
  IRubricCategoryToRubricCommentsMap,
} from '../../types/common';

import {
  assignmentFilesApi,
  assignmentsApi,
  commentTemplatesApi,
  commentsApi,
  coursesApi,
  submissionTestsApi,
  submissionsApi,
} from '../../api-client/clients';
import {
  Comment as ApiComment,
  Course,
  CourseRoster,
  PatchedComment,
  RubricCategory,
  RubricComment,
} from '../../api-client';
import {
  AssignmentFileType,
  AssignmentType,
  AnonymousSubmissionType,
  CommentTemplateType,
  CommentType,
  StudentTestCaseType,
  StudentSubmissionType,
  SubmissionTestType,
  TestCaseType,
  TestCategoryType,
} from '../../types/models';
import { FileType } from '../../utils/file';
import { Submission as SubmissionService } from '../../services/submission';
import { getLatestSubmissionTests } from '../../utils/submissionTests';

type FileWithId = FileType & { id: number; comments?: number[] };
type CursorSnapshot = { startLine: number; endLine?: number; startChar?: number; endChar?: number };
type RubricMenuUIProps = React.ComponentProps<typeof RubricMenuUI>['props'];

import CPButton from '../../components/core/CPButton';
import CPFlex from '../../components/core/CPFlex';
import StandardConsoleLayout from '../../components/core/layouts/StandardConsoleLayout';

import { GradeCode, StudentCode } from './code-panel/CodeContent';
import CodePanelLayout from './code-panel/CodePanelLayout';
import { CommentHighlightProvider } from './code-panel/CommentHighlightContext';
import { GradeComments, StudentComments } from './code-panel/Comments';
import ExecuteFileButton from './components/ExecuteFileButton';

import CursorToggle from '../../components/core/CursorToggle';
import ThemeToggle from '../../components/core/ThemeToggle';

import FileMenu, { FileMenuTitle, FileMenuTooltip } from './menu/FileMenu';
import HelpModal from './menu/HelpModal';
import TemplateMenu, { PinnedCommentsTooltip } from './menu/TemplateMenu';

const RubricMenuUI = React.lazy(() => import('./menu/RubricMenuUI'));

import InlineTestsModal from './components/InlineTestsModal';

import { ReadOnlySubmissionInfo, SubmissionInfo, SubmissionInfoTooltip } from './menu/SubmissionInfoMenu';

import layoutVars from '../../styles/layout/_layoutVars';

import { getDaysLate } from '../../components/utils/LateDays';
import { LOCAL_SETTINGS } from '../../components/utils/LocalSettings';

// Import test-related types from centralized types file
import { fetchTestData, StudentTestCasesByCategory, TestCasesByCategory } from './types';

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

import { getDemoPinnedTemplates, loadDemoGrader, loadDemoStudent } from './demo';

import RubricManager, { IRubricManagerParams, RubricTooltip } from '../../components/core/rubric/RubricManager';

import TestsMenu, { TestsMenuTooltip } from './menu/TestsMenu';

import { CourseContext, defaultCourse } from '../../components/core/Contexts';

import CustomCommentExplorer from './components/CustomCommentExplorer';

import { getCourseAISettings } from '../../utils/aiService';

/**********************************************************************************************************************/

/* f(logged in user, submission) */

// Type imports moved to ../../types/CodeConsole.types.ts
// Import: PANEL_TYPE, ICodeConsoleState, ICodeConsoleProps, CodeConsoleRouteParams

import {
  addCommentToState,
  addToCommentRubricCommentsState,
  calculateGrade,
  fileBouncer,
  linkRubricComment,
  pointsInFile,
  removeCommentFromState,
  removeFromCommentRubricCommentsState,
  unlinkRubricComment,
  updateCommentsState,
} from './codeConsoleUtils';

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
  const comments = useCodeConsoleStore((s) => s.comments);
  const permissionLevel = useCodeConsoleStore((s) => s.permissionLevel);
  const activeCommentID = useCodeConsoleStore((s) => s.activeCommentID);
  const assignment = useCodeConsoleStore((s) => s.assignment);
  const selectedFile = useCodeConsoleStore((s) => s.selectedFile) as FileWithId | undefined;
  const assignmentFiles = useCodeConsoleStore((s) => s.assignmentFiles);
  const commentRubricComments = useCodeConsoleStore((s) => s.commentRubricComments);
  const rubricCategories = useCodeConsoleStore((s) => s.rubricCategories);
  const rubricComments = useCodeConsoleStore((s) => s.rubricComments);
  const submission = useCodeConsoleStore((s) => s.submission);
  const readOnlySubmission = useCodeConsoleStore((s) => s.readOnlySubmission);
  const showKeyboardShortcuts = useCodeConsoleStore((s) => s.showKeyboardShortcuts);
  const graders = useCodeConsoleStore((s) => s.graders);
  const students = useCodeConsoleStore((s) => s.students);
  const isLoading = useCodeConsoleStore((s) => s.isLoading);
  const tests = useCodeConsoleStore((s) => s.tests);
  const testCases = useCodeConsoleStore((s) => s.testCases);
  const testCategories = useCodeConsoleStore((s) => s.testCategories);
  const inlineTestsModalVisible = useCodeConsoleStore((s) => s.showInlineTestsModal);
  const oldCommentIDs = useCodeConsoleStore((s) => s.oldCommentIDs);
  const codeZoom = useCodeConsoleStore((s) => s.codeZoom);
  const codeVerticalOffset = useCodeConsoleStore((s) => s.codeVerticalOffset);
  const demoCommentCounter = useCodeConsoleStore((s) => s.demoCommentCounter);
  const isStudent = useCodeConsoleStore((s) => s.isStudent);
  const editRubricMode = useCodeConsoleStore((s) => s.editRubricMode);
  const commentCounter = useCodeConsoleStore((s) => s.commentCounter);
  const commentRefreshCounter = useCodeConsoleStore((s) => s.commentRefreshCounter);
  const rubricReload = useCodeConsoleStore((s) => s.rubricReload);
  const cursorMode = useCodeConsoleStore((s) => s.cursorMode);
  const showCursor = useCodeConsoleStore((s) => s.showCursor);
  const showCustomCommentExplorer = useCodeConsoleStore((s) => s.showCustomCommentExplorer);
  const panelType = useCodeConsoleStore((s) => s.panelType);
  const hideGrades = useCodeConsoleStore((s) => s.hideGrades);
  const executionResults = useCodeConsoleStore((s) => s.executionResults);
  const aiEnabled = useCodeConsoleStore((s) => s.aiEnabled);
  const course = useCodeConsoleStore((s) => s.course);
  const noSave = useCodeConsoleStore((s) => s.noSave);
  const activeSiderKey = useCodeConsoleStore((s) => s.activeSiderKey);
  const showHelpModal = useCodeConsoleStore((s) => s.showHelpModal); // Added selector
  const isEditMode = useCodeConsoleStore((s) => s.isEditMode);
  // temporaryFileContent removed to prevent parent re-renders

  // Create a backwards-compatible state object from store
  const state: ICodeConsoleState = React.useMemo(
    () => ({
      permissionLevel,
      activeCommentID,
      assignment,
      commentRubricComments,
      comments,
      assignmentFiles,
      showKeyboardShortcuts,
      files,
      graders,
      students,
      isLoading,
      rubricCategories,
      rubricComments,
      submission,
      readOnlySubmission,
      tests,
      testCases,
      testCategories,
      showInlineTestsModal: inlineTestsModalVisible,
      selectedFile,
      oldCommentIDs,
      codeZoom,
      codeVerticalOffset,
      demoCommentCounter,
      isStudent,
      editRubricMode,
      commentCounter,
      commentRefreshCounter,
      rubricReload,
      cursorMode,
      showCursor,
      showCustomCommentExplorer,
      panelType,
      hideGrades,
      executionResults,
      aiEnabled,
      course,
      noSave,
      activeSiderKey,
      showHelpModal,
      isEditMode,
      // temporaryFileContent removed from state object to prevent re-renders
      // casting as any to satisfy interface without subscribing to store
      temporaryFileContent: {} as any,
    }),
    [
      permissionLevel,
      activeCommentID,
      assignment,
      commentRubricComments,
      comments,
      assignmentFiles,
      showKeyboardShortcuts,
      files,
      graders,
      students,
      isLoading,
      rubricCategories,
      rubricComments,
      submission,
      readOnlySubmission,
      tests,
      testCases,
      testCategories,
      inlineTestsModalVisible,
      selectedFile,
      oldCommentIDs,
      codeZoom,
      codeVerticalOffset,
      demoCommentCounter,
      isStudent,
      editRubricMode,
      commentCounter,
      commentRefreshCounter,
      rubricReload,
      cursorMode,
      showCursor,
      showCustomCommentExplorer,
      panelType,
      hideGrades,
      executionResults,
      aiEnabled,
      course,
      noSave,
      activeSiderKey,
      showHelpModal,
      isEditMode,
    ],
  );

  // Backwards-compatible setState that updates Zustand store
  const setState = React.useCallback((updater: React.SetStateAction<ICodeConsoleState>) => {
    const currentState = useCodeConsoleStore.getState();
    const stateObj: ICodeConsoleState = {
      permissionLevel: currentState.permissionLevel,
      activeCommentID: currentState.activeCommentID,
      assignment: currentState.assignment,
      commentRubricComments: currentState.commentRubricComments,
      comments: currentState.comments,
      assignmentFiles: currentState.assignmentFiles,
      showKeyboardShortcuts: currentState.showKeyboardShortcuts,
      files: currentState.files,
      graders: currentState.graders,
      students: currentState.students,
      isLoading: currentState.isLoading,
      rubricCategories: currentState.rubricCategories,
      rubricComments: currentState.rubricComments,
      submission: currentState.submission,
      readOnlySubmission: currentState.readOnlySubmission,
      tests: currentState.tests,
      testCases: currentState.testCases,
      testCategories: currentState.testCategories,
      showInlineTestsModal: currentState.showInlineTestsModal,
      selectedFile: currentState.selectedFile,
      oldCommentIDs: currentState.oldCommentIDs,
      codeZoom: currentState.codeZoom,
      codeVerticalOffset: currentState.codeVerticalOffset,
      demoCommentCounter: currentState.demoCommentCounter,
      isStudent: currentState.isStudent,
      editRubricMode: currentState.editRubricMode,
      commentCounter: currentState.commentCounter,
      commentRefreshCounter: currentState.commentRefreshCounter,
      rubricReload: currentState.rubricReload,
      cursorMode: currentState.cursorMode,
      showCursor: currentState.showCursor,
      showCustomCommentExplorer: currentState.showCustomCommentExplorer,
      panelType: currentState.panelType,
      hideGrades: currentState.hideGrades,
      executionResults: currentState.executionResults,
      aiEnabled: currentState.aiEnabled,
      course: currentState.course,
      noSave: currentState.noSave,
      activeSiderKey: currentState.activeSiderKey,
      showHelpModal: currentState.showHelpModal,
      isEditMode: currentState.isEditMode,
      temporaryFileContent: currentState.temporaryFileContent,
    };

    const newState = typeof updater === 'function' ? updater(stateObj) : updater;
    currentState.setState(newState);
  }, []);

  /***********************************************************************************************/
  /* Helper functions (converted from class methods)
	/***********************************************************************************************/

  // Track last active sidebar key for sticky toggle (Ctrl+B)
  const lastSiderKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (state.activeSiderKey) {
      lastSiderKeyRef.current = state.activeSiderKey;
    }
  }, [state.activeSiderKey]);

  // Keyboard event handlers (defined early for useEffect dependencies)
  const handleHotkeys = React.useCallback(
    (e: KeyboardEvent) => {
      const triggerKey = getOsTriggerKeyFromEvent(e);

      // Toggle Sidebar (Ctrl+B / Cmd+B) - Logic already exists, but adding Ctrl+Shift+B for Hide Grades
      // Use e.code to be robust against CapsLock and keyboard layouts
      if (e.code === 'KeyB' && triggerKey) {
        // Check for Shift -> Hide Grades
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          setState((prev) => ({ ...prev, hideGrades: !prev.hideGrades }));
          return;
        }

        // Normal Ctrl+B -> Toggle Sidebar
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => {
          if (prev.activeSiderKey) {
            // Close
            return { ...prev, activeSiderKey: null };
          } else {
            // Open (restore last or default)
            let target = lastSiderKeyRef.current;
            if (!target) {
              // Fallback default if no history
              target = prev.permissionLevel === PERMISSION_LEVEL.WRITE ? 'rubric-menu' : 'file-menu';
            }
            return { ...prev, activeSiderKey: target };
          }
        });
        return;
      }

      // Toggle Dark Mode (Ctrl+I / Cmd+I)
      if (e.code === 'KeyI' && triggerKey) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle logic tailored to how ThemeToggle works
        const currentMode = LOCAL_SETTINGS.darkMode.getter();
        const nextMode = !currentMode;

        // Update local settings
        LOCAL_SETTINGS.darkMode.setter(nextMode);

        // Force reload to apply theme
        window.location.reload();
        return;
      }

      // File Navigation (Alt + [ / Alt + ])
      if (e.altKey && (e.code === 'BracketLeft' || e.code === 'BracketRight')) {
        e.preventDefault();
        e.stopPropagation();

        setState((prev) => {
          const currentFiles = (prev.files || []) as FileWithId[];
          const selected = prev.selectedFile as FileWithId | undefined;
          if (currentFiles.length === 0 || !selected) return prev;

          const currentIndex = currentFiles.findIndex((f) => f.id === selected.id);
          if (currentIndex === -1) return prev;

          let newIndex = e.code === 'BracketRight' ? currentIndex + 1 : currentIndex - 1;

          // Cycle through files
          if (newIndex >= currentFiles.length) newIndex = 0;
          if (newIndex < 0) newIndex = currentFiles.length - 1;

          const nextFile = currentFiles[newIndex];

          // Update local settings side effect (optional, strictly side-effect in updater but acceptable here for consistency)
          LOCAL_SETTINGS.mostRecentFile.setter(nextFile.id);

          return {
            ...prev,
            selectedFile: nextFile,
            activeCommentID: undefined,
            panelType: PANEL_TYPE.FILE,
          };
        });
        return;
      }

      // Sidebar Tab Shortcuts configuration
      // Easier to edit: just add new entries here
      const SIDEBAR_TAB_SHORTCUTS: { [key: string]: string } = {
        KeyE: 'submission-info',
        KeyD: 'tests-menu',
        KeyF: 'file-menu',
        KeyG: 'rubric-menu',
        KeyH: 'template-menu',
      };

      if (triggerKey && e.shiftKey) {
        if (e.code === 'Slash') {
          // Toggle Help Modal
          e.preventDefault();
          e.stopPropagation();
          useCodeConsoleStore.getState().setShowHelpModal(!useCodeConsoleStore.getState().showHelpModal);
          return;
        }

        // Use e.code (KeyE, etc.)
        const targetTab = SIDEBAR_TAB_SHORTCUTS[e.code];

        if (targetTab) {
          e.preventDefault();
          e.stopPropagation();
          setState((prev) => ({ ...prev, activeSiderKey: targetTab }));
        }
      }
    },
    [setState],
  );

  const toggleCursorMode = React.useCallback(
    (cursorMode: boolean) => {
      setState((prev) => ({
        ...prev,
        cursorMode,
        showCursor: cursorMode ? CURSOR_DOMAIN.CODE : CURSOR_DOMAIN.CODE_HIDDEN,
      }));
    },
    [setState],
  );

  const focusActiveComment = React.useCallback(() => {
    const commentTextArea = document.getElementById('comment-text-area');
    commentTextArea?.focus();
  }, []);

  const blurActiveComment = React.useCallback(() => {
    const commentTextArea = document.getElementById('comment-text-area');
    commentTextArea?.blur();
  }, []);

  const handleCursor = React.useCallback(
    (e: KeyboardEvent) => {
      const triggerKey = getOsTriggerKeyFromEvent(e);

      // Help Modal - Ctrl+/ or Ctrl+? (Shift+/)
      if ((e.key === '/' || e.key === '?') && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        // Toggle Help Modal (consolidated from KeyboardShortcuts drawer)
        useCodeConsoleStore.getState().setShowHelpModal(!useCodeConsoleStore.getState().showHelpModal);
        return;
      }

      // Enable Cursor Mode: Ctrl+Shift+Y - check for 'Y' (uppercase when shift is held)
      if ((e.key === 'y' || e.key === 'Y') && triggerKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => ({
          ...prev,
          cursorMode: !prev.cursorMode,
          showCursor: !prev.cursorMode ? CURSOR_DOMAIN.CODE : CURSOR_DOMAIN.CODE_HIDDEN,
        }));
        return;
      }

      setState((prev) => {
        if (!prev.cursorMode || !prev.selectedFile) return prev;

        if (prev.activeCommentID !== undefined) {
          if (e.key === 'y' && triggerKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            if (prev.showCursor === CURSOR_DOMAIN.RUBRIC) {
              focusActiveComment();
              return { ...prev, showCursor: CURSOR_DOMAIN.CODE_HIDDEN };
            } else {
              blurActiveComment();
              return { ...prev, showCursor: CURSOR_DOMAIN.RUBRIC };
            }
          } else if (e.key === 'e' && triggerKey && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            return { ...prev, showCursor: CURSOR_DOMAIN.CODE, activeCommentID: undefined };
          }
        } else {
          if (e.key === 'e' && triggerKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            const selected = prev.selectedFile as FileWithId | undefined;
            const hasComments = selected ? prev.comments[selected.id]?.length > 0 : false;
            return hasComments ? { ...prev, showCursor: CURSOR_DOMAIN.COMMENTS } : prev;
          } else if (e.key === 'e' && triggerKey && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            return { ...prev, showCursor: CURSOR_DOMAIN.CODE };
          }
        }

        return prev;
      });
    },
    [blurActiveComment, focusActiveComment, setState],
  );

  const loadDemoData = React.useCallback(
    (filesToLoad: Array<{ name: string; data: string }>, studentSample?: boolean) => {
      const demoState =
        studentSample !== undefined && studentSample
          ? loadDemoStudent(filesToLoad, props.user.email!)
          : loadDemoGrader(filesToLoad, props.user.email!);

      setState((prev) => ({ ...prev, ...demoState }));
    },
    [props.user.email, setState],
  );

  const isCourseAdmin = React.useCallback(
    (assignmentToCheck: AssignmentType | undefined) => {
      if (!assignmentToCheck || !assignmentToCheck.course) {
        return false;
      }

      return props.user.courseadminCourses
        .map((course) => {
          return course.id;
        })
        .includes(assignmentToCheck.course);
    },
    [props.user.courseadminCourses],
  );

  const isSuperGrader = React.useCallback(
    (assignmentToCheck: AssignmentType | undefined) => {
      if (!assignmentToCheck || !assignmentToCheck.course) {
        return false;
      }
      if (isCourseAdmin(assignmentToCheck)) return true;

      return props.user.superGraderCourses
        .map((course) => {
          return course.id;
        })
        .includes(assignmentToCheck.course);
    },
    [isCourseAdmin, props.user.superGraderCourses],
  );

  // Component mount logic
  const componentDidMountLogic = React.useCallback(async () => {
    // CommandBar loading callbacks

    // Other stuff

    const queryValues = queryString.parse(location.search);

    if (props.inDemoMode) {
      document.title = 'codePost | Code Console Demo';

      /**********************************************************************************/
      /* BEGIN: QUERY ARG PARSING
			/**********************************************************************************/

      if (queryValues.sample && queryValues.sample === '1') {
        loadDemoData([], true);
      } else {
        loadDemoData([], false);
      }

      /**********************************************************************************/
      /* END: QUERY ARG PARSING
			/**********************************************************************************/

      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Set window title
    const submissionIdParam = params.submissionId;
    if (!submissionIdParam) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }
    const submissionID: number = +submissionIdParam.valueOf();

    let permissionLevel: PERMISSION_LEVEL;
    try {
      const permissions = await submissionsApi.checkPermissionRetrieve({ id: submissionID });
      if (permissions.write) {
        permissionLevel = PERMISSION_LEVEL.WRITE;
      } else if (permissions.filesOnly) {
        permissionLevel = PERMISSION_LEVEL.READ_FILES_ONLY;
      } else if (permissions.read) {
        permissionLevel = PERMISSION_LEVEL.READ;
      } else {
        permissionLevel = PERMISSION_LEVEL.NONE;
      }
    } catch (error) {
      console.error('Failed to fetch submission permissions', error);
      permissionLevel = PERMISSION_LEVEL.NOT_FOUND;
    }

    const values = queryString.parse(location.search);
    let simulatingStudent = false;

    // Check for permissionLevel override in query params (admin only)
    // permissionLevel: 0=NOT_FOUND, 1=NONE, 2=READ, 3=READ_FILES_ONLY, 4=WRITE
    if (values.permissionLevel !== undefined && permissionLevel === PERMISSION_LEVEL.WRITE) {
      const levelOverride = parseInt(values.permissionLevel as string);
      if (!isNaN(levelOverride)) {
        if (levelOverride === 0) {
          permissionLevel = PERMISSION_LEVEL.NOT_FOUND;
        } else if (levelOverride === 1) {
          permissionLevel = PERMISSION_LEVEL.NONE;
        } else if (levelOverride === 2) {
          permissionLevel = PERMISSION_LEVEL.READ;
        } else if (levelOverride === 3) {
          permissionLevel = PERMISSION_LEVEL.READ_FILES_ONLY;
        } else if (levelOverride === 4) {
          permissionLevel = PERMISSION_LEVEL.WRITE;
        }
      }
    }

    if (permissionLevel === PERMISSION_LEVEL.WRITE && values.student !== undefined) {
      permissionLevel = PERMISSION_LEVEL.READ;
      simulatingStudent = true;
    }

    let noSave = false;
    if (values.noSave !== undefined) {
      noSave = true;
    }

    // Everything we need to load
    let submission: StudentSubmissionType | AnonymousSubmissionType | undefined;
    let assignment: AssignmentType;
    let files: FileWithId[] = [];
    let comments: IFileToCommentsMap = {};
    let commentRubricComments: ICommentToRubricCommentMap = {};
    let course: Course | undefined;
    let rubricCategories: RubricCategory[] = [];
    let rubricComments: IRubricCategoryToRubricCommentsMap = {};
    let selectedFile: FileWithId | undefined;
    let tests: SubmissionTestType[];
    let panelTypeOverride: PANEL_TYPE | undefined;
    let activeSiderKeyOverride: string | undefined;

    if (queryValues.tab !== undefined) {
      const tabValue = queryValues.tab as string;
      // Check if it's a sidebar key string (e.g., 'tests-menu', 'file-menu')
      if (tabValue === 'tests-menu') {
        activeSiderKeyOverride = 'tests-menu';
        panelTypeOverride = PANEL_TYPE.TESTS;
      } else if (tabValue === 'file-menu') {
        activeSiderKeyOverride = 'file-menu';
        panelTypeOverride = PANEL_TYPE.FILE;
      } else if (tabValue === 'submission-info' || tabValue === 'rubric-menu' || tabValue === 'template-menu') {
        activeSiderKeyOverride = tabValue;
        // Keep default for panelTypeOverride (show file in main content)
      } else {
        // Legacy: numeric PANEL_TYPE
        const t = parseInt(tabValue);
        if (!isNaN(t)) {
          panelTypeOverride = t;
          activeSiderKeyOverride = t === PANEL_TYPE.TESTS ? 'tests-menu' : 'file-menu';
        }
      }
    }

    switch (permissionLevel) {
      case PERMISSION_LEVEL.NOT_FOUND:
      case PERMISSION_LEVEL.NONE: {
        // Will trigger 403 or 404 message in render
        setState((prev) => ({ ...prev, permissionLevel, isLoading: false }));
        break;
      }
      case PERMISSION_LEVEL.READ_FILES_ONLY: {
        // load the data with files only (no comments, rubrics, or grades)
        const res = await fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionID}/?filesOnly=true`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!res.ok) {
          setState((prev) => ({ ...prev, permissionLevel: PERMISSION_LEVEL.NONE, isLoading: false }));
          break;
        }

        const submissionData: StudentSubmissionType = await res.json();
        assignment = (await assignmentsApi.retrieve({ id: submissionData.assignment })) as unknown as AssignmentType;

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        course = (await coursesApi.retrieve({ id: assignment.course })) as unknown as Course;

        // Files are already included in the response as full objects
        files = (submissionData.files as FileWithId[]) || [];

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        files = fileBouncer(files) as FileWithId[];

        if (selectedFile === undefined && files.length > 0) {
          selectedFile = files[0];
        }

        // No comments, rubrics, or tests in files-only mode
        comments = {};
        commentRubricComments = {};
        rubricCategories = [];
        tests = [];

        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          readOnlySubmission: submissionData,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          isLoading: false,
          selectedFile,
          permissionLevel,
          testCategories: [],
          testCases: {},
          tests: [],
          isStudent: true,
        }));

        break;
      }
      case PERMISSION_LEVEL.READ: {
        // load the data a reader has access to
        submission = (await submissionsApi.retrieve({ id: submissionID })) as unknown as StudentSubmissionType;
        [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            assignmentsApi.retrieve({ id: submission.assignment }).then((a) => a as unknown as AssignmentType),
            SubmissionService.loadData(submission) as unknown as [
              FileWithId[],
              IFileToCommentsMap,
              ICommentToRubricCommentMap,
            ],
            assignmentsApi.rubricRetrieve({ id: submission.assignment }).then((res) => {
              const rubric = res as unknown as { rubricCategories: RubricCategory[]; rubricComments: RubricComment[] };
              const rCats = (rubric.rubricCategories || [])
                .map((cat) => ({
                  ...cat,
                  pointLimit: cat.pointLimit === undefined ? null : cat.pointLimit,
                }))
                .sort(compareRubricCategories);
              const rComms: IRubricCategoryToRubricCommentsMap = {};
              rCats.forEach((cat) => {
                rComms[cat.id] = (rubric.rubricComments || [])
                  .filter((c) => c.category === cat.id)
                  .sort(compareRubricComments);
              });
              return { rubricCategories: rCats, rubricComments: rComms };
            }),
          ]);

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        course = await coursesApi.retrieve({ id: assignment.course }).then((c) => c as unknown as Course);

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        files = fileBouncer(files) as FileWithId[];

        if (selectedFile === undefined && files.length > 0) {
          if (typeof queryValues.file === 'string') {
            selectedFile = files.find((f) => f.name === queryValues.file);
          }

          if (selectedFile === undefined && typeof queryValues.comment === 'string') {
            const matchingFile = files.find((el) =>
              el.comments?.some((c: number) => c === parseInt(queryValues.comment as string)),
            );
            selectedFile = matchingFile || files[0];
          } else if (selectedFile === undefined) {
            selectedFile =
              files.find((f) => {
                return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
              }) || files[0];
          }
        }

        // Read tests
        const { testCases, testCategories } = (await assignmentsApi.studentTestsRetrieve({
          id: assignment.id,
        })) as unknown as { testCases: StudentTestCaseType[]; testCategories: TestCategoryType[] };
        const caseObj: StudentTestCasesByCategory = {};
        testCategories.forEach((category) => {
          caseObj[category.id] = [];
        });
        testCases.forEach((testCase) => {
          caseObj[testCase.testCategory] = [...caseObj[testCase.testCategory], testCase];
        });
        tests = submission.tests
          ? await Promise.all(submission.tests.map((id) => submissionTestsApi.retrieve({ id })))
          : [];

        // then store it in state
        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          readOnlySubmission: submission as StudentSubmissionType,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          isLoading: false,
          selectedFile,
          permissionLevel,
          testCategories,
          testCases: caseObj,
          tests: getLatestSubmissionTests(tests),
          isStudent:
            simulatingStudent ||
            (submission?.students !== undefined && submission.students.indexOf(props.user.email!) > -1),
          panelType: panelTypeOverride !== undefined ? panelTypeOverride : prev.panelType,
          activeSiderKey: activeSiderKeyOverride ?? prev.activeSiderKey,
        }));

        if (assignment && assignment.liveFeedbackMode) {
          // reloadCommentsInterval.current = window.setInterval(() => {
          //   reloadComments();
          // }, LIVE_FEEDBACK_COMMENTS_RELOAD_INTERVAL);
        }

        break;
      }

      case PERMISSION_LEVEL.WRITE: {
        // load the data a writer has access to

        const writableSubmission = (await submissionsApi.retrieve({ id: submissionID })) as AnonymousSubmissionType;
        [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            assignmentsApi.retrieve({ id: writableSubmission.assignment }).then((a) => a as unknown as AssignmentType),
            SubmissionService.loadData(writableSubmission) as unknown as [
              FileWithId[],
              IFileToCommentsMap,
              ICommentToRubricCommentMap,
            ],
            assignmentsApi.rubricRetrieve({ id: writableSubmission.assignment }).then((res) => {
              const rubric = res as unknown as { rubricCategories: RubricCategory[]; rubricComments: RubricComment[] };
              const rCats = (rubric.rubricCategories || [])
                .map((cat) => ({
                  ...cat,
                  pointLimit: cat.pointLimit ?? null,
                }))
                .sort(compareRubricCategories);
              const rComms: IRubricCategoryToRubricCommentsMap = {};
              rCats.forEach((cat) => {
                rComms[cat.id] = (rubric.rubricComments || [])
                  .filter((c) => c.category === cat.id)
                  .sort(compareRubricComments);
              });
              return { rubricCategories: rCats, rubricComments: rComms };
            }),
          ]);

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        course = await coursesApi.retrieve({ id: assignment.course }).then((c) => c as unknown as Course);
        let assignmentFiles: AssignmentFileType[] = [];
        if (assignment.templateMode) {
          assignmentFiles = await Promise.all(
            (assignment.files ?? []).map((assignmentFileOrID) => {
              if (typeof assignmentFileOrID !== 'number') {
                return assignmentFileOrID;
              }
              return assignmentFilesApi.retrieve({ id: assignmentFileOrID });
            }),
          );
        }

        // load the data only an admin or super grader has access to
        let graders: string[] = [];
        let students: string[] = [];

        const isSuperGrader = props.user.superGraderCourses.some((c) => c.id === assignment.course);

        if (isCourseAdmin(assignment) || isSuperGrader) {
          const roster = (await coursesApi.rosterRetrieve({
            id: assignment.course,
          })) as unknown as CourseRoster;
          graders = [...(roster.graders || []), ...(roster.courseAdmins || [])].filter(
            (grader): grader is string => typeof grader === 'string',
          );
          students = (roster.students || []).filter((student): student is string => typeof student === 'string');
        }

        tests = await Promise.all(writableSubmission.tests.map((id) => submissionTestsApi.retrieve({ id })));
        const [categories, cases] = await fetchTestData(assignment);

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        files = fileBouncer(files) as FileWithId[];

        if (selectedFile === undefined && files.length > 0 && panelTypeOverride !== PANEL_TYPE.TESTS) {
          if (typeof queryValues.file === 'string') {
            selectedFile = files.find((f) => f.name === queryValues.file);
          }

          if (selectedFile === undefined && typeof queryValues.comment === 'string') {
            const matchingFile = files.find((el) =>
              el.comments?.some((c: number) => c === parseInt(queryValues.comment as string)),
            );
            selectedFile = matchingFile || files[0];
          } else if (selectedFile === undefined) {
            selectedFile =
              files.find((f) => {
                return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
              }) || files[0];
          }
        }

        // fill in grade using available data if submission doesn't contain an up-to-date grade
        let submissionWithGrade: AnonymousSubmissionType = writableSubmission;
        if (assignment && !writableSubmission.isFinalized) {
          const testCasesArray: TestCaseType[] = Array.isArray(cases) ? cases : Object.values(cases).flat();
          const calculatedGrade = calculateGrade(
            assignment,
            comments,
            commentRubricComments,
            rubricCategories,
            files,
            getLatestSubmissionTests(tests),
            testCasesArray,
          );
          submissionWithGrade = { ...writableSubmission, grade: calculatedGrade };
        }

        // Fetch AI settings for this course
        let aiEnabled = false;
        try {
          const aiSettings = await getCourseAISettings(course!.id);
          aiEnabled = aiSettings.aiCommentsEnabled ?? aiSettings.aiEnabled;
        } catch {
          // AI settings not available or user doesn't have permission
          aiEnabled = false;
        }

        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          submission: submissionWithGrade,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          rubricComments,
          graders,
          students,
          isLoading: false,
          selectedFile,
          permissionLevel,
          assignmentFiles,
          tests: getLatestSubmissionTests(tests),
          testCategories: Array.isArray(categories) ? categories : [],
          testCases: cases as TestCasesByCategory,
          aiEnabled,
          panelType: panelTypeOverride !== undefined ? panelTypeOverride : prev.panelType,
          activeSiderKey: activeSiderKeyOverride ?? prev.activeSiderKey,
        }));
        break;
      }
    }
  }, [
    isCourseAdmin,
    loadDemoData,
    location.search,
    params.submissionId,
    props.inDemoMode,
    props.user.email,
    props.user.superGraderCourses,
    setState,
  ]);

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

  const selectedFileId = (state.selectedFile as FileWithId | undefined)?.id;

  React.useEffect(() => {
    lastCursorRef.current = null;
  }, [selectedFileId]);

  // NOTE: URL sync effect was removed.
  // - URL params (tab, file) are only read on initial load in componentDidMountLogic
  // - URL is only updated when claiming a new submission (same assignment)
  // - Internal state (panelType, selectedFile, activeSiderKey) is now the source of truth

  const updateCursorDomain = React.useCallback(
    (domain: CURSOR_DOMAIN) => {
      setState((prev) => ({
        ...prev,
        showCursor: domain,
        activeCommentID: domain === CURSOR_DOMAIN.CODE ? undefined : prev.activeCommentID,
      }));
    },
    [setState],
  );

  /***********************************************************************************
	/* Loading methods
	/**********************************************************************************/

  // Note: setNewFilesWarning, checkForNewFiles, and onEscKeyPress functions are
  // currently unused in the functional component implementation.

  /***********************************************************************************
	/* Handlers
	/**********************************************************************************/

  const changeActiveComment = React.useCallback(
    (id: number | undefined): void => {
      setState((prev) => {
        if (id === undefined) {
          const newCursor =
            prev.showCursor === CURSOR_DOMAIN.CODE_HIDDEN
              ? CURSOR_DOMAIN.CODE
              : prev.showCursor === CURSOR_DOMAIN.COMMENTS_HIDDEN
                ? CURSOR_DOMAIN.COMMENTS
                : CURSOR_DOMAIN.CODE;
          return { ...prev, activeCommentID: id, showCursor: newCursor };
        } else {
          const newCursor =
            prev.showCursor === CURSOR_DOMAIN.CODE
              ? CURSOR_DOMAIN.CODE_HIDDEN
              : prev.showCursor === CURSOR_DOMAIN.COMMENTS
                ? CURSOR_DOMAIN.COMMENTS_HIDDEN
                : CURSOR_DOMAIN.CODE_HIDDEN;
          return { ...prev, activeCommentID: id, showCursor: newCursor };
        }
      });
    },
    [setState],
  );

  const handleHighlightSelect = React.useCallback(
    (commentId: number, _event?: React.MouseEvent) => {
      if (commentId === 0 || commentId === Number.MAX_SAFE_INTEGER) {
        return;
      }

      if (permissionLevel === PERMISSION_LEVEL.WRITE) {
        changeActiveComment(commentId);
      }

      window.requestAnimationFrame(() => {
        const commentElement = document.getElementById(`comment-${commentId}`);
        commentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [changeActiveComment, permissionLevel],
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

  const submitStudentQuestion = async (submission: StudentSubmissionType, text: string, isRegrade: boolean) => {
    const newSubmission = await SubmissionService.updateQuestion(submission.id, {
      questionText: text,
      questionIsRegrade: isRegrade,
    });
    setState((prev) => ({ ...prev, readOnlySubmission: newSubmission }));

    return newSubmission;
  };

  const deleteStudentQuestion = async (submission: StudentSubmissionType) => {
    const newSubmission = await SubmissionService.deleteQuestion(submission.id, {});
    setState((prev) => ({ ...prev, readOnlySubmission: newSubmission }));

    return newSubmission;
  };

  const addLateDayCreditComment = async (lateDayCreditsUsed: number) => {
    // -- Add a LateDayCredit Comment --
    //
    // * Clear the submission of all other comments tagged with 'late'
    // * Update Submission.lateDayCreditsUsed
    // * Add, save the template comment
    // * Unfocus the new comment

    if (state.course === undefined || state.course.lateDayCreditsAllowable === null) {
      return;
    }

    if (assignment === undefined || !assignment.allowStudentUpload) {
      return;
    }

    if (submission === undefined) {
      return;
    }

    if (files.length === 0) {
      return;
    }

    const firstFile = files[0];

    const daysLate = getDaysLate(assignment, submission);
    const daysLateAfterCredit = daysLate - lateDayCreditsUsed;

    const text = `
\`\`\`
Days Late:                 ${daysLate}
Late Credits Used:         ${lateDayCreditsUsed}
Days Late (After Credit):  ${daysLateAfterCredit}
\`\`\`
`;

    const lateDayCreditComment: CommentType = {
      startLine: 1,
      endLine: 1,
      startChar: 0,
      endChar: 1,
      id: state.commentCounter,
      file: firstFile.id,
      pointDelta: 0.0,
      text,
      rubricComment: null,
      author: props.user.email,
      feedback: 0,
      tags: ['late'],
      color: '',
    };

    const submissionPayload = {
      id: submission!.id,
      lateDayCreditsUsed,
    };

    try {
      await SubmissionService.update(submissionPayload);

      let promises: Promise<void>[] = [];
      // Clear previous LateDay comments
      for (const fileID of Object.keys(comments)) {
        promises = [
          ...promises,
          ...comments[+fileID].map(async (comment: CommentType) => {
            if (comment.tags !== undefined && comment.tags.includes('late')) {
              await deleteComment(comment);
            }
          }),
        ];
      }

      await Promise.all(promises);

      addComment(lateDayCreditComment, firstFile);
      saveComment(lateDayCreditComment);
      setState((prev) => ({ ...prev, activeCommentID: undefined }));
      return true;
    } catch {
      return false;
    }
  };

  // Usually adds a blank comment to the submission state
  const addComment = (comment: CommentType, file: FileType) => {
    const fileWithId = file as FileWithId;
    console.log('[CodeConsole] addComment called', {
      commentId: comment.id,
      fileId: fileWithId.id,
      startLine: comment.startLine,
      endLine: comment.endLine,
      stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n'), // Show call stack
    });

    try {
      if (submission && submission.grader === null) {
        updateGrader(submission, props.user.email);
      }
    } catch {
      console.log('comment author isnt enrolled as a grader');
    }

    const nextComments = addCommentToState(comments, comment, fileWithId);
    setState((prev) => ({
      ...prev,
      comments: nextComments,
      activeCommentID: comment.id,
      commentCounter: state.commentCounter - 1,
    }));
  };

  const updateComment = (commentID: number, newComment: CommentType, newRubricComment?: RubricComment) => {
    const nextComments = updateCommentsState(comments, commentID, newComment);

    // We optimistically update the state before the backend confirms
    const nextCommentRubricComments = addToCommentRubricCommentsState(
      state.commentRubricComments,
      commentID,
      newRubricComment,
    );

    setState((prev) => ({ ...prev, comments: nextComments, commentRubricComments: nextCommentRubricComments }));
  };

  const saveComment = async (comment: CommentType) => {
    console.log('[CodeConsole] saveComment called', {
      commentId: comment.id,
      startLine: comment.startLine,
      endLine: comment.endLine,
      text: comment.text,
      stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n'),
    });

    let savedComment: CommentType = comment;
    let oldCommentIDs = state.oldCommentIDs;

    if (!props.inDemoMode && !state.noSave) {
      if (comment.id < 0) {
        console.log('[CodeConsole] Creating comment via commentsApi.create', comment.id);
        savedComment = await commentsApi.create({ comment: comment as unknown as ApiComment });
        console.log('[CodeConsole] Comment created, new ID:', savedComment.id);
        oldCommentIDs = { ...oldCommentIDs, [savedComment.id]: comment.id };

        // We need to prevent the following race condition error:
        // 1. User creates a comment => triggers a POST
        // 2. User deletes comment before the POST returns. The UI will treat this comment as unsaved
        // 3. POST returns, saving the comment.
        // Solution: Check if the comment with the OLD negative ID still exists in current state
        if (
          !_.flatten(Object.values(comments)).find((el: CommentType) => {
            return el.id === comment.id;
          })
        ) {
          // Comment was deleted while save was in progress
          // Delete the newly created backend comment immediately
          console.log('[Comment Race Condition] Deleting comment', savedComment.id, 'that was saved after UI deletion');
          if (savedComment.id > 0) {
            await commentsApi.destroy({ id: savedComment.id }).then(() => updateSubmissionGrade());
          }
          return;
        }
      } else {
        savedComment = await commentsApi.partialUpdate({
          id: comment.id,
          patchedComment: { ...comment } as PatchedComment,
        });
      }
    } else {
      if (comment.id < 0) {
        // In demo mode, we want to simulate the saving of a comment without actually saving anything.
        // To do this, we need to make up a positive comment id for the comments we "save"
        //
        // Note that the id we use can collide with existing comment IDs, because we never
        // make any API call to interact with the comment whose ID corresponds to the ID we assign here
        savedComment = { ...comment, id: state.demoCommentCounter + 1 };
        oldCommentIDs = { ...oldCommentIDs, [savedComment.id]: comment.id };

        // we want to keep track of the order in which demo comments are created, so we can highlight
        // them precisely. For example, we may want to show one tooltip for the first comment made by
        // a user participating in the demo, and a different tooltip for the second comment.
        setState((oldState) => ({
          ...oldState,
          demoCommentCounter: oldState.demoCommentCounter + 1,
        }));
      }
    }

    setState((prev) => ({ ...prev, oldCommentIDs }));
    updateComment(comment.id, savedComment);
  };

  const deleteComment = async (comment: CommentType) => {
    // Delete from backend if it's a saved comment (positive ID)
    if (comment.id > 0 && !props.inDemoMode && !state.noSave) {
      await commentsApi.destroy({ id: comment.id }).then(() => updateSubmissionGrade());
    }

    // If this comment has a negative ID but was saved (in oldCommentIDs mapping),
    // we need to also delete the saved version to prevent respawning on reload
    if (comment.id < 0 && !props.inDemoMode && !state.noSave) {
      // Find if this negative ID was mapped to a positive ID (comment was saved)
      const savedCommentId = Object.keys(state.oldCommentIDs).find(
        (positiveId) => state.oldCommentIDs[+positiveId] === comment.id,
      );
      if (savedCommentId) {
        console.log('[Comment Delete] Also deleting saved version', savedCommentId, 'of comment', comment.id);
        await commentsApi.destroy({ id: +savedCommentId }).then(() => updateSubmissionGrade());
      }
    }

    const nextComments = removeCommentFromState(comments, comment);
    const [, nextCommentRubricComments] = removeFromCommentRubricCommentsState(commentRubricComments, comment.id);

    setState((prev) => ({ ...prev, comments: nextComments, commentRubricComments: nextCommentRubricComments }));
    // We will never be in a situation in which we have an active comment immediately after
    // deleting a comment. Either
    // (1) we deleted the active comment, so it's no longer active
    // (2) we deleted a different comment, which closed any previously active comment
    changeActiveComment(undefined);
  };

  const updateFeedback = (fileID: number, commentID: number, feedbackNum: number) => {
    commentsApi
      .feedbackPartialUpdate({
        id: commentID,
        patchedComment: { feedback: feedbackNum } as PatchedComment,
      })
      .then((newComment) => {
        setState((oldState) => {
          const newMap = { ...oldState.comments };
          // Update the comment in place to maintain order
          newMap[fileID] = newMap[fileID].map((el) => {
            return el.id === commentID ? newComment : el;
          });
          return { ...oldState, comments: newMap };
        });
      })
      .catch((error) => {
        console.error('Failed to update comment feedback:', error);
        message.error('Failed to update feedback. Please try again.');
      });
  };

  const removeRubricComment = (comment: CommentType, rubricComment: RubricComment) => {
    const nextComments = unlinkRubricComment(comments, comment, rubricComment);
    const [, nextCommentRubricComments] = removeFromCommentRubricCommentsState(commentRubricComments, comment.id);

    setState((prev) => ({ ...prev, comments: nextComments, commentRubricComments: nextCommentRubricComments }));
  };

  const onRubricCommentClick = (rubricComment: RubricComment): void => {
    if (!activeCommentID) {
      message.warning(
        `You must open a comment before applying a rubric comment. Click an existing comment,
				or highlight some code to create a new one.`,
        5,
      );
      return;
    }

    // If this category requires "at most once", check to see if we've applied a comment from this
    // category somewhere else.
    const category = rubricCategories.find((el) => el.id === rubricComment.category);
    if (category !== undefined && category.atMostOnce) {
      const siblings = rubricComments[rubricComment.category].map((el) => el.id);
      const hasApplied = Object.values(comments)
        .flat()
        .some((el) => siblings.indexOf(el.rubricComment) > -1 && el.id !== activeCommentID);
      if (hasApplied) {
        message.warning("You can't apply more than one rubric comment from this rubric category.");
        return;
      }
    }

    const nextComments = linkRubricComment(comments, rubricComment, activeCommentID);

    if (nextComments === undefined) {
      return;
    }

    if (state.showCursor === CURSOR_DOMAIN.RUBRIC) {
      focusActiveComment();
      setState((prev) => ({ ...prev, showCursor: CURSOR_DOMAIN.CODE_HIDDEN }));
    }

    const nextCommentRubricComments = addToCommentRubricCommentsState(
      commentRubricComments,
      activeCommentID,
      rubricComment,
    );

    setState((prev) => ({
      ...prev,
      comments: nextComments,
      commentRubricComments: nextCommentRubricComments,
      showCursor: CURSOR_DOMAIN.CODE_HIDDEN,
    }));
  };

  const calculateGradeFromState = (): number | undefined => {
    if (!(submission || readOnlySubmission) || !assignment) {
      return undefined;
    }

    return calculateGrade(
      assignment,
      comments,
      commentRubricComments,
      rubricCategories,
      files,
      state.tests,
      Object.values(state.testCases).flat() as TestCaseType[],
    );
  };

  const getPointsInFile = (file: FileWithId): number[] => {
    // If, for some reason, the file is not in comments, don't have a fatal error
    const fileComments = comments[file.id] || [];
    return pointsInFile(file, fileComments, commentRubricComments);
  };

  const updateSubmissionGrade = () => {
    if (submission) {
      const grade = calculateGradeFromState();
      if (grade) {
        const updatedSubmission = { ...submission, grade };
        setState((prev) => ({ ...prev, submission: updatedSubmission }));
      }
    }
  };

  const toggleCustomCommentExplorer = () => {
    setState((oldState) => ({
      ...oldState,
      showCustomCommentExplorer: !oldState.showCustomCommentExplorer,
    }));
  };

  const toggleFinalized = async () => {
    if (!submission) {
      return;
    }

    if (props.inDemoMode || state.noSave) {
      setState((oldState: ICodeConsoleState) => {
        // We need to update the submission object in the same way it would be updated
        // if update below was actually sent.
        const newIsFinalized = !oldState.submission!.isFinalized;

        if (newIsFinalized) {
          message.success('Succcessfully finalized submission');
        } else {
          message.success('Succcessfully unfinalized submission');
        }

        return {
          ...oldState,
          submission: {
            ...oldState.submission!,
            isFinalized: newIsFinalized,
            grade: calculateGradeFromState()!,
          },
        };
      });
      return;
    }

    let payload: { id: number; isFinalized: boolean; grader?: string } = {
      id: submission.id,
      isFinalized: !submission.isFinalized,
    };

    // if trying to finalize with only one grader available, set the grader
    if (state.graders.length === 1 && !submission.isFinalized) {
      payload = { ...payload, grader: state.graders[0] };
    }

    try {
      const updatedSubmission: StudentSubmissionType | AnonymousSubmissionType =
        await SubmissionService.update(payload);

      if (updatedSubmission.isFinalized) {
        message.success('Successfully finalized submission');
      } else {
        message.success('Successfully unfinalized submission');
      }

      setState((prev) => ({ ...prev, submission: { ...updatedSubmission, files: updatedSubmission.files || [] } }));
    } catch (error) {
      message.error(`Error updating submission: ${JSON.stringify(error)}`);
    }
  };

  const updateGrader = (sub: AnonymousSubmissionType, graderUsername: string | undefined) => {
    const payload = {
      id: sub.id,
      isFinalized: false,
      grader: graderUsername,
    };

    return SubmissionService.update(payload).then((submission) => {
      setState((prev) => ({ ...prev, submission: { ...submission, files: submission.files || [] } }));
      return { ...submission, files: submission.files || [] };
    });
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
    setState((prev) => ({ ...prev, editRubricMode: !state.editRubricMode }));
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
    (result: { success: boolean; output_data?: unknown; error?: string | null; file_id?: number }) => {
      const fileId = result.file_id || selectedFile?.id;
      if (fileId) {
        const normalizedResult = {
          ...result,
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
      _.debounce((content: string) => {
        const currentSelectedFile = useCodeConsoleStore.getState().selectedFile as FileWithId | undefined;
        if (currentSelectedFile) {
          useCodeConsoleStore.getState().setTemporaryFileContent(currentSelectedFile.id, content);
        }
      }, 500),
    [],
  );

  /***********************************************************************************************/
  /* Rubric Updates
	/***********************************************************************************************/
  // Given an updated rubric, we make sure that all relevant objects stored in state reflect the changes
  const setRubric = (rubric: {
    rubricCategories: RubricCategory[];
    rubricComments: IRubricCategoryToRubricCommentsMap;
  }) => {
    const newCommentRubricComments: ICommentToRubricCommentMap = {};

    for (const commentID of Object.keys(commentRubricComments)) {
      const oldRubricComment = commentRubricComments[+commentID];

      const newRubricComment = rubric.rubricComments[oldRubricComment.category].find((rubricComment: RubricComment) => {
        return rubricComment.id === oldRubricComment.id;
      });

      if (newRubricComment) {
        newCommentRubricComments[+commentID] = newRubricComment;
      }
    }

    setState((prev) => ({
      ...prev,
      rubricCategories: rubric.rubricCategories,
      rubricComments: rubric.rubricComments,
      commentRubricComments: newCommentRubricComments,
    }));
  };

  /***********************************************************************************
	/* Claim from console feature (triggered via console menu)
	/**********************************************************************************/

  const fetchSubmission = async (assignment: AssignmentType): Promise<AnonymousSubmissionType | undefined> => {
    try {
      if (!assignment.id) return undefined;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignment.id}/drawUnassigned/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.status === 204) {
        return undefined;
      }
      if (!res.ok) {
        throw new Error(`Failed to draw unassigned submission (${res.status})`);
      }
      return (await res.json()) as AnonymousSubmissionType;
    } catch (error) {
      // 204 No Content is treated as success (undefined)
      const responseStatus =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (responseStatus === 204) {
        return undefined;
      }
      console.error('Error in fetchSubmission:', error);
      return undefined;
    }
  };

  const claimSubmission = async () => {
    if (assignment) {
      const submissionResult: AnonymousSubmissionType | AnonymousSubmissionType[] | undefined =
        await fetchSubmission(assignment);
      const normalizedSubmission = Array.isArray(submissionResult) ? submissionResult[0] : submissionResult;

      if (normalizedSubmission !== undefined && normalizedSubmission.id !== undefined) {
        // Check if the new submission is from the same assignment
        const isSameAssignment = normalizedSubmission.assignment === assignment.id;

        // Only preserve tab and file state if staying within the same assignment
        const queryParams = isSameAssignment
          ? queryString.stringify({
              tab: activeSiderKey,
              file: selectedFile?.name,
            })
          : '';

        const url = queryParams
          ? `/code/${normalizedSubmission.id}?${queryParams}`
          : `/code/${normalizedSubmission.id}`;

        window.open(url, '_self');
        message.success('Successfully claimed another submission. Start reviewing!');
      } else {
        message.success('The ungraded queue is empty, so there are no more submissions to claim.');
      }
    }
  };

  const turnOnReload = () => {
    setState((prev) => ({ ...prev, rubricReload: 15000 }));
  };

  const turnOffReload = () => {
    setState((prev) => ({ ...prev, rubricReload: undefined }));
  };

  const handlePinComment = async (data: {
    text: string;
    pointDelta: number | null;
    rubricComment: number | null;
    sourceComment: number;
    startLine?: number;
  }) => {
    if (!assignment) return;

    let cellId: string | undefined;

    if (selectedFile && selectedFile.extension === 'ipynb' && data.startLine !== undefined && selectedFile.data) {
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
          assignment: assignment.id,
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
  };

  const handleCursorChange = React.useCallback((cursor: CursorSnapshot | null) => {
    lastCursorRef.current = cursor;
  }, []);

  const handleUpdateCommentLocation = async (
    commentId: number,
    newStartLine: number,
    newEndLine: number,
    newStartChar: number,
    newEndChar: number,
  ) => {
    const fileId = (state.selectedFile as FileWithId | undefined)?.id;
    if (!fileId) return;

    const currentComments = state.comments[fileId] || [];
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

    // Prevent negative lines (though drop target likely prevents this)
    if (newComment.startLine < 1) return;
    if (newComment.startChar < 0) return;

    // Check for collisions if we want to be strict, but backend might handle it or we assume user knows best
    // For now, allow overlapping/stacking as per existing logic, but maybe warn if exact duplicate?
    // Existing logic in handleApplyTemplate checks for overwrite, but here we are moving.
    // Let's just save.

    await saveComment(newComment);
    message.success('Comment updated');
  };

  const handleApplyTemplate = (template: CommentTemplateType) => {
    if (!selectedFile) {
      message.warning('Select a file first.');
      return;
    }

    const fileID = selectedFile.id;

    // If there's an active comment, apply template to it
    if (state.activeCommentID !== undefined) {
      const currentComments = state.comments[fileID] || [];
      const comment = currentComments.find((c) => c.id === state.activeCommentID);

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

        const newCommentsObj = updateCommentsState(state.comments, comment.id, {
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
    const existingComments = state.comments[fileID] || [];
    let targetLine: number | undefined;

    // Check if template has a Cell ID and we are in a notebook
    if (template.cellId && selectedFile.extension === 'ipynb' && selectedFile.data) {
      try {
        const nb = JSON.parse(selectedFile.data) as {
          cells?: Array<{ id?: string; metadata?: { id?: string } }>;
        };
        if (nb.cells && Array.isArray(nb.cells)) {
          // Find the cell index for this UUID
          const cellIndex = nb.cells.findIndex(
            (cell) => cell.id === template.cellId || (cell.metadata && cell.metadata.id === template.cellId),
          );

          if (cellIndex !== -1) {
            targetLine = cellIndex;

            // Check for existing comment on this cell
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
      // Find first available line (start at 1, go up to 1000)
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
      id: state.commentCounter,
      file: fileID,
      startLine: targetLine,
      endLine: targetLine,
      startChar: 0,
      endChar: 1,
      text: template.text,
      pointDelta: template.pointDelta ?? 0,
      rubricComment: template.rubricComment ?? null,
      author: props.user.email,
      feedback: 0,
      tags: [],
      color: '',
    };
    addComment(newComment, selectedFile);
    message.success('Created new comment from pinned comment');
  };

  /***********************************************************************************
	/* Render
	/**********************************************************************************/

  // Create a reference to the outer state to avoid shadowing issues in nested render props
  const outerState = state;

  if (state.isLoading) {
    return <Loading />;
  }

  const theme =
    consoleThemes.light === (context as React.ContextType<typeof ConsoleThemeContext>).consoleTheme ? 'light' : 'dark';

  let leftHeader: React.ReactNode[] = [];
  let middleHeader: React.ReactNode[] = [];
  let rightHeader: React.ReactNode[] = [];
  let content;
  let siderTitles: Array<React.ReactNode | string> = [];
  let siderTooltips: Array<React.ReactNode | string> = []; // Added for shortcuts
  let sider: React.ReactElement[] = [];

  const toolbarWidgets: React.ReactElement[] = [];

  // Add execute button for supported executable files
  if (selectedFile) {
    const ext = selectedFile.extension.toLowerCase().replace(/^\./, '');
    const executableExtensions = ['py', 'ipynb', 'r', 'rb', 'js', 'java', 'cpp', 'c', 'go', 'rs', 'sh'];

    if (executableExtensions.includes(ext)) {
      // Add Edit Toggle and Execute Button
      if (permissionLevel === PERMISSION_LEVEL.WRITE) {
        // Only show edit toggle if:
        // 1. User is superuser (codePostAdmin)
        // 2. User is course admin
        // 3. User is a grader AND Assignment allows graders to edit submissions
        const isGrader = assignment && props.user.graderCourses.some((c) => c.id === assignment.course);
        const canEditSubmission =
          props.user.codePostAdmin ||
          isCourseAdmin(assignment) ||
          (isGrader && assignment && assignment.gradersCanEditSubmissions);

        if (canEditSubmission) {
          toolbarWidgets.push(
            <Button
              key="edit-toggle"
              type={state.isEditMode ? 'primary' : 'default'}
              icon={<EditOutlined />}
              onClick={() => useCodeConsoleStore.getState().setIsEditMode(!state.isEditMode)}
            >
              {state.isEditMode ? 'Exit Edit' : 'Edit'}
            </Button>,
          );
        }
      }

      toolbarWidgets.push(
        <ExecuteFileButton
          key="execute-file-button"
          file={selectedFile}
          disabled={false}
          onExecutionComplete={handleExecutionComplete}
          canWrite={permissionLevel === PERMISSION_LEVEL.WRITE}
          codeOverride={
            state.isEditMode && selectedFile
              ? useCodeConsoleStore.getState().temporaryFileContent[selectedFile.id]
              : undefined
          }
        />,
      );

      // Add execution status for Jupyter notebooks
      const executionResult = state.executionResults[selectedFile.id];
      if (ext === 'ipynb' && executionResult) {
        toolbarWidgets.push(
          <Divider key="execution-divider" type="vertical" style={{ height: '24px', margin: '0 8px' }} />,
        );
        toolbarWidgets.push(
          <Button
            key="execution-clear-button"
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleClearOutputs}
            danger
          >
            Clear
          </Button>,
        );
      }
    }
  }

  const controls = (
    <Controls
      updateVerticalOffset={setVerticalOffset}
      updateZoom={setZoom}
      fallbackWidth={layoutVars.breakpoints.smallScreen.grade}
    />
  );

  const testsTitle = 'Tests';

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
        cursorMode={state.cursorMode}
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
      state.hideGrades || permissionLevel === PERMISSION_LEVEL.READ_FILES_ONLY
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
              submissionTests={state.tests}
              testCases={Object.values(state.testCases).flat() as TestCaseType[]}
            />,
          ];

    const fileMenuTitle = <FileMenuTitle key="files" files={files} />;
    if (props.inDemoMode) {
      if (permissionLevel === PERMISSION_LEVEL.READ) {
        if (state.panelType === PANEL_TYPE.FILE && selectedFile) {
          const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
            <StudentCode
              key={selectedFile!.id}
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={true}
              user={props.user.email!}
              onHighlightClick={onHighlightClick}
              executionResult={state.executionResults[selectedFile!.id] || null}
              onClearOutputs={handleClearOutputs}
            />
          );

          const commentsPanel = (
            <StudentComments
              isStudent={state.isStudent}
              comments={comments[selectedFile!.id]}
              rubricComments={commentRubricComments}
              file={selectedFile!}
              fileIDs={files.map((file) => {
                return (file as FileWithId).id;
              })}
              verticalOffset={state.codeVerticalOffset}
              updateFeedback={updateFeedback.bind(this, selectedFile!.id)}
              studentFeedbackOn={assignment.commentFeedback}
              hideAuthor={
                assignment.studentsCanSeeGraders !== null
                  ? !assignment.studentsCanSeeGraders
                  : state.course
                    ? !state.course.studentsCanSeeGraders
                    : true
              }
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
                zoom={state.codeZoom}
                updateVerticalOffset={setVerticalOffset}
              />
            </CommentHighlightProvider>
          );
        }

        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={claimSubmission}
            isStudent={state.isStudent}
            isAdmin={isCourseAdmin(assignment)}
            course={state.course}
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
        if (state.panelType === PANEL_TYPE.FILE && selectedFile) {
          const demoCode = (onHighlightClick: (e: React.MouseEvent) => void) => (
            <ConnectedGradeCode
              onCursorChange={handleCursorChange}
              onUpdateCommentLocation={handleUpdateCommentLocation}
              key={selectedFile!.id}
              fileId={selectedFile!.id}
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={!!submission!.isFinalized}
              addComment={addComment}
              user={props.user.email!}
              onHighlightClick={onHighlightClick}
              commentCounter={state.commentCounter}
              assignmentFile={undefined}
              cursorMode={state.cursorMode}
              showCursor={state.showCursor}
              updateCursorDomain={updateCursorDomain}
              executionResult={state.executionResults[selectedFile!.id] || null}
              onClearOutputs={handleClearOutputs}
              isEditMode={state.isEditMode}
              onContentChange={handleContentChange}
              // temporaryContent handled by wrapper
            />
          );

          const demoComments = (
            <GradeComments
              isStudent={state.isStudent}
              showExplanations={true}
              comments={comments[selectedFile!.id]}
              rubricComments={commentRubricComments}
              readOnly={!!submission!.isFinalized}
              file={selectedFile!}
              fileIDs={files.map((file) => {
                return (file as FileWithId).id;
              })}
              activeCommentID={activeCommentID}
              changeActive={changeActiveComment}
              deleteComment={deleteComment}
              saveComment={saveComment}
              removeRubricComment={removeRubricComment}
              oldCommentIDs={state.oldCommentIDs}
              verticalOffset={state.codeVerticalOffset}
              updateFeedback={updateFeedback.bind(this, selectedFile!.id)}
              studentFeedbackOn={assignment.commentFeedback}
              hideAuthor={
                assignment.studentsCanSeeGraders !== null
                  ? !assignment.studentsCanSeeGraders
                  : state.course
                    ? !state.course.studentsCanSeeGraders
                    : true
              }
              additiveGrading={assignment.additiveGrading}
              forcedRubricMode={assignment.forcedRubricMode}
              rubricCategories={rubricCategories}
              showCursor={state.showCursor}
              aiEnabled={state.aiEnabled}
              onPin={handlePinComment}
              forcedUpdates={templateForceUpdates}
            />
          );

          content = (
            <CommentHighlightProvider
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={!!submission!.isFinalized}
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
                zoom={state.codeZoom}
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
            courseLateDayCreditsAllowable={state.course?.lateDayCreditsAllowable ?? null}
            graders={state.graders}
            isCourseAdmin={isCourseAdmin(assignment)}
            updateGrader={updateGrader}
            addLateDayCreditComment={addLateDayCreditComment}
            isStudentMode={false}
          />,
          <TestsMenu
            key="tests-menu"
            submissionId={submission!.id}
            tests={Object.values(state.testCases).flat() as TestCaseType[]}
            rubricCategories={state.rubricCategories}
            testCategories={state.testCategories}
            fileOverrides={state.isEditMode ? state.temporaryFileContent : undefined}
            demoMode={true}
            initialResults={state.tests}
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
              comments: _.flatten(Object.values(rubricComments)),
            }}
          >
            {({ props, state: rubricState, helpers }: IRubricManagerParams) => {
              const propz = {
                ...props,
                handleRubricCommentClick: onRubricCommentClick,
                hasActiveComment: outerState.activeCommentID !== undefined,
                toggleEditRubricMode: toggleEditRubricMode,
                editRubricMode: outerState.editRubricMode,
                setRubric: setRubric,
                turnOnReload: turnOnReload,
                turnOffReload: turnOffReload,
                canUserEdit: true, // showcase in-console rubric editing in demo
                demoMode: true,
                showCursor: outerState.showCursor,
                updateCursorDomain: updateCursorDomain,
                showFrequent: !!(outerState.assignment !== undefined
                  ? outerState.assignment.showFrequentlyUsedRubricComments
                  : false),
                course: outerState.course!,
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
            isSuperGrader={isSuperGrader(assignment)}
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
            testCount={Object.values(state.testCases).flat().length}
          />,
          <FileMenuTooltip key="files-tooltip" files={files} />,
          <RubricTooltip key="rubric-tooltip" itemsApplied={Object.values(rubricComments).flat().length} />,
          <PinnedCommentsTooltip key="pinned-comments-tooltip" />,
        ];

        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={claimSubmission}
            isStudent={state.isStudent}
            isDemo={true}
            isAdmin={isCourseAdmin(assignment)}
            course={state.course}
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
            cursorMode={state.cursorMode}
            small={true}
          />,
          <ThemeToggle key="theme-toggle" small={true} />,

          controls,
          <FinalizeButton
            key="subheader-finalize"
            course={state.course!}
            submission={submission!}
            toggleFinalized={toggleFinalized}
            numComments={Object.values(comments).flat().length}
            minComments={state.course?.minComments ?? 0}
            canUnfinalize={true}
            isOnlyGrader={state.graders.length === 1}
          />,
        ];
      }
    } else if (permissionLevel === PERMISSION_LEVEL.READ) {
      if (selectedFile) {
        const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
          <StudentCode
            key={selectedFile!.id}
            file={selectedFile!}
            comments={comments[selectedFile!.id]}
            readOnly={true}
            user={props.user.email!}
            onHighlightClick={onHighlightClick}
            executionResult={state.executionResults[selectedFile!.id] || null}
            onClearOutputs={handleClearOutputs}
          />
        );

        const commentsPanel = (
          <StudentComments
            isStudent={state.isStudent}
            comments={comments[selectedFile!.id]}
            rubricComments={commentRubricComments}
            file={selectedFile!}
            fileIDs={files.map((file) => {
              return (file as FileWithId).id;
            })}
            verticalOffset={state.codeVerticalOffset}
            updateFeedback={updateFeedback.bind(this, selectedFile!.id)}
            studentFeedbackOn={assignment.commentFeedback}
            hideAuthor={
              assignment.studentsCanSeeGraders !== null
                ? !assignment.studentsCanSeeGraders
                : state.course
                  ? !state.course.studentsCanSeeGraders
                  : true
            }
            additiveGrading={false}
            rubricCategories={rubricCategories}
            scrollToCommentID={parseInt(queryString.parse(location.search).comment as string)}
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
              zoom={state.codeZoom}
              updateVerticalOffset={setVerticalOffset}
            />
          </CommentHighlightProvider>
        );
      }

      leftHeader = [
        <HeaderMenu
          key="menu"
          claimSubmission={claimSubmission}
          isStudent={state.isStudent}
          isAdmin={isCourseAdmin(assignment)}
          course={state.course}
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
          isStudentMode={state.isStudent}
          courseStudentsCanSeeGraders={state.course?.studentsCanSeeGraders}
        />,
        <ConnectedTestsMenu
          key="tests-menu"
          submissionId={readOnlySubmission!.id}
          tests={Object.values(state.testCases).flat() as TestCaseType[]}
          rubricCategories={state.rubricCategories}
          testCategories={state.testCategories}
          demoMode={props.inDemoMode}
          initialResults={state.tests}
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
          testCount={Object.values(state.testCases).flat().length}
        />,
        <FileMenuTooltip key="files-tooltip" files={files} />,
      ];
    } else if (permissionLevel === PERMISSION_LEVEL.READ_FILES_ONLY) {
      // Files-only mode: show files but no comments, rubrics, or grades
      if (selectedFile) {
        const code = (_onHighlightClick: (e: React.MouseEvent) => void) => (
          <StudentCode
            key={selectedFile!.id}
            file={selectedFile!}
            comments={[]} // No comments in files-only mode
            readOnly={true}
            user={props.user.email!}
            onHighlightClick={(_e) => {}}
            executionResult={state.executionResults[selectedFile!.id] || null}
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
              zoom={state.codeZoom}
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
          courseStudentsCanSeeGraders={state.course?.studentsCanSeeGraders}
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
          isStudent={state.isStudent}
          isAdmin={isCourseAdmin(assignment)}
          course={state.course}
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
          cursorMode={state.cursorMode}
          small={true}
        />,
        <ThemeToggle key="theme-toggle" small={true} />,
        <DownloadCode key="download-code" submission={submission!} />,
        controls,
        <ViewAsStudent key="view-as-student" pathname={location.pathname} />,
        <FinalizeButton
          key="subheader-finalize"
          course={state.course!}
          submission={submission!}
          toggleFinalized={toggleFinalized}
          numComments={Object.values(comments).flat().length}
          minComments={state.course?.minComments ?? 0}
          canUnfinalize={!state.course!.noUnfinalize || isCourseAdmin(assignment)}
          isOnlyGrader={state.graders.length === 1}
        />,
      ];

      if (selectedFile !== undefined) {
        // assignmentFile logic removed as it was unused and causing warnings
        const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
          <ConnectedGradeCode
            onCursorChange={handleCursorChange}
            onUpdateCommentLocation={handleUpdateCommentLocation}
            key={selectedFile!.id}
            fileId={selectedFile!.id}
            file={selectedFile!}
            comments={comments[selectedFile!.id]}
            readOnly={!!submission!.isFinalized}
            addComment={addComment}
            user={props.user.email!}
            onHighlightClick={onHighlightClick}
            commentCounter={state.commentCounter}
            assignmentFile={undefined}
            cursorMode={state.cursorMode}
            showCursor={state.showCursor}
            updateCursorDomain={updateCursorDomain}
            executionResult={state.executionResults[selectedFile!.id] || null}
            onClearOutputs={handleClearOutputs}
            isEditMode={state.isEditMode}
            onContentChange={handleContentChange}
            // temporaryContent handled by wrapper
          />
        );

        const commentsPanel = (
          <GradeComments
            isStudent={state.isStudent}
            showExplanations={true}
            comments={comments[selectedFile!.id]}
            rubricComments={commentRubricComments}
            readOnly={!!submission!.isFinalized}
            file={selectedFile!}
            fileIDs={files.map((file) => {
              return (file as FileWithId).id;
            })}
            activeCommentID={activeCommentID}
            changeActive={changeActiveComment}
            deleteComment={deleteComment}
            saveComment={saveComment}
            removeRubricComment={removeRubricComment}
            oldCommentIDs={state.oldCommentIDs}
            verticalOffset={state.codeVerticalOffset}
            updateFeedback={updateFeedback.bind(this, selectedFile!.id)}
            studentFeedbackOn={assignment.commentFeedback}
            hideAuthor={
              assignment.studentsCanSeeGraders !== null
                ? !assignment.studentsCanSeeGraders
                : state.course
                  ? !state.course.studentsCanSeeGraders
                  : true
            }
            additiveGrading={assignment.additiveGrading}
            forcedRubricMode={assignment.forcedRubricMode}
            rubricCategories={rubricCategories}
            showCursor={state.showCursor}
            scrollToCommentID={parseInt(queryString.parse(location.search).comment as string)}
            aiEnabled={state.aiEnabled}
            onPin={handlePinComment}
            forcedUpdates={templateForceUpdates}
          />
        );

        content = (
          <div style={{ height: '100%' }}>
            <CommentHighlightProvider
              file={selectedFile!}
              comments={comments[selectedFile!.id]}
              readOnly={!!submission!.isFinalized}
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
                zoom={state.codeZoom}
                updateVerticalOffset={setVerticalOffset}
              />
            </CommentHighlightProvider>
            <CustomCommentExplorer
              graders={state.graders}
              user={props.user.email!}
              isAdmin={isCourseAdmin(assignment)}
              assignment={assignment}
              rubricComments={Object.values(rubricComments).flat()}
              rubricCategories={rubricCategories}
              visible={state.showCustomCommentExplorer}
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
          courseLateDayCreditsAllowable={state.course?.lateDayCreditsAllowable ?? null}
          submission={submission!}
          graders={state.graders}
          isCourseAdmin={isCourseAdmin(assignment)}
          updateGrader={updateGrader}
          addLateDayCreditComment={addLateDayCreditComment}
          isStudentMode={state.isStudent}
          courseStudentsCanSeeGraders={state.course?.studentsCanSeeGraders}
        />,
      );
      siderTitles.push('Submission Info');
      siderTooltips.push(
        <SubmissionInfoTooltip key="submission-info-tooltip" submission={submission!} assignment={assignment} />,
      );

      // 2. Tests
      if (isCourseAdmin(assignment) || state.testCategories.length > 0) {
        sider.push(
          <ConnectedTestsMenu
            key="tests-menu"
            submissionId={submission!.id}
            tests={Object.values(state.testCases).flat() as TestCaseType[]}
            rubricCategories={state.rubricCategories}
            testCategories={state.testCategories}
            demoMode={props.inDemoMode}
            initialResults={state.tests}
          />,
        );
        siderTitles.push(testsTitle);
        siderTooltips.push(
          <TestsMenuTooltip
            key="tests-info-tooltip"
            title={testsTitle}
            testCount={Object.values(state.testCases).flat().length}
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
      sider.push(
        <RubricManager
          key="rubric-menu"
          assignment={assignment as Assignment}
          submissions={[]}
          onCancel={onCancel}
          reloadInterval={state.rubricReload}
          setRubric={setRubric}
          shouldLoadFeedback={false}
          shouldLoadInstanceLists={!!assignment.showFrequentlyUsedRubricComments}
        >
          {({ props, state: rubricState, helpers }: IRubricManagerParams) => {
            const propz: RubricMenuUIProps = {
              ...props,
              handleRubricCommentClick: onRubricCommentClick,
              hasActiveComment: outerState.activeCommentID !== undefined,
              toggleEditRubricMode: toggleEditRubricMode,
              editRubricMode: outerState.editRubricMode,
              setRubric: setRubric,
              turnOnReload: turnOnReload,
              turnOffReload: turnOffReload,
              canUserEdit:
                isCourseAdmin(outerState.assignment) ||
                outerState.assignment!.collaborativeRubricMode ||
                (outerState.course?.isRubricEditor ?? false),
              showCursor: outerState.showCursor,
              updateCursorDomain: updateCursorDomain,
              demoMode: outerState.noSave === true,
              showFrequent: !!(outerState.assignment !== undefined
                ? outerState.assignment.showFrequentlyUsedRubricComments
                : false),
              course: outerState.course!,
            };
            return <RubricMenuUI props={propz} state={rubricState} helpers={helpers} />;
          }}
        </RubricManager>,
      );
      siderTitles.push('Rubric');
      siderTooltips.push(
        <RubricTooltip key="rubric-tooltip" itemsApplied={Object.values(rubricComments).flat().length} />,
      );

      // 5. Templates
      if (assignment) {
        sider.push(
          <TemplateMenu
            key="template-menu"
            assignmentId={assignment.id}
            onApplyTemplate={handleApplyTemplate}
            currentUserEmail={props.user.email!}
            refreshTrigger={templateRefresh}
            currentFilePath={selectedFile?.name}
            isSuperGrader={isSuperGrader(assignment)}
          />,
        );
        siderTitles.push('Pinned Comments');
        siderTooltips.push(<PinnedCommentsTooltip key="pinned-comments-tooltip" />);
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
      <CodeConsoleOnboardingSelector
        open={props.inDemoMode && !assignment}
        onUploadConfirm={loadDemoData}
        onCancel={cancelFunc}
      />
      <CourseContext.Provider value={state.course ?? defaultCourse}>
        {localStorage.getItem('source') !== 'codePost' ? (
          <main id="demo-main-content" style={{ height: '100%' }}>
            {content}
          </main>
        ) : (
          <StandardConsoleLayout
            consoleTypes={['grade']}
            activePanel={(() => {
              const idx = sider.findIndex((s) => s.key === state.activeSiderKey);
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
                  padding: '0 14',
                  height: 49,
                  fontSize: 12,
                  overflow: 'initial',
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
            editRubricMode={state.editRubricMode}
            panelDefaultWidths={{ 'tests-menu': 500 }}
          />
        )}
        {/* KeyboardShortcuts drawer removed - consolidated into HelpModal */}
        <HelpModal />
        {permissionLevel === PERMISSION_LEVEL.WRITE && assignment !== undefined && submission !== undefined ? (
          <InlineTestsModal
            key="inline-tests-modal"
            visible={state.showInlineTestsModal}
            show={showInlineTestsModal}
            hide={hideInlineTestsModal}
            files={files}
            assignment={assignment}
            submission={submission}
          />
        ) : null}
      </CourseContext.Provider>
    </div>
  );
};

export default CodeConsole;
