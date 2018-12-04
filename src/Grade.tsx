import * as React from 'react';
import { Redirect } from 'react-router-dom';

import CodeGrader from './components/grade/CodeGrader';
import Panel from './components/grade/Panel';
import Rubric from './components/grade/Rubric';

import './styles/Grade.scss';

import {
  IAssignment,
  IComment,
  IFile,
  IRubricCategory,
  IRubricComment,
  ISubmission,
} from './types/common';

interface IGradeState {
  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  redirect: boolean;
  submission?: ISubmission;
  rubric?: IRubricCategory[];
  activeCommentId?: number;
}

class Grade extends React.Component<{ match: { params: { subID: typeof Number } } }, IGradeState> {
  public state: Readonly<IGradeState> = {
    activeCommentId: undefined,
    email: '',
    isLoading: true,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    rubric: undefined,
    submission: undefined,
  };

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    // Should use props to pass graderID here from top-level app...
    // ...annoying that typescript doesn't allow usage of lambdas
    // in render prop of Route object (which is designed to handle
    // lambdas efficiently)
    if (this.state.isLoggedIn) {
      this.loadSubmission();
    } else {
      this.setState({ redirect: true });
    }
  }

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to="/" />;
    }
    return;
  };

  public render() {
    const { activeCommentId, rubric, submission } = this.state;
    const deductions: number[] = [];

    if (!submission || !rubric) {
      return <div>No Submission Found </div>;
    }

    // Should include loading functionality while the submission is coming in
    return (
      <div>
        {this.renderRedirect()}

        <Panel submission={submission} toggleFinalized={this.toggleFinalized} />
        <div className="container-main">
          <Rubric rubric={rubric} handleRubricCommentClick={this.handleRubricCommentClick} />
          <CodeGrader
            deductions={deductions}
            submission={submission}
            readOnly={submission.isFinalized}
            addComment={this.addComment}
            activeCommentId={activeCommentId}
            changeActive={this.changeActive}
            deleteComment={this.deleteComment}
            updateComment={this.updateComment}
          />
        </div>
      </div>
    );
  }

  private changeActive = (id: number) => {
    this.setState({ activeCommentId: id });
  };

  private handleRubricCommentClick = (rubricComment: IRubricComment) => {
    const { activeCommentId, submission } = this.state;

    if (!submission || !activeCommentId) {
      return;
    }

    // As below, this is mutating the state object which could be bad practice
    for (const file of submission.files) {
      const comment = file.comments.find((c: IComment) => c.localId === activeCommentId);
      if (comment) {
        comment.text = rubricComment.text;
        comment.pointDelta = rubricComment.pointDelta;
        this.setState({ submission });
        break;
      }
    }
  };

  // Adds a blank comment to the submission state
  private addComment = (comment: IComment, file: IFile) => {
    const { submission } = this.state;
    if (!submission) {
      return;
    }

    // This mutates the submission state object which could be bad practice
    submission.files.find((f: IFile) => f.id === file.id).comments = [
      ...submission.files.find((f: IFile) => f.id === file.id).comments,
      comment,
    ];
    this.setState({ submission });
  };

  // Update comment text and pointDelta
  // POST / PATCH methods get called from EditableComment
  private updateComment = (comment: IComment, file: IFile) => {
    const { submission } = this.state;
    if (!submission) {
      return;
    }

    const commentsCopy = submission.files.find((f: IFile) => f.id === file.id).comments;
    const index = commentsCopy.findIndex((c: IComment) => c.localId === comment.localId);

    submission.files.find((f: IFile) => f.id === file.id).comments[index] = comment;
    this.setState({ submission });
  };

  // Delete the comment json from the submission state
  // Then delete the comment from the remote db
  private deleteComment = (comment: IComment, file: IFile) => {
    const { submission } = this.state;
    if (!submission) {
      return;
    }

    // This mutates the submission state object which could be bad practice
    const commentsCopy = submission.files.find((f: IFile) => f.id === file.id).comments;
    const index = commentsCopy.findIndex((c: IComment) => c.id === comment.id);

    submission.files.find((f: IFile) => f.id === file.id).comments = [
      ...commentsCopy.slice(0, index),
      ...commentsCopy.slice(index + 1),
    ];

    this.setState({ submission });

    fetch(`/api/comments/${comment.id}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      method: 'DELETE',
    }).then((res) => {
      // Returning '204 No Content' on success
      // Is that correct?
      console.log('res', res);
    });
  };

  // Callback for Finalize Button
  private toggleFinalized = () => {
    const { submission } = this.state;
    if (!submission) {
      return;
    }

    if (submission.isFinalized) {
      return new Promise((resolve, reject) => {
        fetch(`/api/submissions/${submission.id}/takeBack/`, {
          headers: {
            Authorization: `JWT ${localStorage.getItem('token')}`,
          },
          method: 'PATCH',
        })
          .then((res) => {
            return res.json();
          })
          .then((json) => {
            console.log('updated finalized', json);
            this.setState({
              submission: json,
            });
            resolve(json);
          });
      });
    }
    return new Promise((resolve, reject) => {
      fetch(`/api/submissions/${submission.id}/finalize/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'PATCH',
      })
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          console.log('updated finalized', json);
          this.setState({
            submission: json,
          });
          resolve(json);
        });
    });
  };

  private loadSubmission = () => {
    const subID = this.props.match.params.subID;
    fetch(`/api/submissions/${subID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (json.detail === 'Not found.') {
          this.setState({ submission: undefined, isLoading: false, email: json.email });
        } else {
          this.setState({ submission: json, isLoading: false, email: json.email });
          this.loadRubric(json.assignment);
        }
      });
  };

  private loadRubric = (assignment: IAssignment) => {
    fetch(`/api/assignments/${assignment.id}/rubric`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        this.setState({ rubric: json });
      });
  };
}

export default Grade;
