// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useRef, useState } from 'react';

/* ant imports */
import { Button, Input, Modal } from 'antd';
import type { InputRef } from 'antd';

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
  const inputRef = useRef<InputRef>(null);

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

  const matches = typedName.trim() === assignmentName;
  // Say why Delete is still grey, instead of leaving a disabled button to explain itself.
  const hint = matches
    ? 'Name matches. Delete is enabled.'
    : typedName
      ? 'Not the exact name yet. Capitals and spaces count.'
      : 'Delete stays off until the name matches.';

  const content = (
    <div>
      Are you sure you want to delete this assignment? If you proceed, you will delete all submissions associated with
      this assignment, including all grades and comments. <b>You cannot undo this.</b>
      <br />
      <br />
      To continue, type the name of the assignment, <b>{assignmentName}</b>, into the field below.
      <br />
      <br />
      <Input
        ref={inputRef}
        aria-label="Assignment name"
        aria-describedby="delete-assignment-hint"
        onChange={changeTypedName}
        onPressEnter={matches ? handleDelete : undefined}
        placeholder="Assignment name"
        status={typedName && !matches ? 'warning' : undefined}
        value={typedName}
      />
      <div
        id="delete-assignment-hint"
        aria-live="polite"
        style={{ marginTop: 8, fontSize: 13, color: matches ? '#198665' : 'rgba(0, 0, 0, 0.6)' }}
      >
        {hint}
      </div>
    </div>
  );

  return (
    <Modal
      open={isVisible}
      title={`Delete assignment: ${assignmentName}`}
      okText="Delete"
      onCancel={onCancel}
      afterOpenChange={(open) => open && inputRef.current?.focus()}
      footer={[
        <CPButton cpType="secondary" key="back" onClick={onCancel}>
          Cancel
        </CPButton>,
        // Solid red, like the admin's other destructive confirms: the quiet grey danger style is for row icons.
        <Button key="submit" type="primary" danger disabled={!matches} loading={isDeleting} onClick={handleDelete}>
          Delete assignment
        </Button>,
      ]}
    >
      {content}
    </Modal>
  );
};

export default DeleteAssignmentDialog;
