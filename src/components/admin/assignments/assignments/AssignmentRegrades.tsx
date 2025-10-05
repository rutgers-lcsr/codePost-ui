import React, { useMemo } from 'react';

import { Breadcrumb } from 'antd';

import CPAdminDetail from '../../other/CPAdminDetail';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';
import { SubmissionInfoType } from '../../../../infrastructure/submission';

import { UserType } from '../../../../infrastructure/user';

import RegradesTable from './AssignmentRegrades/RegradesTable';

import SendEmailModal from '../../other/SendEmailModal';

interface IAssignmentRegradesProps {
  /* assignment data */
  assignment: AssignmentType;
  currentCourse: CourseType;
  submissions: SubmissionInfoType[];

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;
  onCancel: () => void;
  user: UserType;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

const AssignmentRegrades = (props: IAssignmentRegradesProps) => {
  // *********************** STATE VARIABLES *************************

  const getOpenRegradeGraders = (submissions: SubmissionInfoType[]) => {
    return submissions
      .filter((s) => s.questionIsOpen && s.grader && (!s.questionResponder || s.grader === s.questionResponder))
      .map((s) => s.grader!);
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
        body={<div>Notify graders of submissions with unclaimed or unfinished regrades. </div>}
      />
    ) : null;

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb
          items={[...props.breadcrumbs, { title: props.assignment.name }, { title: 'Student Regrade Requests' }]}
        />
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
