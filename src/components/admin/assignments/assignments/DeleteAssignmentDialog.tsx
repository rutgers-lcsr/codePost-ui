/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useState } from 'react';

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

const DeleteAssignmentDialog: React.FC<IProps> = ({ isVisible, onCancel, onDelete, assignmentName }) => {
  const [typedName, setTypedName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const changeTypedName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedName(e.target.value);
  }, []);

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    onDelete();
  }, [onDelete]);

  if (!isVisible) {
    return null;
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
      <Input onChange={changeTypedName} placeholder="Assignment name" value={typedName} />
    </div>
  );

  return (
    <Modal
      open={isVisible}
      title={`Delete assignment: ${assignmentName}`}
      okText="Delete"
      footer={[
        <CPButton cpType="secondary" key="back" onClick={onCancel}>
          Cancel
        </CPButton>,
        <CPButton
          key="submit"
          disabled={typedName !== assignmentName}
          cpType="danger"
          loading={isDeleting}
          onClick={handleDelete}
        >
          Delete
        </CPButton>,
      ]}
    >
      {content}
    </Modal>
  );
};

export default DeleteAssignmentDialog;
