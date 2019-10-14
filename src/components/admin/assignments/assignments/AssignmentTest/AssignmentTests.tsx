import React, { useEffect, useState } from 'react';

import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { UserType } from '../../../../../infrastructure/user';

import { EditTests } from './EditTests';
import { TestsSummary } from './TestsSummary';

enum DETAIL_TYPE {
  Edit,
  Summary,
}

interface IProps {
  /* assignment data */
  activeAssignment: AssignmentType;
  submissions: SubmissionType[];

  onCancel: () => void;
  user: UserType;

  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

export const AssignmentTests = (props: IProps) => {
  const [detail, setDetail] = useState(DETAIL_TYPE.Summary);
  const [assignment, setAssignment] = useState(props.activeAssignment);

  useEffect(() => {
    const fetchData = async () => {
      const updatedAssignment = await Assignment.read(props.activeAssignment.id);
      setAssignment(updatedAssignment);
    };
    fetchData();
  }, [props.activeAssignment]);

  const updateAssignment = async (patchObj: AssignmentPatchType) => {
    const newAssignment = await Assignment.update(patchObj);
    setAssignment(newAssignment);
  };

  let content;
  switch (detail) {
    case DETAIL_TYPE.Edit:
      content = (
        <EditTests
          currentAssignment={assignment}
          switchDetail={setDetail.bind({}, DETAIL_TYPE.Edit)}
          onCancel={props.onCancel}
          updateAssignment={updateAssignment}
        />
      );
      break;
    case DETAIL_TYPE.Summary:
      content = (
        <TestsSummary
          currentAssignment={assignment}
          submissions={props.submissions}
          switchDetail={setDetail.bind({}, DETAIL_TYPE.Edit)}
          onCancel={props.onCancel}
        />
      );
  }

  return <div>{content}</div>;
};
