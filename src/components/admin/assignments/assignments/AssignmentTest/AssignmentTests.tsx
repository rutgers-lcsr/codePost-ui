/* react imports */
import React, { useEffect, useState } from 'react';

/* codePost object imports */
import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { UserType } from '../../../../../infrastructure/user';

/* codePost component imports */
import { TestingSetup } from './TestingSetup';
import { TestingSummary } from './TestingSummary';

enum DETAIL_TYPE {
  SetUp,
  Summary,
}

interface IProps {
  activeAssignment: AssignmentType;
  submissions: SubmissionType[];
  onCancel: () => void;
  user: UserType;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

export const AssignmentTests = (props: IProps) => {
  // ************************** State Variables ******************************
  const [detail, setDetail] = useState(DETAIL_TYPE.Summary);
  const [assignment, setAssignment] = useState(props.activeAssignment);

  // ************************** Fetch data ******************************
  useEffect(() => {
    // We want to make sure we have the latest assignment information (test language, test categories)
    const fetchData = async () => {
      const updatedAssignment = await Assignment.read(props.activeAssignment.id);
      setAssignment(updatedAssignment);
    };
    fetchData();
  }, [props.activeAssignment]);

  // ***************** API / State change functions ***********************
  const updateAssignment = async (patchObj: AssignmentPatchType) => {
    const newAssignment = await Assignment.update(patchObj);
    setAssignment(newAssignment);
  };

  // ************************ Return ************************************
  let content;
  switch (detail) {
    case DETAIL_TYPE.SetUp:
      content = (
        <TestingSetup
          currentAssignment={assignment}
          switchDetail={setDetail.bind({}, DETAIL_TYPE.SetUp)}
          onCancel={props.onCancel}
          submissions={props.submissions}
          updateAssignment={updateAssignment}
        />
      );
      break;
    case DETAIL_TYPE.Summary:
      content = (
        <TestingSummary
          currentAssignment={assignment}
          submissions={props.submissions}
          switchDetail={setDetail.bind({}, DETAIL_TYPE.SetUp)}
          onCancel={props.onCancel}
        />
      );
  }

  return <div>{content}</div>;
};
