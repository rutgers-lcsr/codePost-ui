import * as React from 'react';

import * as moment from 'moment';

// import { CodePanel } from './components/Code/CodePanel';
// import Finalize from './components/grade/Finalize';
// import Rubric from './components/grade/Rubric';
// import SubmissionInfo from './components/grade/SubmissionInfo';

import { CircularProgress } from 'react-md';

import {
  ICommentToRubricCommentMap,
  IdMapType,
  IFileToCommentsMap,
  IRubricCategoryToRubricCommentsMap,
} from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CommentIO, CommentType, UiComment } from './infrastructure/comment';
import { Course, CourseSettingsType, CourseType } from './infrastructure/course';

import { RubricCategory, RubricCategoryType } from './infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from './infrastructure/rubricComment';
import { AnonymousSubmissionType, Submission, SubmissionType } from './infrastructure/submission';

import { UserType } from './infrastructure/user';

import CPLayoutGrade from './components/core/CPLayoutGrade';

import { Divider, Menu, Popover, Tag, Tooltip } from 'antd';

import { SelectParam } from 'antd/lib/menu';

import CPButton from './components/core/CPButton';
import CPDropdown from './components/core/CPDropdown';
import CPFileMenu from './components/core/CPFileMenu';
import CPFlex from './components/core/CPFlex';
import CPLayoutCodePanel from './components/core/CPLayoutCodePanel';
import CPLogo from './components/core/CPLogo';
import CPRubricMenu from './components/core/CPRubricMenu';

import { FileType } from './infrastructure/file';

import Code from './components/Code/Code';
// import CodePanelUtils from './components/Code/CodePanelUtils';

import Comments from './components/core/Comments';

import * as Immutable from './infrastructure/immutable';

interface IGradeState {
  isLoading: boolean;
  redirect: boolean;
  assignment?: AssignmentType;
  course?: CourseType;
  submission?: AnonymousSubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  activeCommentId?: number;
  unsavedComments: IdMapType;

  files: FileType[];
  graders: string[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  allowGradersToEditRubric: boolean;

  selectedFile: FileType | undefined;
}

export interface IGradeProps {
  match: any;
  history: any;
  user: UserType;
  addToast: any;
  addErrorToast: (text: string, action: string | undefined) => void;
}

class Grade extends React.Component<IGradeProps, IGradeState> {
  // -------------------------- Static Methods -------------------------- //

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
    console.log('old', comments[newComment.file]);
    const fileComments = Immutable.arrayUpdate(comments[newComment.file], newComment, index);
    console.log('new', fileComments);

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
  public static pointsInFile = (
    file: FileType,
    comments: CommentType[],
    rubricComments: ICommentToRubricCommentMap,
  ): number => {
    return comments.reduce((accumulator: number, comment: CommentType) => {
      if (!UiComment.isNew(comment)) {
        return accumulator + UiComment.points(comment, rubricComments[comment.id]);
      } else {
        return accumulator;
      }
    }, 0);
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
    const commentPoints = Grade.genericCommentPoints(comments);
    const pointsPerCategory = Grade.pointsPerCategory(commentRubricComments);
    const poinstPerCategoryWithCaps = Grade.pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories);

    const categoryPoints = Object.values(poinstPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
      return accumulator + current;
    }, 0);

