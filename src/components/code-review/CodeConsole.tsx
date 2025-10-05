/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { BugOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, Empty, message, notification, Progress, Typography } from 'antd';

/* other library imports */
import _ from 'lodash';
import queryString from 'query-string';

/* codePost imports */
import Loading from '../core/Loading';

import { getOperatingSystem, OS } from '../core/operatingSystem';

import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { Assignment, AssignmentStudent, AssignmentType } from '../../infrastructure/assignment';
import { CommentIO, CommentType } from '../../infrastructure/comment';
import { Course, CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
import { FileTemplate, FileTemplateType } from '../../infrastructure/fileTemplate';
import { RubricCategory, RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../infrastructure/rubricComment';
import { AnonymousSubmissionType, StudentSubmissionType, Submission } from '../../infrastructure/submission';
import { SubmissionTest, SubmissionTestType } from '../../infrastructure/submissionTest';
import { TestCategoryType } from '../../infrastructure/testCategory';
import { UserType } from '../../infrastructure/user';

import CPButton from '../core/CPButton';
import CPFlex from '../core/CPFlex';
import StandardConsoleLayout from '../core/layouts/StandardConsoleLayout';

import { GradeCode, StudentCode } from './code-panel/CodeContent';
import CodePanelLayout from './code-panel/CodePanelLayout';
import { GradeComments, StudentComments } from './code-panel/Comments';

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

import { fetchTestData, StudentTestCasesByCategory, TestCasesByCategory } from '../core/testFetchUtils';

import {
  Controls,
  DownloadCode,
  FinalizeButton,
  GradeButton,
  HeaderMenu,
  HeaderSearch,
  StatusTags,
  SubheaderTitle,
  ViewAsStudent,
} from '../code-review/Header';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

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
export enum PERMISSION_LEVEL {
  NOT_FOUND,
  NONE,
  READ,
  WRITE,
}

export enum CURSOR_DOMAIN {
  CODE,
  CODE_HIDDEN,
  COMMENTS,
  COMMENTS_HIDDEN,
  RUBRIC,
}

enum PANEL_TYPE {
  TESTS,
  FILE,
}

interface ICodeConsoleState {
  /* UI control */
  permissionLevel: PERMISSION_LEVEL;
  isLoading: boolean;
  selectedFile: FileType | undefined;
  codeZoom: number;
  codeVerticalOffset: number;
  isStudent: boolean;
  showKeyboardShortcuts: boolean;
  showExplanations: boolean;
  showCustomCommentExplorer: boolean;

  /* submissions data for readers and writers */
  readOnlySubmission?: StudentSubmissionType;
  assignment?: AssignmentType;
  course?: CourseType;
  files: FileType[];
  comments: IFileToCommentsMap;
  fileTemplates?: FileTemplateType[];
  tests: SubmissionTestType[];
  testCategories: TestCategoryType[];
  testCases: TestCasesByCategory | StudentTestCasesByCategory;
  showInlineTestsModal: boolean;

  /* writer data */
  submission?: AnonymousSubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  activeCommentID?: number;
  oldCommentIDs: { [currentID: number]: number };

  /* admin data */
  graders: string[];
  students: string[];

  /* demo data */
  demoCommentCounter: number;

  editRubricMode: boolean;
  commentCounter: number;
  commentRefreshCounter: number;

  panelType: PANEL_TYPE;

  rubricReload?: number;

  /* console cursor */
  cursorMode: boolean;
  showCursor: CURSOR_DOMAIN;
  noSave?: boolean;

  hideGrades: boolean;
}

export interface ICodeConsoleProps {
  match: any;
  history: any;
  location: any;
  user: UserType;
  handleLogout: () => void;
  inDemoMode: boolean;
}

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

class CodeConsole extends React.Component<ICodeConsoleProps, ICodeConsoleState> {
  /***********************************************************************************************/
  /* Static Methods - Now imported from codeConsoleUtils (can be used as utility functions)
  /***********************************************************************************************/

  // Note: Static methods have been extracted to codeConsoleUtils.ts
  // They can be imported and used directly: addCommentToState, removeCommentFromState, etc.

  /***********************************************************************************************/
  /* Component instance
  /***********************************************************************************************/

  private checkNewFilesInterval: any;
  private reloadCommentsInterval: any;
  private LIVE_FEEDBACK_FILES_RELOAD_INTERVAL = 60000;
  private LIVE_FEEDBACK_COMMENTS_RELOAD_INTERVAL = 2000;

  public constructor(props: ICodeConsoleProps) {
    super(props);
    this.state = {
      permissionLevel: PERMISSION_LEVEL.READ,
      activeCommentID: undefined,
      assignment: undefined,
      commentRubricComments: {},
      comments: {},
      fileTemplates: undefined,
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
    };
  }

  /**********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public async componentDidMount() {
    // CommandBar loading callbacks

    window.CommandBar.addCallback(
      'assignGrader',
      // Assumes the existence of an argument called name
      (args, context) => {
        if (this.state.submission) this.updateGrader(this.state.submission!, args.grader);
      },
    );

    window.CommandBar.addCallback(
      'gotoFile',
      // Assumes the existence of an argument called name
      (args, context) => {
        if (this.state.submission) {
          const foundFile = this.state.files.find((file) => {
            return file.name === args.filename;
          });
          if (foundFile) {
            this.changeSelectedFile(foundFile.id);
          }
        }
      },
    );

    window.CommandBar.addCallback(
      'gotoTestResults',
      // Assumes the existence of an argument called name
      (args, context) => {
        this.setState({ panelType: PANEL_TYPE.TESTS, selectedFile: undefined });
      },
    );

    window.CommandBar.addCallback(
      'gotoCustomCommentExplorer',
      // Assumes the existence of an argument called name
      (args, context) => {
        this.toggleCustomCommentExplorer();
      },
    );

    // Other stuff

    document.addEventListener('keydown', this.handleCursor);
    document.addEventListener('keydown', this.handleHotkeys);
    const queryValues = queryString.parse(this.props.location.search);

    if (this.props.inDemoMode) {
      document.title = 'codePost | Code Console Demo';

      /**********************************************************************************/
      /* BEGIN: QUERY ARG PARSING
      /**********************************************************************************/

      if (queryValues.sample && queryValues.sample === '1') {
        this.loadDemoData([], true);
      } else {
        this.loadDemoData([], false);
      }

      /**********************************************************************************/
      /* END: QUERY ARG PARSING
      /**********************************************************************************/

      this.setState({ isLoading: false });
      return;
    }

    // Set window title
    const submissionID: number = +this.props.match.params.submissionId.valueOf();

    let permissionLevel = await this.detectPermissionType(submissionID);

    const values = queryString.parse(this.props.location.search);
    let simulatingStudent = false;
    if (permissionLevel === PERMISSION_LEVEL.WRITE && values.student !== undefined) {
      permissionLevel = PERMISSION_LEVEL.READ;
      simulatingStudent = true;
    }

    let noSave = false;
    if (values.noSave !== undefined) {
      noSave = true;
    }

    // Everything we need to load
    let submission;
    let assignment: AssignmentType;
    let files;
    let comments;
    let commentRubricComments;
    let course;
    let rubricCategories;
    let rubricComments;
    let selectedFile;
    let tests: SubmissionTestType[];

    switch (permissionLevel) {
      case PERMISSION_LEVEL.NOT_FOUND:
      case PERMISSION_LEVEL.NONE:
        // Will trigger 403 or 404 message in render
        this.setState({ permissionLevel, isLoading: false });
        break;
      case PERMISSION_LEVEL.READ:
        // load the data a reader has access to
        submission = await Submission.readReadOnly(submissionID);
        [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            Assignment.read(submission.assignment),
            Submission.loadData(submission),
            this.loadRubric(submission.assignment),
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
        this.setState(
          {
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
              (submission.students !== undefined && submission.students.indexOf(this.props.user.email) > -1),
          },
          () => {
            if (assignment && assignment.liveFeedbackMode) {
              // this.reloadCommentsInterval = window.setInterval(() => {
              //   this.reloadComments();
              // }, this.LIVE_FEEDBACK_COMMENTS_RELOAD_INTERVAL);
            }
          },
        );
        break;

      case PERMISSION_LEVEL.WRITE:
        // load the data a writer has access to

        const writableSubmission = await Submission.readAnonymous(submissionID);
        [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            Assignment.read(writableSubmission.assignment),
            Submission.loadData(writableSubmission),
            this.loadRubric(writableSubmission.assignment),
          ]);

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        course = await Course.read(assignment.course);
        let fileTemplates;
        if (assignment.templateMode) {
          fileTemplates = await Promise.all(
            assignment.fileTemplates.map((fileTemplateID: number) => {
              return FileTemplate.read(fileTemplateID);
            }),
          );
        }

        // load the data only an admin has access to
        let graders: string[] = [];
        let students: string[] = [];
        if (this.isCourseAdmin(assignment)) {
          const roster = await Course.readRoster(assignment.course);
          graders = roster['graders'];
          students = roster['students'];
        }

        // fill in grade using available data if submission doesn't contain an up-to-date grade
        if (assignment && !writableSubmission.isFinalized) {
          writableSubmission.grade = calculateGrade(
            assignment,
            comments,
            commentRubricComments,
            rubricCategories,
            files,
            this.state.tests,
            Object.values(this.state.testCases).flat(),
          );
        }

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

        tests = await Promise.all(writableSubmission.tests.map((id) => SubmissionTest.read(id)));
        const [categories, cases] = await fetchTestData(assignment);

        this.setState(
          {
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
            fileTemplates,
            tests: SubmissionTest.getLatest(tests),
            testCases: cases as TestCasesByCategory,
            testCategories: categories as TestCategoryType[],
          },
          () => this.setNewFilesWarning(),
        );
    }
  }

  public componentDidUpdate(prevProps: ICodeConsoleProps, prevState: ICodeConsoleState) {
    // CommandBar populate the context
    if (this.state.assignment && (!prevState.assignment || prevState.assignment != this.state.assignment)) {
      window.CommandBar.addContext({
        assignment: this.state.assignment,
      });
    }
    if (this.state.course && (!prevState.course || prevState.course != this.state.course)) {
      window.CommandBar.addContext({
        course: this.state.course,
      });
    }
    if (this.state.files && (!prevState.files || prevState.files != this.state.files)) {
      window.CommandBar.addContext({
        files: this.state.files,
        filenames: this.state.files.map((record) => record['name']),
      });
    }
    if (this.state.graders && (!prevState.graders || prevState.graders != this.state.graders)) {
      window.CommandBar.addContext({
        graders: this.state.graders,
      });
    }
    if (this.state.submission && (!prevState.submission || prevState.submission != this.state.submission)) {
      window.CommandBar.addContext({
        submission: this.state.submission,
      });
    }
  }

  public componentWillUnmount() {
    document.removeEventListener('keydown', this.handleCursor);
    document.removeEventListener('keydown', this.handleHotkeys);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Cursor Navigation (in order of code implementation below)
  //
  // >>>>>>>>>>> If Active Comment
  // - Move up and down rubric: cmd - [j,k]
  //
  // >>>>>>>>>>> No Active Comment
  // >>> General
  // - Leave 'cursor mode': escape
  // - Enter 'cursor mode': cmd - [up, down]
  //
  // >>> Code Domain
  // - Change from code to comments domain: cmd - [left, right]
  // - Extend code cursor: cmd - shift - [up, down]
  // - Navigate and scroll code with cursor: cmd - [up, down]
  // - Highlight selection: Enter
  //
  // >>> Comments Domain
  // - Change from comments to code domain: cmd - [left, right]
  // - Navigate and jump to next comment with cursor: cmd - [up, down]
  // - Activate comment for editing: Enter
  /////////////////////////////////////////////////////////////////////////////////

  public handleHotkeys = (e: any) => {
    const os = getOperatingSystem();

    const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

    // Show Custom Comment Explorer (typically accessible via Foobar)
    if (e.key === 'e' && triggerKey && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleCustomCommentExplorer();
    }
  };

  public toggleCursorMode = (cursorMode: boolean) => {
    if (cursorMode) {
      this.setState({ cursorMode, showCursor: CURSOR_DOMAIN.CODE });
    } else {
      this.setState({ cursorMode, showCursor: CURSOR_DOMAIN.CODE_HIDDEN });
    }
  };

  public handleCursor = async (e: any) => {
    const os = getOperatingSystem();
    const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

    if (e.key === '/' && triggerKey) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleKeyboardShortcuts();
      return;
    }

    if (e.key === 'y' && triggerKey && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleCursorMode(!this.state.cursorMode);
      return;
    }

    if (this.state.cursorMode) {
      if (this.state.selectedFile !== undefined) {
        if (this.state.activeCommentID !== undefined) {
          if (e.key === 'y' && triggerKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            if (this.state.showCursor === CURSOR_DOMAIN.RUBRIC) {
              this.focusActiveComment();
              this.setState({ showCursor: CURSOR_DOMAIN.CODE_HIDDEN });
            } else {
              this.blurActiveComment();
              this.setState({ showCursor: CURSOR_DOMAIN.RUBRIC });
            }
          } else if (e.key === 'e' && triggerKey && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.setState({ showCursor: CURSOR_DOMAIN.CODE, activeCommentID: undefined });
          }
        } else {
          if (e.key === 'e' && triggerKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            if (
              this.state.comments[this.state.selectedFile.id] !== undefined &&
              this.state.comments[this.state.selectedFile.id].length > 0
            ) {
              this.setState({ showCursor: CURSOR_DOMAIN.COMMENTS });
            }
          } else if (e.key === 'e' && triggerKey && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.setState({ showCursor: CURSOR_DOMAIN.CODE });
          }
        }
      }
    }
  };

  public updateCursorDomain = (domain: CURSOR_DOMAIN) => {
    if (domain === CURSOR_DOMAIN.CODE) {
      this.changeActiveComment(undefined);
    }
    this.setState({ showCursor: domain });
  };

  public focusActiveComment = () => {
    const commentTextArea = document.getElementById('comment-text-area');
    if (commentTextArea !== null) {
      commentTextArea.focus();
    }
  };

  public blurActiveComment = () => {
    const commentTextArea = document.getElementById('comment-text-area');
    if (commentTextArea !== null) {
      commentTextArea.blur();
    }
  };

  /***********************************************************************************
  /* Loading methods
  /**********************************************************************************/

  public setNewFilesWarning = () => {
    if (
      this.state.permissionLevel !== PERMISSION_LEVEL.WRITE ||
      !this.state.submission ||
      !this.state.assignment ||
      !this.state.assignment.liveFeedbackMode
    ) {
      return;
    }

    this.checkNewFilesInterval = window.setInterval(() => {
      this.checkForNewFiles();
    }, this.LIVE_FEEDBACK_FILES_RELOAD_INTERVAL);
  };

  public checkForNewFiles = async () => {
    const newSubmission = await Submission.readAnonymous(this.state.submission!.id);
    if (newSubmission.files.length !== this.state.submission!.files.length) {
      notification['warning']({
        message: 'New files uploaded',
        description:
          'There are new files for this submission. Please refresh this page to view the new files, before continuing to grade. ',
        duration: null,
      });
      clearInterval(this.checkNewFilesInterval);
    }
  };

  // reloadComments only called for students
  public reloadComments = async () => {
    let requestID = 0;
    this.setState(
      (oldState) => {
        requestID = oldState.commentRefreshCounter + 1;
        return { commentRefreshCounter: requestID };
      },
      async () => {
        // preventing a self-DDoS from abandoned tabs by limiting the number of requests any session can make
        const MAX_REQUESTS = 3600 / (this.LIVE_FEEDBACK_COMMENTS_RELOAD_INTERVAL / 1000); // 1 hour

        if (requestID < MAX_REQUESTS) {
          // Fetch the latest submission in case the files changed elsewhere
          const newSub = await Submission.readReadOnly(this.state.readOnlySubmission!.id);
          let files, comments, _;
          [files, comments, _] = await Submission.loadData(newSub);
          files = fileBouncer(files);

          // change the selected file
          const selectedFile =
            files.find((f: FileType) => {
              return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
            }) || files[0];

          // guard against an old (i.e. not the latest) request from overwriting state
          if (this.state.commentRefreshCounter === requestID) {
            this.setState({ readOnlySubmission: newSub, files, comments, selectedFile });
          }
        } else {
          clearInterval(this.reloadCommentsInterval);
        }
      },
    );
  };

  public loadRubric = async (assignmentID: number) => {
    const rubric = await Assignment.readRubric(assignmentID);

    const rubricCategories = rubric.rubricCategories.sort(RubricCategory.compare);
    const rubricComments: any = {};

    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      rubricComments[rubricCategory.id] = rubric.rubricComments
        .filter((rubricComment) => {
          return rubricComment.category === rubricCategory.id;
        })
        .sort(RubricComment.compare);
    });

    return { rubricCategories, rubricComments };
  };

  public detectPermissionType = (submissionID: number) => {
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

  public changeActiveComment = (id: number | undefined): void => {
    if (id === undefined) {
      if (this.state.showCursor === CURSOR_DOMAIN.CODE_HIDDEN) {
        this.setState({ activeCommentID: id, showCursor: CURSOR_DOMAIN.CODE });
      } else if (this.state.showCursor === CURSOR_DOMAIN.COMMENTS_HIDDEN) {
        this.setState({ activeCommentID: id, showCursor: CURSOR_DOMAIN.COMMENTS });
      } else {
        this.setState({ activeCommentID: id, showCursor: CURSOR_DOMAIN.CODE });
      }
    } else {
      if (this.state.showCursor === CURSOR_DOMAIN.CODE) {
        this.setState({ activeCommentID: id, showCursor: CURSOR_DOMAIN.CODE_HIDDEN });
      } else if (this.state.showCursor === CURSOR_DOMAIN.COMMENTS) {
        this.setState({ activeCommentID: id, showCursor: CURSOR_DOMAIN.COMMENTS_HIDDEN });
      } else {
        this.setState({ activeCommentID: id, showCursor: CURSOR_DOMAIN.CODE_HIDDEN });
      }
    }
  };

  public changeSelectedFile = (fileID: number): void => {
    const selectedFile = this.state.files.find((file: FileType) => {
      return file.id === fileID;
    });
    if (selectedFile !== undefined) {
      LOCAL_SETTINGS.mostRecentFile.setter(selectedFile.id);
    }
    this.setState({ selectedFile, activeCommentID: undefined, panelType: PANEL_TYPE.FILE });
  };

  public toggleShowExplanations = () => {
    this.setState(
      (oldState: ICodeConsoleState) => {
        return { showExplanations: !oldState.showExplanations };
      },
      () => {
        message.info(`Now showing rubric comment ${this.state.showExplanations ? 'explanations' : 'text'}`);
      },
    );
  };

  public showInlineTestsModal = () => {
    this.setState({ showInlineTestsModal: true });
  };

  public hideInlineTestsModal = () => {
    this.setState({ showInlineTestsModal: false });
  };

  /***********************************************************************************
  /* Helper functions
  /**********************************************************************************/

  public submitStudentQuestion = async (submission: StudentSubmissionType, text: string, isRegrade: boolean) => {
    const payload = {
      id: submission.id,
      questionText: text,
      questionIsRegrade: isRegrade,
    };

    const newSubmission = await Submission.updateQuestion(payload);
    this.setState({ readOnlySubmission: newSubmission });

    return newSubmission;
  };

  public deleteStudentQuestion = async (submission: StudentSubmissionType) => {
    const payload = {
      id: submission.id,
    };

    const newSubmission = await Submission.deleteQuestion(payload);
    this.setState({ readOnlySubmission: newSubmission });

    return newSubmission;
  };

  public addLateDayCreditComment = async (lateDayCreditsUsed: number) => {
    // -- Add a LateDayCredit Comment --
    //
    // * Clear the submission of all other comments tagged with 'late'
    // * Update Submission.lateDayCreditsUsed
    // * Add, save the template comment
    // * Unfocus the new comment

    if (this.state.course === undefined || this.state.course.lateDayCreditsAllowable === null) {
      return;
    }

    if (this.state.assignment === undefined || !this.state.assignment.allowStudentUpload) {
      return;
    }

    if (this.state.submission === undefined) {
      return;
    }

    if (this.state.files.length === 0) {
      return;
    }

    const firstFile = this.state.files[0];

    const daysLate = getDaysLate(this.state.assignment, this.state.submission);
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
      id: this.state.commentCounter,
      file: firstFile.id,
      pointDelta: 0.0,
      text,
      rubricComment: null,
      author: this.props.user.email,
      feedback: 0,
      tags: ['late'],
      color: '',
    };

    const submissionPayload = {
      id: this.state.submission!.id,
      lateDayCreditsUsed,
    };

    try {
      await Submission.update(submissionPayload);

      let promises: Promise<any>[] = [];
      // Clear previous LateDay comments
      for (const fileID of Object.keys(this.state.comments)) {
        promises = [
          ...promises,
          ...this.state.comments[+fileID].map(async (comment: CommentType) => {
            if (comment.tags !== undefined && comment.tags.includes('late')) {
              await this.deleteComment(comment);
            }
          }),
        ];
      }

      await Promise.all(promises);

      this.addComment(lateDayCreditComment, firstFile);
      this.saveComment(lateDayCreditComment);
      this.setState({ activeCommentID: undefined });
      return true;
    } catch (err) {
      return false;
    }
  };

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType) => {
    try {
      if (this.state.submission && this.state.submission.grader === null) {
        this.updateGrader(this.state.submission, this.props.user.email);
      }
    } catch (err) {
      console.log('comment author isnt enrolled as a grader');
    }

    const comments = addCommentToState(this.state.comments, comment, file);
    this.setState({ comments, activeCommentID: comment.id, commentCounter: this.state.commentCounter - 1 });
  };

  public updateComment = (commentID: number, newComment: CommentType, newRubricComment?: RubricCommentType) => {
    const comments = updateCommentsState(this.state.comments, commentID, newComment);

    const [rubricComment, restOfCommentRubricComments] = removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      commentID,
    );

    const commentRubricComments = addToCommentRubricCommentsState(
      restOfCommentRubricComments,
      newComment.id,
      newRubricComment ? newRubricComment : rubricComment,
    );

    this.setState({ comments, commentRubricComments });
  };

  public saveComment = async (comment: CommentType) => {
    console.log('[saveComment] Saving comment:', comment);
    let savedComment: CommentType = comment;
    let oldCommentIDs = this.state.oldCommentIDs;

    if (!this.props.inDemoMode && !this.state.noSave) {
      if (comment.id < 0) {
        console.log('[saveComment] Creating new comment via API...');
        savedComment = await CommentIO.create(comment);
        console.log('[saveComment] Comment created with ID:', savedComment.id);
        oldCommentIDs = { ...oldCommentIDs, [savedComment.id]: comment.id };

        // We need to prevent the following race condition error:
        // 1. User creates a comment => triggers a POST
        // 2. User deletes comment before the POST returns. The UI will treat this comment as unsaved
        // 3. POST returns, saving the comment.
        if (
          !_.flatten(Object.values(this.state.comments)).find((el: CommentType) => {
            return el.id === comment.id;
          })
        ) {
          await this.deleteComment(savedComment);
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
        savedComment = { ...comment, id: this.state.demoCommentCounter + 1 };
        oldCommentIDs = { ...oldCommentIDs, [savedComment.id]: comment.id };

        // we want to keep track of the order in which demo comments are created, so we can highlight
        // them precisely. For example, we may want to show one tooltip for the first comment made by
        // a user participating in the demo, and a different tooltip for the second comment.
        this.setState((oldState) => {
          return {
            demoCommentCounter: oldState.demoCommentCounter + 1,
          };
        });
      }
    }

    this.setState(
      {
        oldCommentIDs,
      },
      () => {
        this.updateComment(comment.id, savedComment);
      },
    );
  };

  public deleteComment = async (comment: CommentType) => {
    if (comment.id > 0 && !this.props.inDemoMode && !this.state.noSave) {
      await CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
    }

    const comments = removeCommentFromState(this.state.comments, comment);
    const [, commentRubricComments] = removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );

    this.setState({ comments, commentRubricComments }, () => {
      // We will never be in a situation in which we have an active comment immediately after
      // deleting a comment. Either
      // (1) we deleted the active comment, so it's no longer active
      // (2) we deleted a different comment, which closed any previously active comment
      this.changeActiveComment(undefined);
    });
  };

  public updateFeedback = (fileID: number, commentID: number, feedbackNum: number) => {
    CommentIO.updateFeedback({ id: commentID, feedback: feedbackNum }).then((newComment) => {
      this.setState((oldState) => {
        const newMap = { ...oldState.comments };
        newMap[fileID] = [
          ...newMap[fileID].filter((el) => {
            return el.id !== commentID;
          }),
          newComment,
        ];
        return { comments: newMap };
      });
    });
  };

  public removeRubricComment = (comment: CommentType, rubricComment: RubricCommentType) => {
    const comments = unlinkRubricComment(this.state.comments, comment, rubricComment);
    const [, commentRubricComments] = removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );

    this.setState({ comments, commentRubricComments });
  };

  public onRubricCommentClick = (rubricComment: RubricCommentType): void => {
    if (!this.state.activeCommentID) {
      message.warning(
        `You must open a comment before applying a rubric comment. Click an existing comment,
        or highlight some code to create a new one.`,
        5,
      );
      return;
    }

    // If this category requires "at most once", check to see if we've applied a comment from this
    // category somewhere else.
    const category = this.state.rubricCategories.find((el) => el.id === rubricComment.category);
    if (category !== undefined && category.atMostOnce) {
      const siblings = this.state.rubricComments[rubricComment.category].map((el) => el.id);
      const hasApplied = Object.values(this.state.comments)
        .flat()
        .some((el) => siblings.indexOf(el.rubricComment) > -1 && el.id !== this.state.activeCommentID);
      if (hasApplied) {
        message.warning("You can't apply more than one rubric comment from this rubric category.");
        return;
      }
    }

    const comments = linkRubricComment(this.state.comments, rubricComment, this.state.activeCommentID);

    if (comments === undefined) {
      return;
    }

    if (this.state.showCursor === CURSOR_DOMAIN.RUBRIC) {
      this.focusActiveComment();
      this.setState({ showCursor: CURSOR_DOMAIN.CODE_HIDDEN });
    }

    const commentRubricComments = addToCommentRubricCommentsState(
      this.state.commentRubricComments,
      this.state.activeCommentID,
      rubricComment,
    );

    this.setState({
      comments,
      commentRubricComments,
      showCursor: CURSOR_DOMAIN.CODE_HIDDEN,
    });
  };

  public calculateGradeFromState = (): number | undefined => {
    if (!(this.state.submission || this.state.readOnlySubmission) || !this.state.assignment) {
      return undefined;
    }

    return calculateGrade(
      this.state.assignment,
      this.state.comments,
      this.state.commentRubricComments,
      this.state.rubricCategories,
      this.state.files,
      this.state.tests,
      Object.values(this.state.testCases).flat(),
    );
  };

  public getPointsInFile = (file: FileType): number[] => {
    // If, for some reason, the file is not in comments, don't have a fatal error
    const fileComments = this.state.comments[file.id] || [];
    return pointsInFile(file, fileComments, this.state.commentRubricComments);
  };

  public updateSubmissionGrade = () => {
    if (this.state.submission) {
      const grade = this.calculateGradeFromState();
      if (grade) {
        const submission = { ...this.state.submission, grade };
        this.setState({
          submission,
        });
      }
    }
  };

  public toggleCustomCommentExplorer = () => {
    this.setState((oldState) => {
      return { showCustomCommentExplorer: !oldState.showCustomCommentExplorer };
    });
  };

  public toggleFinalized = async () => {
    if (!this.state.submission) {
      return;
    }

    if (this.props.inDemoMode || this.state.noSave) {
      this.setState(
        (oldState: ICodeConsoleState) => {
          // We need to update the submission object in the same way it would be updated
          // if update below was actually sent.

          return {
            submission: {
              ...oldState.submission!,
              isFinalized: !oldState.submission!.isFinalized,
              grade: this.calculateGradeFromState()!,
            },
          };
        },
        () => {
          if (this.state.submission!.isFinalized) {
            message.success('Succcessfully finalized submission');
          } else {
            message.success('Succcessfully unfinalized submission');
          }
        },
      );
      return;
    }

    let payload: any = {
      id: this.state.submission.id,
      isFinalized: !this.state.submission.isFinalized,
    };

    // if trying to finalize with only one grader available, set the grader
    if (this.state.graders.length === 1 && !this.state.submission.isFinalized) {
      payload = { ...payload, grader: this.state.graders[0] };
    }

    try {
      let submission;
      if (this.state.submission.students === undefined) {
        submission = await Submission.updateAnonymous(payload);
      } else {
        submission = await Submission.update(payload);
      }

      if (!this.state.submission.isFinalized) {
        sendSlack(
          'Submission finalized',
          `${this.state.submission.id} ${this.state.assignment ? this.state.assignment.name : ''} | ${
            this.state.course ? this.state.course.name : ''
          } ${this.state.course ? this.state.course.period : ''}`,
          '#24be85',
          '#user_notifications_everything',
          this.state.course ? this.state.course.id : 0,
        );
        message.success('Successfully finalized submission');
      } else {
        message.success('Successfully unfinalized submission');
      }

      this.setState({ submission });
    } catch (error) {
      message.error(`Error updating submission: ${JSON.stringify(error)}`);
    }
  };

  public updateGrader = (sub: AnonymousSubmissionType, graderUsername: string | undefined) => {
    const payload = {
      id: sub.id,
      isFinalized: false,
      grader: graderUsername,
    };

    return Submission.update(payload).then((submission) => {
      this.setState({ submission });
      return submission;
    });
  };

  public isCourseAdmin = (assignment: AssignmentType | undefined) => {
    if (!assignment || !assignment.course) {
      return false;
    }

    return this.props.user.courseadminCourses
      .map((course) => {
        return course.id;
      })
      .includes(assignment.course);
  };

  public onEscKeyPress = () => {
    this.changeActiveComment(undefined);
  };

  public setZoom = (newZoom: number) => {
    this.setState({ codeZoom: newZoom });
  };

  public setVerticalOffset = (oldToNew: (oldValue: number) => number) => {
    this.setState((oldState: ICodeConsoleState) => {
      return {
        codeVerticalOffset: oldToNew(oldState.codeVerticalOffset),
      };
    });
  };

  public toggleKeyboardShortcuts = () => {
    this.setState({ showKeyboardShortcuts: !this.state.showKeyboardShortcuts });
  };

  /***********************************************************************************************/
  /* Demo data
  /***********************************************************************************************/
  public loadDemoData = (files: any[], studentSample?: boolean) => {
    const demoState =
      studentSample !== undefined && studentSample
        ? loadDemoStudent(files, this.props.user.email)
        : loadDemoGrader(files, this.props.user.email);

    this.setState(demoState);
  };

  public toggleEditRubricMode = () => {
    this.setState({ editRubricMode: !this.state.editRubricMode });
  };

  // This is a bit of a hacky way to rebase the CodeConsole state comments with an updated rubric
  // Given an updated rubric, we make sure that all relevant objects stored in state reflect the changes
  public setRubric = (rubric: {
    rubricCategories: RubricCategoryType[];
    rubricComments: IRubricCategoryToRubricCommentsMap;
  }) => {
    const newCommentRubricComments: any = {};

    for (const commentID of Object.keys(this.state.commentRubricComments)) {
      const oldRubricComment = this.state.commentRubricComments[+commentID];

      const newRubricComment = rubric.rubricComments[oldRubricComment.category].find(
        (rubricComment: RubricCommentType) => {
          return rubricComment.id === oldRubricComment.id;
        },
      );

      if (newRubricComment) {
        newCommentRubricComments[+commentID] = newRubricComment;
      }
    }

    this.setState({
      rubricCategories: rubric.rubricCategories,
      rubricComments: rubric.rubricComments,
      commentRubricComments: newCommentRubricComments,
    });
  };

  /***********************************************************************************
  /* Claim from console feature (triggered via console menu)
  /**********************************************************************************/

  public fetchSubmission = async (assignment: AssignmentType): Promise<AnonymousSubmissionType | undefined> => {
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

  public claimSubmission = async () => {
    if (this.state.assignment) {
      const submission = await this.fetchSubmission(this.state.assignment);
      if (submission !== undefined) {
        openSubmissionInSameTab(submission.id);
        message.success('Successfully claimed another submission. Start reviewing!');
      } else {
        message.success('The ungraded queue is empty, so there are no more submissions to claim.');
      }
    }
  };

  public turnOnReload = () => {
    this.setState({ rubricReload: 15000 });
  };

  public turnOffReload = () => {
    this.setState({ rubricReload: undefined });
  };

  /***********************************************************************************
  /* Render
  /**********************************************************************************/

  public render() {
    if (this.state.isLoading) {
      return <Loading />;
    }

    const theme = consoleThemes.light === this.context.consoleTheme ? 'light' : 'dark';

    let leftHeader: React.ReactNode[] = [];
    let middleHeader: React.ReactNode[] = [];
    let rightHeader: React.ReactNode[] = [];
    let content;
    let siderTitles: Array<React.ReactNode | string> = [];
    let sider: React.ReactElement[] = [];

    const toolbarWidgets: React.ReactElement[] = [];

    const controls = (
      <Controls
        updateVerticalOffset={this.setVerticalOffset}
        updateZoom={this.setZoom}
        fallbackWidth={layoutVars.breakpoints.smallScreen.grade}
      />
    );

    const testsTitle = (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>Tests</div>
        <div style={{ flexGrow: 1 }} />
        <Button
          size="small"
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            this.setState({ panelType: PANEL_TYPE.TESTS, selectedFile: undefined });
          }}
          disabled={this.state.testCategories.length === 0}
        >
          View
        </Button>
        <Button
          size="small"
          style={{ marginLeft: '6px' }}
          icon={<BugOutlined />}
          onClick={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            this.showInlineTestsModal();
          }}
          disabled={this.state.testCategories.length === 0}
        >
          Debug
        </Button>
      </div>
    );

    if (
      this.state.permissionLevel === PERMISSION_LEVEL.NONE ||
      this.state.permissionLevel === PERMISSION_LEVEL.NOT_FOUND
    ) {
      rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

      content = (
        <Empty
          imageStyle={{
            marginTop: '200px',
            height: 60,
          }}
          description={
            <span style={{ color: theme === 'light' ? 'black' : 'white', fontSize: 'larger' }}>
              {this.state.permissionLevel === PERMISSION_LEVEL.NOT_FOUND
                ? "Whoops! This submission doesn't exist...😔"
                : "Whoops! Looks like you don't have access to this submission...😔, If you submitted this assignment, your submission might still be under review. please check back later after its finalized!"}
            </span>
          }
        />
      );
    } else if (this.props.inDemoMode && !this.state.assignment) {
      rightHeader = [
        <CursorToggle
          key="cursor-toggle"
          toggleCursorMode={this.toggleCursorMode}
          cursorMode={this.state.cursorMode}
          small={true}
        />,
        <ThemeToggle key="theme-toggle" small={true} />,
        controls,
      ];
    } else {
      if (!this.state.assignment) {
        return <div>We're not supposed to get here..</div>;
      }

      // At this stage, we're going to render the Code Review Console, so we can
      // build the elements that are common between read-level and write-level

      /*********************************************************
      /* Build header
      /*********************************************************/

      middleHeader = this.state.hideGrades
        ? []
        : [
            <GradeButton
              key="subheader-grade"
              assignment={this.state.assignment!}
              submission={this.state.submission === undefined ? this.state.readOnlySubmission! : this.state.submission}
              calculateGrade={this.calculateGradeFromState}
              rubricCategories={this.state.rubricCategories}
              comments={this.state.comments}
              commentRubricComments={this.state.commentRubricComments}
              files={this.state.files}
              submissionTests={this.state.tests}
              testCases={Object.values(this.state.testCases).flat()}
            />,
          ];

      const fileMenuTitle = <FileMenuTitle key="files" files={this.state.files} />;
      if (this.props.inDemoMode) {
        if (this.state.permissionLevel === PERMISSION_LEVEL.READ) {
          if (this.state.selectedFile) {
            const code = (onHighlightClick: any) => (
              <StudentCode
                key={this.state.selectedFile!.id}
                file={this.state.selectedFile!}
                comments={this.state.comments[this.state.selectedFile!.id]}
                readOnly={true}
                user={this.props.user.email}
                onHighlightClick={onHighlightClick}
              />
            );

            const comments = (
              <StudentComments
                isStudent={this.state.isStudent}
                comments={this.state.comments[this.state.selectedFile!.id]}
                rubricComments={this.state.commentRubricComments}
                file={this.state.selectedFile!}
                fileIDs={this.state.files.map((file: FileType) => {
                  return file.id;
                })}
                verticalOffset={this.state.codeVerticalOffset}
                updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
                studentFeedbackOn={this.state.assignment.commentFeedback}
                hideAuthor={this.state.assignment.hideGradersFromStudents}
                additiveGrading={false}
                rubricCategories={this.state.rubricCategories}
              />
            );

            content = (
              <CodePanelLayout
                comments={comments}
                code={code}
                toolbarWidgets={toolbarWidgets}
                file={this.state.selectedFile}
                zoom={this.state.codeZoom}
                updateVerticalOffset={this.setVerticalOffset}
              />
            );
          } else if (this.state.panelType === PANEL_TYPE.TESTS) {
            content = (
              <TestsList tests={this.state.tests} cases={this.state.testCases} categories={this.state.testCategories} />
            );
          }

          leftHeader = [
            <HeaderMenu
              key="menu"
              claimSubmission={this.claimSubmission}
              isStudent={this.state.isStudent}
              toggleShowExplanations={this.toggleShowExplanations}
              showExplanations={this.state.showExplanations}
              hasExplanations={Object.values(this.state.rubricComments)
                .flat()
                .some((el) => el.explanation)}
              isAdmin={this.isCourseAdmin(this.state.assignment)}
              course={this.state.course}
              assignment={this.state.assignment}
            />,
            <SubheaderTitle key="subheader-title" assignment={this.state.assignment!} />,
          ];

          rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

          sider = [
            <ReadOnlySubmissionInfo
              key="submission-info"
              title="Submission Info"
              assignment={this.state.assignment}
              readOnlySubmission={this.state.readOnlySubmission!}
              submitStudentQuestion={this.submitStudentQuestion}
              deleteStudentQuestion={this.deleteStudentQuestion}
              isStudentMode={
                this.state.readOnlySubmission!.students!.find((el) => el === this.props.user.email) === undefined
              }
            />,
            <FileMenu
              key="file-menu"
              title="Files"
              files={this.state.files}
              comments={this.state.comments}
              selectedFile={this.state.selectedFile}
              getPointsInFile={this.getPointsInFile}
              changeSelectedFile={this.changeSelectedFile}
            />,
          ];

          siderTitles = ['Submission Info', fileMenuTitle];
        } else {
          if (this.state.selectedFile) {
            const demoCode = (onHighlightClick: any) => (
              <GradeCode
                key={this.state.selectedFile!.id}
                file={this.state.selectedFile!}
                comments={this.state.comments[this.state.selectedFile!.id]}
                readOnly={this.state.submission!.isFinalized}
                addComment={this.addComment}
                user={this.props.user.email}
                onHighlightClick={onHighlightClick}
                commentCounter={this.state.commentCounter}
                fileTemplate={undefined}
                cursorMode={this.state.cursorMode}
                showCursor={this.state.showCursor}
                updateCursorDomain={this.updateCursorDomain}
              />
            );

            const demoComments = (
              <GradeComments
                isStudent={this.state.isStudent}
                showExplanations={this.state.showExplanations}
                comments={this.state.comments[this.state.selectedFile!.id]}
                rubricComments={this.state.commentRubricComments}
                readOnly={this.state.submission!.isFinalized}
                file={this.state.selectedFile!}
                fileIDs={this.state.files.map((file: FileType) => {
                  return file.id;
                })}
                activeCommentID={this.state.activeCommentID}
                changeActive={this.changeActiveComment}
                deleteComment={this.deleteComment}
                saveComment={this.saveComment}
                removeRubricComment={this.removeRubricComment}
                oldCommentIDs={this.state.oldCommentIDs}
                verticalOffset={this.state.codeVerticalOffset}
                updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
                studentFeedbackOn={this.state.assignment.commentFeedback}
                hideAuthor={this.state.assignment.hideGradersFromStudents}
                additiveGrading={this.state.assignment.additiveGrading}
                forcedRubricMode={this.state.assignment.forcedRubricMode}
                rubricCategories={this.state.rubricCategories}
                showCursor={this.state.showCursor}
              />
            );

            content = (
              <CodePanelLayout
                comments={demoComments}
                code={demoCode}
                toolbarWidgets={toolbarWidgets}
                file={this.state.selectedFile}
                zoom={this.state.codeZoom}
                updateVerticalOffset={this.setVerticalOffset}
              />
            );
          } else if (this.state.panelType === PANEL_TYPE.TESTS) {
            content = (
              <TestsList tests={this.state.tests} cases={this.state.testCases} categories={this.state.testCategories} />
            );
          }

          const onCancel = () => {
            return;
          };

          sider = [
            <SubmissionInfo
              key="submission-info"
              title="Submission Info"
              assignment={this.state.assignment!}
              submission={this.state.submission!}
              courseLateDayCreditsAllowable={this.state.course!.lateDayCreditsAllowable}
              graders={this.state.graders}
              isCourseAdmin={this.isCourseAdmin(this.state.assignment)}
              updateGrader={this.updateGrader}
              addLateDayCreditComment={this.addLateDayCreditComment}
              isStudentMode={false}
            />,
            <TestsMenu
              key="tests-menu"
              isOpen={this.state.panelType === PANEL_TYPE.TESTS}
              tests={this.state.tests}
              cases={this.state.testCases}
              categories={this.state.testCategories}
              assignment={this.state.assignment}
              emptyMessage="Your instructor didn't define any tests for this assignment. "
              showLink={true}
              onClick={(e: any) => {
                e.preventDefault();
                e.stopPropagation();
                this.setState({ panelType: PANEL_TYPE.TESTS, selectedFile: undefined });
              }}
            />,
            <FileMenu
              key="file-menu"
              title="Files"
              files={this.state.files}
              comments={this.state.comments}
              selectedFile={this.state.selectedFile}
              getPointsInFile={this.getPointsInFile}
              changeSelectedFile={this.changeSelectedFile}
            />,
            <RubricManager
              key="rubric-menu"
              shouldLoadFeedback={false}
              shouldLoadInstanceLists={this.state.assignment.showFrequentlyUsedRubricComments}
              assignment={this.state.assignment}
              submissions={[]}
              onCancel={onCancel}
              defaultRubric={{
                categories: this.state.rubricCategories,
                comments: _.flatten(Object.values(this.state.rubricComments)),
              }}
            >
              {({ props, state, helpers }: IRubricManagerParams) => {
                const propz = {
                  ...props,
                  handleRubricCommentClick: this.onRubricCommentClick,
                  hasActiveComment: this.state.activeCommentID !== undefined,
                  toggleEditRubricMode: this.toggleEditRubricMode,
                  editRubricMode: this.state.editRubricMode,
                  setRubric: this.setRubric,
                  turnOnReload: this.turnOnReload,
                  turnOffReload: this.turnOffReload,
                  canUserEdit: true, // showcase in-console rubric editing in demo
                  demoMode: true,
                  showCursor: this.state.showCursor,
                  updateCursorDomain: this.updateCursorDomain,
                  showExplanations: this.state.showExplanations,
                  showFrequent:
                    this.state.assignment !== undefined
                      ? this.state.assignment.showFrequentlyUsedRubricComments
                      : false,
                  course: this.state.course!,
                };
                return <RubricMenuUI props={propz} state={state} helpers={helpers} />;
              }}
            </RubricManager>,
          ];

          siderTitles = ['Submission Info', testsTitle, fileMenuTitle, 'Rubric'];

          leftHeader = [
            <HeaderMenu
              key="menu"
              claimSubmission={this.claimSubmission}
              isStudent={this.state.isStudent}
              isDemo={true}
              toggleShowExplanations={this.toggleShowExplanations}
              showExplanations={this.state.showExplanations}
              hasExplanations={Object.values(this.state.rubricComments)
                .flat()
                .some((el) => el.explanation)}
              isAdmin={this.isCourseAdmin(this.state.assignment)}
              course={this.state.course}
              assignment={this.state.assignment}
            />,
            <SubheaderTitle key="subheader-title" assignment={this.state.assignment} />,
          ];

          const signupButton =
            this.props.user.id === -1 ? (
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
              toggleCursorMode={this.toggleCursorMode}
              cursorMode={this.state.cursorMode}
              small={true}
            />,
            <ThemeToggle key="theme-toggle" small={true} />,
            controls,
            <FinalizeButton
              key="subheader-finalize"
              course={this.state.course!}
              submission={this.state.submission!}
              toggleFinalized={this.toggleFinalized}
              numComments={Object.values(this.state.comments).flat().length}
              minComments={this.state.course!.minComments}
              canUnfinalize={true}
              isOnlyGrader={this.state.graders.length === 1}
            />,
          ];
        }
      } else if (this.state.permissionLevel === PERMISSION_LEVEL.READ) {
        if (this.state.selectedFile) {
          const code = (onHighlightClick: any) => (
            <StudentCode
              key={this.state.selectedFile!.id}
              file={this.state.selectedFile!}
              comments={this.state.comments[this.state.selectedFile!.id]}
              readOnly={true}
              user={this.props.user.email}
              onHighlightClick={onHighlightClick}
            />
          );

          const comments = (
            <StudentComments
              isStudent={this.state.isStudent}
              comments={this.state.comments[this.state.selectedFile!.id]}
              rubricComments={this.state.commentRubricComments}
              file={this.state.selectedFile!}
              fileIDs={this.state.files.map((file: FileType) => {
                return file.id;
              })}
              verticalOffset={this.state.codeVerticalOffset}
              updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
              studentFeedbackOn={this.state.assignment.commentFeedback}
              hideAuthor={this.state.assignment.hideGradersFromStudents}
              additiveGrading={false}
              rubricCategories={this.state.rubricCategories}
              scrollToCommentID={parseInt(queryString.parse(this.props.location.search).comment as string)}
            />
          );

          content = (
            <CodePanelLayout
              comments={comments}
              code={code}
              toolbarWidgets={toolbarWidgets}
              file={this.state.selectedFile}
              zoom={this.state.codeZoom}
              updateVerticalOffset={this.setVerticalOffset}
            />
          );
        } else if (this.state.panelType === PANEL_TYPE.TESTS) {
          content = (
            <TestsList tests={this.state.tests} cases={this.state.testCases} categories={this.state.testCategories} />
          );
        }

        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={this.claimSubmission}
            isStudent={this.state.isStudent}
            toggleShowExplanations={this.toggleShowExplanations}
            showExplanations={this.state.showExplanations}
            hasExplanations={Object.values(this.state.rubricComments)
              .flat()
              .some((el) => el.explanation)}
            isAdmin={this.isCourseAdmin(this.state.assignment)}
            course={this.state.course}
            assignment={this.state.assignment}
          />,
          <SubheaderTitle key="subheader-title" assignment={this.state.assignment!} />,
        ];

        rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

        sider = [
          <ReadOnlySubmissionInfo
            key="submission-info"
            title="Submission Info"
            assignment={this.state.assignment}
            readOnlySubmission={this.state.readOnlySubmission!}
            submitStudentQuestion={this.submitStudentQuestion}
            deleteStudentQuestion={this.deleteStudentQuestion}
            isStudentMode={
              this.state.readOnlySubmission!.students === undefined ||
              this.state.readOnlySubmission!.students.find((el) => el === this.props.user.email) === undefined
            }
          />,
          <TestsMenu
            key="tests-menu"
            isOpen={this.state.panelType === PANEL_TYPE.TESTS}
            tests={this.state.tests}
            cases={this.state.testCases}
            categories={this.state.testCategories}
            assignment={this.state.assignment}
            emptyMessage="Your instructor didn't define any tests for this assignment. "
            onClick={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
              this.setState({ panelType: PANEL_TYPE.TESTS, selectedFile: undefined });
            }}
          />,
          <FileMenu
            key="file-menu"
            title="Files"
            files={this.state.files}
            comments={this.state.comments}
            selectedFile={this.state.selectedFile}
            getPointsInFile={this.getPointsInFile}
            changeSelectedFile={this.changeSelectedFile}
          />,
        ];

        siderTitles = ['Submission Info', testsTitle, fileMenuTitle];
      } else {
        leftHeader = [
          <HeaderMenu
            key="menu"
            claimSubmission={this.claimSubmission}
            isStudent={this.state.isStudent}
            toggleShowExplanations={this.toggleShowExplanations}
            showExplanations={this.state.showExplanations}
            hasExplanations={Object.values(this.state.rubricComments)
              .flat()
              .some((el) => el.explanation)}
            isAdmin={this.isCourseAdmin(this.state.assignment)}
            course={this.state.course}
            assignment={this.state.assignment}
          />,
          <SubheaderTitle key="subheader-title" assignment={this.state.assignment!} />,
          <HeaderSearch />,
          <StatusTags
            key="tag"
            assignment={this.state.assignment!}
            submission={this.state.submission!}
            fallbackWidth={layoutVars.breakpoints.smallScreen.gradeHeader}
          />,
        ];

        rightHeader = [
          <CursorToggle
            key="cursor-toggle"
            toggleCursorMode={this.toggleCursorMode}
            cursorMode={this.state.cursorMode}
            small={true}
          />,
          <ThemeToggle key="theme-toggle" small={true} />,
          <DownloadCode key="download-code" submission={this.state.submission!} />,
          controls,
          <ViewAsStudent key="view-as-student" pathname={this.props.location.pathname} />,
          <FinalizeButton
            key="subheader-finalize"
            course={this.state.course!}
            submission={this.state.submission!}
            toggleFinalized={this.toggleFinalized}
            numComments={Object.values(this.state.comments).flat().length}
            minComments={this.state.course!.minComments}
            canUnfinalize={!this.state.course!.noUnfinalize || this.isCourseAdmin(this.state.assignment)}
            isOnlyGrader={this.state.graders.length === 1}
          />,
        ];

        if (this.state.selectedFile !== undefined) {
          let fileTemplate: FileTemplateType | undefined;
          if (this.state.fileTemplates !== undefined) {
            fileTemplate = this.state.fileTemplates.find((template: FileTemplateType) => {
              // FIXME: could be more flexible here
              // Find the first match
              return template.name === this.state.selectedFile!.name;
            });
          }

          const code = (onHighlightClick: any) => (
            <GradeCode
              key={this.state.selectedFile!.id}
              file={this.state.selectedFile!}
              comments={this.state.comments[this.state.selectedFile!.id]}
              readOnly={this.state.submission!.isFinalized}
              addComment={this.addComment}
              user={this.props.user.email}
              onHighlightClick={onHighlightClick}
              commentCounter={this.state.commentCounter}
              fileTemplate={fileTemplate}
              cursorMode={this.state.cursorMode}
              showCursor={this.state.showCursor}
              updateCursorDomain={this.updateCursorDomain}
            />
          );

          const comments = (
            <GradeComments
              isStudent={this.state.isStudent}
              showExplanations={this.state.showExplanations}
              comments={this.state.comments[this.state.selectedFile!.id]}
              rubricComments={this.state.commentRubricComments}
              readOnly={this.state.submission!.isFinalized}
              file={this.state.selectedFile!}
              fileIDs={this.state.files.map((file: FileType) => {
                return file.id;
              })}
              activeCommentID={this.state.activeCommentID}
              changeActive={this.changeActiveComment}
              deleteComment={this.deleteComment}
              saveComment={this.saveComment}
              removeRubricComment={this.removeRubricComment}
              oldCommentIDs={this.state.oldCommentIDs}
              verticalOffset={this.state.codeVerticalOffset}
              updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
              studentFeedbackOn={this.state.assignment.commentFeedback}
              hideAuthor={this.state.assignment.hideGradersFromStudents}
              additiveGrading={this.state.assignment.additiveGrading}
              forcedRubricMode={this.state.assignment.forcedRubricMode}
              rubricCategories={this.state.rubricCategories}
              showCursor={this.state.showCursor}
              scrollToCommentID={parseInt(queryString.parse(this.props.location.search).comment as string)}
            />
          );

          content = (
            <div>
              <CodePanelLayout
                comments={comments}
                code={code}
                toolbarWidgets={toolbarWidgets}
                file={this.state.selectedFile}
                zoom={this.state.codeZoom}
                updateVerticalOffset={this.setVerticalOffset}
              />
              <CustomCommentExplorer
                graders={this.state.graders}
                user={this.props.user.email}
                isAdmin={this.isCourseAdmin(this.state.assignment)}
                assignment={this.state.assignment}
                rubricComments={Object.values(this.state.rubricComments).flat()}
                rubricCategories={this.state.rubricCategories}
                visible={this.state.showCustomCommentExplorer}
                onCancel={this.toggleCustomCommentExplorer}
              />
            </div>
          );
        } else if (this.state.panelType === PANEL_TYPE.TESTS) {
          content = (
            <TestsList tests={this.state.tests} cases={this.state.testCases} categories={this.state.testCategories} />
          );
        }

        const onCancel = () => {
          return;
        };

        sider = [
          <SubmissionInfo
            key="submission-info"
            title="Submission Info"
            assignment={this.state.assignment}
            courseLateDayCreditsAllowable={this.state.course!.lateDayCreditsAllowable}
            submission={this.state.submission!}
            graders={this.state.graders}
            isCourseAdmin={this.isCourseAdmin(this.state.assignment)}
            updateGrader={this.updateGrader}
            addLateDayCreditComment={this.addLateDayCreditComment}
            isStudentMode={false}
          />,
          <TestsMenu
            key="tests-menu"
            isOpen={this.state.panelType === PANEL_TYPE.TESTS}
            tests={this.state.tests}
            cases={this.state.testCases}
            categories={this.state.testCategories}
            assignment={this.state.assignment}
            emptyMessage="No tests have been defined for this assignment."
            showLink={true}
            onClick={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
              this.setState({ panelType: PANEL_TYPE.TESTS, selectedFile: undefined });
            }}
          />,
          <FileMenu
            key="file-menu"
            title="Files"
            files={this.state.files}
            comments={this.state.comments}
            selectedFile={this.state.selectedFile}
            getPointsInFile={this.getPointsInFile}
            changeSelectedFile={this.changeSelectedFile}
          />,
          <RubricManager
            key="rubric-menu"
            assignment={this.state.assignment}
            submissions={[]}
            onCancel={onCancel}
            reloadInterval={this.state.rubricReload}
            setRubric={this.setRubric}
            shouldLoadFeedback={false}
            shouldLoadInstanceLists={this.state.assignment.showFrequentlyUsedRubricComments}
          >
            {({ props, state, helpers }: IRubricManagerParams) => {
              const propz = {
                ...props,
                handleRubricCommentClick: this.onRubricCommentClick,
                hasActiveComment: this.state.activeCommentID !== undefined,
                toggleEditRubricMode: this.toggleEditRubricMode,
                editRubricMode: this.state.editRubricMode,
                setRubric: this.setRubric,
                turnOnReload: this.turnOnReload,
                turnOffReload: this.turnOffReload,
                canUserEdit:
                  this.isCourseAdmin(this.state.assignment) || this.state.assignment!.collaborativeRubricMode,
                showCursor: this.state.showCursor,
                updateCursorDomain: this.updateCursorDomain,
                demoMode: this.state.noSave === true,
                showExplanations: this.state.showExplanations,
                showFrequent:
                  this.state.assignment !== undefined ? this.state.assignment.showFrequentlyUsedRubricComments : false,
                course: this.state.course!,
              };
              return <RubricMenuUI props={propz} state={state} helpers={helpers} />;
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
        this.updateGrader(this.state.submission!, queryValue);
      }
    };

    const goToFile = (queryValue?: string) => {
      if (queryValue !== undefined) {
        const foundFile = this.state.files.find((file) => {
          return file.name === queryValue;
        });
        if (foundFile) {
          this.changeSelectedFile(foundFile.id);
        }
      }
    };

    const goToTests = () => {
      this.setState({ panelType: PANEL_TYPE.TESTS, selectedFile: undefined });
    };

    const findGraderSubmissions = async (grader: string) => {
      const submissions = await Assignment.readSubmissions(this.state.assignment!.id, { grader });
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
      const submissions = await Assignment.readSubmissions(this.state.assignment!.id, { student });
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
      if (this.state.assignment) {
        const submissions = await Assignment.readSubmissions(this.state.assignment.id);

        const numSubmissions = submissions.length;
        const numGraded = submissions.filter((el) => el.isFinalized).length;
        const numInProgress = submissions.filter((el) => el.grader && !el.isFinalized).length;
        const numUnclaimed = numSubmissions - numGraded - numInProgress;

        return (
          <div>
            <Progress
              percent={Math.floor(((numGraded + numInProgress) / numSubmissions) * 100)}
              successPercent={Math.floor((numGraded / numSubmissions) * 100)}
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
        callback: this.toggleCustomCommentExplorer,
      },
    ];

    if (this.isCourseAdmin(this.state.assignment)) {
      window.CommandBar.addContext({ students: this.state.students });

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
          link: getRubricURL(this.state.course!, this.state.assignment!),
          kind: 'link',
        },
        {
          value: 'Open test editor',
          label: 'Open test editor',
          link: `/admin/${encodeForLink(this.state.course!.name)}/${encodeForLink(
            this.state.course!.period,
          )}/assignments/tests/${encodeForLink(this.state.assignment!.name)}/edit/tests`,
          kind: 'link',
        },
        {
          value: 'Open test results',
          label: 'Open test results',
          link: `/admin/${encodeForLink(this.state.course!.name)}/${encodeForLink(
            this.state.course!.period,
          )}/assignments/tests/${encodeForLink(this.state.assignment!.name)}/results`,
          kind: 'link',
        },
        { value: 'View stats', label: 'View stats', kind: 'dashboard', populator: viewStats },
        { value: 'Edit code', label: 'Edit code', callback: this.showInlineTestsModal, kind: 'action' },
        { value: 'Debug mode', label: 'Debug mode', callback: this.showInlineTestsModal, kind: 'action' },
      ];
    }

    defaultOptions = [...defaultOptions, ...helpQueryMap];

    // New Foobar config
    window.CommandBar.addCallback('showInlineTestsModal', this.showInlineTestsModal);

    // Old Fobar config
    // for (const option of defaultOptions) {
    //   (window as any).addToFoobar(option);
    // }
    // (window as any).setFoobarParams('grader', this.state.graders);
    // (window as any).setFoobarParams('student', this.state.students);
    // (window as any).setFoobarParams('file', this.state.files.map((file) => file.name));
    (window as any).foobarIsActive = false; // lift off // MODIFIED ON 2020-01-20 for CommandBar replacement
    // (window as any).foobarUser = this.props.user.email; // for logging
    // (window as any).foobarURL = this.props.match.url; // for logging

    /*************************************************************************************/
    return (
      <div id="Grade">
        <CodeConsoleOnboardingSelector
          visible={this.props.inDemoMode && !this.state.assignment}
          onUploadConfirm={this.loadDemoData}
          onCancel={cancelFunc}
        />
        <CourseContext.Provider value={this.state.course || defaultCourse}>
          {localStorage.getItem('source') !== 'codePost' ? (
            content
          ) : (
            <StandardConsoleLayout
              consoleTypes={['grade']}
              header={
                <CPFlex
                  style={{
                    padding: '0 15',
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
              editRubricMode={this.state.editRubricMode}
            />
          )}
          <KeyboardShortcuts
            key="keyboard-shortcuts"
            visible={this.state.showKeyboardShortcuts}
            onClose={this.toggleKeyboardShortcuts}
            isStudent={this.state.isStudent}
          />
          {this.state.permissionLevel === PERMISSION_LEVEL.WRITE &&
          this.state.assignment !== undefined &&
          this.state.submission !== undefined ? (
            <InlineTestsModal
              key="inline-tests-modal"
              visible={this.state.showInlineTestsModal}
              show={this.showInlineTestsModal}
              hide={this.hideInlineTestsModal}
              files={this.state.files}
              assignment={this.state.assignment}
              submission={this.state.submission}
            />
          ) : null}
        </CourseContext.Provider>
      </div>
    );
  }
}
CodeConsole.contextType = ConsoleThemeContext;

export default CodeConsole;
