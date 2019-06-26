import * as React from 'react';

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
import { AnonymousSubmissionType, Submission } from '../../infrastructure/submission';

import { UserType } from '../../infrastructure/user';

import StandardConsoleHeader from '../core/layouts/StandardConsoleHeader';
import StandardConsoleLayout from '../core/layouts/StandardConsoleLayout';

import { Divider, message } from 'antd';

import CPFlex from '../core/CPFlex';

import {
  FinalizeButton,
  LastEdited,
  StatusTags,
  Students,
  SubheaderGrade,
  SubheaderGrader,
  SubheaderInfo,
  SubheaderTitle,
} from '../code-review/Subheader';

import CodePanelLayout from '../code-review/code-panel/CodePanelLayout';

import FileMenu from '../code-review/FileMenu';

import RubricMenu from '../code-review/RubricMenu';

import { FileType } from '../../infrastructure/file';

import { GradeCode } from '../code-review/code-panel/CodeContent';

import { GradeComments } from '../code-review/code-panel/Comments';

import * as Immutable from '../../infrastructure/immutable';

interface IGradeState {
  isLoading: boolean;
  redirect: boolean;
  assignment?: AssignmentType;
  course?: CourseType;
  submission?: AnonymousSubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;

  files: FileType[];
  graders: string[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  allowGradersToEditRubric: boolean;

  activeCommentID?: number;
  unsavedComments: IdMapType;

  oldCommentIDs: { [currentID: number]: number };

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
    const commentPoints = Grade.genericCommentPoints(comments);
    const pointsPerCategory = Grade.pointsPerCategory(commentRubricComments);
    const pointsPerCategoryWithCaps = Grade.pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories);

