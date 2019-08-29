import React from 'react';

import { Breadcrumb } from 'antd';

import CPAdminDetail from '../../other/CPAdminDetail';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../infrastructure/submission';

import { UserType } from '../../../../infrastructure/user';

import StudentQuestionsTable from './StudentQuestions/StudentQuestionsTable';

interface IStudentQuestionsProps {
  /* assignment data */
  assignment: AssignmentType;
  submissions: SubmissionType[];

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;
  onCancel: () => void;
  user: UserType;
  updateSubmission: (submission: SubmissionType) => Promise<void>;
}
const AssignmentStudentQuestions = (props: IStudentQuestionsProps) => {
  // *********************** STATE VARIABLES *************************

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item onClick={props.onCancel}>
            <a>Assignments</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{props.assignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item>
            `Student Questions${props.assignment.allowRegradeRequests ? ' and Regrade Requests' : ''}`
          </Breadcrumb.Item>
        </Breadcrumb>
      }
      goBack={null}
      title={`${props.assignment.name} | Student Questions${
        props.assignment.allowRegradeRequests ? ' and Regrade Requests' : ''
      }`}
      actions={[]}
      content={
        <StudentQuestionsTable
          assignment={props.assignment}
          submissions={props.submissions}
          refreshCourseData={props.refreshCourseData}
          user={props.user}
          updateSubmission={props.updateSubmission}
        />
      }
    />
  );
};

export default AssignmentStudentQuestions;
