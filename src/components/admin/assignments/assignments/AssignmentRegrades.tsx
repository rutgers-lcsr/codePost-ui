import React, { useMemo } from 'react';

import { Breadcrumb } from 'antd';

import CPAdminDetail from '../../other/CPAdminDetail';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';
import { SubmissionType } from '../../../../infrastructure/submission';

import { UserType } from '../../../../infrastructure/user';

import RegradesTable from './AssignmentRegrades/RegradesTable';

import SendEmailModal from '../../other/SendEmailModal';

interface IAssignmentRegradesProps {
  /* assignment data */
  assignment: AssignmentType;
  currentCourse: CourseType;
  submissions: SubmissionType[];

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;
  onCancel: () => void;
  user: UserType;
  updateSubmission: (submission: SubmissionType) => Promise<void>;
}
const AssignmentRegrades = (props: IAssignmentRegradesProps) => {
  // *********************** STATE VARIABLES *************************

  const getOpenRegradeGraders = (submissions: SubmissionType[]) => {
    return submissions
      .filter((s) => s.questionIsOpen && s.grader)
      .map((s) => (s.questionResponder ? s.questionResponder : s.grader!));
  };
  const reminderEmails = useMemo(() => getOpenRegradeGraders(props.submissions), [props.submissions]);

  const remindGraders =
    reminderEmails.length > 0 ? (
      <SendEmailModal
        buttonText={'Remind graders'}
        title="Notify graders via email"
        template="regrades_reminder"
        course={props.currentCourse}
        assignment={props.assignment}
        me={props.user.email}
        emails={reminderEmails}
        body={
          <div>
            Notify graders of submissions with open regrades that they open regrades to be finished. If the question has
            already been claimed by a responder, the responder will be emailed. If not, the original grader of the
            submission will be emailed.{' '}
          </div>
        }
      />
    ) : null;

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item onClick={props.onCancel}>
            <a>Assignments</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{props.assignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item>Student Regrade Requests</Breadcrumb.Item>
        </Breadcrumb>
      }
      goBack={null}
      title={`${props.assignment.name} | Student Regrade Requests`}
      actions={[remindGraders]}
      content={
        <RegradesTable
          assignment={props.assignment}
          submissions={props.submissions}
          refreshCourseData={props.refreshCourseData}
          user={props.user}
          updateSubmission={props.updateSubmission}
          isAdmin={true}
        />
      }
    />
  );
};

export default AssignmentRegrades;
