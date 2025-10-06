/* react imports */
import { useState } from 'react';

/* ant imports */
import { Alert, message, Modal, Radio } from 'antd';

/* codePost imports */

import { AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionInfoType } from '../../../../infrastructure/submission';

import { CourseType } from '../../../../infrastructure/course';

export interface IProps {
  activeAssignment: AssignmentType;
  submissions: SubmissionInfoType[];
  currentCourse: CourseType;
  onCancel: () => void;
  myEmail: string;
  bulkUpdateSubmissions: (assignmentID: number, getPayload: (sub: SubmissionInfoType) => any) => Promise<void>;
}

enum BULK_ACTION {
  Finalize,
  Unfinalize,
}

const BulkSubmissionEdit = (props: IProps) => {
  const [action, setAction] = useState(BULK_ACTION.Finalize);
  const [executing, setExecuting] = useState(false);

  // ********************************** Bulk edit functions ****************************************

  const execute = async () => {
    switch (action) {
      case BULK_ACTION.Finalize:
        return await editFinalized(true);
      case BULK_ACTION.Unfinalize:
        return await editFinalized(false);
    }
  };

  const editFinalized = async (isFinalized: boolean) => {
    const getPayload = (sub: SubmissionInfoType) => {
      let payload: any = { id: sub.id, isFinalized: isFinalized };
      if (isFinalized && !sub.grader) {
        // If finalizing and no grader is set, set a grader
        payload = { ...payload, grader: props.myEmail };
      }
      return payload;
    };
    return await props.bulkUpdateSubmissions(props.activeAssignment.id, getPayload);
  };

  // ********************************** Helpers ****************************************
  const getNumAffected = () => {
    switch (action) {
      case BULK_ACTION.Finalize:
        return props.submissions.filter((s) => !s.isFinalized).length;
      case BULK_ACTION.Unfinalize:
        return props.submissions.filter((s) => s.isFinalized).length;
    }
  };

  const onSubmit = () => {
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
        execute().then(() => {
          setExecuting(false);
          message.success('Action completed!');
        });
      },
      onCancel() {
        return;
      },
    });
  };

  const onChange = (e: any) => {
    setAction(e.target.value);
  };
  // ********************************** RENDER ****************************************

  const numFinalized = props.submissions.filter((s) => s.isFinalized).length;
  const numUnfinalized = props.submissions.length - numFinalized;

  const radioStyle = {
    display: 'block',
    height: '35px',
    lineHeight: '35px',
  };
  return (
    <Modal
      visible={true}
      width={550}
      title={'Bulk edit submissions'}
      okText="Execute"
      onCancel={props.onCancel}
      onOk={onSubmit}
      okButtonProps={{ loading: executing }}
    >
      <Alert
        type="warning"
        style={{ marginBottom: 15 }}
        message={
          <div>
            <b>WARNING:</b> Performing bulk actions on submissions cannot be undone.
          </div>
        }
      />
      <div>
        <div style={{ fontSize: 16, marginBottom: 10, marginTop: 30 }}>Choose an action to perform: </div>
        <Radio.Group style={{ paddingLeft: 20 }}>
          <Radio.Group onChange={onChange} value={action}>
            <Radio style={radioStyle} value={BULK_ACTION.Finalize} disabled={numUnfinalized === 0}>
              <b>Finalize</b> all submissions (impacts {numUnfinalized} submission{numUnfinalized > 1 ? 's' : ''})
            </Radio>
            <Radio style={radioStyle} value={BULK_ACTION.Unfinalize} disabled={numFinalized === 0}>
              <b>Unfinalize</b> all submission (impacts {numFinalized} submission{numFinalized > 1 ? 's' : ''})
            </Radio>
          </Radio.Group>
        </Radio.Group>
      </div>
    </Modal>
  );
};

export default BulkSubmissionEdit;