    return assignment.points - commentPoints - categoryPoints;
  };

  // -------------------------- Initialization / Lifecycles -------------------------- //

  public state: Readonly<IGradeState> = {
    activeCommentId: undefined,
    assignment: undefined,
    commentRubricComments: {},
    comments: {},
    files: [],
    graders: [],
    isLoading: true,
    redirect: false,
    rubricCategories: [],
    rubricComments: {},
    submission: undefined,
    allowGradersToEditRubric: false,

    selectedFile: undefined,
    unsavedComments: {},
  };

  public async componentDidMount() {
    document.body.style.overflow = 'hidden';

    this.setState({ isLoading: true });
    const submissionID: number = +this.props.match.params.submissionId.valueOf();
    const submission = await Submission.readAnonymous(submissionID);
    if (submission) {
      const [
        assignment,
        [files, comments, commentRubricComments],
        [rubricCategories, rubricComments],
      ] = await Promise.all([
        Assignment.read(submission.assignment),
        Submission.loadData(submission),
        this.loadRubric(submission.assignment),
      ]);
      // add catch
      //     .catch((errors) => {
      //       this.setState({ isLoading: false });
      //     });

      const course = await Course.read(assignment.course);
      const settings = await this.loadSettings(assignment);
      const allowGradersToEditRubric = settings.allowGradersToEditRubric;
      const graders = this.isCourseAdmin(assignment)
        ? (await Course.readRoster(assignment.course))['graders'].sort()
        : [];

      if (assignment && !submission.isFinalized) {
        // @ts-ignore
        submission.grade = Grade.calculateGrade(assignment, comments, commentRubricComments, rubricCategories);
      }

      let selectedFile;
      if (files.length > 0) {
        selectedFile = files[0];
      }

      // @ts-ignore
      this.setState({
        assignment,
        course,
        submission,
        files,
        comments,
        commentRubricComments,
        rubricCategories,
        rubricComments,
        graders,
        allowGradersToEditRubric,
        isLoading: false,
        selectedFile,
      });
    }
  }

  public componentWillUnmount() {
    document.body.style.overflow = 'auto';
  }

  // -------------------------- Loading -------------------------- //

  public loadSettings = async (assignment: AssignmentType) => {
    const courseID = assignment.course;
    const settings: CourseSettingsType = await Course.readSettings(courseID);
    return settings;
  };

  public refreshRubric = async () => {
    if (!this.state.assignment) {
      return;
    }

    this.setState({ isLoading: true });
    const [rubricCategories, rubricComments] = await this.loadRubric(this.state.assignment.id);
    // @ts-ignore
    this.setState({ rubricCategories, rubricComments });
    this.setState({ isLoading: false });
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

    return [rubricCategories, rubricComments];
  };

  // -------------------------- Handlers -------------------------- //

  public changeActiveComment = (id: number | undefined): void => {
    this.setState({ activeCommentId: id });
  };

  public changeSelectedFile = (fileID: number): void => {
    const selectedFile = this.state.files.find((file: FileType) => {
      return file.id === fileID;
    });

    this.setState({ selectedFile, unsavedComments: {} });
  };

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType) => {
    console.log('adding comment', comment);
    const comments = Grade.addCommentToState(this.state.comments, comment, file);
    console.log('comments', comments);
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, comment.id);
    this.setState({ comments, unsavedComments, activeCommentId: comment.id });
  };

  public updateComment = (commentID: number, newComment: CommentType, newRubricComment?: RubricCommentType) => {
    const comments = Grade.updateCommentsState(this.state.comments, commentID, newComment);

    const [rubricComment, restOfCommentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      commentID,
    );

    const commentRubricComments = Grade.addToCommentRubricCommentsState(
      restOfCommentRubricComments,
      commentID,
      newRubricComment ? newRubricComment : rubricComment,
    );

    this.setState({ comments, commentRubricComments });
  };

  public saveComment = async (comment: CommentType) => {
    console.log('save comment grade', comment);
    let savedComment;
    if (comment.id < 0) {
      savedComment = await CommentIO.create(comment);
    } else {
      savedComment = await CommentIO.update(comment);
      console.log('saved comment', savedComment);
    }

    const unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, savedComment.id);

    // MISSING: what happens if unsuccessful save?
    this.updateComment(comment.id, savedComment);

    this.setState({ unsavedComments, activeCommentId: undefined });
    return;
  };

  public deleteComment = (comment: CommentType) => {
    const comments = Grade.removeCommentFromState(this.state.comments, comment);
    const [, commentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );
    const unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, unsavedComments, commentRubricComments });
    // MISSING
    if (comment.id > 0) {
      CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
    }
  };

  public addUnsaved = (commentID: number) => {
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
  };

  public removeUnsaved = (commentID: number) => {
    const unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
  };

  public removeRubricComment = (comment: CommentType, rubricComment: RubricCommentType) => {
    const comments = Grade.unlinkRubricComment(this.state.comments, comment, rubricComment);
    const [, commentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, commentRubricComments, unsavedComments });
  };

  public onRubricCommentClick = (rubricComment: RubricCommentType): void => {
    if (!this.state.activeCommentId) {
      return;
    }

    const comments = Grade.linkRubricComment(this.state.comments, rubricComment, this.state.activeCommentId);

    if (comments === undefined) {
      return;
    }

    const commentRubricComments = Grade.addToCommentRubricCommentsState(
      this.state.commentRubricComments,
      this.state.activeCommentId,
      rubricComment,
    );
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, this.state.activeCommentId);

    this.setState({ comments, commentRubricComments, unsavedComments });
  };

  public calculateGradeFromState = (): number | undefined => {
    if (!this.state.submission || !this.state.assignment) {
      return undefined;
    }

    return Grade.calculateGrade(
      this.state.assignment,
      this.state.comments,
      this.state.commentRubricComments,
      this.state.rubricCategories,
    );
  };

  public getPointsInFile = (file: FileType): number => {
    return Grade.pointsInFile(file, this.state.comments[file.id], this.state.commentRubricComments);
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

  // public updateComment = (commentID: number, newComment: CommentType, isSaved: boolean): boolean => {
  //   if (!this.state.submission) {
  //     return false;
  //   }

  //   const [comments, commentRubricComments, unsavedComments] = this.updateCommentHelper(
  //     commentID,
  //     newComment,
  //     isSaved,
  //     this.state.comments,
  //     this.state.commentRubricComments,
  //     this.state.unsavedComments,
  //   );

  //   this.setState({ comments, commentRubricComments, unsavedComments });
  //   return true;
  // };

  // Delete the comment json from the submission state
  // Then delete the comment from the remote db
  // public deleteComment = (comment: CommentType): void => {
  //   // const { submission, comments, commentRubricComments } = this.state;
  //   // if (!submission) {
  //   //   return;
  //   // }

  //   const index = this.state.comments[comment.file].findIndex((c: CommentType) => c.id === comment.id);
  //   const comments = {
  //     ...this.state.comments,
  //     [comment.file]: [
  //       ...this.state.comments[comment.file].slice(0, index),
  //       ...this.state.comments[comment.file].slice(index + 1),
  //     ],
  //   };

  //   const { [comment.id]: comm, ...commentRubricComments } = this.state.commentRubricComments;

  //   this.setState({ comments, commentRubricComments });

  //   if (this.state.unsavedComments.includes(comment.id)) {
  //     const unsavedComments = this.state.unsavedComments.filter((i: number) => {
  //       return i !== comment.id;
  //     });
  //     this.setState({ unsavedComments });
  //   }

  //   // Think about how to handle this case
  //   // Options:
  //   // - Leave as is. If the DELETE fails, it's not that big of a deal. Just annoying.
  //   // - Keep comment rendered until DELETE completes
  //   // - Remove comment render, add in a global page loading icon.
  //   if (comment.id > 0) {
  //     CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
  //   }
  // };

  public toggleFinalized = (): Promise<any> => {
    const { submission } = this.state;
    if (!submission) {
      return Promise.resolve();
    }

    const payload = {
      id: submission.id,
      isFinalized: !submission.isFinalized,
    };

    return Submission.update(payload)
      .then((json: any) => {
        this.setState({
          submission: json,
        });
        return json;
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.props.addErrorToast(error, undefined);
          });
        });
      });
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

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    // const {
    //   assignment,
    //   activeCommentId,
    //   commentRubricComments,
    //   files,
    //   rubricCategories,
    //   rubricComments,
    //   submission,
    //   comments,
    //   isLoading,
    //   graders,
    //   positiveNegativeAlert,
    // } = this.state;]

    // console.log(this.state.files);

    const isCourseAdmin = this.isCourseAdmin(this.state.assignment);

    if (this.state.isLoading) {
      return <CircularProgress id="progress" className="progress-circle" />;
    }

    if (!this.state.submission || !this.state.assignment) {
      return <div>No Submission Found</div>;
    }

    // --------- Mock Data --------- //

    // const category1 = RubricCategoryMock;
    // const category2 = { ...RubricCategoryMock, id: 2, name: 'Another Category' };

    // const comment1 = RubricCommentMock;
    // const comment2 = { ...RubricCommentMock, id: 2, text: 'another rubric comment' };
    // const comment3 = { ...RubricCommentMock, id: 3, category: 2, text: 'missing a semicolon' };

    // const rubricCategories = [category1, category2];
    // const rubricComments = { 1: [comment1, comment2], 2: [comment3] };

    // const file1 = FileMock;
    // const file2 = { ...FileMock, id: 2, name: 'loops.java', comments: [2] };

    // const files = [file1, file2];

    // const getPointsInFile = (file: FileType): number => {
    //   return Math.floor(Math.random() * 10) - 4;
    // };

    // ------------------------------ //

    const headerLeft = [<CPLogo key="header-0" cpType="main" />];

    const headerRight = [
      <span key="header-user" className="cp-label cp-label--white cp-label--bold">
        {this.props.user.email}
      </span>,
      <CPButton key="header-logout" cpType="dark">
        Log Out
      </CPButton>,
    ];

    const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={20} />;

    const subHeaderLeftTop = [
      <SubheaderTitle key="subheader-title" assignment={this.state.assignment} />,
      <SubheaderGrade
        key="subheader-grade"
        assignment={this.state.assignment}
        submission={this.state.submission}
        calculateGrade={this.calculateGradeFromState}
      />,
      <SubheaderInfo key="subheader-info" submission={this.state.submission} />,
    ];

    const subHeaderRightTop = [
      <SubheaderGrader
        key="subheader-grader"
        submission={this.state.submission}
        graders={this.state.graders}
        isCourseAdmin={isCourseAdmin}
        updateGrader={this.updateGrader}
      />,
      <FinalizeButton
        key="subheader-finalize"
        submission={this.state.submission}
        toggleFinalized={this.toggleFinalized}
      />,
    ];

    const subHeaderLeftBottom = [
      <StatusTags key="subheader-status-tags" assignment={this.state.assignment} submission={this.state.submission} />,
      <Divider key="subheader-divider" type="vertical" />,
      <Students key="subheader-students" submission={this.state.submission} />,
    ];

    const subHeaderRightBottom = [<LastEdited key="subheader-last-edited" submission={this.state.submission} />];

    const subheader = (
      <div>
        <CPFlex left={subHeaderLeftTop} right={subHeaderRightTop} gutterSize={6} />
        <CPFlex left={subHeaderLeftBottom} right={subHeaderRightBottom} gutterSize={6} />
      </div>
    );

    // const addComment = (comment: CommentType, file: FileType) => {
    //   this.changeActiveComment(comment.id);
    //   const didCommentAdd = this.addComment(comment, file);
    //   // CodePanelUtils.updateCommentPanelHeight();
    //   return didCommentAdd;
    // };

    let content = <div>no selected file</div>;
    if (this.state.selectedFile) {
      //       <Code
      //   // submission={this.state.submission}
      //   file={this.state.selectedFile}
      //   comments={CodePanelUtils.sortComments(this.state.comments[this.state.selectedFile.id])}
      //   // rubricComments={this.state.commentRubricComments}
      //   readOnly={false}
      //   addComment={addComment}
      //   commentCounter={1} // MISSING
      //   updateCommentCounter={updateCounter}
      //   // activeCommentId={1} // MISSING
      //   // changeActive={this.changeActiveComment}
      //   // deleteComment={this.deleteComment}
      //   // updateComment={this.updateComment}
      //   // updateSubmissionGrade={this.updateSubmissionGrade}
      //   // unsavedComments={this.state.unsavedComments}
      // />

      const code = (
        <Code
          file={this.state.selectedFile}
          comments={this.state.comments[this.state.selectedFile.id]}
          readOnly={false}
          addComment={this.addComment}
          user={this.props.user}
        />
      );
      // console.log('grade unsaved', this.state.unsavedComments);
      const comments = (
        <Comments
          comments={this.state.comments[this.state.selectedFile.id]}
          rubricComments={this.state.commentRubricComments}
          readOnly={false}
          file={this.state.selectedFile}
          activeCommentID={this.state.activeCommentId}
          changeActive={this.changeActiveComment}
          deleteComment={this.deleteComment}
          saveComment={this.saveComment}
          addUnsaved={this.addUnsaved}
          removeUnsaved={this.removeUnsaved}
          removeRubricComment={this.removeRubricComment}
        />
      );

      content = <CPLayoutCodePanel comments={comments} code={code} file={this.state.selectedFile} />;
    }
    //
    return (
      <CPLayoutGrade
        header={header}
        subheader={subheader}
        files={
          <CPFileMenu
            files={this.state.files}
            selectedFile={this.state.selectedFile}
            getPointsInFile={this.getPointsInFile}
            changeSelectedFile={this.changeSelectedFile}
            canChange={Object.keys(this.state.unsavedComments).length === 0}
          />
        }
        rubric={
          <CPRubricMenu
            rubricCategories={this.state.rubricCategories}
            rubricComments={this.state.rubricComments}
            handleRubricCommentClick={this.onRubricCommentClick}
          />
        }
        content={content}
      >
        <UseEscKey onPress={this.onEscKeyPress} />
      </CPLayoutGrade>
    );
  }
}

