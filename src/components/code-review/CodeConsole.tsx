import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';
import {
  CURSOR_DOMAIN,
  ICodeConsoleProps,
  ICodeConsoleState,
  PANEL_TYPE,
  PERMISSION_LEVEL,
} from '../../types/CodeConsole.types';
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { BugOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, Empty, message, Progress, Space, Tag, Typography } from 'antd';

/* other library imports */
import _ from 'lodash';
import queryString from 'query-string';

/* codePost imports */
import Loading from '../core/Loading';
import { colors } from '../../theme/colors';

import { getOperatingSystem, OS } from '../core/operatingSystem';

import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { Assignment, AssignmentStudent, AssignmentType } from '../../infrastructure/assignment';
import { CommentIO, CommentType } from '../../infrastructure/comment';
import { Course, CourseType } from '../../infrastructure/course';
import { AssignmentFile, AssignmentFileType, FileType } from '../../infrastructure/file';
import { RubricCategory, RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../infrastructure/rubricComment';
import { AnonymousSubmissionType, StudentSubmissionType, Submission } from '../../infrastructure/submission';
import { SubmissionTest, SubmissionTestType } from '../../infrastructure/submissionTest';

import CPButton from '../core/CPButton';
import CPFlex from '../core/CPFlex';
import StandardConsoleLayout from '../core/layouts/StandardConsoleLayout';

import { GradeCode, StudentCode } from './code-panel/CodeContent';
import CodePanelLayout from './code-panel/CodePanelLayout';
import { CommentHighlightProvider } from './code-panel/CommentHighlightContext';
import { GradeComments, StudentComments } from './code-panel/Comments';
import ExecuteFileButton from './ExecuteFileButton';

import CursorToggle from '../core/CursorToggle';
import ThemeToggle from '../core/ThemeToggle';

import KeyboardShortcuts from './KeyboardShortcuts';

import FileMenu, { FileMenuTitle } from './menu/FileMenu';

import RubricMenuUI from './menu/RubricMenuUI';

import InlineTestsModal from './InlineTestsModal';

import { ReadOnlySubmissionInfo, SubmissionInfo } from './menu/SubmissionInfoMenu';

import layoutVars from '../../styles/layout/_layoutVars';

import { openSubmissionInSameTab } from '../admin/other/AdminUtils';

import { sendSlack } from '../core/slack';

import { getDaysLate } from '../utils/LateDays';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';

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
} from '../code-review/Header';

import { CodeConsoleOnboardingSelector } from '../core/OnboardingSelector';

import { loadDemoGrader, loadDemoStudent } from './demo';

import RubricManager, { IRubricManagerParams } from '../core/rubric/RubricManager';

import { helpQueryMap } from './HelpQueries';

import TestsList from './code-panel/TestsList';
import TestsMenu from './menu/TestsMenu';

import { CourseContext, defaultCourse } from '../core/Contexts';

import CustomCommentExplorer from './CustomCommentExplorer';

