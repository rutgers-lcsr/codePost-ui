import * as React from 'react';
import { Button, DialogContainer, TextField } from 'react-md';

import { AssignmentType } from '../../infrastructure/assignment';

interface IProps {
  assignments: AssignmentType[];
  addErrorToast: (text: string, action: string | undefined) => void;
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;
}

interface IState {
  newAssignmentName: string;
  newAssignmentPoints: number;
  dialogVisible: boolean;
}

class NewAssignmentDialog extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newAssignmentName: '',
    newAssignmentPoints: 0,
    dialogVisible: false,
  };

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
      newAssignmentName: '',
    });
  };

  public changeNameField = (newName: string) => {
    this.setState({ newAssignmentName: newName });
  };

  public changePointsField = (newPoints: number) => {
    this.setState({ newAssignmentPoints: newPoints });
  };

  public createNewAssignment = () => {
    const { newAssignmentName, newAssignmentPoints } = this.state;
    const { assignments } = this.props;
    if (newAssignmentName.length < 4) {
      this.props.addErrorToast('Assignment name must be longer than 4 characters', undefined);
      return;
    }
    if (
      assignments
        .map((i) => {
          return i.name.toLowerCase();
        })
        .indexOf(newAssignmentName.toLowerCase()) !== -1
    ) {
      this.props.addErrorToast(
        'Assignment name must be distinct from other assignments in course.',
        undefined,
      );
      return;
    }
    if (newAssignmentPoints < 1) {
      this.props.addErrorToast('Assignment total points must be greater than 0', undefined);
      return;
    }
    this.props.createAssignment(newAssignmentName, newAssignmentPoints).then(() => {
      this.toggleDialog();
    });
  };

  public render() {
    const { dialogVisible } = this.state;
    const dialogActions = [];
    dialogActions.push({
      secondary: true,
      children: 'Cancel',
      onClick: this.toggleDialog,
    });

    dialogActions.push(
      <Button flat primary onClick={this.createNewAssignment}>
        Create
      </Button>,
    );

    return (
      <div>
        <Button raised onClick={this.toggleDialog}>
          Add a new assignment
        </Button>
        <DialogContainer
          id="newAssignment-dialog"
          visible={dialogVisible}
          title="Add new assignmentt"
          onHide={this.toggleDialog}
          actions={dialogActions}
          modal
        >
          <TextField
            id="newAssignment-name"
            label="New Assignment name"
            defaultValue=""
            onChange={this.changeNameField}
          />
          <TextField
            id="newAssignment-points"
            label="Total points"
            pattern="^d+(\.|\,)\d{1}"
            type="number"
            min={0}
            defaultValue=""
            onChange={this.changePointsField}
          />
        </DialogContainer>
      </div>
    );
  }
}
export default NewAssignmentDialog;