    const categoryPoints = Object.values(pointsPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
      return accumulator + current;
    }, 0);

    return assignment.points - commentPoints - categoryPoints;
  };

  // -------------------------- Initialization / Lifecycles -------------------------- //

  public state: Readonly<IGradeState> = {
    activeCommentID: undefined,
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
    oldCommentIDs: {},
  };

  public async componentDidMount() {
    this.setState({ isLoading: true });

    const submissionID: number = +this.props.match.params.submissionId.valueOf();
    document.title = `Submission - ${submissionID}`;
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

  // -------------------------- Loading -------------------------- //

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

    return [rubricCategories, rubricComments];
  };

  // -------------------------- Handlers -------------------------- //

  public changeActiveComment = (id: number | undefined): void => {
    this.setState({ activeCommentID: id });
  };

  public changeSelectedFile = (fileID: number): void => {
    const selectedFile = this.state.files.find((file: FileType) => {
      return file.id === fileID;
    });

    this.setState({ selectedFile, unsavedComments: {} });
  };

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType) => {
    const comments = Grade.addCommentToState(this.state.comments, comment, file);
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, comment.id);
    this.setState({ comments, unsavedComments, activeCommentID: comment.id });
  };

  public updateComment = (commentID: number, newComment: CommentType, newRubricComment?: RubricCommentType) => {
    const comments = Grade.updateCommentsState(this.state.comments, commentID, newComment);

    const [rubricComment, restOfCommentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      commentID,
    );

    const commentRubricComments = Grade.addToCommentRubricCommentsState(
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

    let unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);
    unsavedComments = Grade.removeIdFromUnsavedState(unsavedComments, savedComment.id);

    this.setState({ unsavedComments, oldCommentIDs, activeCommentID: undefined });

    this.updateComment(comment.id, savedComment);
  };

  public deleteComment = async (comment: CommentType) => {
    if (comment.id > 0) {
      await CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
    }

    const comments = Grade.removeCommentFromState(this.state.comments, comment);
    const [, commentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );
    const unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, unsavedComments, commentRubricComments });
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
    if (!this.state.activeCommentID) {
      return;
    }

    const comments = Grade.linkRubricComment(this.state.comments, rubricComment, this.state.activeCommentID);

    if (comments === undefined) {
      return;
    }

    const commentRubricComments = Grade.addToCommentRubricCommentsState(
      this.state.commentRubricComments,
      this.state.activeCommentID,
      rubricComment,
    );
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, this.state.activeCommentID);

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

  public getPointsInFile = (file: FileType): number[] => {
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

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const isCourseAdmin = this.isCourseAdmin(this.state.assignment);

    if (this.state.isLoading) {
      return <Loading />;
    }

    if (!this.state.submission || !this.state.assignment) {
      return <div>No Submission Found</div>;
    }

    const header = <StandardConsoleHeader user={this.props.user} handleLogout={this.onEscKeyPress} />;

    const subHeaderLeftTop = [
      <SubheaderTitle key="subheader-title" assignment={this.state.assignment} />,
      <SubheaderGrade
        key="subheader-grade"
        assignment={this.state.assignment}
        submission={this.state.submission}
        calculateGrade={this.calculateGradeFromState}
      />,
      <SubheaderInfo
        key="subheader-info"
        submission={this.state.submission}
        assignment={this.state.assignment}
        rubricCategories={this.state.rubricCategories}
        comments={this.state.comments}
        commentRubricComments={this.state.commentRubricComments}
      />,
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
        canToggle={Object.keys(this.state.unsavedComments).length === 0}
        toggleFinalized={this.toggleFinalized}
      />,
    ];

    const subHeaderLeftBottom = [
      <StatusTags key="subheader-status-tags" assignment={this.state.assignment} submission={this.state.submission} />,
      <Divider key="subheader-divider" type="vertical" />,
      <Students
        key="subheader-students"
        submission={this.state.submission}
        isAnonymous={this.state.assignment.anonymousGrading}
      />,
    ];

    const subHeaderRightBottom = [<LastEdited key="subheader-last-edited" submission={this.state.submission} />];

    const subheader = (
      <div>
        <CPFlex left={subHeaderLeftTop} right={subHeaderRightTop} gutterSize={6} />
        <CPFlex left={subHeaderLeftBottom} right={subHeaderRightBottom} gutterSize={6} />
      </div>
    );

    let content;
    if (this.state.selectedFile) {
      const code = (codeStyle: React.CSSProperties) => (
        <GradeCode
          key={this.state.selectedFile!.id}
          file={this.state.selectedFile!}
          comments={this.state.comments[this.state.selectedFile!.id]}
          readOnly={this.state.submission!.isFinalized}
          addComment={this.addComment}
          user={this.props.user.email}
          codeStyle={codeStyle}
        />
      );

      const comments = (
        <GradeComments
          comments={this.state.comments[this.state.selectedFile.id]}
          rubricComments={this.state.commentRubricComments}
          readOnly={this.state.submission.isFinalized}
          file={this.state.selectedFile}
          activeCommentID={this.state.activeCommentID}
          changeActive={this.changeActiveComment}
          deleteComment={this.deleteComment}
          saveComment={this.saveComment}
          addUnsaved={this.addUnsaved}
          removeUnsaved={this.removeUnsaved}
          removeRubricComment={this.removeRubricComment}
          oldCommentIDs={this.state.oldCommentIDs}
        />
      );

      content = <CodePanelLayout comments={comments} code={code} file={this.state.selectedFile} />;
    }

    return (
      <StandardConsoleLayout
        consoleTypes={['grade', 'subheader']}
        header={header}
        subheader={subheader}
        sider={[
          <FileMenu
            key={'file-menu'}
            title="Files"
            files={this.state.files}
            selectedFile={this.state.selectedFile}
            getPointsInFile={this.getPointsInFile}
            changeSelectedFile={this.changeSelectedFile}
            canChange={Object.keys(this.state.unsavedComments).length === 0}
          />,
          <RubricMenu
            key={'rubric-menu'}
            rubricCategories={this.state.rubricCategories}
            rubricComments={this.state.rubricComments}
            handleRubricCommentClick={this.onRubricCommentClick}
          />,
        ]}
        content={content}
      />
    );
  }
}

export default Grade;
