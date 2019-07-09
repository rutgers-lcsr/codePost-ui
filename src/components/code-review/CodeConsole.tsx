/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Badge, Dropdown, Empty, Icon, Menu, message } from 'antd';

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

import { RubricCategory, RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../infrastructure/rubricComment';
import { AnonymousSubmissionType, StudentSubmissionType, Submission } from '../../infrastructure/submission';

import { UserType } from '../../infrastructure/user';

import StandardConsoleLayout from '../core/layouts/StandardConsoleLayout';

import CPFlex from '../core/CPFlex';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

import { StatusTags, SubheaderTitle } from '../code-review/Subheader';

import CodePanelLayout from '../code-review/code-panel/CodePanelLayout';

import FileMenu from '../code-review/FileMenu';

import RubricMenu from '../code-review/RubricMenu';

import { FileType } from '../../infrastructure/file';

import { GradeCode, StudentCode } from '../code-review/code-panel/CodeContent';

import { GradeComments, StudentComments } from '../code-review/code-panel/Comments';

import * as Immutable from '../../infrastructure/immutable';

import ThemeToggle from '../core/ThemeToggle';

import { ReadOnlySubmissionInfo, SubmissionInfo } from '../code-review/SubmissionInfo';

import { FinalizeButton, GradeButton, Magnifier, Reset, Sizer } from '../code-review/code-panel/CodePanelWidgets';

import themeVars from '../../styles/abstracts/_theme.js';

/**********************************************************************************************************************/

/* f(logged in user, submission) */
enum PERMISSION_LEVEL {
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
  codeSplitBasis: number;
  codeVerticalOffset: number;

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
}

export interface ICodeConsoleProps {
  match: any;
  history: any;
  user: UserType;
  handleLogout: () => void;
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
        const pointLimit = thisCategory ? (thisCategory.pointLimit ? thisCategory.pointLimit : 99999) : 99999;
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

  public state: Readonly<ICodeConsoleState> = {
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
    codeSplitBasis: themeVars.grade.splitBasis,
    codeVerticalOffset: 0,
  };

  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public async componentDidMount() {
    // Set window title
    const submissionID: number = +this.props.match.params.submissionId.valueOf();
    document.title = `Submission - ${submissionID}`;

    const permissionLevel = await this.detectPermissionType(submissionID);

    // Everything we need to load
    let submission;
    let assignment;
    let files;
    let comments;
    let commentRubricComments;
    let course;

    switch (permissionLevel) {
      case PERMISSION_LEVEL.NONE:
        // Will trigger 403 message in render
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
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        console.log(json);
        if (json.write) {
          return PERMISSION_LEVEL.WRITE;
        } else if (json.read) {
          return PERMISSION_LEVEL.READ;
        } else {
          return PERMISSION_LEVEL.NONE;
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

    if (comment.id < 0) {
      savedComment = await CommentIO.create(comment);
      oldCommentIDs = { ...oldCommentIDs, [savedComment.id]: comment.id };
    } else {
      savedComment = await CommentIO.update(comment);
    }

    let unsavedComments = CodeConsole.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);
    unsavedComments = CodeConsole.removeIdFromUnsavedState(unsavedComments, savedComment.id);

    this.setState({ unsavedComments, oldCommentIDs, activeCommentID: undefined });

    this.updateComment(comment.id, savedComment);
  };

  public deleteComment = async (comment: CommentType) => {
    if (comment.id > 0) {
      await CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
    }

    const comments = CodeConsole.removeCommentFromState(this.state.comments, comment);
    const [, commentRubricComments] = CodeConsole.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );
    const unsavedComments = CodeConsole.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, unsavedComments, commentRubricComments });
  };

  public addUnsaved = (commentID: number) => {
    const unsavedComments = CodeConsole.addIdToUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
  };

  public removeUnsaved = (commentID: number) => {
    const unsavedComments = CodeConsole.removeIdFromUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
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

  public setSplitBasis = (newSplitBasis: number) => {
    this.setState({ codeSplitBasis: newSplitBasis });
  };

  public setVerticalOffset = (oldToNew: (oldValue: number) => number) => {
    this.setState((oldState: ICodeConsoleState) => {
      return {
        codeVerticalOffset: oldToNew(oldState.codeVerticalOffset),
      };
    });
  };

  /***********************************************************************************
  /* Render
  /**********************************************************************************/

  public render() {
    if (this.state.isLoading) {
      return <Loading />;
    }

    const theme = consoleThemes.light === this.context.consoleTheme ? 'light' : 'dark';

    if (this.state.permissionLevel === PERMISSION_LEVEL.NONE) {
      return (
        <div id="Grade">
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
                left={[]}
                right={[
                  <ThemeToggle key="theme-toggle" small={true} />,
                  <Reset key="reset" updateVerticalOffset={this.setVerticalOffset} />,
                  <Sizer key="sizer" updateSplitBasis={this.setSplitBasis} />,
                  <Magnifier key="zoom" updateZoom={this.setZoom} />,
                ]}
                gutterSize={20}
                className={theme}
              />
            }
            sider={[]}
            siderTitles={[]}
            content={
              <Empty
                imageStyle={{
                  marginTop: '200px',
                  height: 60,
                }}
                description={
                  <span style={{ color: theme === 'light' ? 'black' : 'white' }}>
                    Whoops! Looks like you don't have access to this submission...😔
                  </span>
                }
              />
            }
          />
        </div>
      );
    }

    if (!this.state.assignment) {
      return <div>Weird... should have loaded the assignment by now</div>;
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

    const menu = (
      <Menu mode="vertical" style={{ width: 280, padding: 0 }}>
        <Menu.Item key="setting:1" style={groupStyle} className="header-menu">
          Code Review Console
        </Menu.Item>
        <Menu.Item key="setting:2" style={itemStyle} className="header-menu">
          Redo tutorial
        </Menu.Item>
        <Menu.Item key="setting:3" style={itemStyle} className="header-menu">
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

    const headerMiddle = [
      <GradeButton
        key="subheader-grade"
        assignment={this.state.assignment}
        submission={this.state.submission === undefined ? this.state.readOnlySubmission! : this.state.submission}
        calculateGrade={this.calculateGradeFromState}
        rubricCategories={this.state.rubricCategories}
        comments={this.state.comments}
        commentRubricComments={this.state.commentRubricComments}
      />,
    ];

    const fileMenuTitle = (
      <span key="files">
        Files{' '}
        <span>
          <Badge
            style={{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset' }}
            count={this.state.files.length}
          />
        </span>
      </span>
    );

    /*********************************************************
    /* Render console for read-only submission
    /*********************************************************/
    if (this.state.permissionLevel === PERMISSION_LEVEL.READ) {
      let readOnlyContent;
      if (this.state.selectedFile) {
        const code = (codeStyle: React.CSSProperties, highlightHeight: string, onHighlightClick: any) => (
          <StudentCode
            key={this.state.selectedFile!.id}
            file={this.state.selectedFile!}
            comments={this.state.comments[this.state.selectedFile!.id]}
            readOnly={true}
            user={this.props.user.email}
            codeStyle={codeStyle}
            highlightHeight={highlightHeight}
            onHighlightClick={onHighlightClick}
          />
        );

        const comments = (
          <StudentComments
            comments={this.state.comments[this.state.selectedFile!.id]}
            rubricComments={this.state.commentRubricComments}
            file={this.state.selectedFile!}
            verticalOffset={this.state.codeVerticalOffset}
          />
        );

        readOnlyContent = (
          <CodePanelLayout
            comments={comments}
            code={code}
            file={this.state.selectedFile}
            zoom={this.state.codeZoom}
            splitBasis={this.state.codeSplitBasis}
            updateVerticalOffset={this.setVerticalOffset}
          />
        );
      }

      const readOnlyHeaderLeft = [
        <Dropdown overlay={menu} trigger={['click']} key="menu">
          <Icon type="menu" twoToneColor="white" />
        </Dropdown>,
        <SubheaderTitle key="subheader-title" assignment={this.state.assignment} />,
      ];

      const readOnlyHeaderRight = [
        <ThemeToggle key="theme-toggle" small={true} />,
        <Reset key="reset" updateVerticalOffset={this.setVerticalOffset} />,
        <Sizer key="sizer" updateSplitBasis={this.setSplitBasis} />,
        <Magnifier key="zoom" updateZoom={this.setZoom} />,
      ];

      const readOnlyHeader = (
        <CPFlex
          style={{
            padding: '0 15',
            height: 49,
            fontSize: 12,
            overflow: 'initial',
          }}
          left={readOnlyHeaderLeft}
          right={readOnlyHeaderRight}
          middle={headerMiddle}
          gutterSize={20}
          className={theme}
        />
      );

      return (
        <div id="Grade">
          <StandardConsoleLayout
            consoleTypes={['grade']}
            header={readOnlyHeader}
            sider={[
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
            ]}
            siderTitles={['Submission Info', fileMenuTitle]}
            content={readOnlyContent}
          />
        </div>
      );
    }

    /*********************************************************
    /* Render console for writable submission submission
    /*********************************************************/

    const headerLeft = [
      <Dropdown overlay={menu} trigger={['click']} key="menu">
        <Icon type="menu" twoToneColor="white" />
      </Dropdown>,
      <SubheaderTitle key="subheader-title" assignment={this.state.assignment} />,
      <StatusTags key="tag" assignment={this.state.assignment} submission={this.state.submission!} />,
    ];

    const headerRight = [
      <ThemeToggle key="theme-toggle" small={true} />,
      <Reset key="reset" updateVerticalOffset={this.setVerticalOffset} />,
      <Sizer key="sizer" updateSplitBasis={this.setSplitBasis} />,
      <Magnifier key="zoom" updateZoom={this.setZoom} />,
      <FinalizeButton
        key="subheader-finalize"
        submission={this.state.submission!}
        canToggle={this.containsUnsavedComments}
        toggleFinalized={this.toggleFinalized}
      />,
    ];

    const header = (
      <CPFlex
        style={{
          padding: '0 15',
          height: 49,
          fontSize: 12,
          overflow: 'initial',
        }}
        left={headerLeft}
        right={headerRight}
        middle={headerMiddle}
        gutterSize={20}
        className={theme}
      />
    );

    let content;
    if (this.state.selectedFile) {
      const code = (codeStyle: React.CSSProperties, highlightHeight: string, onHighlightClick: any) => (
        <GradeCode
          key={this.state.selectedFile!.id}
          file={this.state.selectedFile!}
          comments={this.state.comments[this.state.selectedFile!.id]}
          readOnly={this.state.submission!.isFinalized}
          addComment={this.addComment}
          user={this.props.user.email}
          codeStyle={codeStyle}
          highlightHeight={highlightHeight}
          onHighlightClick={onHighlightClick}
        />
      );

      const comments = (
        <GradeComments
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
        />
      );

      content = (
        <CodePanelLayout
          comments={comments}
          code={code}
          file={this.state.selectedFile}
          zoom={this.state.codeZoom}
          splitBasis={this.state.codeSplitBasis}
          updateVerticalOffset={this.setVerticalOffset}
        />
      );
    }

    return (
      <div id="Grade">
        <StandardConsoleLayout
          consoleTypes={['grade']}
          header={header}
          sider={[
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
          ]}
          siderTitles={['Submission Info', fileMenuTitle, 'Rubric']}
          content={content}
        />
      </div>
    );
  }
}
CodeConsole.contextType = ConsoleThemeContext;

export default CodeConsole;
