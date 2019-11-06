/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */

import { Empty, message, notification } from 'antd';

import queryString from 'query-string';

/* other library imports */
import _ from 'lodash';

/* codePost imports */
import Loading from '../core/Loading';

import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CommentIO, CommentType, UiComment } from '../../infrastructure/comment';
import { Course, CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
import { FileTemplate, FileTemplateType } from '../../infrastructure/fileTemplate';
import * as Immutable from '../../infrastructure/immutable';
import { RubricCategory, RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../infrastructure/rubricComment';
import { AnonymousSubmissionType, StudentSubmissionType, Submission } from '../../infrastructure/submission';
import { UserType } from '../../infrastructure/user';

import CPButton from '../core/CPButton';
import CPFlex from '../core/CPFlex';
import StandardConsoleLayout from '../core/layouts/StandardConsoleLayout';

import { GradeCode, StudentCode } from './code-panel/CodeContent';
import CodePanelLayout from './code-panel/CodePanelLayout';
import { GradeComments, StudentComments } from './code-panel/Comments';
import LayoutResizer, { CodeConsoleDimensionsType, getInitialDimensions } from './code-panel/LayoutResizer';

import ThemeToggle from '../core/ThemeToggle';

import FileMenu, { FileMenuTitle } from './menu/FileMenu';

import RubricMenuUI from './menu/RubricMenuUI';

import { ReadOnlySubmissionInfo, SubmissionInfo } from './menu/SubmissionInfoMenu';

import layoutVars from '../../styles/layout/_layoutVars';

import { openSubmissionInSameTab } from '../admin/other/AdminUtils';

import { sendSlack } from '../core/slack';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import {
  Controls,
  FinalizeButton,
  GradeButton,
  HeaderMenu,
  StatusTags,
  SubheaderTitle,
  ViewAsStudent,
  DownloadCode,
} from '../code-review/Header';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

import { CodeConsoleOnboardingSelector } from '../core/OnboardingSelector';

import { demoFiles } from './demoCode';

import RubricManager, { IRubricManagerParams } from '../core/rubric/RubricManager';

/**********************************************************************************************************************/

/* f(logged in user, submission) */
enum PERMISSION_LEVEL {
  NOT_FOUND,
  NONE,
  READ,
  WRITE,
}

interface ICodeConsoleState {
  /* UI control */
  permissionLevel: PERMISSION_LEVEL;
  isLoading: boolean;
  selectedFile: FileType | undefined;
  codeZoom: number;
  codeVerticalOffset: number;
  dimensions: CodeConsoleDimensionsType;
  isStudent: boolean;
  showExplanations: boolean;

  /* submissions data for readers and writers */
  readOnlySubmission?: StudentSubmissionType;
  assignment?: AssignmentType;
  course?: CourseType;
  files: FileType[];
  comments: IFileToCommentsMap;
  fileTemplates?: FileTemplateType[];

  /* writer data */
  submission?: AnonymousSubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  activeCommentID?: number;
  oldCommentIDs: { [currentID: number]: number };

  /* admin data */
  graders: string[];

  /* demo data */
  demoCommentCounter: number;

  editRubricMode: boolean;
  commentCounter: number;

  rubricReload?: number;
}

export interface ICodeConsoleProps {
  match: any;
  history: any;
  location: any;
  user: UserType;
  handleLogout: () => void;
  inDemoMode: boolean;
}

class CodeConsole extends React.Component<ICodeConsoleProps, ICodeConsoleState> {
  /***********************************************************************************************/
  /* Static Methods
  /***********************************************************************************************/

  // --- Comments
  public static addCommentToState = (comments: IFileToCommentsMap, comment: CommentType, file: FileType) => {
    const fileComments = Immutable.arrayAdd(comments[file.id], comment);
    return { ...comments, [file.id]: fileComments.sort(CommentIO.compare) };
  };

  public static removeCommentFromState = (comments: IFileToCommentsMap, comment: CommentType) => {
    const index = comments[comment.file].findIndex((c: CommentType) => c.id === comment.id);

    const fileComments = Immutable.arrayRemove(comments[comment.file], index);
    return { ...comments, [comment.file]: fileComments };
  };

  public static updateCommentsState = (comments: IFileToCommentsMap, commentID: number, newComment: CommentType) => {
    const index = comments[newComment.file].findIndex((comment: CommentType) => comment.id === commentID);
    const fileComments = Immutable.arrayUpdate(comments[newComment.file], newComment, index);

    return { ...comments, [newComment.file]: fileComments };
  };

  // --- Linked Rubric Comments
  public static addToCommentRubricCommentsState = (
    commentRubricComments: ICommentToRubricCommentMap,
    commentID: number,
    rubricComment?: RubricCommentType,
  ) => {
    if (rubricComment) {
      return { ...commentRubricComments, [commentID]: rubricComment };
    }
    return commentRubricComments;
  };

  public static removeFromCommentRubricCommentsState = (
    commentRubricComments: ICommentToRubricCommentMap,
    commentID: number,
  ): [RubricCommentType, ICommentToRubricCommentMap] => {
    const { [commentID]: rubricComment, ...restOfCommentRubricComments } = commentRubricComments;
    return [rubricComment, restOfCommentRubricComments];
  };

  public static linkRubricComment = (
    comments: IFileToCommentsMap,
    rubricComment: RubricCommentType,
    activeCommentID: number,
  ) => {
    for (const fileID of Object.keys(comments)) {
      const index = comments[+fileID].findIndex((comment: CommentType) => comment.id === activeCommentID);
      if (index !== -1) {
        const comment = {
          ...comments[+fileID][index],
          rubricComment: rubricComment.id,
          pointDelta: null,
        };
        const fileComments = Immutable.arrayUpdate(comments[+fileID], comment, index);

        return { ...comments, [+fileID]: fileComments };
      }
    }

    return undefined;
  };

  public static unlinkRubricComment = (
    comments: IFileToCommentsMap,
    comment: CommentType,
    rubricComment: RubricCommentType,
  ) => {
    const index = comments[comment.file].findIndex((c: CommentType) => c.id === comment.id);
    const editedComment = {
      ...comments[comment.file][index],
      rubricComment: null,
      pointDelta: rubricComment.pointDelta,
    };
    const fileComments = Immutable.arrayUpdate(comments[comment.file], editedComment, index);
    return { ...comments, [comment.file]: fileComments };
  };

  // --- Grading

  // return [deductions, bonuses]
  public static pointsInFile = (
    file: FileType,
    comments: CommentType[],
    rubricComments: ICommentToRubricCommentMap,
  ): number[] => {
    return comments.reduce(
      (accumulator: number[], comment: CommentType) => {
        if (!UiComment.isNew(comment)) {
          const points = UiComment.points(comment, rubricComments[comment.id]);
          if (points > 0) {
            // Deductions
            return [accumulator[0] + points, accumulator[1]];
          } else {
            // Bonuses
            return [accumulator[0], accumulator[1] - points];
          }
        } else {
          return accumulator;
        }
      },
      [0, 0],
    );
  };

  // Points from generic comments
  public static genericCommentPoints = (comments: IFileToCommentsMap, filterFileSet?: Set<Number>): number => {
    return Object.keys(comments)
      .map((fileID) => {
        // If there's a filter set, and this file isn't in the set, then ignore it
        if (filterFileSet && !filterFileSet.has(parseInt(fileID))) return 0;

        return comments[+fileID].reduce((accumulator: number, comment: CommentType) => {
          if (!UiComment.isNew(comment) && comment.pointDelta) {
            return accumulator + comment.pointDelta;
          } else {
            return accumulator;
          }
        }, 0);
      })
      .reduce((accumulator: number, fileGrade: number) => {
        return accumulator + fileGrade;
      }, 0);
  };

  // Points from RubricComments, ignoring category caps
  public static pointsPerCategory = (
    commentRubricComments: ICommentToRubricCommentMap,
    filterCommentSet?: Set<Number>,
  ): { [categoryID: number]: number } => {
    const pointsPerCategory: any = {};
    for (const commentID in commentRubricComments) {
      // If there's a filter set, and this comment isn't in the set, then ignore it
      if (filterCommentSet && !filterCommentSet.has(parseInt(commentID))) continue;

      // Don't count unsaved comments
      if (+commentID > 0 && commentRubricComments.hasOwnProperty(commentID)) {
        if (!pointsPerCategory[commentRubricComments[commentID].category]) {
          pointsPerCategory[commentRubricComments[commentID].category] = commentRubricComments[commentID].pointDelta;
        } else {
          pointsPerCategory[commentRubricComments[commentID].category] =
            pointsPerCategory[commentRubricComments[commentID].category] + commentRubricComments[commentID].pointDelta;
        }
      }
    }

    return pointsPerCategory;
  };

  public static pointsPerCategoryWithCaps = (
    pointsPerCategory: { [categoryID: number]: number },
    rubricCategories: RubricCategoryType[],
  ): { [categoryID: number]: number } => {
    const pointsPerCategoryWithCaps: any = {};
    for (const category in pointsPerCategory) {
      if (pointsPerCategory.hasOwnProperty(category)) {
        const thisCategory = rubricCategories.find((rubricCategory: RubricCategoryType) => {
          return rubricCategory.id === +category;
        });
        const pointLimit = thisCategory ? (thisCategory.pointLimit !== null ? thisCategory.pointLimit : 99999) : 99999;
        if (pointLimit < 0) {
          pointsPerCategoryWithCaps[+category] = Math.max(pointsPerCategory[category], pointLimit);
        } else {
          pointsPerCategoryWithCaps[+category] = Math.min(pointsPerCategory[category], pointLimit);
        }
      }
    }
    return pointsPerCategoryWithCaps;
  };

  public static calculateGrade = (
    assignment: AssignmentType,
    comments: IFileToCommentsMap,
    commentRubricComments: ICommentToRubricCommentMap,
    rubricCategories: RubricCategoryType[],
    files: FileType[],
  ): number => {
    // Get the set of fileIDs and commentIDs for the current files
    // This filters out any old file versions
    const [currentFileSet, currentCommentSet] = CodeConsole.filterCurrentFileVersions(files, comments);
    const commentPoints = CodeConsole.genericCommentPoints(comments, currentFileSet);
    const pointsPerCategory = CodeConsole.pointsPerCategory(commentRubricComments, currentCommentSet);
    const pointsPerCategoryWithCaps = CodeConsole.pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories);

    const categoryPoints = Object.values(pointsPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
      return accumulator + current;
    }, 0);

    let grade = 0;
    if (assignment.additiveGrading) {
      grade = 0 - commentPoints - categoryPoints;
    } else {
      grade = assignment.points - commentPoints - categoryPoints;
    }

    // Prevent floating point arithmetic causing weird rounding errors
    return parseFloat(grade.toFixed(2));
  };

  // This function filters out old file versions, and keeps only the current file versions
  // It outputs a set of the current file IDs and the current comment IDs
  public static filterCurrentFileVersions = (files: FileType[], currentComments?: IFileToCommentsMap) => {
    const currentFiles: { [pathName: string]: FileType } = {};
    files.forEach((file) => {
      const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;
      if (!currentFiles[path]) currentFiles[path] = file;
      else {
        if (Date.parse(currentFiles[path].created) <= Date.parse(file.created)) {
          currentFiles[path] = file;
        }
      }
    });

    const currentFileSet: Set<Number> = new Set();
    const currentCommentSet: Set<Number> = new Set();
    Object.keys(currentFiles).forEach((path) => {
      const file = currentFiles[path];
      currentFileSet.add(file.id);
      if (currentComments) {
        // If current comment Map is specified, use that instead of file.comments
        const comments = currentComments[file.id];
        if (comments) {
          comments.forEach((comment) => currentCommentSet.add(comment.id));
        }
      } else {
        file.comments.forEach((commentID) => currentCommentSet.add(commentID));
      }
    });

    return [currentFileSet, currentCommentSet];
  };

  /***********************************************************************************************/
  /* Component instance
  /***********************************************************************************************/

  // Interval for live feedback mode to reloda the submission to see if there are new files
  private checkNewFilesInterval: any;
  private LIVE_FEEDBACK_FILES_RELOAD_INTERVAL = 60000;

  public constructor(props: ICodeConsoleProps) {
    super(props);
    this.state = {
      permissionLevel: PERMISSION_LEVEL.READ,
      activeCommentID: undefined,
      assignment: undefined,
      commentRubricComments: {},
      comments: {},
      fileTemplates: undefined,

      files: [],
      graders: [],
      isLoading: true,
      rubricCategories: [],
      rubricComments: {},
      submission: undefined,

      selectedFile: undefined,
      oldCommentIDs: {},

      codeZoom: LOCAL_SETTINGS.codeZoom.getter(),
      codeVerticalOffset: 0,
      dimensions: getInitialDimensions(),

      demoCommentCounter: 0,

      isStudent: false,
      editRubricMode: false,
      commentCounter: -1,

      rubricReload: undefined,
      showExplanations: false,
    };
  }

  /**********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public async componentDidMount() {
    if (this.props.inDemoMode) {
      document.title = 'codePost | Code Console Demo';
      this.setState({ isLoading: false });
      return;
    }

    // Set window title
    const submissionID: number = +this.props.match.params.submissionId.valueOf();
    document.title = `codePost | Submission - ${submissionID}`;

    let permissionLevel = await this.detectPermissionType(submissionID);

    const values = queryString.parse(this.props.location.search);
    let simulatingStudent = false;
    if (permissionLevel === PERMISSION_LEVEL.WRITE && values.student !== undefined) {
      permissionLevel = PERMISSION_LEVEL.READ;
      simulatingStudent = true;
    }

    // Everything we need to load
    let submission;
    let assignment;
    let files;
    let comments;
    let commentRubricComments;
    let course;
    let rubricCategories;
    let rubricComments;
    let selectedFile;

    switch (permissionLevel) {
      case PERMISSION_LEVEL.NOT_FOUND:
      case PERMISSION_LEVEL.NONE:
        // Will trigger 403 or 404 message in render
        this.setState({ permissionLevel, isLoading: false });
        break;
      case PERMISSION_LEVEL.READ:
        // load the data a reader has access to
        submission = await Submission.readReadOnly(submissionID);
        [
          assignment,
          [files, comments, commentRubricComments],
          { rubricCategories, rubricComments },
        ] = await Promise.all([
          Assignment.read(submission.assignment),
          Submission.loadData(submission),
          this.loadRubric(submission.assignment),
        ]);
        course = await Course.read(assignment.course);

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        selectedFile = files.find((f: FileType) => {
          return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
        });
        if (selectedFile === undefined && files.length > 0) {
          selectedFile = files[0];
        }

        // then store it in state
        this.setState({
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
          isStudent:
            simulatingStudent ||
            (submission.students !== undefined && submission.students.indexOf(this.props.user.email) > -1),
        });
        break;

      case PERMISSION_LEVEL.WRITE:
        // load the data a writer has access to

        const writableSubmission = await Submission.readAnonymous(submissionID);
        [
          assignment,
          [files, comments, commentRubricComments],
          { rubricCategories, rubricComments },
        ] = await Promise.all([
          Assignment.read(writableSubmission.assignment),
          Submission.loadData(writableSubmission),
          this.loadRubric(writableSubmission.assignment),
        ]);
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
        const graders = this.isCourseAdmin(assignment)
          ? (await Course.readRoster(assignment.course))['graders'].sort()
          : [];

        // fill in grade using available data if submission doesn't contain an up-to-date grade
        if (assignment && !writableSubmission.isFinalized) {
          writableSubmission.grade = CodeConsole.calculateGrade(
            assignment,
            comments,
            commentRubricComments,
            rubricCategories,
            files,
          );
        }

        selectedFile = files.find((f: FileType) => {
          return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
        });

        if (selectedFile === undefined && files.length > 0) {
          selectedFile = files[0];
        }

        this.setState(
          {
            assignment,
            course,
            submission: writableSubmission,
            files,
            comments,
            commentRubricComments,
            rubricCategories,
            rubricComments,
            graders,
            isLoading: false,
            selectedFile,
            permissionLevel,
            fileTemplates,
          },
          () => this.setNewFilesWarning(),
        );
    }
  }

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
        Authorization: `JWT ${localStorage.getItem('token')}`,
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
    this.setState({ activeCommentID: id });
  };

  public changeSelectedFile = (fileID: number): void => {
    const selectedFile = this.state.files.find((file: FileType) => {
      return file.id === fileID;
    });
    if (selectedFile !== undefined) {
      LOCAL_SETTINGS.mostRecentFile.setter(selectedFile.id);
    }
    this.setState({ selectedFile, activeCommentID: undefined });
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

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType) => {
    const comments = CodeConsole.addCommentToState(this.state.comments, comment, file);
    this.setState({ comments, activeCommentID: comment.id, commentCounter: this.state.commentCounter - 1 });
  };

  public updateComment = (commentID: number, newComment: CommentType, newRubricComment?: RubricCommentType) => {
    const comments = CodeConsole.updateCommentsState(this.state.comments, commentID, newComment);

    const [rubricComment, restOfCommentRubricComments] = CodeConsole.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      commentID,
    );

    const commentRubricComments = CodeConsole.addToCommentRubricCommentsState(
      restOfCommentRubricComments,
      newComment.id,
      newRubricComment ? newRubricComment : rubricComment,
    );

    this.setState({ comments, commentRubricComments });
  };

  public saveComment = async (comment: CommentType) => {
    let savedComment: CommentType = comment;
    let oldCommentIDs = this.state.oldCommentIDs;

    if (!this.props.inDemoMode) {
      if (comment.id < 0) {
        savedComment = await CommentIO.create(comment);
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
          this.deleteComment(savedComment);
          return;
        }
      } else {
        savedComment = await CommentIO.update(comment);
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
    if (comment.id > 0 && !this.props.inDemoMode) {
      await CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
    }

    const comments = CodeConsole.removeCommentFromState(this.state.comments, comment);
    const [, commentRubricComments] = CodeConsole.removeFromCommentRubricCommentsState(
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
    const comments = CodeConsole.unlinkRubricComment(this.state.comments, comment, rubricComment);
    const [, commentRubricComments] = CodeConsole.removeFromCommentRubricCommentsState(
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

    const comments = CodeConsole.linkRubricComment(this.state.comments, rubricComment, this.state.activeCommentID);

    if (comments === undefined) {
      return;
    }

    const commentRubricComments = CodeConsole.addToCommentRubricCommentsState(
      this.state.commentRubricComments,
      this.state.activeCommentID,
      rubricComment,
    );

    this.setState({ comments, commentRubricComments });
  };

  public calculateGradeFromState = (): number | undefined => {
    if (!(this.state.submission || this.state.readOnlySubmission) || !this.state.assignment) {
      return undefined;
    }

    return CodeConsole.calculateGrade(
      this.state.assignment,
      this.state.comments,
      this.state.commentRubricComments,
      this.state.rubricCategories,
      this.state.files,
    );
  };

  public getPointsInFile = (file: FileType): number[] => {
    return CodeConsole.pointsInFile(file, this.state.comments[file.id], this.state.commentRubricComments);
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

  public toggleFinalized = async () => {
    if (!this.state.submission) {
      return;
    }

    if (this.props.inDemoMode) {
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

    const payload = {
      id: this.state.submission.id,
      isFinalized: !this.state.submission.isFinalized,
    };

    try {
      const submission = await Submission.update(payload);

      if (!this.state.submission.isFinalized) {
        sendSlack(
          'Submission finalized',
          `${this.state.submission.id} ${this.state.assignment ? this.state.assignment.name : ''} | ${
            this.state.course ? this.state.course.name : ''
          } ${this.state.course ? this.state.course.period : ''}`,
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

  /***********************************************************************************************/
  /* Demo data
  /***********************************************************************************************/
  public loadDemoData = (files: any[]) => {
    const demoAssignment: AssignmentType = {
      id: -1,
      name: 'codePost Demo',
      isReleased: false,
      hideGrades: false,
      rubricCategories: [],
      course: -1,
      sortKey: 0,
      anonymousGrading: false,
      allowRegradeRequests: false,
      regradeDeadline: '',
      hideGradersFromStudents: false,
      mean: null,
      median: null,
      points: 20,
      commentFeedback: true,
      allowStudentUpload: false,
      uploadDueDate: '',
      liveFeedbackMode: false,
      collaborativeRubricMode: false,
      additiveGrading: false,
      forcedRubricMode: false,
      templateMode: false,
      fileTemplates: [],
    };

    const demoCourse: CourseType = {
      id: -1,
      name: 'Demo',
      period: 'demo',
      assignments: [-1],
      sections: [],
      sendReleasedSubmissionsToBack: false,
      showStudentsStatistics: false,
      timezone: '',
      emailNewUsers: false,
      anonymousGradingDefault: false,
    };

    const demoSubmission: AnonymousSubmissionType = {
      id: 1,
      isFinalized: false,
      files: [1, 2, 3],
      students: ['student1@example.edu'],
      assignment: -1,
      dateEdited: '',
      dateUploaded: '',
      grade: null,
      grader: this.props.user.email,
      questionText: '',
      questionIsOpen: false,
      questionResponder: 'grader0@example.edu',
      questionResponse: '',
      questionIsRegrade: false,
      questionDate: '',
      responseDate: '',
    };

    const fileList: FileType[] = [];
    const commentMap: any = {};
    if (files.length > 0) {
      files.forEach((file, index) => {
        fileList.push({
          id: index,
          code: file.data,
          comments: [],
          extension: file.name.split('.')[1],
          name: file.name,
          submission: 1,
          path: null,
          created: '',
        });

        commentMap[index] = [];
      });
    } else {
      fileList[0] = demoFiles[0];
      fileList[1] = demoFiles[1];
      commentMap[0] = [];
      commentMap[1] = [];
    }

    const rubricCategoryList: RubricCategoryType[] = [
      {
        id: 1,
        name: 'Style',
        rubricComments: [],
        assignment: 1,
        pointLimit: null,
        sortKey: 0,
        helpText: '',
      },
      {
        id: 2,
        name: 'Performance',
        rubricComments: [],
        assignment: 1,
        pointLimit: null,
        sortKey: 1,
        helpText: '',
      },
    ];

    const rubricCommentsMap: IRubricCategoryToRubricCommentsMap = {
      1: [
        {
          id: 1,
          text: 'Unnecessary comment - this code speaks for itself!',
          category: 1,
          comments: [],
          pointDelta: 1,
          sortKey: 0,
        },
        {
          id: 2,
          text: 'Code not separated by newlines into logical blocks',
          category: 1,
          comments: [],
          pointDelta: 1,
          sortKey: 1,
        },
        {
          id: 3,
          text: "Generic variable name (e.g. `x`) that doesn't describe value",
          category: 1,
          comments: [],
          pointDelta: 1,
          sortKey: 2,
        },
      ],
      2: [
        {
          id: 4,
          text: 'Sorting followed by binary search would be faster than performing a `O(n^2)` search every time',
          category: 2,
          comments: [],
          pointDelta: 2,
          sortKey: 0,
        },
        {
          id: 5,
          text: 'Memoization would improve performance, since these values are frequently recomputed',
          category: 2,
          comments: [],
          pointDelta: 1,
          sortKey: 0,
        },
      ],
    };

    this.setState({
      assignment: demoAssignment,
      course: demoCourse,
      submission: demoSubmission,
      files: fileList,
      comments: commentMap,
      selectedFile: fileList.length > 0 ? fileList[0] : undefined,
      rubricCategories: rubricCategoryList,
      rubricComments: rubricCommentsMap,
    });
  };

  public setDimensions = (dimensions: CodeConsoleDimensionsType) => {
    this.setState({ dimensions });
    LOCAL_SETTINGS.codeWidth.setter(dimensions.codeWidth);
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
        Authorization: `JWT ${localStorage.getItem('token')}`,
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

    const toolbarWidgets = [];
    if (!this.props.inDemoMode) {
      const hasComments =
        this.state.selectedFile !== undefined ? this.state.comments[this.state.selectedFile.id].length > 0 : false;

      toolbarWidgets.push(
        <LayoutResizer
          key="layout-resizer"
          initialDimensions={this.state.dimensions}
          setDimensions={this.setDimensions}
          hasComments={hasComments}
          isEditingComment={this.state.activeCommentID !== undefined || this.state.editRubricMode}
        />,
      );
    }

    const controls = (
      <Controls
        updateVerticalOffset={this.setVerticalOffset}
        updateZoom={this.setZoom}
        fallbackWidth={layoutVars.breakpoints.smallScreen.grade}
      />
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
            <span style={{ color: theme === 'light' ? 'black' : 'white' }}>
              {this.state.permissionLevel === PERMISSION_LEVEL.NOT_FOUND
                ? "Whoops! This submission doesn't exist...😔"
                : "Whoops! Looks like you don't have access to this submission...😔"}
            </span>
          }
        />
      );
    } else if (this.props.inDemoMode && !this.state.assignment) {
      rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];
    } else {
      if (!this.state.assignment) {
        return <div>We're not supposed to get here..</div>;
      }

      // At this stage, we're going to render the Code Review Console, so we can
      // build the elements that are common between read-level and write-level

      /*********************************************************
      /* Build header
      /*********************************************************/

      middleHeader = [
        <GradeButton
          key="subheader-grade"
          assignment={this.state.assignment!}
          submission={this.state.submission === undefined ? this.state.readOnlySubmission! : this.state.submission}
          calculateGrade={this.calculateGradeFromState}
          rubricCategories={this.state.rubricCategories}
          comments={this.state.comments}
          commentRubricComments={this.state.commentRubricComments}
          files={this.state.files}
        />,
      ];

      const fileMenuTitle = <FileMenuTitle key="files" files={this.state.files} />;
      if (this.props.inDemoMode) {
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
              dimensions={this.state.dimensions}
              commentCounter={this.state.commentCounter}
              fileTemplate={undefined}
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
              activeCommentID={this.state.activeCommentID}
              changeActive={this.changeActiveComment}
              deleteComment={this.deleteComment}
              saveComment={this.saveComment}
              removeRubricComment={this.removeRubricComment}
              oldCommentIDs={this.state.oldCommentIDs}
              verticalOffset={this.state.codeVerticalOffset}
              dimensions={this.state.dimensions}
              updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
              studentFeedbackOn={this.state.assignment.commentFeedback}
              hideAuthor={this.state.assignment.hideGradersFromStudents}
              additiveGrading={this.state.assignment.additiveGrading}
              forcedRubricMode={this.state.assignment.forcedRubricMode}
              rubricCategories={this.state.rubricCategories}
            />
          );

          content = (
            <CodePanelLayout
              comments={demoComments}
              code={demoCode}
              toolbarWidgets={toolbarWidgets}
              dimensions={this.state.dimensions}
              file={this.state.selectedFile}
              zoom={this.state.codeZoom}
              updateVerticalOffset={this.setVerticalOffset}
            />
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
            graders={this.state.graders}
            isCourseAdmin={this.isCourseAdmin(this.state.assignment)}
            updateGrader={this.updateGrader}
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
                showExplanations: this.state.showExplanations,
              };
              return <RubricMenuUI props={propz} state={state} helpers={helpers} />;
            }}
          </RubricManager>,
        ];

        siderTitles = ['Submission Info', fileMenuTitle, 'Rubric'];

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
          <ThemeToggle key="theme-toggle" small={true} />,
          controls,
          <FinalizeButton
            key="subheader-finalize"
            submission={this.state.submission!}
            toggleFinalized={this.toggleFinalized}
          />,
        ];
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
              dimensions={this.state.dimensions}
            />
          );

          const comments = (
            <StudentComments
              isStudent={this.state.isStudent}
              comments={this.state.comments[this.state.selectedFile!.id]}
              rubricComments={this.state.commentRubricComments}
              file={this.state.selectedFile!}
              verticalOffset={this.state.codeVerticalOffset}
              dimensions={this.state.dimensions}
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
              dimensions={this.state.dimensions}
              file={this.state.selectedFile}
              zoom={this.state.codeZoom}
              updateVerticalOffset={this.setVerticalOffset}
            />
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
          <StatusTags
            key="tag"
            assignment={this.state.assignment!}
            submission={this.state.submission!}
            fallbackWidth={layoutVars.breakpoints.smallScreen.gradeHeader}
          />,
        ];

        rightHeader = [
          <ThemeToggle key="theme-toggle" small={true} />,
          <DownloadCode key="download-code" files={this.state.files} />,
          controls,
          <ViewAsStudent key="view-as-student" pathname={this.props.location.pathname} />,
          <FinalizeButton
            key="subheader-finalize"
            submission={this.state.submission!}
            toggleFinalized={this.toggleFinalized}
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
              dimensions={this.state.dimensions}
              commentCounter={this.state.commentCounter}
              fileTemplate={fileTemplate}
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
              activeCommentID={this.state.activeCommentID}
              changeActive={this.changeActiveComment}
              deleteComment={this.deleteComment}
              saveComment={this.saveComment}
              removeRubricComment={this.removeRubricComment}
              oldCommentIDs={this.state.oldCommentIDs}
              verticalOffset={this.state.codeVerticalOffset}
              dimensions={this.state.dimensions}
              updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
              studentFeedbackOn={this.state.assignment.commentFeedback}
              hideAuthor={this.state.assignment.hideGradersFromStudents}
              additiveGrading={this.state.assignment.additiveGrading}
              forcedRubricMode={this.state.assignment.forcedRubricMode}
              rubricCategories={this.state.rubricCategories}
            />
          );

          content = (
            <CodePanelLayout
              comments={comments}
              code={code}
              toolbarWidgets={toolbarWidgets}
              dimensions={this.state.dimensions}
              file={this.state.selectedFile}
              zoom={this.state.codeZoom}
              updateVerticalOffset={this.setVerticalOffset}
            />
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
            submission={this.state.submission!}
            graders={this.state.graders}
            isCourseAdmin={this.isCourseAdmin(this.state.assignment)}
            updateGrader={this.updateGrader}
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
                demoMode: false,
                showExplanations: this.state.showExplanations,
              };
              return <RubricMenuUI props={propz} state={state} helpers={helpers} />;
            }}
          </RubricManager>,
        ];

        siderTitles = ['Submission Info', fileMenuTitle, 'Rubric'];
      }
    }

    const cancelFunc = () => {
      return;
    };

    return (
      <div id="Grade">
        <CodeConsoleOnboardingSelector
          visible={this.props.inDemoMode && !this.state.assignment}
          onUploadConfirm={this.loadDemoData}
          onCancel={cancelFunc}
        />
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
      </div>
    );
  }
}
CodeConsole.contextType = ConsoleThemeContext;

export default CodeConsole;