interface ISubheaderTitleProps {
  assignment: AssignmentType;
}

const SubheaderTitle = (props: ISubheaderTitleProps) => {
  return <span className=" cp-label cp-label--very-bold cp-label--large cp-label--title">{props.assignment.name}</span>;
};

interface ISubheaderGradeProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  calculateGrade: () => number | undefined;
}

const SubheaderGrade = (props: ISubheaderGradeProps) => {
  const gradeString = props.submission.isFinalized
    ? `${props.submission.grade} / ${props.assignment.points}`
    : `${props.calculateGrade()} / ${props.assignment.points}`;

  return <span className="cp-label cp-label--very-bold cp-label--medium cp-label--subtitle">{gradeString}</span>;
};

interface ISubheaderInfoProps {
  submission: AnonymousSubmissionType;
}

const SubheaderInfo = (props: ISubheaderInfoProps) => {
  const title = 'How was this calculated?';
  const content = props.submission.files.length;
  return (
    <Popover content={content} title={title} placement="right">
      <CPButton key="subheader-info" cpType="highlight" size="small" icon="question" />
    </Popover>
  );
};

interface ISubheaderGraderProps {
  submission: AnonymousSubmissionType;
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (submission: AnonymousSubmissionType, graderUsername: string | undefined) => Promise<SubmissionType>;
}