import { encodeForLink, getRubricURL } from '../core/URLutils';

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

  // Refs for intervals (replacing instance variables)
  const checkNewFilesInterval = React.useRef<number | undefined>(undefined);
  const reloadCommentsInterval = React.useRef<number | undefined>(undefined);
  // Note: LIVE_FEEDBACK_*_RELOAD_INTERVAL constants removed as live feedback features are deprecated

  // State management
  const [state, setState] = React.useState<ICodeConsoleState>({
    permissionLevel: PERMISSION_LEVEL.READ,
    activeCommentID: undefined,
    assignment: undefined,
    commentRubricComments: {},
    comments: {},
    assignmentFiles: undefined,
    showKeyboardShortcuts: false,

    files: [],
    graders: [],
    students: [],
    isLoading: true,
    rubricCategories: [],
    rubricComments: {},
    submission: undefined,
    tests: [],
    testCases: {},
    testCategories: [],
    showInlineTestsModal: false,

    selectedFile: undefined,
    oldCommentIDs: {},

    codeZoom: LOCAL_SETTINGS.codeZoom.getter(),
    codeVerticalOffset: 0,

    demoCommentCounter: 0,

    isStudent: false,
    editRubricMode: false,
    commentCounter: -1,
    commentRefreshCounter: 0,

    rubricReload: undefined,

    cursorMode: LOCAL_SETTINGS.cursorMode.getter(),
    showCursor: LOCAL_SETTINGS.cursorMode.getter() ? CURSOR_DOMAIN.CODE : CURSOR_DOMAIN.CODE_HIDDEN,
    showExplanations: false,
    showCustomCommentExplorer: false,

    panelType: PANEL_TYPE.FILE,
    hideGrades: false,
    executionResults: {},
  });

  /***********************************************************************************************/
  /* Helper functions (converted from class methods)
  /***********************************************************************************************/

  // Keyboard event handlers (defined early for useEffect dependencies)
  const handleHotkeys = React.useCallback((e: KeyboardEvent) => {
    const os = getOperatingSystem();
    const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

    // Show Custom Comment Explorer (typically accessible via Foobar)
    if (e.key === 'e' && triggerKey && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      setState((prev) => ({ ...prev, showCustomCommentExplorer: !prev.showCustomCommentExplorer }));
    }
  }, []);

  const toggleCursorMode = React.useCallback((cursorMode: boolean) => {
    setState((prev) => ({
      ...prev,
      cursorMode,
      showCursor: cursorMode ? CURSOR_DOMAIN.CODE : CURSOR_DOMAIN.CODE_HIDDEN,
    }));
  }, []);

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
      const os = getOperatingSystem();
      const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

      if (e.key === '/' && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => ({ ...prev, showKeyboardShortcuts: !prev.showKeyboardShortcuts }));
        return;
      }

      if (e.key === 'y' && triggerKey && e.shiftKey) {
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
            const hasComments = prev.comments[prev.selectedFile.id]?.length > 0;
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
    [focusActiveComment, blurActiveComment],
  );

  // Component mount logic
  const componentDidMountLogic = React.useCallback(async () => {
    // CommandBar loading callbacks

    window.CommandBar.addCallback(
      'assignGrader',
      // Assumes the existence of an argument called name
      (args, _context) => {
        if (state.submission) updateGrader(state.submission!, args.grader);
      },
    );

    window.CommandBar.addCallback(
      'gotoFile',
      // Assumes the existence of an argument called name
      (args, _context) => {
        if (state.submission) {
          const foundFile = state.files.find((file) => {
            return file.name === args.filename;
          });
          if (foundFile) {
            changeSelectedFile(foundFile.id);
          }
        }
      },
    );

    window.CommandBar.addCallback(
      'gotoTestResults',
      // Assumes the existence of an argument called name
      (_args, _context) => {
        setState((prev) => ({ ...prev, panelType: PANEL_TYPE.TESTS, selectedFile: undefined }));
      },
    );

    window.CommandBar.addCallback(
      'gotoCustomCommentExplorer',
      // Assumes the existence of an argument called name
      (_args, _context) => {
        toggleCustomCommentExplorer();
      },
    );

    // Other stuff

    document.addEventListener('keydown', handleCursor);
    document.addEventListener('keydown', handleHotkeys);
    const queryValues = queryString.parse(props.location.search);

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
    const submissionIdParam = props.match.params.submissionId;
    if (!submissionIdParam) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }
    const submissionID: number = +submissionIdParam.valueOf();

    let permissionLevel = await detectPermissionType(submissionID);

    const values = queryString.parse(props.location.search);
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
    let files: FileType[] = [];
    let comments: IFileToCommentsMap = {};
    let commentRubricComments: ICommentToRubricCommentMap = {};
    let course: CourseType | undefined;
    let rubricCategories: RubricCategoryType[] = [];
    let rubricComments: IRubricCategoryToRubricCommentsMap = {};
    let selectedFile: FileType | undefined;
    let tests: SubmissionTestType[];

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
        assignment = await Assignment.read(submissionData.assignment);

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        course = await Course.read(assignment.course);

        // Files are already included in the response as full objects
        files = (submissionData.files as FileType[]) || [];

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        files = fileBouncer(files);

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
        submission = await Submission.readReadOnly(submissionID);
        [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            Assignment.read(submission.assignment),
            Submission.loadData(submission),
            loadRubric(submission.assignment),
          ]);

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        course = await Course.read(assignment.course);

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        files = fileBouncer(files);

        if (selectedFile === undefined && files.length > 0) {
          if (typeof queryValues.comment === 'string') {
            const matchingFile = files.find((el) =>
              el.comments.some((c) => c === parseInt(queryValues.comment as string)),
            );
            selectedFile = matchingFile || files[0];
          } else {
            selectedFile =
              files.find((f: FileType) => {
                return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
              }) || files[0];
          }
        }

        // Read tests
        const { testCases, testCategories } = await AssignmentStudent.readStudentTests(assignment.id);
        const caseObj: StudentTestCasesByCategory = {};
        testCategories.forEach((category) => {
          caseObj[category.id] = [];
        });
        testCases.forEach((testCase) => {
          caseObj[testCase.testCategory] = [...caseObj[testCase.testCategory], testCase];
        });
        tests = submission.tests ? await Promise.all(submission.tests.map((id) => SubmissionTest.read(id))) : [];

        // then store it in state
        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          readOnlySubmission: submission,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          isLoading: false,
          selectedFile,
          permissionLevel,
          testCategories,
          testCases: caseObj,
          tests: SubmissionTest.getLatest(tests),
          isStudent:
            simulatingStudent ||
            (submission?.students !== undefined && submission.students.indexOf(props.user.email) > -1),
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

        const writableSubmission = await Submission.readAnonymous(submissionID);
        [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            Assignment.read(writableSubmission.assignment),
            Submission.loadData(writableSubmission),
            loadRubric(writableSubmission.assignment),
          ]);

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        course = await Course.read(assignment.course);
        let assignmentFiles: AssignmentFileType[] = [];
        if (assignment.templateMode) {
          assignmentFiles = await Promise.all(
            assignment.files.map((assignmentFileID: number) => {
              return AssignmentFile.read(assignmentFileID);
            }),
          );
        }

        // load the data only an admin has access to
        let graders: string[] = [];
        let students: string[] = [];
        if (isCourseAdmin(assignment)) {
          const roster = await Course.readRoster(assignment.course);
          graders = roster['graders'];
          students = roster['students'];
        }

        tests = await Promise.all(writableSubmission.tests.map((id) => SubmissionTest.read(id)));
        const [categories, cases] = await fetchTestData(assignment);

        // fill in grade using available data if submission doesn't contain an up-to-date grade
        if (assignment && !writableSubmission.isFinalized) {
          const testCasesArray = Array.isArray(cases) ? cases : Object.values(cases).flat();
          writableSubmission.grade = calculateGrade(
            assignment,
            comments,
            commentRubricComments,
            rubricCategories,
            files,
            SubmissionTest.getLatest(tests),
            testCasesArray,
          );
        }

        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          submission: writableSubmission,
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
          tests: SubmissionTest.getLatest(tests),
          testCategories: Array.isArray(categories) ? categories : [],
          testCases: cases as TestCasesByCategory,
        }));
        break;
      }
    }
  }, []);

  // useEffect to call componentDidMount logic on component mount - ONLY ONCE
  React.useEffect(() => {
    componentDidMountLogic();

    // Add event listeners
    document.addEventListener('keydown', handleCursor);
    document.addEventListener('keydown', handleHotkeys);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleCursor);
      document.removeEventListener('keydown', handleHotkeys);
      // Capture interval refs in cleanup to avoid stale ref warnings
      const checkFilesInterval = checkNewFilesInterval.current;
      const reloadInterval = reloadCommentsInterval.current;
      if (checkFilesInterval) {
        clearInterval(checkFilesInterval);
      }
      if (reloadInterval) {
        clearInterval(reloadInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const updateCursorDomain = React.useCallback((domain: CURSOR_DOMAIN) => {
    setState((prev) => ({
      ...prev,
      showCursor: domain,
      activeCommentID: domain === CURSOR_DOMAIN.CODE ? undefined : prev.activeCommentID,
    }));
  }, []);

  /***********************************************************************************
  /* Loading methods
  /**********************************************************************************/

  // Note: setNewFilesWarning, checkForNewFiles, and onEscKeyPress functions are
  // currently unused in the functional component implementation.

  const loadRubric = async (assignmentID: number) => {
    const rubric = await Assignment.readRubric(assignmentID);

    const rubricCategories = rubric.rubricCategories.sort(RubricCategory.compare);
    const rubricComments: IRubricCategoryToRubricCommentsMap = {};

    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      rubricComments[rubricCategory.id] = rubric.rubricComments
        .filter((rubricComment) => {
          return rubricComment.category === rubricCategory.id;
        })
        .sort(RubricComment.compare);
    });

    return { rubricCategories, rubricComments };
  };

  const detectPermissionType = (submissionID: number) => {
    // Read submission and figure out whether the client is a reader or writer
    return fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionID}/checkPermission/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(async (res) => {
        if (res.ok) {
          return res.json();
        } else {
          return Promise.reject(res);
        }
      })
      .then((json) => {
        if (json.write) {
          return PERMISSION_LEVEL.WRITE;
        } else if (json.read) {
          return PERMISSION_LEVEL.READ;
        } else if (json.filesOnly) {
          return PERMISSION_LEVEL.READ_FILES_ONLY;
        } else {
          return PERMISSION_LEVEL.NONE;
        }
      })
      .catch((error) => {
        if (error.status === 404) {
          return PERMISSION_LEVEL.NOT_FOUND;
        } else {
          return;
        }
      });
  };

  /***********************************************************************************
  /* Handlers
  /**********************************************************************************/

  const changeActiveComment = React.useCallback((id: number | undefined): void => {
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
  }, []);

  const handleHighlightSelect = React.useCallback(
    (commentId: number, _event?: React.MouseEvent) => {
      if (commentId === 0 || commentId === Number.MAX_SAFE_INTEGER) {
        return;
      }

      if (state.permissionLevel === PERMISSION_LEVEL.WRITE) {
        changeActiveComment(commentId);
      }

      window.requestAnimationFrame(() => {
        const commentElement = document.getElementById(`comment-${commentId}`);
        commentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [changeActiveComment, state.permissionLevel],
  );

  const changeSelectedFile = React.useCallback((fileID: number): void => {
    setState((prev) => {
      const selectedFile = prev.files.find((file: FileType) => file.id === fileID);
      if (selectedFile) {
        LOCAL_SETTINGS.mostRecentFile.setter(selectedFile.id);
      }
      return { ...prev, selectedFile, activeCommentID: undefined, panelType: PANEL_TYPE.FILE };
    });
  }, []);

  const toggleShowExplanations = React.useCallback(() => {
    setState((prev) => {
      const newShowExplanations = !prev.showExplanations;
      message.info(`Now showing rubric comment ${newShowExplanations ? 'explanations' : 'text'}`);
      return { ...prev, showExplanations: newShowExplanations };
    });
  }, []);

  const showInlineTestsModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, showInlineTestsModal: true }));
  }, []);

  const hideInlineTestsModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, showInlineTestsModal: false }));
  }, []);

  /***********************************************************************************
  /* Helper functions
  /**********************************************************************************/

  const submitStudentQuestion = async (submission: StudentSubmissionType, text: string, isRegrade: boolean) => {
    const payload = {
      id: submission.id,
      questionText: text,
      questionIsRegrade: isRegrade,
    };

    const newSubmission = await Submission.updateQuestion(payload);
    setState((prev) => ({ ...prev, readOnlySubmission: newSubmission }));

    return newSubmission;
  };

  const deleteStudentQuestion = async (submission: StudentSubmissionType) => {
    const payload = {
      id: submission.id,
    };

    const newSubmission = await Submission.deleteQuestion(payload);
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

    if (state.assignment === undefined || !state.assignment.allowStudentUpload) {
      return;
    }

    if (state.submission === undefined) {
      return;
    }

    if (state.files.length === 0) {
      return;
    }

    const firstFile = state.files[0];

    const daysLate = getDaysLate(state.assignment, state.submission);
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
      id: state.submission!.id,
      lateDayCreditsUsed,
    };

    try {
      await Submission.update(submissionPayload);

      let promises: Promise<void>[] = [];
      // Clear previous LateDay comments
      for (const fileID of Object.keys(state.comments)) {
        promises = [
          ...promises,
          ...state.comments[+fileID].map(async (comment: CommentType) => {
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
    } catch (err) {
      return false;
    }
  };

  // Usually adds a blank comment to the submission state
  const addComment = (comment: CommentType, file: FileType) => {
    console.log('[CodeConsole] addComment called', {
      commentId: comment.id,
      fileId: file.id,
      startLine: comment.startLine,
      endLine: comment.endLine,
      stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n'), // Show call stack
    });

    try {
      if (state.submission && state.submission.grader === null) {
        updateGrader(state.submission, props.user.email);
      }
    } catch (err) {
      console.log('comment author isnt enrolled as a grader');
    }

    const comments = addCommentToState(state.comments, comment, file);
    setState((prev) => ({ ...prev, comments, activeCommentID: comment.id, commentCounter: state.commentCounter - 1 }));
  };

  const updateComment = (commentID: number, newComment: CommentType, newRubricComment?: RubricCommentType) => {
    const comments = updateCommentsState(state.comments, commentID, newComment);

    const [rubricComment, restOfCommentRubricComments] = removeFromCommentRubricCommentsState(
      state.commentRubricComments,
      commentID,
    );

    const commentRubricComments = addToCommentRubricCommentsState(
      restOfCommentRubricComments,
      newComment.id,
      newRubricComment ? newRubricComment : rubricComment,
    );

    setState((prev) => ({ ...prev, comments, commentRubricComments }));
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
        console.log('[CodeConsole] Creating comment via CommentIO.create', comment.id);
        savedComment = await CommentIO.create(comment);
        console.log('[CodeConsole] Comment created, new ID:', savedComment.id);
        oldCommentIDs = { ...oldCommentIDs, [savedComment.id]: comment.id };

        // We need to prevent the following race condition error:
        // 1. User creates a comment => triggers a POST
        // 2. User deletes comment before the POST returns. The UI will treat this comment as unsaved
        // 3. POST returns, saving the comment.
        // Solution: Check if the comment with the OLD negative ID still exists in current state
        if (
          !_.flatten(Object.values(state.comments)).find((el: CommentType) => {
            return el.id === comment.id;
          })
        ) {
          // Comment was deleted while save was in progress
          // Delete the newly created backend comment immediately
          console.log('[Comment Race Condition] Deleting comment', savedComment.id, 'that was saved after UI deletion');
          if (savedComment.id > 0) {
            await CommentIO.delete(savedComment).then(() => updateSubmissionGrade());
          }
          return;
        }
      } else {
        savedComment = await CommentIO.update({ ...comment });
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
      await CommentIO.delete(comment).then(() => updateSubmissionGrade());
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
        await CommentIO.delete({ ...comment, id: +savedCommentId }).then(() => updateSubmissionGrade());
      }
    }

    const comments = removeCommentFromState(state.comments, comment);
    const [, commentRubricComments] = removeFromCommentRubricCommentsState(state.commentRubricComments, comment.id);

    setState((prev) => ({ ...prev, comments, commentRubricComments }));
    // We will never be in a situation in which we have an active comment immediately after
    // deleting a comment. Either
    // (1) we deleted the active comment, so it's no longer active
    // (2) we deleted a different comment, which closed any previously active comment
    changeActiveComment(undefined);
  };

  const updateFeedback = (fileID: number, commentID: number, feedbackNum: number) => {
    CommentIO.updateFeedback({ id: commentID, feedback: feedbackNum })
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

  const removeRubricComment = (comment: CommentType, rubricComment: RubricCommentType) => {
    const comments = unlinkRubricComment(state.comments, comment, rubricComment);
    const [, commentRubricComments] = removeFromCommentRubricCommentsState(state.commentRubricComments, comment.id);

    setState((prev) => ({ ...prev, comments, commentRubricComments }));
  };

  const onRubricCommentClick = (rubricComment: RubricCommentType): void => {
    if (!state.activeCommentID) {
      message.warning(
        `You must open a comment before applying a rubric comment. Click an existing comment,
        or highlight some code to create a new one.`,
        5,
      );
      return;
    }

    // If this category requires "at most once", check to see if we've applied a comment from this
    // category somewhere else.
    const category = state.rubricCategories.find((el) => el.id === rubricComment.category);
    if (category !== undefined && category.atMostOnce) {
      const siblings = state.rubricComments[rubricComment.category].map((el) => el.id);
      const hasApplied = Object.values(state.comments)
        .flat()
        .some((el) => siblings.indexOf(el.rubricComment) > -1 && el.id !== state.activeCommentID);
      if (hasApplied) {
        message.warning("You can't apply more than one rubric comment from this rubric category.");
        return;
      }
    }

    const comments = linkRubricComment(state.comments, rubricComment, state.activeCommentID);

    if (comments === undefined) {
      return;
    }

    if (state.showCursor === CURSOR_DOMAIN.RUBRIC) {
      focusActiveComment();
      setState((prev) => ({ ...prev, showCursor: CURSOR_DOMAIN.CODE_HIDDEN }));
    }

    const commentRubricComments = addToCommentRubricCommentsState(
      state.commentRubricComments,
      state.activeCommentID,
      rubricComment,
    );

    setState((prev) => ({ ...prev, comments, commentRubricComments, showCursor: CURSOR_DOMAIN.CODE_HIDDEN }));
  };

  const calculateGradeFromState = (): number | undefined => {
    if (!(state.submission || state.readOnlySubmission) || !state.assignment) {
      return undefined;
    }

    return calculateGrade(
      state.assignment,
      state.comments,
      state.commentRubricComments,
      state.rubricCategories,
      state.files,
      state.tests,
      Object.values(state.testCases).flat() as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  };

  const getPointsInFile = (file: FileType): number[] => {
    // If, for some reason, the file is not in comments, don't have a fatal error
    const fileComments = state.comments[file.id] || [];
    return pointsInFile(file, fileComments, state.commentRubricComments);
  };

  const updateSubmissionGrade = () => {
    if (state.submission) {
      const grade = calculateGradeFromState();
      if (grade) {
        const submission = { ...state.submission, grade };
        setState((prev) => ({ ...prev, submission }));
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
    if (!state.submission) {
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
      id: state.submission.id,
      isFinalized: !state.submission.isFinalized,
    };

    // if trying to finalize with only one grader available, set the grader
    if (state.graders.length === 1 && !state.submission.isFinalized) {
      payload = { ...payload, grader: state.graders[0] };
    }

    try {
      let submission;
      if (state.submission.students === undefined) {
        submission = await Submission.updateAnonymous(payload);
      } else {
        submission = await Submission.update(payload);
      }

      if (!state.submission.isFinalized) {
        sendSlack(
          'Submission finalized',
          `${state.submission.id} ${state.assignment ? state.assignment.name : ''} | ${
            state.course ? state.course.name : ''
          } ${state.course ? state.course.period : ''}`,
          colors.brandPrimary,
          '#user_notifications_everything',
          state.course ? state.course.id : 0,
        );
        message.success('Successfully finalized submission');
      } else {
        message.success('Successfully unfinalized submission');
      }

      setState((prev) => ({ ...prev, submission }));
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

    return Submission.update(payload).then((submission) => {
      setState((prev) => ({ ...prev, submission }));
      return submission;
    });
  };

  const isCourseAdmin = (assignment: AssignmentType | undefined) => {
    if (!assignment || !assignment.course) {
      return false;
    }

    return props.user.courseadminCourses
      .map((course) => {
        return course.id;
      })
      .includes(assignment.course);
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

  const toggleKeyboardShortcuts = () => {
    setState((prev) => ({ ...prev, showKeyboardShortcuts: !state.showKeyboardShortcuts }));
  };

  /***********************************************************************************************/
  /* Demo data
  /***********************************************************************************************/
  const loadDemoData = (files: Array<{ name: string; data: string }>, studentSample?: boolean) => {
    const demoState =
      studentSample !== undefined && studentSample
        ? loadDemoStudent(files, props.user.email)
        : loadDemoGrader(files, props.user.email);

    setState((prev) => ({ ...prev, ...demoState }));
  };

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
    (result: { success: boolean; output_data?: unknown; error?: string; file_id?: number }) => {
      const fileId = result.file_id || state.selectedFile?.id;
      if (fileId) {
        setState((prev) => ({
          ...prev,
          executionResults: {
            ...prev.executionResults,
            [fileId]: result,
          },
        }));
      }
    },
    [state.selectedFile?.id],
  );

  /**
   * Callback to clear execution outputs for the currently selected file
   *
   * Removes the execution result from the cache for the current file only,
   * preserving results for other files.
   */
  const handleClearOutputs = React.useCallback(() => {
    setState((prev) => {
      if (!prev.selectedFile?.id) return prev;
      const newResults = { ...prev.executionResults };
      delete newResults[prev.selectedFile.id];
      return { ...prev, executionResults: newResults };
    });
  }, []);

  /***********************************************************************************************/
  /* Rubric Updates
  /***********************************************************************************************/
  // This is a bit of a hacky way to rebase the CodeConsole state comments with an updated rubric
  // Given an updated rubric, we make sure that all relevant objects stored in state reflect the changes
  const setRubric = (rubric: {
    rubricCategories: RubricCategoryType[];
    rubricComments: IRubricCategoryToRubricCommentsMap;
  }) => {
    const newCommentRubricComments: ICommentToRubricCommentMap = {};

    for (const commentID of Object.keys(state.commentRubricComments)) {
      const oldRubricComment = state.commentRubricComments[+commentID];

      const newRubricComment = rubric.rubricComments[oldRubricComment.category].find(
        (rubricComment: RubricCommentType) => {
          return rubricComment.id === oldRubricComment.id;
        },
      );

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
    return await fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignment.id}/drawUnassigned/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (res.status === 204) {
          return undefined;
        }
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  const claimSubmission = async () => {
    if (state.assignment) {
      const submission = await fetchSubmission(state.assignment);
      if (submission !== undefined) {
        openSubmissionInSameTab(submission.id);
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
  let sider: React.ReactElement[] = [];

  const toolbarWidgets: React.ReactElement[] = [];

  // Add execute button for Python and Jupyter files
  if (state.selectedFile) {
    const ext = state.selectedFile.extension.toLowerCase();
    const isPython = ext === 'py' || ext === '.py';
    const isJupyter = ext === 'ipynb' || ext === '.ipynb';

    if (isPython || isJupyter) {
      toolbarWidgets.push(
        <ExecuteFileButton
          key="execute-file-button"
          file={state.selectedFile}
          disabled={false}
          onExecutionComplete={handleExecutionComplete}
          canWrite={state.permissionLevel === PERMISSION_LEVEL.WRITE}
        />,
      );
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

  const testsActions = (
    <Space.Compact
      style={{
        fontWeight: 600,
      }}
    >
      <Button
        size="small"
        type="primary"
        icon={<FolderOpenOutlined />}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setState((prev) => ({ ...prev, panelType: PANEL_TYPE.TESTS, selectedFile: undefined }));
        }}
        disabled={state.testCategories.length === 0}
      >
        View
      </Button>
      <Button
        size="small"
        icon={<BugOutlined />}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          showInlineTestsModal();
        }}
        disabled={state.testCategories.length === 0}
      >
        Debug
      </Button>
    </Space.Compact>
  );

  if (state.permissionLevel === PERMISSION_LEVEL.NONE || state.permissionLevel === PERMISSION_LEVEL.NOT_FOUND) {
    rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

    content = (
      <Empty
        styles={{ image: { marginTop: '200px', height: '60px' } }}
        description={
          <span style={{ color: theme === 'light' ? 'black' : 'white', fontSize: 'larger' }}>
            {state.permissionLevel === PERMISSION_LEVEL.NOT_FOUND
              ? "Whoops! This submission doesn't exist...😔"
              : "Whoops! Looks like you don't have access to this submission...😔, If you submitted this assignment, your submission might still be under review. please check back later after its finalized!"}
          </span>
        }
      />
    );
  } else if (props.inDemoMode && !state.assignment) {
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
    if (!state.assignment) {
      return <div>We're not supposed to get here..</div>;
    }

    // At this stage, we're going to render the Code Review Console, so we can
    // build the elements that are common between read-level and write-level

    /*********************************************************
      /* Build header
      /*********************************************************/

    middleHeader =
      state.hideGrades || state.permissionLevel === PERMISSION_LEVEL.READ_FILES_ONLY
        ? []
        : [
            <GradeButton
              key="subheader-grade"
              assignment={state.assignment!}
              submission={state.submission === undefined ? state.readOnlySubmission! : state.submission}
              calculateGrade={calculateGradeFromState}
              rubricCategories={state.rubricCategories}
              comments={state.comments}
              commentRubricComments={state.commentRubricComments}
              files={state.files}
              submissionTests={state.tests}
              testCases={Object.values(state.testCases).flat() as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            />,
          ];

    const fileMenuTitle = <FileMenuTitle key="files" files={state.files} />;
    if (props.inDemoMode) {
      if (state.permissionLevel === PERMISSION_LEVEL.READ) {
        if (state.selectedFile) {
          const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
            <StudentCode
              key={state.selectedFile!.id}
              file={state.selectedFile!}
              comments={state.comments[state.selectedFile!.id]}
              readOnly={true}
              user={props.user.email}
              onHighlightClick={onHighlightClick}
              executionResult={state.executionResults[state.selectedFile!.id] || null}
              onClearOutputs={handleClearOutputs}
            />
          );

          const comments = (
            <StudentComments
              isStudent={state.isStudent}
              comments={state.comments[state.selectedFile!.id]}
              rubricComments={state.commentRubricComments}
              file={state.selectedFile!}
              fileIDs={state.files.map((file: FileType) => {
                return file.id;
              })}
              verticalOffset={state.codeVerticalOffset}
              updateFeedback={updateFeedback.bind(this, state.selectedFile!.id)}
              studentFeedbackOn={state.assignment.commentFeedback}
              hideAuthor={state.assignment.hideGradersFromStudents}
              additiveGrading={false}
              rubricCategories={state.rubricCategories}
            />
          );

          content = (
            <CommentHighlightProvider
              file={state.selectedFile!}
              comments={state.comments[state.selectedFile!.id]}
              readOnly={true}
              user={props.user.email}
              onHighlightClick={(_e: React.MouseEvent) => {
                // Highlight clicks are handled by CodePanelLayout for scroll sync in demo student mode.
              }}
              onHighlightSelect={handleHighlightSelect}
            >
              <CodePanelLayout
                comments={comments}
                code={code}
                toolbarWidgets={toolbarWidgets}
                file={state.selectedFile}
                zoom={state.codeZoom}
                updateVerticalOffset={setVerticalOffset}
              />
            </CommentHighlightProvider>
          );
        } else if (state.panelType === PANEL_TYPE.TESTS) {
          content = <TestsList tests={state.tests} cases={state.testCases} categories={state.testCategories} />;
        }

        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={claimSubmission}
            isStudent={state.isStudent}
            toggleShowExplanations={toggleShowExplanations}
            showExplanations={state.showExplanations}
            hasExplanations={Object.values(state.rubricComments)
              .flat()
              .some((el) => el.explanation)}
            isAdmin={isCourseAdmin(state.assignment)}
            course={state.course}
            assignment={state.assignment}
          />,
          <SubheaderTitle key="subheader-title" assignment={state.assignment!} />,
        ];

        rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

        sider = [
          <ReadOnlySubmissionInfo
            key="submission-info"
            title="Submission Info"
            assignment={state.assignment}
            readOnlySubmission={state.readOnlySubmission!}
            submitStudentQuestion={submitStudentQuestion}
            deleteStudentQuestion={deleteStudentQuestion}
            isStudentMode={state.readOnlySubmission!.students!.find((el) => el === props.user.email) === undefined}
          />,
          <FileMenu
            key="file-menu"
            title="Files"
            files={state.files}
            comments={state.comments}
            selectedFile={state.selectedFile}
            getPointsInFile={getPointsInFile}
            changeSelectedFile={changeSelectedFile}
          />,
        ];

        siderTitles = ['Submission Info', fileMenuTitle];
      } else {
        if (state.selectedFile) {
          const demoCode = (onHighlightClick: (e: React.MouseEvent) => void) => (
            <GradeCode
              key={state.selectedFile!.id}
              file={state.selectedFile!}
              comments={state.comments[state.selectedFile!.id]}
              readOnly={state.submission!.isFinalized}
              addComment={addComment}
              user={props.user.email}
              onHighlightClick={onHighlightClick}
              commentCounter={state.commentCounter}
              assignmentFile={undefined}
              cursorMode={state.cursorMode}
              showCursor={state.showCursor}
              updateCursorDomain={updateCursorDomain}
              executionResult={state.executionResults[state.selectedFile!.id] || null}
              onClearOutputs={handleClearOutputs}
            />
          );

          const demoComments = (
            <GradeComments
              isStudent={state.isStudent}
              showExplanations={state.showExplanations}
              comments={state.comments[state.selectedFile!.id]}
              rubricComments={state.commentRubricComments}
              readOnly={state.submission!.isFinalized}
              file={state.selectedFile!}
              fileIDs={state.files.map((file: FileType) => {
                return file.id;
              })}
              activeCommentID={state.activeCommentID}
              changeActive={changeActiveComment}
              deleteComment={deleteComment}
              saveComment={saveComment}
              removeRubricComment={removeRubricComment}
              oldCommentIDs={state.oldCommentIDs}
              verticalOffset={state.codeVerticalOffset}
              updateFeedback={updateFeedback.bind(this, state.selectedFile!.id)}
              studentFeedbackOn={state.assignment.commentFeedback}
              hideAuthor={state.assignment.hideGradersFromStudents}
              additiveGrading={state.assignment.additiveGrading}
              forcedRubricMode={state.assignment.forcedRubricMode}
              rubricCategories={state.rubricCategories}
              showCursor={state.showCursor}
            />
          );

          content = (
            <CommentHighlightProvider
              file={state.selectedFile!}
              comments={state.comments[state.selectedFile!.id]}
              readOnly={state.submission!.isFinalized}
              user={props.user.email}
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
                file={state.selectedFile}
                zoom={state.codeZoom}
                updateVerticalOffset={setVerticalOffset}
              />
            </CommentHighlightProvider>
          );
        } else if (state.panelType === PANEL_TYPE.TESTS) {
          content = <TestsList tests={state.tests} cases={state.testCases} categories={state.testCategories} />;
        }

        const onCancel = () => {
          return;
        };

        sider = [
          <SubmissionInfo
            key="submission-info"
            title="Submission Info"
            assignment={state.assignment!}
            submission={state.submission!}
            courseLateDayCreditsAllowable={state.course!.lateDayCreditsAllowable}
            graders={state.graders}
            isCourseAdmin={isCourseAdmin(state.assignment)}
            updateGrader={updateGrader}
            addLateDayCreditComment={addLateDayCreditComment}
            isStudentMode={false}
          />,
          <TestsMenu
            key="tests-menu"
            isOpen={state.panelType === PANEL_TYPE.TESTS}
            tests={state.tests}
            cases={state.testCases}
            categories={state.testCategories}
            assignment={state.assignment}
            emptyMessage="Your instructor didn't define any tests for this assignment. "
            showLink={true}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              setState((prev) => ({ ...prev, panelType: PANEL_TYPE.TESTS, selectedFile: undefined }));
            }}
            headerActions={testsActions}
          />,
          <FileMenu
            key="file-menu"
            title="Files"
            files={state.files}
            comments={state.comments}
            selectedFile={state.selectedFile}
            getPointsInFile={getPointsInFile}
            changeSelectedFile={changeSelectedFile}
          />,
          <RubricManager
            key="rubric-menu"
            shouldLoadFeedback={false}
            shouldLoadInstanceLists={state.assignment.showFrequentlyUsedRubricComments}
            assignment={state.assignment}
            submissions={[]}
            onCancel={onCancel}
            defaultRubric={{
              categories: state.rubricCategories,
              comments: _.flatten(Object.values(state.rubricComments)),
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
                showExplanations: outerState.showExplanations,
                showFrequent:
                  outerState.assignment !== undefined ? outerState.assignment.showFrequentlyUsedRubricComments : false,
                course: outerState.course!,
              };
              return <RubricMenuUI props={propz} state={rubricState} helpers={helpers} />;
            }}
          </RubricManager>,
        ];

        siderTitles = ['Submission Info', testsTitle, fileMenuTitle, 'Rubric'];

        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={claimSubmission}
            isStudent={state.isStudent}
            isDemo={true}
            toggleShowExplanations={toggleShowExplanations}
            showExplanations={state.showExplanations}
            hasExplanations={Object.values(state.rubricComments)
              .flat()
              .some((el) => el.explanation)}
            isAdmin={isCourseAdmin(state.assignment)}
            course={state.course}
            assignment={state.assignment}
          />,
          <SubheaderTitle key="subheader-title" assignment={state.assignment} />,
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
            submission={state.submission!}
            toggleFinalized={toggleFinalized}
            numComments={Object.values(state.comments).flat().length}
            minComments={state.course!.minComments}
            canUnfinalize={true}
            isOnlyGrader={state.graders.length === 1}
          />,
        ];
      }
    } else if (state.permissionLevel === PERMISSION_LEVEL.READ) {
      if (state.selectedFile) {
        const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
          <StudentCode
            key={state.selectedFile!.id}
            file={state.selectedFile!}
            comments={state.comments[state.selectedFile!.id]}
            readOnly={true}
            user={props.user.email}
            onHighlightClick={onHighlightClick}
            executionResult={state.executionResults[state.selectedFile!.id] || null}
            onClearOutputs={handleClearOutputs}
          />
        );

        const comments = (
          <StudentComments
            isStudent={state.isStudent}
            comments={state.comments[state.selectedFile!.id]}
            rubricComments={state.commentRubricComments}
            file={state.selectedFile!}
            fileIDs={state.files.map((file: FileType) => {
              return file.id;
            })}
            verticalOffset={state.codeVerticalOffset}
            updateFeedback={updateFeedback.bind(this, state.selectedFile!.id)}
            studentFeedbackOn={state.assignment.commentFeedback}
            hideAuthor={state.assignment.hideGradersFromStudents}
            additiveGrading={false}
            rubricCategories={state.rubricCategories}
            scrollToCommentID={parseInt(queryString.parse(props.location.search).comment as string)}
          />
        );

        content = (
          <CommentHighlightProvider
            file={state.selectedFile!}
            comments={state.comments[state.selectedFile!.id]}
            readOnly={true}
            user={props.user.email}
            onHighlightClick={(_e: React.MouseEvent) => {
              // Highlight clicks are handled by CodePanelLayout for scroll sync in student mode.
            }}
            onHighlightSelect={handleHighlightSelect}
          >
            <CodePanelLayout
              comments={comments}
              code={code}
              toolbarWidgets={toolbarWidgets}
              file={state.selectedFile}
              zoom={state.codeZoom}
              updateVerticalOffset={setVerticalOffset}
            />
          </CommentHighlightProvider>
        );
      } else if (state.panelType === PANEL_TYPE.TESTS) {
        content = <TestsList tests={state.tests} cases={state.testCases} categories={state.testCategories} />;
      }

      leftHeader = [
        <HeaderMenu
          key="menu"
          claimSubmission={claimSubmission}
          isStudent={state.isStudent}
          toggleShowExplanations={toggleShowExplanations}
          showExplanations={state.showExplanations}
          hasExplanations={Object.values(state.rubricComments)
            .flat()
            .some((el) => el.explanation)}
          isAdmin={isCourseAdmin(state.assignment)}
          course={state.course}
          assignment={state.assignment}
        />,
        <SubheaderTitle key="subheader-title" assignment={state.assignment!} />,
      ];

      rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

      sider = [
        <ReadOnlySubmissionInfo
          key="submission-info"
          title="Submission Info"
          assignment={state.assignment}
          readOnlySubmission={state.readOnlySubmission!}
          submitStudentQuestion={submitStudentQuestion}
          deleteStudentQuestion={deleteStudentQuestion}
          isStudentMode={
            state.readOnlySubmission!.students === undefined ||
            state.readOnlySubmission!.students.find((el) => el === props.user.email) === undefined
          }
        />,
        <TestsMenu
          key="tests-menu"
          isOpen={state.panelType === PANEL_TYPE.TESTS}
          tests={state.tests}
          cases={state.testCases}
          categories={state.testCategories}
          assignment={state.assignment}
          emptyMessage="Your instructor didn't define any tests for this assignment. "
          headerActions={testsActions}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setState((prev) => ({ ...prev, panelType: PANEL_TYPE.TESTS, selectedFile: undefined }));
          }}
        />,
        <FileMenu
          key="file-menu"
          title="Files"
          files={state.files}
          comments={state.comments}
          selectedFile={state.selectedFile}
          getPointsInFile={getPointsInFile}
          changeSelectedFile={changeSelectedFile}
        />,
      ];

      siderTitles = ['Submission Info', testsTitle, fileMenuTitle];
    } else if (state.permissionLevel === PERMISSION_LEVEL.READ_FILES_ONLY) {
      // Files-only mode: show files but no comments, rubrics, or grades
      if (state.selectedFile) {
        const code = (_onHighlightClick: (e: React.MouseEvent) => void) => (
          <StudentCode
            key={state.selectedFile!.id}
            file={state.selectedFile!}
            comments={[]} // No comments in files-only mode
            readOnly={true}
            user={props.user.email}
            onHighlightClick={(_e) => {}}
            executionResult={state.executionResults[state.selectedFile!.id] || null}
            onClearOutputs={handleClearOutputs}
          />
        );

        content = (
          <CodePanelLayout
            comments={null} // No comments panel
            code={code}
            toolbarWidgets={toolbarWidgets}
            file={state.selectedFile}
            zoom={state.codeZoom}
            updateVerticalOffset={setVerticalOffset}
          />
        );
      }

      leftHeader = [
        <SubheaderTitle key="subheader-title" assignment={state.assignment!} />,
        <Tag key="files-only-notice" color="warning">
          Files Only - Feedback not yet available
        </Tag>,
      ];

      rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

      sider = [
        <ReadOnlySubmissionInfo
          key="submission-info"
          title="Submission Info"
          assignment={state.assignment}
          readOnlySubmission={state.readOnlySubmission!}
          submitStudentQuestion={undefined} // No regrade requests in files-only mode
          deleteStudentQuestion={undefined}
          isStudentMode={true}
        />,
        <FileMenu
          key="file-menu"
          title="Files"
          files={state.files}
          comments={{}} // No comments to show
          selectedFile={state.selectedFile}
          getPointsInFile={getPointsInFile}
          changeSelectedFile={changeSelectedFile}
        />,
      ];

      siderTitles = ['Submission Info', fileMenuTitle];
    } else {
      leftHeader = [
        <HeaderMenu
          key="menu"
          claimSubmission={claimSubmission}
          isStudent={state.isStudent}
          toggleShowExplanations={toggleShowExplanations}
          showExplanations={state.showExplanations}
          hasExplanations={Object.values(state.rubricComments)
            .flat()
            .some((el) => el.explanation)}
          isAdmin={isCourseAdmin(state.assignment)}
          course={state.course}
          assignment={state.assignment}
        />,
        <SubheaderTitle key="subheader-title" assignment={state.assignment!} />,
        <StatusTags
          key="tag"
          assignment={state.assignment!}
          submission={state.submission!}
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
        <DownloadCode key="download-code" submission={state.submission!} />,
        controls,
        <ViewAsStudent key="view-as-student" pathname={props.location.pathname} />,
        <FinalizeButton
          key="subheader-finalize"
          course={state.course!}
          submission={state.submission!}
          toggleFinalized={toggleFinalized}
          numComments={Object.values(state.comments).flat().length}
          minComments={state.course!.minComments}
          canUnfinalize={!state.course!.noUnfinalize || isCourseAdmin(state.assignment)}
          isOnlyGrader={state.graders.length === 1}
        />,
      ];

      if (state.selectedFile !== undefined) {
        let assignmentFile: AssignmentFileType | undefined;
        if (state.assignmentFiles !== undefined) {
          assignmentFile = state.assignmentFiles.find((template: AssignmentFileType) => {
            // FIXME: could be more flexible here
            // Find the first match
            return template.name === state.selectedFile!.name;
          });
        }

        const code = (onHighlightClick: (e: React.MouseEvent) => void) => (
          <GradeCode
            key={state.selectedFile!.id}
            file={state.selectedFile!}
            comments={state.comments[state.selectedFile!.id]}
            readOnly={state.submission!.isFinalized}
            addComment={addComment}
            user={props.user.email}
            onHighlightClick={onHighlightClick}
            commentCounter={state.commentCounter}
            assignmentFile={assignmentFile}
            cursorMode={state.cursorMode}
            showCursor={state.showCursor}
            updateCursorDomain={updateCursorDomain}
            executionResult={state.executionResults[state.selectedFile!.id] || null}
            onClearOutputs={handleClearOutputs}
          />
        );

        const comments = (
          <GradeComments
            isStudent={state.isStudent}
            showExplanations={state.showExplanations}
            comments={state.comments[state.selectedFile!.id]}
            rubricComments={state.commentRubricComments}
            readOnly={state.submission!.isFinalized}
            file={state.selectedFile!}
            fileIDs={state.files.map((file: FileType) => {
              return file.id;
            })}
            activeCommentID={state.activeCommentID}
            changeActive={changeActiveComment}
            deleteComment={deleteComment}
            saveComment={saveComment}
            removeRubricComment={removeRubricComment}
            oldCommentIDs={state.oldCommentIDs}
            verticalOffset={state.codeVerticalOffset}
            updateFeedback={updateFeedback.bind(this, state.selectedFile!.id)}
            studentFeedbackOn={state.assignment.commentFeedback}
            hideAuthor={state.assignment.hideGradersFromStudents}
            additiveGrading={state.assignment.additiveGrading}
            forcedRubricMode={state.assignment.forcedRubricMode}
            rubricCategories={state.rubricCategories}
            showCursor={state.showCursor}
            scrollToCommentID={parseInt(queryString.parse(props.location.search).comment as string)}
          />
        );

        content = (
          <div>
            <CommentHighlightProvider
              file={state.selectedFile!}
              comments={state.comments[state.selectedFile!.id]}
              readOnly={state.submission!.isFinalized}
              user={props.user.email}
              onHighlightClick={(_e: React.MouseEvent) => {
                // This is called from CodePanelLayout's scroll sync handler
                // The event already has the comment ID in e.currentTarget.id
                // This is a no-op for now - the scroll sync happens in CodePanelLayout
              }}
              addComment={addComment}
              onHighlightSelect={handleHighlightSelect}
            >
              <CodePanelLayout
                comments={comments}
                code={code}
                toolbarWidgets={toolbarWidgets}
                file={state.selectedFile}
                zoom={state.codeZoom}
                updateVerticalOffset={setVerticalOffset}
              />
            </CommentHighlightProvider>
            <CustomCommentExplorer
              graders={state.graders}
              user={props.user.email}
              isAdmin={isCourseAdmin(state.assignment)}
              assignment={state.assignment}
              rubricComments={Object.values(state.rubricComments).flat()}
              rubricCategories={state.rubricCategories}
              visible={state.showCustomCommentExplorer}
              onCancel={toggleCustomCommentExplorer}
            />
          </div>
        );
      } else if (state.panelType === PANEL_TYPE.TESTS) {
        content = <TestsList tests={state.tests} cases={state.testCases} categories={state.testCategories} />;
      }

      const onCancel = () => {
        return;
      };

      sider = [
        <SubmissionInfo
          title="Submission Info"
          assignment={state.assignment}
          courseLateDayCreditsAllowable={state.course!.lateDayCreditsAllowable}
          submission={state.submission!}
          graders={state.graders}
          isCourseAdmin={isCourseAdmin(state.assignment)}
          updateGrader={updateGrader}
          addLateDayCreditComment={addLateDayCreditComment}
          isStudentMode={false}
        />,
        <TestsMenu
          key="tests-menu"
          isOpen={state.panelType === PANEL_TYPE.TESTS}
          tests={state.tests}
          cases={state.testCases}
          categories={state.testCategories}
          assignment={state.assignment}
          emptyMessage="No tests have been defined for this assignment."
          showLink={true}
          headerActions={testsActions}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setState((prev) => ({ ...prev, panelType: PANEL_TYPE.TESTS, selectedFile: undefined }));
          }}
        />,
        <FileMenu
          key="file-menu"
          title="Files"
          files={state.files}
          comments={state.comments}
          selectedFile={state.selectedFile}
          getPointsInFile={getPointsInFile}
          changeSelectedFile={changeSelectedFile}
        />,
        <RubricManager
          key="rubric-menu"
          assignment={state.assignment}
          submissions={[]}
          onCancel={onCancel}
          reloadInterval={state.rubricReload}
          setRubric={setRubric}
          shouldLoadFeedback={false}
          shouldLoadInstanceLists={state.assignment.showFrequentlyUsedRubricComments}
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
              canUserEdit: isCourseAdmin(outerState.assignment) || outerState.assignment!.collaborativeRubricMode,
              showCursor: outerState.showCursor,
              updateCursorDomain: updateCursorDomain,
              demoMode: outerState.noSave === true,
              showExplanations: outerState.showExplanations,
              showFrequent:
                outerState.assignment !== undefined ? outerState.assignment.showFrequentlyUsedRubricComments : false,
              course: outerState.course!,
            };
            return <RubricMenuUI props={propz} state={rubricState} helpers={helpers} />;
          }}
        </RubricManager>,
      ];

      siderTitles = ['Submission Info', testsTitle, fileMenuTitle, 'Rubric'];
    }
  }

  const cancelFunc = () => {
    return;
  };

  /*************************************************************************************/
  /* Foobar config */
  /*************************************************************************************/

  /* callbacks */
  const assigner = (queryValue?: string) => {
    if (queryValue !== undefined) {
      updateGrader(state.submission!, queryValue);
    }
  };

  const goToFile = (queryValue?: string) => {
    if (queryValue !== undefined) {
      const foundFile = state.files.find((file) => {
        return file.name === queryValue;
      });
      if (foundFile) {
        changeSelectedFile(foundFile.id);
      }
    }
  };

  const goToTests = () => {
    setState((prev) => ({ ...prev, panelType: PANEL_TYPE.TESTS, selectedFile: undefined }));
  };

  const findGraderSubmissions = async (grader: string) => {
    const submissions = await Assignment.readSubmissions(state.assignment!.id, { grader });
    return submissions.map((sub) => {
      return {
        value: `${sub.id}`,
        label: `Open submission ${sub.id}`,
        callback: () => openSubmissionInSameTab(sub.id),
        tags: sub.students,
        kind: 'action',
      };
    });
  };

  const findStudentSubmission = async (student: string) => {
    const submissions = await Assignment.readSubmissions(state.assignment!.id, { student });
    if (submissions.length === 1) {
      const sub = submissions[0];
      return [
        {
          value: `${sub.id}`,
          label: `Open submission ${sub.id}`,
          callback: () => openSubmissionInSameTab(sub.id),
          tags: sub.students,
          kind: 'action',
        },
      ];
    } else {
      return [];
    }
  };

  const viewStats = async () => {
    if (state.assignment) {
      const submissions = await Assignment.readSubmissions(state.assignment.id);

      const numSubmissions = submissions.length;
      const numGraded = submissions.filter((el) => el.isFinalized).length;
      const numInProgress = submissions.filter((el) => el.grader && !el.isFinalized).length;
      const numUnclaimed = numSubmissions - numGraded - numInProgress;

      return (
        <div>
          <Progress
            percent={Math.floor(((numGraded + numInProgress) / numSubmissions) * 100)}
            success={{ percent: Math.floor((numGraded / numSubmissions) * 100) }}
            type="dashboard"
          />
          &nbsp;&nbsp;&nbsp;
          <Typography.Text style={{ paddingBottom: 10 }}>
            {`${numGraded} done / ${numInProgress} drafts / ${numUnclaimed} unclaimed`}
          </Typography.Text>
        </div>
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let defaultOptions: any[] = [
    {
      value: 'Jump to ',
      label: 'Jump to {{file}}',
      kind: 'dynamic',
      child: {
        callback: goToFile,
        kind: 'action',
      },
    },
    {
      value: 'Open tests',
      label: 'Open tests',
      kind: 'action',
      callback: goToTests,
    },
    {
      value: 'Show custom comment explorer',
      label: 'Show custom comment explorer',
      kind: 'action',
      callback: toggleCustomCommentExplorer,
    },
  ];

  if (isCourseAdmin(state.assignment)) {
    window.CommandBar.addContext({ students: state.students });

    defaultOptions = [
      ...defaultOptions,
      {
        value: 'Find submission of ',
        label: 'Find submission of {{student}}',
        kind: 'dynamic',
        child: {
          generator: findStudentSubmission,
          kind: 'generator',
          emptyMessage: 'Student has no submission for this assignment',
        },
      },
      {
        value: 'Find submissions graded by ',
        label: 'Find submissions graded by {{grader}}',
        kind: 'dynamic',
        child: {
          generator: findGraderSubmissions,
          kind: 'generator',
          emptyMessage: "Grader hasn't graded any submissions",
        },
      },
      {
        value: 'Assign to ',
        label: 'Assign to {{grader}}',
        kind: 'dynamic',
        child: {
          callback: assigner,
          kind: 'action',
        },
      },
      {
        value: 'Open rubric editor',
        label: 'Open rubric editor',
        link: getRubricURL(state.course!, state.assignment!),
        kind: 'link',
      },
      {
        value: 'Open test editor',
        label: 'Open test editor',
        link: `/admin/${encodeForLink(state.course!.name)}/${encodeForLink(
          state.course!.period,
        )}/assignments/tests/${encodeForLink(state.assignment!.name)}/edit/tests`,
        kind: 'link',
      },
      {
        value: 'Open test results',
        label: 'Open test results',
        link: `/admin/${encodeForLink(state.course!.name)}/${encodeForLink(
          state.course!.period,
        )}/assignments/tests/${encodeForLink(state.assignment!.name)}/results`,
        kind: 'link',
      },
      { value: 'View stats', label: 'View stats', kind: 'dashboard', populator: viewStats },
      { value: 'Edit code', label: 'Edit code', callback: showInlineTestsModal, kind: 'action' },
      { value: 'Debug mode', label: 'Debug mode', callback: showInlineTestsModal, kind: 'action' },
    ];
  }

  // Merge with help queries
  const allOptions = [...defaultOptions, ...helpQueryMap];
  void allOptions; // Preserve merged options for legacy CommandBar tooling

  // New Foobar config
  window.CommandBar.addCallback('showInlineTestsModal', showInlineTestsModal);

  (window as { foobarIsActive?: boolean }).foobarIsActive = false; // lift off // MODIFIED ON 2020-01-20 for CommandBar

  /*************************************************************************************/
  return (
    <div id="Grade">
      <CodeConsoleOnboardingSelector
        open={props.inDemoMode && !state.assignment}
        onUploadConfirm={loadDemoData}
        onCancel={cancelFunc}
      />
      <CourseContext.Provider value={state.course || defaultCourse}>
        {localStorage.getItem('source') !== 'codePost' ? (
          content
        ) : (
          <StandardConsoleLayout
            consoleTypes={['grade']}
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
            content={content}
            editRubricMode={state.editRubricMode}
          />
        )}
        <KeyboardShortcuts
          key="keyboard-shortcuts"
          visible={state.showKeyboardShortcuts}
          onClose={toggleKeyboardShortcuts}
          isStudent={state.isStudent}
        />
        {state.permissionLevel === PERMISSION_LEVEL.WRITE &&
        state.assignment !== undefined &&
        state.submission !== undefined ? (
          <InlineTestsModal
            key="inline-tests-modal"
            visible={state.showInlineTestsModal}
            show={showInlineTestsModal}
            hide={hideInlineTestsModal}
            files={state.files}
            assignment={state.assignment}
            submission={state.submission}
          />
        ) : null}
      </CourseContext.Provider>
    </div>
  );
};

export default CodeConsole;
