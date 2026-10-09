// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React, { useCallback, useState } from 'react';

/* ant imports */
import type { RadioChangeEvent } from 'antd';
import { Alert, message, Modal, Radio } from 'antd';

import { apiErrorMessageAsync } from '../../../../lib/apiError';

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
  Release,
}

interface SubmissionPayload {
  id: number;
  isFinalized?: boolean;
  grader?: string | null;
}

// Claimed but not finalized: the submissions a Release sends back to the Draw queue.
const isReleasable = (sub: SubmissionInfoType) => !!sub.grader && !sub.isFinalized;

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

  const releaseClaimed = useCallback(async () => {
    const getPayload = (sub: SubmissionInfoType): SubmissionPayload =>
      isReleasable(sub) ? { id: sub.id, grader: null } : { id: sub.id };
    return await bulkUpdateSubmissions(activeAssignment.id, getPayload);
  }, [activeAssignment.id, bulkUpdateSubmissions]);

  const execute = useCallback(async () => {
    switch (action) {
      case BULK_ACTION.Finalize:
        return await editFinalized(true);
      case BULK_ACTION.Unfinalize:
        return await editFinalized(false);
      case BULK_ACTION.Release:
        return await releaseClaimed();
    }
  }, [action, editFinalized, releaseClaimed]);

  // ********************************** Helpers ****************************************
  const getNumAffected = useCallback(() => {
    switch (action) {
      case BULK_ACTION.Finalize:
        return submissions.filter((s) => !s.isFinalized).length;
      case BULK_ACTION.Unfinalize:
        return submissions.filter((s) => s.isFinalized).length;
      case BULK_ACTION.Release:
        return submissions.filter(isReleasable).length;
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
          .catch(async (error) => {
            message.error((await apiErrorMessageAsync(error, 'isFinalized', 'grader')) ?? 'The bulk action failed.');
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
  const numReleasable = submissions.filter(isReleasable).length;

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
    {
      label: `Release claimed submissions back to the queue (impacts ${numReleasable} submission${numReleasable > 1 ? 's' : ''})`,
      value: BULK_ACTION.Release,
      disabled: numReleasable === 0,
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
        {action === BULK_ACTION.Release && (
          <div style={{ marginTop: 10, color: 'rgba(0, 0, 0, 0.45)' }}>
            Unassigns the grader from every claimed, unfinalized submission so graders can Draw them again. Finalized
            submissions are not affected.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkSubmissionEdit;
