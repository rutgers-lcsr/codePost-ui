import React, { useState } from 'react';

import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { CourseType } from '../../../../../infrastructure/course';
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

export const Tests = (props: IProps) => {
  const [detail, setDetail] = useState(DETAIL_TYPE.Summary);

  let content;
  switch (detail) {
    case DETAIL_TYPE.Edit:
      content = (
        <EditTests
          currentAssignment={props.activeAssignment}
          switchDetail={setDetail.bind({}, DETAIL_TYPE.Edit)}
          onCancel={props.onCancel}
          updateAssignment={props.updateAssignment}
        />
      );
      break;
    case DETAIL_TYPE.Summary:
      content = (
        <TestsSummary
          currentAssignment={props.activeAssignment}
          submissions={props.submissions}
          switchDetail={setDetail.bind({}, DETAIL_TYPE.Edit)}
          onCancel={props.onCancel}
        />
      );
  }

  return <div>{content}</div>;
};
