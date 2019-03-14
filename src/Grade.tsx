import * as React from 'react';

import { CodePanel } from './components/CodePanel';
import Finalize from './components/grade/Finalize';
import Rubric from './components/grade/Rubric';
import SubmissionInfo from './components/grade/SubmissionInfo';

import { Button, CircularProgress } from 'react-md';

import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CommentIO, CommentType } from './infrastructure/comment';
import { Course } from './infrastructure/course';
import { FileType } from './infrastructure/file';
import { RubricCategoryType } from './infrastructure/rubricCategory';
import { RubricCommentType } from './infrastructure/rubricComment';
import { Submission, SubmissionType } from './infrastructure/submission';
import { UserType } from './infrastructure/user';

interface IGradeState {
  isLoading: boolean;
  redirect: boolean;
  assignment?: AssignmentType;
  submission?: SubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  activeCommentId?: number;
  unsavedComments: number[];

  files: FileType[];
  graders: string[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  positiveNegativeAlert: boolean;
}

export interface IGradeProps {
  match: any;
  history: any;
  user: UserType;
  addErrorToast: (text: string, action: string | undefined) => void;
}

class Grade extends React.Component<IGradeProps, IGradeState> {
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
    unsavedComments: [],
    positiveNegativeAlert: false,
  };

  //////////////////////////////////////
  // Lifecycle Methods
  //////////////////////////////////////

