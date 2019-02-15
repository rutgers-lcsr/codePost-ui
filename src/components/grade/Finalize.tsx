import * as React from 'react';

import { BUTTON_STATE, IFileToCommentsMap } from '../../types/common';

import { Button, DialogContainer } from 'react-md';

import { CommentIO, CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';
import { SubmissionType } from '../../infrastructure/submission';
import { FinalizeButton } from '../Buttons';

interface IFinalizeProps {
  submission: SubmissionType;
  comments: IFileToCommentsMap;
  toggleFinalized: any;
  updateSubmissionGrade: any;
  updateComment: any;
  files: FileType[];
}

interface IFinalizeState {
  buttonState: BUTTON_STATE;
  dialogVisible: boolean;
}

export class Finalize extends React.Component<IFinalizeProps, IFinalizeState> {
  public static getDerivedStateFromProps(nextProps: IFinalizeProps, prevState: IFinalizeState) {
    // do things with nextProps.someProp and prevState.cachedSomeProp
    return {
      buttonState: nextProps.submission.isFinalized ? BUTTON_STATE.Active : BUTTON_STATE.Inactive,
    };
  }

  public state: Readonly<IFinalizeState> = {
    // Finalized (take back) --> Active
    // else --> Inactive
    buttonState: this.props.submission.isFinalized ? BUTTON_STATE.Active : BUTTON_STATE.Inactive,
    dialogVisible: false,
  };

  public checkForUnsavedComments = () => {
    const { comments } = this.props;
    let existUnsavedComments = false;
    for (const fileID in comments) {
      if (comments.hasOwnProperty(fileID)) {
        if (
          comments[fileID].filter((comment: CommentType) => {
            return comment.id < 0;
          }).length > 0
        ) {
          existUnsavedComments = true;
          break;
        }
      }
    }

    return existUnsavedComments;
  };

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
    });
  };

  public tryToToggleFinalized = () => {
    const { submission } = this.props;
    this.setState({ buttonState: BUTTON_STATE.Loading });

    if (!submission.isFinalized && this.checkForUnsavedComments) {
      this.toggleDialog();
    } else {
      this.toggle();
    }
  };

  public toggle = () => {
    const { toggleFinalized } = this.props;
    toggleFinalized().then((submission: SubmissionType) => {
      if (!submission) {
        this.setState({ buttonState: BUTTON_STATE.Active });
      } else if (submission.isFinalized) {
        this.setState({ buttonState: BUTTON_STATE.Active });
      } else {
        this.setState({ buttonState: BUTTON_STATE.Inactive });
      }
    });
  };

  public handleUnsavedComments = (shouldSave: boolean) => {
    const { comments, updateSubmissionGrade, updateComment, files } = this.props;
    if (shouldSave) {
      const promises = [];
      for (const fileID in comments) {
        if (comments.hasOwnProperty(fileID)) {
          promises.push(
            comments[fileID].map((comment: CommentType) => {
              if (comment.id < 0) {
                const payload = {
                  id: comment.id, // codePost convention
                  endChar: comment.endChar,
                  endLine: comment.endLine,
                  file: comment.file,
                  pointDelta: comment.pointDelta,
                  rubricComment: comment.rubricComment,
                  startChar: comment.startChar,
                  startLine: comment.startLine,
                  text: comment.text,
                };

                return CommentIO.create(payload)
                  .then((json) => {
                    // eagerly update submission grade
                    updateSubmissionGrade();
                    const file = files.filter((f: FileType) => {
                      return f.id === +fileID;
                    })[0];
                    updateComment(comment.id, json, file);

                    return true;
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              } else {
                return Promise.resolve();
              }
            }),
          );
        }
      }
      Promise.all(promises).then(() => {
        this.toggleDialog();
        this.toggle();
      });
    } else {
      this.toggleDialog();
      this.toggle();
    }
  };

  public render() {
    const { buttonState } = this.state;

    const dialogActions = [];
    dialogActions.push(
      <Button secondary flat onClick={this.handleUnsavedComments.bind(this, false)}>
        Finalize without Saving
      </Button>,
    );

    dialogActions.push(
      <Button primary flat onClick={this.handleUnsavedComments.bind(this, true)}>
        Save and Finalize
      </Button>,
    );

    return (
      <div>
        <FinalizeButton buttonState={buttonState} handleClick={this.tryToToggleFinalized} />
        <DialogContainer
          id="finalize-dialog"
          className="dialog--finalize-submission"
          visible={this.state.dialogVisible}
          title="You have unsaved comments"
          onHide={this.toggleDialog}
          actions={dialogActions}
          disableScrollLocking={true}
        >
          Do you want to save them?
        </DialogContainer>
      </div>
    );
  }
}

export default Finalize;
