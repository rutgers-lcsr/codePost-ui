// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React, { useCallback, useState } from 'react';

/* ant imports */
import type { RadioChangeEvent } from 'antd';
import { Alert, message, Modal, Radio } from 'antd';

/* codePost imports */
/* codePost imports */
import { Course } from '../../../../api-client';
import { Assignment, SubmissionInfoType } from '../../../../types/common';

export interface IProps {
  activeAssignment: Assignment;
  submissions: SubmissionInfoType[];
  currentCourse: Course;
  onCancel: () => void;
  myEmail: string;
  bulkUpdateSubmissions: (
    assignmentID: number,
    getPayload: (sub: SubmissionInfoType) => Partial<SubmissionInfoType>,
  ) => Promise<void>;
}

enum BULK_ACTION {
  Finalize,
  Unfinalize,
}

interface SubmissionPayload {
  id: number;
  isFinalized: boolean;
  grader?: string;
}

const BulkSubmissionEdit: React.FC<IProps> = ({
  activeAssignment,
  submissions,
  onCancel,
  myEmail,
  bulkUpdateSubmissions,
}) => {
  const [action, setAction] = useState(BULK_ACTION.Finalize);
  const [executing, setExecuting] = useState(false);

  // ********************************** Bulk edit functions ****************************************

  const editFinalized = useCallback(
    async (isFinalized: boolean) => {
      const getPayload = (sub: SubmissionInfoType): SubmissionPayload => {
        const payload: SubmissionPayload = { id: sub.id, isFinalized };
        if (isFinalized && !sub.grader) {
          // If finalizing and no grader is set, set a grader
          payload.grader = myEmail;
        }
        return payload;
      };
      return await bulkUpdateSubmissions(activeAssignment.id, getPayload);
    },
    [activeAssignment.id, myEmail, bulkUpdateSubmissions],
  );

  const execute = useCallback(async () => {
    switch (action) {
      case BULK_ACTION.Finalize:
        return await editFinalized(true);
      case BULK_ACTION.Unfinalize:
        return await editFinalized(false);
    }
  }, [action, editFinalized]);

  // ********************************** Helpers ****************************************
  const getNumAffected = useCallback(() => {
    switch (action) {
      case BULK_ACTION.Finalize:
        return submissions.filter((s) => !s.isFinalized).length;
      case BULK_ACTION.Unfinalize:
        return submissions.filter((s) => s.isFinalized).length;
    }
  }, [action, submissions]);

  const onSubmit = useCallback(() => {
    const numAffected = getNumAffected();
    Modal.confirm({
      title: `Are you sure you want to perform this action?`,
      content: (
        <div>
          This will affect <b>{`${numAffected}`} submissions</b>.
        </div>
      ),
      onOk() {
        setExecuting(true);
        execute()
          .then(() => {
            message.success('Action completed!');
          })
          .catch((error) => {
            message.error(`Action failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
          })
          .finally(() => {
            setExecuting(false);
          });
      },
      onCancel() {
        return;
      },
    });
  }, [getNumAffected, execute]);

  const onChange = useCallback((e: RadioChangeEvent) => {
    setAction(e.target.value);
  }, []);

  // ********************************** RENDER ****************************************

  const numFinalized = submissions.filter((s) => s.isFinalized).length;
  const numUnfinalized = submissions.length - numFinalized;

  const radioStyle = {
    height: '35px',
    lineHeight: '35px',
    width: '100%',
    fontSize: 15,
  };

  const options = [
    {
      label: `Finalize all submissions (impacts ${numUnfinalized} submission${numUnfinalized > 1 ? 's' : ''})`,
      value: BULK_ACTION.Finalize,
      disabled: numUnfinalized === 0,
      style: radioStyle,
    },
    {
      label: `Unfinalize all submissions (impacts ${numFinalized} submission${numFinalized > 1 ? 's' : ''})`,
      value: BULK_ACTION.Unfinalize,
      disabled: numFinalized === 0,
      style: radioStyle,
    },
  ];

  return (
    <Modal
      open={true}
      width={500}
      title={'Bulk edit submissions'}
      okText="Execute"
      onCancel={onCancel}
      onOk={onSubmit}
      okButtonProps={{ loading: executing }}
    >
      <Alert
        type="warning"
        style={{ marginBottom: 15 }}
        title={
          <div>
            <b>WARNING:</b> Performing bulk actions on submissions cannot be undone.
          </div>
        }
      />
      <div>
        <div style={{ fontSize: 16, marginBottom: 10, marginTop: 30 }}>Choose an action to perform: </div>
        <Radio.Group style={{ paddingLeft: 20 }} onChange={onChange} value={action} options={options}></Radio.Group>
      </div>
    </Modal>
  );
};

export default BulkSubmissionEdit;