  public async componentDidMount() {
    this.setState({ isLoading: true });
    const submissionID: number = +this.props.match.params.submissionId.valueOf();
    const submission = await Submission.read(submissionID);
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

      const graders = (await Course.readRoster(assignment.course))['graders'];

      if (assignment && !submission.isFinalized) {
        // @ts-ignore
        submission.grade = this.calculateGrade(assignment, comments, commentRubricComments, rubricCategories);
      }

      // @ts-ignore
      this.setState({
        assignment,
        submission,
        files,
        comments,
        commentRubricComments,
        rubricCategories,
        rubricComments,
        graders,
        positiveNegativeAlert: this.hasPositiveAndNegativeComments(comments, commentRubricComments),
        isLoading: false,
      });
    }
  }

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadRubric = async (assignmentID: number) => {
    const rubric = await Assignment.readRubric(assignmentID);

    const rubricCategories = rubric.rubricCategories;
    const rubricComments = {};

    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      rubricComments[rubricCategory.id] = rubric.rubricComments.filter((rubricComment) => {
        return rubricComment.category === rubricCategory.id;
      });
    });

    return [rubricCategories, rubricComments];
  };

  ///////////////////////////////////////
  // Handlers
  ///////////////////////////////////////

  public handleRubricCommentClick = (rubricComment: RubricCommentType): void => {
    const { activeCommentId, submission, files, comments, commentRubricComments } = this.state;

    if (!submission || !activeCommentId) {
      return;
    }

    for (const file of files) {
      const index = comments[file.id].findIndex((c: CommentType) => c.id === activeCommentId);
      if (index !== -1) {
        comments[file.id][index].rubricComment = rubricComment.id;
        comments[file.id][index].pointDelta = null;
        commentRubricComments[comments[file.id][index].id] = rubricComment;
        this.setState({ comments, commentRubricComments }, () => this.updateSubmissionGrade());
        break;
      }
    }
  };

  public changeActiveComment = (id: number | undefined): void => {
    this.setState({ activeCommentId: id });
  };

  public calculateGradeFromState = (): number | undefined => {
    if (!this.state.submission || !this.state.assignment) {
      return undefined;
    }

    return this.calculateGrade(
      this.state.assignment,
      this.state.comments,
      this.state.commentRubricComments,
      this.state.rubricCategories,
    );
  };

  public calculateGrade = (
    assignment: AssignmentType,
    comments: IFileToCommentsMap,
    commentRubricComments: ICommentToRubricCommentMap,
    rubricCategories: RubricCategoryType[],
  ): number => {
    // non-rubricComment deductions
    const commentPoints = this.commentPoints(comments);
    const pointsPerCategory = this.pointsPerCategory(commentRubricComments);
    const poinstPerCategoryWithCaps = this.pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories);

    const categoryPoints = Object.values(poinstPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
      return accumulator + current;
    }, 0);

    return assignment.points - commentPoints - categoryPoints;
  };

  // Points from non-RubricComment Comments
  public commentPoints = (comments: IFileToCommentsMap): number => {
    return Object.keys(comments)
      .map((fileID) => {
        return comments[fileID].reduce((accumulator: number, comment: CommentType) => {
          // Don't count unsaved comments
          if (comment.id > 0 && comment.pointDelta) {
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
  public pointsPerCategory = (commentRubricComments: ICommentToRubricCommentMap): { [categoryID: number]: number } => {
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

  // Incorporate category caps
  public pointsPerCategoryWithCaps = (
    pointsPerCategory: { [categoryID: number]: number },
    rubricCategories: RubricCategoryType[],
  ): { [categoryID: number]: number } => {
    const pointsPerCategoryWithCaps = {};
    for (const category in pointsPerCategory) {
      if (pointsPerCategory.hasOwnProperty(category)) {
        const thisCategory = rubricCategories.find((rubricCategory: RubricCategoryType) => {
          return rubricCategory.id === +category;
        });
        const pointLimit = thisCategory ? (thisCategory.pointLimit ? thisCategory.pointLimit : 1000) : 1000;
        pointsPerCategoryWithCaps[+category] = Math.min(pointsPerCategory[category], pointLimit);
      }
    }
    return pointsPerCategoryWithCaps;
  };

  public hasPositiveAndNegativeComments = (
    comments: IFileToCommentsMap,
    commentRubricComments: ICommentToRubricCommentMap,
  ): boolean => {
    let hasPositiveDeduction = false;
    let hasNegativeDeduction = false;
    Object.keys(comments).forEach((fileID) => {
      comments[fileID].forEach((comment: CommentType) => {
        const pointDelta = comment.pointDelta
          ? comment.pointDelta
          : commentRubricComments[comment.id]
          ? commentRubricComments[comment.id].pointDelta
          : 0;
        if (pointDelta > 0) {
          hasPositiveDeduction = true;
        } else if (pointDelta < 0) {
          hasNegativeDeduction = true;
        }
      });
    });

    return hasPositiveDeduction && hasNegativeDeduction;
  };

  public updateSubmissionGrade = () => {
    if (this.state.submission) {
      const grade = this.calculateGradeFromState();
      if (grade) {
        const submission = { ...this.state.submission, grade };
        this.setState({
          submission,
          positiveNegativeAlert: this.hasPositiveAndNegativeComments(
            this.state.comments,
            this.state.commentRubricComments,
          ),
        });
      }
    }
  };

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType): void => {
    const { submission, comments } = this.state;
    if (!submission) {
      return;
    }

    comments[file.id] = [...comments[file.id], comment];
    this.setState({ comments }, () => this.updateSubmissionGrade());
  };

  public updateComment = (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean): void => {
    const { assignment, commentRubricComments, submission, comments } = this.state;
    if (!submission || !assignment) {
      return;
    }

    // Don't force the client side to always have to input a 0 for deduction
    if (newComment.pointDelta === null) {
      newComment.pointDelta = 0;
    }

    const index = comments[file.id].findIndex((comment: CommentType) => comment.id === commentID);
    comments[file.id][index] = newComment;

    let unsavedComments = this.state.unsavedComments;
    if (isSaved) {
      unsavedComments = this.state.unsavedComments.filter((i: number) => {
        return i !== commentID;
      });
    } else if (!this.state.unsavedComments.includes(commentID)) {
      unsavedComments = this.state.unsavedComments.concat(commentID);
    }

    this.setState({ unsavedComments });
    if (newComment.rubricComment) {
      commentRubricComments[newComment.id] = commentRubricComments[commentID];
    }

    this.setState({ comments, commentRubricComments });
  };

  // Delete the comment json from the submission state
  // Then delete the comment from the remote db
  public deleteComment = (comment: CommentType, file: FileType): void => {
    const { submission, comments, commentRubricComments } = this.state;
    if (!submission) {
      return;
    }

    const index = comments[file.id].findIndex((c: CommentType) => c.id === comment.id);
    comments[file.id] = [...comments[file.id].slice(0, index), ...comments[file.id].slice(index + 1)];

    delete commentRubricComments[comment.id];
    this.setState({ comments, commentRubricComments });

    if (this.state.unsavedComments.includes(comment.id)) {
      const unsavedComments = this.state.unsavedComments.filter((i: number) => {
        return i !== comment.id;
      });
      this.setState({ unsavedComments });
    }

    // Think about how to handle this case
    // Options:
    // - Leave as is. If the DELETE fails, it's not that big of a deal. Just annoying.
    // - Keep comment rendered until DELETE completes
    // - Remove comment render, add in a global page loading icon.
    if (comment.id > 0) {
      CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
    }
  };

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

  public updateGrader = (sub: SubmissionType, graderUsername: string | undefined) => {
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

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const {
      assignment,
      activeCommentId,
      commentRubricComments,
      files,
      rubricCategories,
      rubricComments,
      submission,
      comments,
      isLoading,
      graders,
      positiveNegativeAlert,
    } = this.state;

    const isCourseAdmin = this.isCourseAdmin(assignment);

    if (isLoading) {
      return <CircularProgress id="progress" className="progress-circle" />;
    }

    if (!submission || !assignment) {
      return <div>No Submission Found</div>;
    }

    // Should include loading functionality while the submission is coming in
    return (
      <div id="grade" className="grade">
        <div className="grade__main-container">
          <div className="grade__main-container__left-panel">
            <SubmissionInfo
              submission={submission}
              assignment={assignment}
              graders={graders}
              updateGrader={this.updateGrader}
              isCourseAdmin={isCourseAdmin}
              commentRubricComments={commentRubricComments}
              rubricCategories={rubricCategories}
              calculateGradeFromComments={this.calculateGradeFromState}
            />
            <Rubric
              rubricCategories={rubricCategories}
              rubricComments={rubricComments}
              handleRubricCommentClick={this.handleRubricCommentClick}
            />
          </div>
          <div className="grade__main-container__right-panel">
            <ToggleFinalize
              submission={submission}
              comments={comments}
              toggleFinalized={this.toggleFinalized}
              positiveNegativeAlert={positiveNegativeAlert}
              updateSubmissionGrade={this.updateSubmissionGrade}
              updateComment={this.updateComment}
              files={files}
              unsavedComments={this.state.unsavedComments}
            />
            <CodePanel
              submission={submission}
              files={files}
              comments={comments}
              rubricComments={commentRubricComments}
              readOnly={submission.isFinalized}
              addComment={this.addComment}
              activeCommentId={activeCommentId}
              changeActive={this.changeActiveComment}
              deleteComment={this.deleteComment}
              updateComment={this.updateComment}
              updateSubmissionGrade={this.updateSubmissionGrade}
              unsavedComments={this.state.unsavedComments}
            />
          </div>
        </div>
      </div>
    );
  }
}

interface IToggleFinalizeProps {
  submission: SubmissionType;
  comments: IFileToCommentsMap;
  toggleFinalized: any;
  positiveNegativeAlert: boolean;
  updateSubmissionGrade: any;
  updateComment: any;
  files: FileType[];
  unsavedComments: number[];
}

const ToggleFinalize = (props: IToggleFinalizeProps) => {
  const {
    submission,
    comments,
    toggleFinalized,
    positiveNegativeAlert,
    updateSubmissionGrade,
    updateComment,
    files,
  } = props;
  const warningClassName = positiveNegativeAlert
    ? 'grade__finalize__positive-negative-alert'
    : 'grade__finalize__positive-negative-alert--none';
  return (
    <div className="grade__finalize">
      <div className="grade__finalize--warning">
        <Button
          icon
          tooltipLabel="Warning: This submission has both positive and negative point comments.
        Please check to make sure that this is intentional."
          tooltipPosition="left"
          className={warningClassName}
        >
          warning
        </Button>
      </div>
      <Finalize
        submission={submission}
        comments={comments}
        toggleFinalized={toggleFinalized}
        updateSubmissionGrade={updateSubmissionGrade}
        updateComment={updateComment}
        files={files}
        unsavedComments={props.unsavedComments}
      />
    </div>
  );
};

export default Grade;
