import * as React from 'react';

import { Modal, Spin } from 'antd';

import {
  AssignmentStudent,
  AssignmentStudentType,
  StudentUploadInformationType,
} from '../../infrastructure/assignment';

interface ILateSubmissionModalProps {
  visible: boolean;
  assignment: AssignmentStudentType;
  onOk: any;
  onCancel: any;
}

const LateSubmissionModal = (props: ILateSubmissionModalProps) => {
  const [studentUploadInformation, setStudentUploadInformation] = React.useState<StudentUploadInformationType | null>(
    null,
  );

  React.useEffect(() => {
    const getStudentUploadInformation = async () => {
      setStudentUploadInformation(null);
      const studentUploadInformation = await AssignmentStudent.beforeStudentUpload(props.assignment.id);
      setStudentUploadInformation(studentUploadInformation);
    };

    getStudentUploadInformation();
  }, []);

  const content =
    studentUploadInformation === null ? (
      <div>
        We are loading.... <Spin />
      </div>
    ) : (
      <div>Finished loading {studentUploadInformation.daysLate}</div>
    );

  return (
    <Modal
      title="Confirm late submission"
      visible={props.visible}
      onOk={props.onOk}
      onCancel={props.onCancel}
      okText={'Continue'}
      destroyOnClose={true}
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
    >
      {content}
    </Modal>
  );
};

export default LateSubmissionModal;
