// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { Modal, Spin } from 'antd';

import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import { CodePostDate } from '../utils/CodepostDate';

import { AssignmentStudent } from '../../services/assignment';
import type { BeforeStudentUploadResponse } from '../../api-client';
import type { AssignmentStudentType } from '../../types/models';

interface ILateSubmissionModalProps {
  open: boolean;
  assignment: AssignmentStudentType;
  onOk: any;
  onCancel: any;
}

const LateSubmissionModal = (props: ILateSubmissionModalProps) => {
  const [studentUploadInformation, setStudentUploadInformation] = React.useState<BeforeStudentUploadResponse | null>(
    null,
  );

  let lateDayCreditsTemplate = '';

  if (
    studentUploadInformation !== null &&
    studentUploadInformation.lateDayCreditsAvailable !== undefined &&
    studentUploadInformation.lateDayCreditsToUse !== undefined &&
    studentUploadInformation.adjustedDaysLate !== undefined &&
    props.assignment.lateDeductions.length > 0
  ) {
    lateDayCreditsTemplate = `

You have ${studentUploadInformation.lateDayCreditsAvailable} unused late day credit${
      studentUploadInformation.lateDayCreditsAvailable === 1 ? '' : 's'
    } and **${studentUploadInformation.lateDayCreditsToUse} credit${
      studentUploadInformation.lateDayCreditsToUse === 1 ? '' : 's'
    } will be applied to this submission**. After the adjustment, the submission will be ${
      studentUploadInformation.adjustedDaysLate
    } day${studentUploadInformation.adjustedDaysLate === 1 ? '' : 's'} late.

`;
  }

  let penaltyTemplate = '';

  if (studentUploadInformation !== null && props.assignment.lateDeductions.length > 0) {
    if (studentUploadInformation.pointsOff === 0) {
      penaltyTemplate = 'No penalty will be applied to the submission.';
    } else {
      penaltyTemplate = `A penalty will be applied to the submission.`;
    }
  }

  const lateSubmissionTemplate =
    studentUploadInformation === null
      ? ''
      : `

-------

The due date has passed. **If you submit now or update an existing submission your submission will be ${
          studentUploadInformation.daysLate
        } day${studentUploadInformation.daysLate === 1 ? '' : 's'} late**. ${lateDayCreditsTemplate}

${penaltyTemplate}

Please see the course policy or contact your instructor if you have any questions.
`;

  const times =
    props.assignment.uploadDueDate === undefined || props.assignment.uploadDueDate === null ? null : (
      <div style={{ paddingBottom: '14px' }}>
        <table>
          <tbody>
            <tr>
              <td style={{ fontStyle: 'italic', fontWeight: 500 }}>Time Due:</td>
              <td>
                <CodePostDate datetime={props.assignment.uploadDueDate} />
              </td>
            </tr>
            <tr>
              <td style={{ fontStyle: 'italic', fontWeight: 500 }}>Time Now:</td>
              <td>
                <CodePostDate datetime={dayjs()} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );

  React.useEffect(() => {
    const getStudentUploadInformation = async () => {
      setStudentUploadInformation(null);
      const studentUploadInformation = await AssignmentStudent.beforeStudentUpload(props.assignment.id);
      setStudentUploadInformation(studentUploadInformation);
    };

    if (props.open) {
      getStudentUploadInformation();
    }
  }, [props.open, props.assignment.id]);

  let content;

  if (studentUploadInformation === null) {
    content = (
      <div>
        <Spin />
      </div>
    );
  } else {
    content = (
      <div className="markdown-table">
        {times}
        <ReactMarkdown>{lateSubmissionTemplate}</ReactMarkdown>
      </div>
    );
  }

  return (
    <Modal
      title="Confirm late submission"
      open={props.open}
      onOk={props.onOk}
      onCancel={props.onCancel}
      okText={'Continue'}
      destroyOnHidden={true}
    >
      {content}
    </Modal>
  );
};

export default LateSubmissionModal;
