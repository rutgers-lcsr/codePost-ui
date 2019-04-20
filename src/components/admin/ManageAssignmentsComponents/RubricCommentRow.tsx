/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
import { Button, FontIcon, TableColumn, TableRow, TextField, Tooltipped } from 'react-md';

/* codePost imports */
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { STATUS, statusChange } from './RubricUtils';

/**********************************************************************************************************************/

interface IProps {
  rubricComment: RubricCommentType;
  savedRubricComment?: RubricCommentType;
  isDisabled: boolean;
  deleteComment: (rComment: RubricCommentType) => void;
  updateComment: (rComment: RubricCommentType) => void;
  onEdit: (obj: RubricCommentType) => void;
  onUndo: (obj: RubricCommentType) => void;
  activateCommentExplorer: (rComment: RubricCommentType) => void;
}

interface IState {
  text: string;
  pointDelta: number;
  status: STATUS;
}

/**********************************************************************************************************************/

class RubricCommentRow extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      text: this.props.rubricComment.text,
      pointDelta: this.props.rubricComment.pointDelta,
      status: typeof this.props.savedRubricComment === 'undefined' ? STATUS.UNSAVED : STATUS.NONE,
    };
  }

  // public deleteRubric = () => {

  // }

  public componentDidUpdate(prevProps: IProps) {
    // For updating status when rubric is saved (to remove the unsaved icon)
    const { savedRubricComment } = this.props;
    if (savedRubricComment !== prevProps.savedRubricComment) {
      this.updateStatus();
    }

    // For undoing changes made at the RubricCommentRow level
    if (this.props.rubricComment !== prevProps.rubricComment) {
      this.setState(
        {
          text: this.props.rubricComment.text,
          pointDelta: this.props.rubricComment.pointDelta,
        },
        () => {
          this.updateStatus();
        },
      );
    }
  }

  public updateStatus = () => {
    const { savedRubricComment } = this.props;
    const { text, pointDelta, status } = this.state;
    if (savedRubricComment) {
      const newStatus = statusChange(
        [savedRubricComment.text, savedRubricComment.pointDelta],
        [text, pointDelta],
        status,
      );
      if (newStatus !== status) {
        this.setState({ status: newStatus }, () => {
          switch (newStatus) {
            case STATUS.UNSAVED:
              this.props.onEdit(this.props.rubricComment);
              break;
            case STATUS.NONE:
              this.props.onUndo(this.props.rubricComment);
              break;
          }
        });
      }
    }
  };

  public setValue = (label: string, value: any) => {
    this.setState(
      (prevstate) => {
        const newState = { ...prevstate };
        newState[label] = label === 'pointDelta' ? parseInt(value, 10) : value;
        return newState;
      },
      () => {
        this.updateStatus();
      },
    );
  };

  public saveComment = () => {
    const { rubricComment } = this.props;
    const { text, pointDelta } = this.state;

    if (text !== rubricComment.text || pointDelta !== rubricComment.pointDelta) {
      const payload: RubricCommentType = Object.assign({}, this.props.rubricComment);
      payload.text = this.state.text;
      payload.pointDelta = this.state.pointDelta;
      this.props.updateComment(payload);
    }
  };

  public triggerCommentExplorer = () => {
    this.props.activateCommentExplorer(this.props.rubricComment);
    return;
  };

  public render() {
    const { isDisabled, deleteComment, rubricComment } = this.props;
    const { text, pointDelta, status } = this.state;

    // Only shown option to delete if editing is enabled
    const deleteCommentColumn = !isDisabled ? (
      <TableColumn>
        <Button
          key="Delete"
          className="Btn"
          flat={true}
          icon={true}
          disabled={isDisabled}
          onClick={deleteComment.bind(this, rubricComment)}
        >
          delete
        </Button>
      </TableColumn>
    ) : null;

    // Inform the user if the comment has unsaved changes or whether a save was executed successfully
    let unSavedChanges = <div style={{ width: '20px' }} />;
    switch (status) {
      case STATUS.SAVED:
        unSavedChanges = (
          <Tooltipped label="Changes saved." position="right" setPosition={true} delay={500}>
            <div>
              <FontIcon>done_all</FontIcon>
            </div>
          </Tooltipped>
        );
        break;
      case STATUS.UNSAVED:
        unSavedChanges = (
          <Tooltipped label="Unsaved changes. Click anywhere to save." position="right" setPosition={true} delay={500}>
            <div>
              <FontIcon>cloud_off</FontIcon>
            </div>
          </Tooltipped>
        );
        break;
      default:
        break;
    }

    // Icon showing number of linked comments
    const frequencyClassName =
      rubricComment.comments.length > 0
        ? 'admin-rubric__commentRow__frequency'
        : 'admin-rubric__commentRow__frequency--none';

    return (
      <TableRow key={rubricComment.id}>
        <TableColumn>{unSavedChanges}</TableColumn>
        <TableColumn>
          <Tooltipped label="Click to explore." setPosition={true} position="right" delay={500}>
            <div className={frequencyClassName} onClick={this.triggerCommentExplorer}>
              {rubricComment.comments.length}
            </div>
          </Tooltipped>
        </TableColumn>
        <TableColumn grow={true}>
          <TextField
            value={text}
            disabled={isDisabled}
            onChange={this.setValue.bind(this, 'text')}
            onBlur={this.saveComment}
            className={'comment-text'}
            maxRows={5}
            rows={1}
            style={{ width: '100%' }}
          />
        </TableColumn>
        <TableColumn style={{ position: 'relative' }}>
          <TextField
            type="number"
            defaultValue={pointDelta}
            step={0.5}
            pattern="^d+(\.|\,)\d{1}"
            className="deduction-field"
            disabled={isDisabled}
            onChange={this.setValue.bind(this, 'pointDelta')}
            onBlur={this.saveComment}
            style={{ width: '100%', position: 'absolute', bottom: '0px' }}
          />
        </TableColumn>
        {deleteCommentColumn}
      </TableRow>
    );
  }
}

export default RubricCommentRow;
