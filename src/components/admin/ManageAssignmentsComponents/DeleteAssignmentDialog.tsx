import * as React from 'react';
import { Button, DialogContainer, TextField } from 'react-md';

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onDelete: () => void;
  assignmentName: string;
}

interface IState {
  typedName: string;
}

class DeleteAssignmentDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    typedName: '',
  };

  public changeTypedName = (newName: string) => {
    this.setState({ typedName: newName });
  };

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }
    const content = (
      <div>
        <div className="error-padding" />
        Are you sure you want to delete this assignment? If you proceed, you will delete all submissions associated with
        this assignment, including all grades and comments. <b>You cannot undo this.</b>
        <div className="error-padding" />
        To continue, type the name of the assignment into the field below.
        <TextField id="" label="" defaultValue="" onChange={this.changeTypedName} />
        <div className="error-padding" />
        <Button raised onClick={this.props.onCancel} primary={true} flat={true}>
          Cancel
        </Button>
        <Button
          raised
          onClick={this.props.onDelete}
          primary={false}
          flat={true}
          disabled={this.state.typedName !== this.props.assignmentName}
          style={{ marginLeft: '55px' }}
        >
          Delete
        </Button>
        <div className="error-padding" />
      </div>
    );
    return (
      <DialogContainer
        id="rubricFile-dialog"
        visible={true}
        title="Are you sure you want to delete this assignment?"
        onHide={this.props.onCancel}
        modal
      >
        {content}
      </DialogContainer>
    );
  }
}
export default DeleteAssignmentDialog;
