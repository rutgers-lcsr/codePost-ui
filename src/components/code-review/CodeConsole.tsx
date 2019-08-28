/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Empty, Menu, message } from 'antd';

/* codePost imports */
import Loading from '../core/Loading';

import {
  ICommentToRubricCommentMap,
  IdMapType,
  IFileToCommentsMap,
  IRubricCategoryToRubricCommentsMap,
} from '../../types/common';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CommentIO, CommentType, UiComment } from '../../infrastructure/comment';
import { Course, CourseSettingsType, CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
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
import RubricMenu from './menu/RubricMenu';
import { ReadOnlySubmissionInfo, SubmissionInfo } from './menu/SubmissionInfoMenu';

import layoutVars from '../../styles/layout/_layoutVars';

import { Controls, FinalizeButton, GradeButton, HeaderMenu, StatusTags, SubheaderTitle } from '../code-review/Header';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

import { CodeConsoleOnboardingSelector } from '../core/OnboardingSelector';

import { demoFiles } from './demoCode';

import { CODE_DEMO, CODE_TOUR_ID } from '../../routes';

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

  /* submissions data for readers and writers */
  readOnlySubmission?: StudentSubmissionType;
  assignment?: AssignmentType;
  course?: CourseType;
  files: FileType[];
  comments: IFileToCommentsMap;

  /* writer data */
  submission?: AnonymousSubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  allowGradersToEditRubric: boolean;
  activeCommentID?: number;
  unsavedComments: IdMapType;
  oldCommentIDs: { [currentID: number]: number };

  /* admin data */
  graders: string[];

  /* demo data */
  demoCommentCounter: number;
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

  // --- Edits
  public static addIdToUnsavedState = (unsavedComments: IdMapType, commentID: number) => {
    return { ...unsavedComments, [commentID]: true };
  };

  public static removeIdFromUnsavedState = (unsavedComments: IdMapType, commentID: number) => {
    const { [commentID]: flag, ...restOfUnsavedComments } = unsavedComments;
    return restOfUnsavedComments;
  };

  public static clearUnsavedComments = (comments: IFileToCommentsMap, file: FileType) => {
    // tslint:disable
    return comments.hasOwnProperty(file.id)
      ? {
          ...comments,
          [file.id]: comments[file.id].filter((comment: CommentType) => {
            return comment.id > 0;
          }),
        }
      : comments;
  };
  // tslint:enable

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
        const comment = { ...comments[+fileID][index], rubricComment: rubricComment.id, pointDelta: null };
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
  public static genericCommentPoints = (comments: IFileToCommentsMap): number => {
    return Object.keys(comments)
      .map((fileID) => {
        return comments[fileID].reduce((accumulator: number, comment: CommentType) => {
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
  ): { [categoryID: number]: number } => {
    const pointsPerCategory = {};
    for (const commentID in commentRubricComments) {
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
    const pointsPerCategoryWithCaps = {};
    for (const category in pointsPerCategory) {
      if (pointsPerCategory.hasOwnProperty(category)) {
        const thisCategory = rubricCategories.find((rubricCategory: RubricCategoryType) => {
          return rubricCategory.id === +category;
        });
        const pointLimit = thisCategory ? (thisCategory.pointLimit !== null ? thisCategory.pointLimit : 99999) : 99999;
        pointsPerCategoryWithCaps[+category] = Math.min(pointsPerCategory[category], pointLimit);
      }
    }
    return pointsPerCategoryWithCaps;
  };

  public static calculateGrade = (
    assignment: AssignmentType,
    comments: IFileToCommentsMap,
    commentRubricComments: ICommentToRubricCommentMap,
    rubricCategories: RubricCategoryType[],
  ): number => {
    const commentPoints = CodeConsole.genericCommentPoints(comments);
    const pointsPerCategory = CodeConsole.pointsPerCategory(commentRubricComments);
    const pointsPerCategoryWithCaps = CodeConsole.pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories);

    const categoryPoints = Object.values(pointsPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
      return accumulator + current;
    }, 0);

    return assignment.points - commentPoints - categoryPoints;
  };

  /***********************************************************************************************/
  /* Component instance
  /***********************************************************************************************/

  public constructor(props: ICodeConsoleProps) {
    super(props);
    this.state = {
      permissionLevel: PERMISSION_LEVEL.READ,
      activeCommentID: undefined,
      assignment: undefined,
      commentRubricComments: {},
      comments: {},
      files: [],
      graders: [],
      isLoading: true,
      rubricCategories: [],
      rubricComments: {},
      submission: undefined,
      allowGradersToEditRubric: false,

      selectedFile: undefined,
      unsavedComments: {},
      oldCommentIDs: {},

      codeZoom: 1,
      codeVerticalOffset: 0,
      dimensions: getInitialDimensions(),

      demoCommentCounter: 0,

      isStudent: false,
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

    const permissionLevel = await this.detectPermissionType(submissionID);

    // Everything we need to load
    let submission;
    let assignment;
    let files;
    let comments;
    let commentRubricComments;
    let course;

    switch (permissionLevel) {
      case PERMISSION_LEVEL.NOT_FOUND:
      case PERMISSION_LEVEL.NONE:
        // Will trigger 403 or 404 message in render
        this.setState({ permissionLevel, isLoading: false });
        break;
      case PERMISSION_LEVEL.READ:
        // load the data a reader has access to
        submission = await Submission.readReadOnly(submissionID);
        [assignment, [files, comments, commentRubricComments]] = await Promise.all([
          Assignment.read(submission.assignment),
          Submission.loadData(submission),
        ]);
        course = await Course.read(assignment.course);

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        // then store it in state
        this.setState({
          assignment,
          course,
          readOnlySubmission: submission,
          files,
          comments,
          commentRubricComments,
          isLoading: false,
          selectedFile: files.length > 0 ? files[0] : undefined,
          permissionLevel,
          isStudent: submission.students.indexOf(this.props.user.email) > -1,
        });
        break;

      case PERMISSION_LEVEL.WRITE:
        // load the data a writer has access to
        let rubricCategories;
        let rubricComments;

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
        const settings = await this.loadSettings(assignment);
        const allowGradersToEditRubric = settings.allowGradersToEditRubric;

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
          );
        }

        this.setState({
          assignment,
          course,
          submission: writableSubmission,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          rubricComments,
          graders,
          allowGradersToEditRubric,
          isLoading: false,
          selectedFile: files.length > 0 ? files[0] : undefined,
          permissionLevel,
        });
    }
  }

  /***********************************************************************************
  /* Loading methods
  /**********************************************************************************/

  public loadSettings = async (assignment: AssignmentType) => {
    const courseID = assignment.course;
    const settings: CourseSettingsType = await Course.readSettings(courseID);
    return settings;
  };

  public loadRubric = async (assignmentID: number) => {
    const rubric = await Assignment.readRubric(assignmentID);

    const rubricCategories = rubric.rubricCategories.sort(RubricCategory.compare);
    const rubricComments = {};

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
    const comments =
      this.state.selectedFile !== undefined
        ? CodeConsole.clearUnsavedComments(this.state.comments, this.state.selectedFile)
        : this.state.comments;

    const selectedFile = this.state.files.find((file: FileType) => {
      return file.id === fileID;
    });

    // this.setState({ unsavedComments: {} });
    this.setState({ selectedFile, comments });
  };

  // Comment Elements have a data-status attribute
  // We use plain javascript to decipher whether there are unsaved comments
  public containsUnsavedComments = (): boolean => {
    if (this.state.selectedFile) {
      if (this.state.comments.hasOwnProperty(this.state.selectedFile.id)) {
        for (const comment of this.state.comments[this.state.selectedFile.id]) {
          const commentElement = document.getElementById(`comment-${comment.id}`);
          if (commentElement !== null) {
            if (commentElement.dataset.status === 'edited') {
              return false;
            }
          }
        }
      }
    }
    return true;
  };

  /***********************************************************************************
  /* Helper functions
  /**********************************************************************************/

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType) => {
    const comments = CodeConsole.addCommentToState(this.state.comments, comment, file);
    // const unsavedComments = CodeConsole.addIdToUnsavedState(this.state.unsavedComments, comment.id);
    // this.setState({unsavedComments});
    this.setState({ comments, activeCommentID: comment.id });
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
    let savedComment;
    let oldCommentIDs = this.state.oldCommentIDs;

    if (!this.props.inDemoMode) {
      if (comment.id < 0) {
        savedComment = await CommentIO.create(comment);
        oldCommentIDs = { ...oldCommentIDs, [savedComment.id]: comment.id };
      } else {
        savedComment = await CommentIO.update(comment);
      }
    } else {
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

    let unsavedComments = CodeConsole.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);
    unsavedComments = CodeConsole.removeIdFromUnsavedState(unsavedComments, savedComment.id);

    this.setState({ unsavedComments, oldCommentIDs, activeCommentID: undefined });

    this.updateComment(comment.id, savedComment);
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
    const unsavedComments = CodeConsole.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, unsavedComments, commentRubricComments }, () => {
      // We will never be in a situation in which we have an active comment immediately after
      // deleting a comment. Either
      // (1) we deleted the active comment, so it's no longer active
      // (2) we deleted a different comment, which closed any previously active comment
      this.changeActiveComment(undefined);
    });
  };

  public addUnsaved = (commentID: number) => {
    const unsavedComments = CodeConsole.addIdToUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
  };

  public removeUnsaved = (commentID: number) => {
    const unsavedComments = CodeConsole.removeIdFromUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
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
    const unsavedComments = CodeConsole.addIdToUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, commentRubricComments, unsavedComments });
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
    // const unsavedComments = CodeConsole.addIdToUnsavedState(this.state.unsavedComments, this.state.activeCommentID);
    // this.setState({unsavedComments});

    this.setState({ comments, commentRubricComments });
  };

  public calculateGradeFromState = (): number | undefined => {
    if (!this.state.submission || !this.state.assignment) {
      return undefined;
    }

    return CodeConsole.calculateGrade(
      this.state.assignment,
      this.state.comments,
      this.state.commentRubricComments,
      this.state.rubricCategories,
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
      let comments = this.state.comments;

      if (!this.state.submission.isFinalized) {
        comments =
          this.state.selectedFile !== undefined
            ? CodeConsole.clearUnsavedComments(this.state.comments, this.state.selectedFile)
            : this.state.comments;
        message.success('Successfully finalized submission');
      } else {
        message.success('Successfully unfinalized submission');
      }

      this.setState({ submission, comments });
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
      mean: null,
      median: null,
      points: 20,
      commentFeedback: true,
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
      allowGradersToEditRubric: false,
    };

    const demoSubmission: AnonymousSubmissionType = {
      id: 1,
      isFinalized: false,
      files: [1, 2, 3],
      students: ['student1@example.edu'],
      assignment: -1,
      dateEdited: '',
      grade: null,
      grader: this.props.user.email,
    };

    const fileList: FileType[] = [];
    const commentMap = {};
    if (files.length > 0) {
      files.forEach((file, index) => {
        fileList.push({
          id: index,
          code: file.data,
          comments: [],
          extension: file.name.split('.')[1],
          name: file.name,
          submission: 1,
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
      { id: 1, name: 'Style', rubricComments: [], assignment: 1, pointLimit: null, sortKey: 0, helpText: '' },
      { id: 2, name: 'Performance', rubricComments: [], assignment: 1, pointLimit: null, sortKey: 1, helpText: '' },
    ];

    const rubricCommentsMap: IRubricCategoryToRubricCommentsMap = {
      [1]: [
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
          text: "Generic variable name that doesn't describe value",
          category: 1,
          comments: [],
          pointDelta: 1,
          sortKey: 2,
        },
      ],
      [2]: [
        {
          id: 4,
          text: 'Sorting followed by binary search would be faster than performing a quadratic search every time',
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
    let sider: React.ReactNode[] = [];

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
      const groupStyle = {
        padding: '5px 20px',
        lineHeight: '40px',
        fontSize: '14px',
        color: '#8d9298',
        background: '#f4f4f4',
        fontWeight: 600,
        cursor: 'default',
      };
      const itemStyle = {
        padding: '5px 20px',
        lineHeight: '35px',
        fontSize: '14px',
        cursor: 'pointer',
      };

      const openIntercom = () => {
        (window as any).Intercom('show');
      };

      const menu = (
        <Menu mode="vertical" style={{ width: 280, padding: 0 }}>
          <Menu.Item key="setting:1" style={groupStyle} className="header-menu">
            Code Review Console
          </Menu.Item>
          <Menu.Item key="setting:2" style={itemStyle} className="header-menu">
            <a href={`${CODE_DEMO}/?product_tour_id=${CODE_TOUR_ID}`}>Redo tutorial</a>
          </Menu.Item>
          <Menu.Item key="setting:3" style={itemStyle} className="header-menu" onClick={openIntercom}>
            Help! (talk to a human from codePost)
          </Menu.Item>
          <Menu.Item key="setting:4" style={groupStyle} className="header-menu">
            Other
          </Menu.Item>
          <Menu.Item key="setting:5" style={itemStyle} className="header-menu">
            <a href="/">Home</a>
          </Menu.Item>
          <Menu.Item key="setting:6" style={itemStyle} className="header-menu">
            <a href="/logout">Logout</a>
          </Menu.Item>
        </Menu>
      );

      middleHeader = [
        <GradeButton
          key="subheader-grade"
          assignment={this.state.assignment!}
          submission={this.state.submission === undefined ? this.state.readOnlySubmission! : this.state.submission}
          calculateGrade={this.calculateGradeFromState}
          rubricCategories={this.state.rubricCategories}
          comments={this.state.comments}
          commentRubricComments={this.state.commentRubricComments}
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
            />
          );

          const demoComments = (
            <GradeComments
              isStudent={this.state.isStudent}
              comments={this.state.comments[this.state.selectedFile!.id]}
              rubricComments={this.state.commentRubricComments}
              readOnly={this.state.submission!.isFinalized}
              file={this.state.selectedFile!}
              activeCommentID={this.state.activeCommentID}
              changeActive={this.changeActiveComment}
              deleteComment={this.deleteComment}
              saveComment={this.saveComment}
              addUnsaved={this.addUnsaved}
              removeUnsaved={this.removeUnsaved}
              removeRubricComment={this.removeRubricComment}
              oldCommentIDs={this.state.oldCommentIDs}
              verticalOffset={this.state.codeVerticalOffset}
              dimensions={this.state.dimensions}
              updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
              studentFeedbackOn={this.state.assignment.commentFeedback}
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
            canChange={this.containsUnsavedComments}
          />,
          <RubricMenu
            key="rubric-menu"
            rubricCategories={this.state.rubricCategories}
            rubricComments={this.state.rubricComments}
            handleRubricCommentClick={this.onRubricCommentClick}
          />,
        ];

        siderTitles = ['Submission Info', fileMenuTitle, 'Rubric'];

        leftHeader = [
          <HeaderMenu menu={menu} key="menu" />,
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
            canToggle={this.containsUnsavedComments}
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
          <HeaderMenu menu={menu} key="menu" />,
          <SubheaderTitle key="subheader-title" assignment={this.state.assignment!} />,
        ];

        rightHeader = [<ThemeToggle key="theme-toggle" small={true} />, controls];

        sider = [
          <ReadOnlySubmissionInfo
            key="submission-info"
            title="Submission Info"
            assignment={this.state.assignment}
            readOnlySubmission={this.state.readOnlySubmission!}
          />,
          <FileMenu
            key="file-menu"
            title="Files"
            files={this.state.files}
            comments={this.state.comments}
            selectedFile={this.state.selectedFile}
            getPointsInFile={this.getPointsInFile}
            changeSelectedFile={this.changeSelectedFile}
            canChange={this.containsUnsavedComments}
          />,
        ];
      } else {
        leftHeader = [
          <HeaderMenu menu={menu} key="menu" />,
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
          controls,
          <FinalizeButton
            key="subheader-finalize"
            submission={this.state.submission!}
            canToggle={this.containsUnsavedComments}
            toggleFinalized={this.toggleFinalized}
          />,
        ];

        if (this.state.selectedFile) {
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
            />
          );

          const comments = (
            <GradeComments
              isStudent={this.state.isStudent}
              comments={this.state.comments[this.state.selectedFile!.id]}
              rubricComments={this.state.commentRubricComments}
              readOnly={this.state.submission!.isFinalized}
              file={this.state.selectedFile!}
              activeCommentID={this.state.activeCommentID}
              changeActive={this.changeActiveComment}
              deleteComment={this.deleteComment}
              saveComment={this.saveComment}
              addUnsaved={this.addUnsaved}
              removeUnsaved={this.removeUnsaved}
              removeRubricComment={this.removeRubricComment}
              oldCommentIDs={this.state.oldCommentIDs}
              verticalOffset={this.state.codeVerticalOffset}
              dimensions={this.state.dimensions}
              updateFeedback={this.updateFeedback.bind(this, this.state.selectedFile!.id)}
              studentFeedbackOn={this.state.assignment.commentFeedback}
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
            canChange={this.containsUnsavedComments}
          />,
          <RubricMenu
            key="rubric-menu"
            rubricCategories={this.state.rubricCategories}
            rubricComments={this.state.rubricComments}
            handleRubricCommentClick={this.onRubricCommentClick}
          />,
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
        />
      </div>
    );
  }
}
CodeConsole.contextType = ConsoleThemeContext;

export default CodeConsole;
