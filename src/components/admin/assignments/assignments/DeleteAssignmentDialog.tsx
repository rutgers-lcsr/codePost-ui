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
  /** What goes with it, when the table knows: submissions, and how many of them are graded. */
  submissionCount?: number;
  gradedCount?: number;
}

const DeleteAssignmentDialog: React.FC<IProps> = ({
  isVisible,
  onCancel,
  onDelete,
  assignmentName,
  submissionCount,
  gradedCount,
}) => {
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

  // Name what is lost in numbers when the table knows them; the generic sentence otherwise.
  const stakes =
    submissionCount == null
      ? 'all submissions associated with it, including all grades and comments'
      : submissionCount === 0
        ? 'nothing else: it has no submissions yet'
        : `its ${submissionCount} submission${submissionCount === 1 ? '' : 's'}${
            gradedCount ? ` (${gradedCount} graded)` : ''
          }, with every grade and comment on them`;

  const content = (
    <div>
      Deleting this assignment deletes {stakes}. <b>You cannot undo this.</b>
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
