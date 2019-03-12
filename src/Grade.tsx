import * as React from 'react';

import { CodePanel } from './components/CodePanel';
import Finalize from './components/grade/Finalize';
import Rubric from './components/grade/Rubric';
import SubmissionInfo from './components/grade/SubmissionInfo';

import { Button, CircularProgress } from 'react-md';

import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CommentIO, CommentType } from './infrastructure/comment';
import { Course, RosterType } from './infrastructure/course';
import { File, FileType } from './infrastructure/file';
import { RubricCategoryType } from './infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from './infrastructure/rubricComment';
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

interface IProps {
  submissionID: number;
  match: any;
  history: any;
  user: UserType;
  addErrorToast: (text: string, action: string | undefined) => void;
}

class Grade extends React.Component<IProps, IGradeState> {
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

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    // Should use props to pass graderID here from top-level app...
    // ...annoying that typescript doesn't allow usage of lambdas
    // in render prop of Route object (which is designed to handle
    // lambdas efficiently)
    this.loadSubmission()
      .then((submission) => {
        return Promise.all([this.loadAssignment(submission.assignment), this.loadRubric(submission.assignment)]).then(
          () => {
            const positiveNegativeAlert = this.hasPositiveAndNegativeComments();
            if (!submission.isFinalized) {
              submission.grade = this.calculateGradeFromComments();
            }
            this.setState({ isLoading: false, positiveNegativeAlert, submission });
          },
        );
      })
      .catch((errors) => {
        this.setState({ isLoading: false });
      });
  }

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadAssignment = (assignmentId: number) => {
    return Assignment.read(assignmentId)
      .then((assignment: AssignmentType) => {
        this.setState({ assignment });
        return assignment;
      })
      .then((assignment) => {
        if (this.isCourseAdmin(assignment)) {
          this.loadGraders(assignment.course!);
        }
        return assignment;
      });
  };

  public loadGraders = (courseID: number) => {
    return Course.readRoster(courseID).then((roster: RosterType) => {
      const rosterGraders = 'graders';
      this.setState({ graders: roster[rosterGraders] });
      return roster;
    });
  };

  public loadSubmission = () => {
    const submissionId: number = +this.props.match.params.submissionId.valueOf();
    return Submission.read(submissionId).then((submission: SubmissionType) => {
      return this.loadFiles(submission).then(() => {
        this.setState({ submission });
        return submission;
      });
    });
  };

  public loadFiles = (submission: SubmissionType) => {
    const newFiles: FileType[] = [];
    return Promise.all(
      submission.files.map((fileId: number) => {
        return File.read(fileId).then((file: FileType) => {
          newFiles.push(file);
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: [],
            },
          });
          return this.loadComments(file);
        });
      }),
    ).then(() => {
      this.setState({ files: newFiles });
      return Promise.all([Promise.resolve()]);
    });
  };

  public loadComments = (file: FileType) => {
    return Promise.all(
      file.comments.map((commentId: number) => {
        return CommentIO.read(commentId).then((comment: CommentType) => {
          const comments = [...this.state.comments[file.id], comment];
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: comments,
            },
          });
          if (comment.rubricComment) {
            return RubricComment.read(comment.rubricComment).then((rubricComment) => {
              this.setState({
                commentRubricComments: {
                  ...this.state.commentRubricComments,
                  [comment.id]: rubricComment,
                },
              });
            });
          }
          return;
        });
      }),
    );
  };

  public loadRubric = (assignmentID: number) => {
    return Assignment.readRubric(assignmentID).then((rubric) => {
      this.setState({ rubricCategories: rubric.rubricCategories });
      return Promise.all(
        rubric.rubricCategories.map((rubricCategory: RubricCategoryType) => {
          return this.setState({
            rubricComments: {
              ...this.state.rubricComments,
              [rubricCategory.id]: rubric.rubricComments.filter((rubricComment) => {
                return rubricComment.category === rubricCategory.id;
              }),
            },
          });
        }),
      );
    });
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

  public calculateGradeFromComments = () => {
    const { comments, submission, assignment, commentRubricComments, rubricCategories } = this.state;

    let assignmentPoints = 0;
    if (!submission || !assignment) {
      return null;
    } else {
      assignmentPoints = assignment.points;
    }

    const grade =
      assignmentPoints -
      Object.keys(comments)
        .map((fileID) => {
          return comments[fileID].reduce((accumulator: number, comment: CommentType) => {
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

    let categoryPoints = 0;
    for (const category in pointsPerCategory) {
      if (pointsPerCategory.hasOwnProperty(category)) {
        const thisCategory = rubricCategories.find((rubricCategory: RubricCategoryType) => {
          return rubricCategory.id === +category;
        });
        const pointLimit = thisCategory ? (thisCategory.pointLimit ? thisCategory.pointLimit : 1000) : 1000;
        categoryPoints = categoryPoints + Math.min(pointsPerCategory[category], pointLimit);
      }
    }

    return grade - categoryPoints;
  };

  public hasPositiveAndNegativeComments = () => {
    const { comments, commentRubricComments } = this.state;

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
    const { submission } = this.state;
    if (submission) {
      const grade = this.calculateGradeFromComments();
      const positiveNegativeAlert = this.hasPositiveAndNegativeComments();
      submission.grade = grade;
      this.setState({ submission, positiveNegativeAlert });
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
              calculateGradeFromComments={this.calculateGradeFromComments}
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
  const warningClassName = positiveNegativeAlert ? 'positiveNegativeAlert' : 'positiveNegativeAlert--none';
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