const SubheaderGrader = (props: ISubheaderGraderProps) => {
  const menuItems = props.graders.map((grader: string, index: number) => {
    return <Menu.Item key={grader}>{grader}</Menu.Item>;
  });

  menuItems.unshift(<Menu.Item key={'unassign'}>** unassign **</Menu.Item>);

  const onClick = (param: SelectParam) => {
    const selectedGrader = param.key;
    if (selectedGrader === 'unassign') {
      props.updateGrader(props.submission, '');
    } else {
      props.updateGrader(props.submission, selectedGrader);
    }
  };

  const overlay = <Menu onClick={onClick}>{menuItems}</Menu>;

  const currentGrader = props.submission.grader ? props.submission.grader : 'unassigned';
  const currentGraderString = `grader: ${currentGrader}`;

  const dropdown = (
    <CPDropdown
      value={currentGraderString}
      overlay={overlay}
      overlayStyle={{ maxHeight: '300px', overflowY: 'scroll' }}
    />
  );

  if (props.isCourseAdmin) {
    return dropdown;
  } else {
    return <span className="cp-label p-label--bold">{currentGraderString}</span>;
  }
  return dropdown;
};

// interface IToggleFinalizeProps {
//   submission: AnonymousSubmissionType;
//   comments: IFileToCommentsMap;
//   toggleFinalized: any;
//   positiveNegativeAlert: boolean;
//   updateSubmissionGrade: any;
//   updateComment: any;
//   files: FileType[];
//   unsavedComments: number[];
// }

