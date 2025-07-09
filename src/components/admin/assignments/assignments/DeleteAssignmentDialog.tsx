/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Input, Modal } from 'antd';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onDelete: () => void;
  assignmentName: string;
}

interface IState {
  typedName: string;
  isDeleting: boolean;
}

class DeleteAssignmentDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    typedName: '',
    isDeleting: false,
  };

  public changeTypedName = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ typedName: e.target.value });
  };

  public delete = () => {
    this.setState({ isDeleting: true });
    this.props.onDelete();
  };

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }
    const content = (
      <div>
        Are you sure you want to delete this assignment? If you proceed, you will delete all submissions associated with
        this assignment, including all grades and comments. <b>You cannot undo this.</b>
        <br />
        <br />
        To continue, type the <b>name of the assignment</b> into the field below.
        <br />
        <br />
        <Input onChange={this.changeTypedName} placeholder="Assignment name" />
      </div>
    );
    return (
      <Modal
        visible={this.props.isVisible}
        title={`Delete assignment: ${this.props.assignmentName}`}
        okText="Delete"
        footer={[
          <CPButton cpType="secondary" key="back" onClick={this.props.onCancel}>
            Cancel
          </CPButton>,
          <CPButton
            key="submit"
            disabled={this.state.typedName !== this.props.assignmentName}
            cpType="danger"
            loading={this.state.isDeleting}
            onClick={this.delete}
          >
            Delete
          </CPButton>,
        ]}
      >
        {content}
      </Modal>
    );
  }
}
export default DeleteAssignmentDialog;
