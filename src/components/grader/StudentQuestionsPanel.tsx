/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Divider, Switch } from 'antd';

import CPAdminDetail from '../admin/other/CPAdminDetail';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { AnonymousSubmissionType, Submission } from '../../infrastructure/submission';
import { UserType } from '../../infrastructure/user';

import StudentQuestionsTable from '../admin/assignments/assignments/StudentQuestions/StudentQuestionsTable';

/**********************************************************************************************************************/

interface IProps {
  assignment: AssignmentType;
  user: UserType;
  isAnonymous: boolean;
  isAdmin: boolean;
}

const StudentQuestionsPanel = (props: IProps) => {
  const [submissions, setSubmissions] = useState<AnonymousSubmissionType[]>([]);
  const [showStudentEmails, setShowStudentEmails] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const loadSubmissions = async (currentAssignment: AssignmentType, user: string) => {
    const newSubmissions = await Assignment.readSubmissionsAnonymous(currentAssignment.id, {
      grader: user,
    });
    setSubmissions(newSubmissions);
    return;
  };

  const refreshSubmissions = () => {
    loadSubmissions(props.assignment, props.user.email);
    return;
  };

  const changeAssignment = (newAssignment: AssignmentType) => {
    setLoading(true);
    loadSubmissions(newAssignment, props.user.email).then(() => {
      setLoading(false);
    });
  };

  const updateSubmission = (toUpdate: AnonymousSubmissionType) => {
    /* Make sure we are acting on a submission linked to this course */
    const oldSubmission = submissions.find((el) => {
      return el.id === toUpdate.id;
    });

    if (oldSubmission === undefined) {
      return Promise.reject('Submission does not exist');
    }

    return Submission.update(toUpdate).then((updated) => {
      /* use return value to replace existing submission */
      const newSubmissions = [
        ...submissions.filter((s) => {
          return s.id !== updated.id;
        }),
        updated,
      ];

      setSubmissions(newSubmissions);
    });
  };

  useEffect(
    () => {
      changeAssignment(props.assignment);
    },
    [props.assignment],
  );

  const revealStudents =
    props.isAnonymous && props.isAdmin ? (
      <div>
        <div style={{ display: 'inline-block' }}>
          Reveal students: &nbsp;
          <Switch
            defaultChecked={showStudentEmails}
            onChange={setShowStudentEmails.bind({}, !showStudentEmails)}
            key="toggleShowStudents"
            style={{ display: 'inline-block' }}
          />
        </div>
        <Divider type="vertical" style={{ height: 25 }} />
      </div>
    ) : (
      <div />
    );

  const content = (
    <div>
      {revealStudents}
      <StudentQuestionsTable
        assignment={props.assignment}
        submissions={submissions}
        refreshCourseData={refreshSubmissions}
        user={props.user}
        updateSubmission={updateSubmission}
        isLoading={isLoading}
        isAnonymous={!showStudentEmails}
      />
    </div>
  );

  return (
    <CPAdminDetail
      goBack={null}
      title={<div>{`Student questions: ${props.assignment.name}`}</div>}
      titleInfo={'Quesitons or regrade requests from submissions that you have graded.'}
      actions={[]}
      content={content}
      gutterSize={0}
    />
  );
};

export default StudentQuestionsPanel;