interface IFinalizeButtonProps {
  submission: AnonymousSubmissionType;
  toggleFinalized: () => Promise<any>;
}

// MISSING: Positive/Negative, Toggle click, Unsaved comments modal
const FinalizeButton = (props: IFinalizeButtonProps) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const onClick = async () => {
    setIsLoading(true);
    await props.toggleFinalized();
    setIsLoading(false);
  };

  if (props.submission.isFinalized) {
    return (
      <CPButton cpType="secondary" fallback="unlock" onClick={onClick} loading={isLoading}>
        Unfinalize
      </CPButton>
    );
  } else {
    return (
      <CPButton cpType="primary" fallback="lock" onClick={onClick} loading={isLoading}>
        Finalize
      </CPButton>
    );
  }
};

interface IStatusTagsProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
}

type StatusTagType = 0 | 1 | 2 | 3;

const StatusTags = (props: IStatusTagsProps) => {
  const subStatus = (finalized: boolean, published: boolean): StatusTagType => {
    if (!finalized && !published) {
      return 0;
    }

    if (finalized && !published) {
      return 1;
    }

    if (!finalized && published) {
      return 2;
    }

    if (finalized && published) {
      return 3;
    }

    // never hits
    return 0;
  };

  const statusTagType: StatusTagType = subStatus(props.submission.isFinalized, props.assignment.isReleased);

  let tagColor;
  let tagText;
  let tooltipText;
  switch (statusTagType) {
    case 0:
      tagColor = 'blue';
      tagText = 'not finalized and not published';
      tooltipText = 'student cannot view';
      break;
    case 1:
      tagColor = 'orange';
      tagText = 'finalized but not published';
      tooltipText = 'student cannot view';
      break;
    case 2:
      tagColor = 'red';
      tagText = 'published but not finalized';
      tooltipText = 'student cannot view';
      break;
    case 3:
      tagColor = 'gold';
      tagText = 'finalized and published';
      tooltipText = '';
      break;
  }

  return (
    <Tooltip title={tooltipText}>
      <Tag color={tagColor} style={{ marginRight: '0px' }}>
        {tagText}
      </Tag>
    </Tooltip>
  );
};

