import * as React from 'react';
import { Redirect } from 'react-router-dom';

import CodeGrader from './components/grade/CodeGrader';
import Panel from './components/grade/Panel';
import Rubric from './components/grade/Rubric';

import './styles/Grade.scss';

import APIUtils from './APIUtils';

import {
  IAssignment,
  IComment,
  IFile,
  IFileToCommentsMap,
  IRubricCategory,
  IRubricCategoryToRubricCommentsMap,
  IRubricComment,
  ISubmission,
} from './types/common';

interface IGradeState {
  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  redirect: boolean;
  assignment?: IAssignment;
  submission?: ISubmission;
  rubricCategories: IRubricCategory[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  activeCommentId?: number;

  files: IFile[];
  comments: IFileToCommentsMap;
}

class Grade extends React.Component<{ match: { params: { submissionId: typeof Number } } }, IGradeState> {
  public state: Readonly<IGradeState> = {
    activeCommentId: undefined,
    assignment: undefined,
    comments: {},
    email: '',
    files: [],
    isLoading: true,
    isLoggedIn: localStorage.getItem('token') ? true : false,
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
    if (this.state.isLoggedIn) {
      this.loadSubmission().then((submission) => {
        return Promise.all([
          this.loadAssignment(submission.assignment),
          this.loadRubricCategories(submission.assignment),
        ]).then(() => {
          this.setState({ isLoading: false });
        });
      });
    } else {
      this.setState({ redirect: true });
    }
  }

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadAssignment = (assignmentId: number) => {
    return APIUtils.fetchAssignment(assignmentId).then((assignment: any) => {
      console.log('4.1 - saving assignment: ', assignment);
      this.setState({ assignment });
      return assignment;
    });
  };

  public loadSubmission = () => {
    const submissionId: number = +this.props.match.params.submissionId.valueOf();
    return APIUtils.fetchSubmission(submissionId).then((submission: any) => {
      return this.loadFiles(submission).then(() => {
        console.log('3 - saving submission: ', submission);
        this.setState({ submission });
        return submission;
      });
    });
  };

  public loadFiles = (submission: ISubmission) => {
    return Promise.all(
      submission.files.map((fileId: number) => {
        return APIUtils.fetchFile(fileId).then((file: IFile) => {
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: [],
            },
          });
          return this.loadComments(file).then(() => {
            console.log('2 - saving file:', file);
            this.setState({ files: [...this.state.files, file] });
          });
        });
      }),
    );
  };

  public loadComments = (file: IFile) => {
    return Promise.all(
      file.comments.map((commentId: number) => {
        return APIUtils.fetchComment(commentId).then((comment: IComment) => {
          console.log('1 - saving comment:', comment);
          const comments = [...this.state.comments[file.id], comment];
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: comments,
            },
          });
        });
      }),
    );
  };

  public loadRubricCategories = (assignmentId: number) => {
    return APIUtils.fetchRubricCategories(assignmentId).then((rubricCategories) => {
      return Promise.all(
        rubricCategories.map((rubricCategory: IRubricCategory) => {
          return this.loadRubricComments(rubricCategory);
        }),
      ).then(() => {
        console.log('4.2 - saving rubricCategories: ', rubricCategories);
        this.setState({ rubricCategories });
        return rubricCategories;
      });
    });
  };

  public loadRubricComments = (rubricCategory: IRubricCategory) => {
    return Promise.all(
      rubricCategory.rubricComments.map((rubricCommentId: number) => {
        return APIUtils.fetchRubricComment(rubricCommentId).then((rubricComment: IRubricComment) => {
          console.log('4.11 - saving rubricComment:', rubricComment);
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

  public handleRubricCommentClick = (rubricComment: IRubricComment) => {
    const { activeCommentId, submission, files, comments } = this.state;

    if (!submission || !activeCommentId) {
      return;
    }

    for (const file of files) {
      const index = comments[file.id].findIndex((c: IComment) => c.id === activeCommentId);
      if (index !== -1) {
        comments[file.id][index].rubricComment = rubricComment.id;
        this.setState({ comments });
        break;
      }
    }
  };

  public getRubricComment = (rubricCommentId: number) => {
    const { rubricComments } = this.state;

    for (const rubricCategoryId of Object.keys(rubricComments)) {
      const rubricComment = rubricComments[rubricCategoryId].find((rc: IRubricComment) => rc.id === rubricCommentId);
      if (rubricComment) {
        return rubricComment;
      }
    }
  };

  public changeActiveComment = (id: number) => {
    this.setState({ activeCommentId: id });
  };

  // Usually adds a blank comment to the submission state
  public addComment = (comment: IComment, file: IFile) => {
    const { submission, comments } = this.state;
    if (!submission) {
      return;
    }

    comments[file.id] = [...comments[file.id], comment];
    this.setState({ comments });
  };

  public updateComment = (commentId: number, newComment: IComment, file: IFile) => {
    const { submission, comments } = this.state;
    if (!submission) {
      return;
    }

    const index = comments[file.id].findIndex((comment: IComment) => comment.id === commentId);

    comments[file.id][index] = newComment;

    this.setState({ comments });
  };

  // Delete the comment json from the submission state
  // Then delete the comment from the remote db
  public deleteComment = (comment: IComment, file: IFile) => {
    const { submission, comments } = this.state;
    if (!submission) {
      return;
    }

    const index = comments[file.id].findIndex((c: IComment) => c.id === comment.id);

    comments[file.id] = [...comments[file.id].slice(0, index), ...comments[file.id].slice(index + 1)];

    this.setState({ comments });

    // Think about how to handle this case
    // Options:
    // - Leave as is. If the DELETE fails, it's not that big of a deal. Just annoying.
    // - Keep comment rendered until DELETE completes
    // - Remove comment render, add in a global page loading icon.
    if (comment.id > 0) {
      fetch(`/api/comments/${comment.id}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'DELETE',
      }).then((res) => {
        // Returns '204 No Content' on success
        console.log('res', res);
      });
    }
  };

  public toggleFinalized = () => {
    const { submission } = this.state;
    if (!submission) {
      return;
    }

    const payload = {
      isFinalized: !submission.isFinalized,
    };

    return APIUtils.updateSubmission(submission.id, payload).then((json) => {
      this.setState({
        submission: json,
      });
      return json;
    });
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to="/" />;
    }
    return;
  };

  public render() {
    const {
      assignment,
      activeCommentId,
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
      <div>
        {this.renderRedirect()}

        <Panel submission={submission} assignment={assignment} toggleFinalized={this.toggleFinalized} />
        <div className="container-main">
          <Rubric
            rubricCategories={rubricCategories}
            rubricComments={rubricComments}
            handleRubricCommentClick={this.handleRubricCommentClick}
          />
          <CodeGrader
            submission={submission}
            files={files}
            comments={comments}
            readOnly={submission.isFinalized}
            addComment={this.addComment}
            activeCommentId={activeCommentId}
            changeActive={this.changeActiveComment}
            deleteComment={this.deleteComment}
            updateComment={this.updateComment}
            getRubricComment={this.getRubricComment}
          />
        </div>
      </div>
    );
  }
}

export default Grade;
