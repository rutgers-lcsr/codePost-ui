import * as React from 'react';

import { CodePanel } from './components/CodePanel';
import Panel from './components/grade/Panel';
import Rubric from './components/grade/Rubric';

import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CommentIO, CommentType } from './infrastructure/comment';
import { File, FileType } from './infrastructure/file';
import { RubricCategoryType } from './infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from './infrastructure/rubricComment';
import { Submission, SubmissionType } from './infrastructure/submission';

interface IGradeState {
  isLoading: boolean;
  redirect: boolean;
  assignment?: AssignmentType;
  submission?: SubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  activeCommentId?: number;

  files: FileType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
}

interface IProps {
  submissionID: number;
  email: string;
  match: any;
  history: any;
}

class Grade extends React.Component<IProps, IGradeState> {
  public state: Readonly<IGradeState> = {
    activeCommentId: undefined,
    assignment: undefined,
    commentRubricComments: {},
    comments: {},
    files: [],
    isLoading: true,
    redirect: false,
    rubricCategories: [],
    rubricComments: {},
    submission: undefined,
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
    this.loadSubmission().then((submission) => {
      return Promise.all([
        this.loadAssignment(submission.assignment),
        this.loadRubricCategories(submission.assignment),
      ]).then(() => {
        this.setState({ isLoading: false });
      });
    });
  }

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadAssignment = (assignmentId: number) => {
    return Assignment.read(assignmentId).then((assignment: AssignmentType) => {
      this.setState({ assignment });
      return assignment;
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
    return Promise.all(
      submission.files.map((fileId: number) => {
        return File.read(fileId).then((file: FileType) => {
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: [],
            },
          });
          return this.loadComments(file).then(() => {
            this.setState({ files: [...this.state.files, file] });
          });
        });
      }),
    );
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

  public loadRubricCategories = (assignmentId: number) => {
    return Assignment.readRubric(assignmentId, {}).then((rubric) => {
      return Promise.all(
        rubric.rubricCategories.map((rubricCategory: RubricCategoryType) => {
          return this.loadRubricComments(rubricCategory);
        }),
      ).then(() => {
        this.setState({ rubricCategories: rubric.rubricCategories });
        return rubric.rubricCategories;
      });
    });
  };

  public loadRubricComments = (rubricCategory: RubricCategoryType) => {
    return Promise.all(
      rubricCategory.rubricComments.map((rubricCommentId: number) => {
        return RubricComment.read(rubricCommentId).then((rubricComment: RubricCommentType) => {
          let rubricComments = [rubricComment];
          if (this.state.rubricComments[rubricCategory.id]) {
            rubricComments = [...this.state.rubricComments[rubricCategory.id], rubricComment];
          }
          this.setState({
            rubricComments: {
              ...this.state.rubricComments,
              [rubricCategory.id]: rubricComments,
            },
          });
        });
      }),
    );
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
        this.setState({ comments, commentRubricComments });
        break;
      }
    }
  };

  public changeActiveComment = (id: number | undefined): void => {
    this.setState({ activeCommentId: id });
  };

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType): void => {
    const { submission, comments } = this.state;
    if (!submission) {
      return;
    }

    comments[file.id] = [...comments[file.id], comment];
    this.setState({ comments });
  };

  public updateComment = (commentID: number, newComment: CommentType, file: FileType): void => {
    const { submission, comments } = this.state;
    if (!submission) {
      return;
    }

    const index = comments[file.id].findIndex((comment: CommentType) => comment.id === commentID);
    comments[file.id][index] = newComment;
    this.setState({ comments });
  };

  public saveGrade = (): any => {
    const { comments, submission, assignment, commentRubricComments } = this.state;

    let assignmentPoints = 0;
    if (!submission || !assignment) {
      return;
    } else {
      assignmentPoints = assignment.points;
    }

    // Horrific code that is happneing because the pointDelta is sometimes
    // a number and sometimes a string
    // will fix the underlying issue in a future PR
    const grade =
      assignmentPoints -
      Object.keys(comments)
        .map((fileID) => {
          return comments[fileID].reduce((accumulator: number, comment: CommentType) => {
            if (comment.pointDelta) {
              if (typeof comment.pointDelta === 'number') {
                return accumulator + comment.pointDelta;
              } else {
                return accumulator + parseInt(comment.pointDelta, 10);
              }
            } else if (commentRubricComments[comment.id]) {
              return accumulator + commentRubricComments[comment.id].pointDelta;
            } else {
              return accumulator;
            }
          }, 0);
        })
        .reduce((accumulator: number, fileGrade: number) => {
          return accumulator + fileGrade;
        }, 0);

    const payload = {
      id: submission.id,
      grade,
    };

    return Submission.update(payload).then((json: any) => {
      this.setState({
        submission: json,
      });
      return json;
    });
  };

  // Delete the comment json from the submission state
  // Then delete the comment from the remote db
  public deleteComment = (comment: CommentType, file: FileType): void => {
    const { submission, comments } = this.state;
    if (!submission) {
      return;
    }

    const index = comments[file.id].findIndex((c: CommentType) => c.id === comment.id);
    comments[file.id] = [...comments[file.id].slice(0, index), ...comments[file.id].slice(index + 1)];
    this.setState({ comments });

    // Think about how to handle this case
    // Options:
    // - Leave as is. If the DELETE fails, it's not that big of a deal. Just annoying.
    // - Keep comment rendered until DELETE completes
    // - Remove comment render, add in a global page loading icon.
    if (comment.id > 0) {
      CommentIO.delete(comment.id);
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

    return Submission.update(payload).then((json: any) => {
      this.setState({
        submission: json,
      });
      return json;
    });
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
    } = this.state;

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!submission || !assignment) {
      return <div>No Submission Found </div>;
    }

    // Should include loading functionality while the submission is coming in
    return (
      <div className="grade">
        <Panel submission={submission} assignment={assignment} toggleFinalized={this.toggleFinalized} />
        <div className="grade__main-container">
          <div className="grade__main-container__left-panel">
            <Rubric
              rubricCategories={rubricCategories}
              rubricComments={rubricComments}
              handleRubricCommentClick={this.handleRubricCommentClick}
            />
          </div>
          <div className="grade__main-container__right-panel">
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
              saveGrade={this.saveGrade}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Grade;