const LastEdited = (props: { submission: AnonymousSubmissionType }) => {
  return (
    <span className="cp-label cp-label--bold">
      Last Edited: {props.submission.dateEdited ? moment(props.submission.dateEdited).format('lll') : '--'}
    </span>
  );
};

// MISSING: Anonymized Logic
const Students = (props: { submission: AnonymousSubmissionType }) => {
  let studentString;

  if (props.submission.students === undefined) {
    studentString = `${props.submission.id} <Anonymized>`;
  } else {
    studentString = props.submission.students.join(', ');
  }
  return <span className="cp-label">{studentString}</span>;
};

const UseEscKey = (props: { onPress: () => void }) => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.keyCode === 27) {
      props.onPress();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  });

  return null;
};

// const ToggleFinalize = (props: IToggleFinalizeProps) => {
//   const {
//     submission,
//     comments,
//     toggleFinalized,
//     positiveNegativeAlert,
//     updateSubmissionGrade,
//     updateComment,
//     files,
//   } = props;
//   const warningClassName = positiveNegativeAlert
//     ? 'grade__finalize__positive-negative-alert'
//     : 'grade__finalize__positive-negative-alert--none';
//   return (
//     <div className="grade__finalize">
//       <div className="grade__finalize--warning">
//         <Button
//           icon
//           tooltipLabel="Warning: This submission has both positive and negative point comments.
//         Please check to make sure that this is intentional."
//           tooltipPosition="left"
//           className={warningClassName}
//         >
//           warning
//         </Button>
//       </div>
//       <Finalize
//         submission={submission}
//         comments={comments}
//         toggleFinalized={toggleFinalized}
//         updateSubmissionGrade={updateSubmissionGrade}
//         updateComment={updateComment}
//         files={files}
//         unsavedComments={props.unsavedComments}
//       />
//     </div>
//   );
// };

export default Grade;
