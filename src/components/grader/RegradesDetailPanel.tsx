/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Breadcrumb, Switch } from 'antd';

import CPAdminDetail from '../admin/other/CPAdminDetail';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { AnonymousSubmissionInfoType, Submission } from '../../infrastructure/submission';
import { UserType } from '../../infrastructure/user';

import RegradesTable from '../admin/assignments/assignments/AssignmentRegrades/RegradesTable';

/**********************************************************************************************************************/

interface IProps {
  assignment: AssignmentType;
  user: UserType;
  isAnonymous: boolean;
  isAdmin: boolean;
  isSuperGrader: boolean;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

const RegradesDetailPanel = (props: IProps) => {
  const [submissions, setSubmissions] = useState<AnonymousSubmissionInfoType[]>([]);
  const [showStudentEmails, setShowStudentEmails] = useState(!props.isAnonymous);
  const [isLoading, setLoading] = useState(false);
  const [viewAll, setViewAll] = useState(false);

  const loadMySubmissions = async (currentAssignment: AssignmentType, user: string) => {
    const newSubmissions = await Assignment.readSubmissionsAnonymous(currentAssignment.id, {
      grader: user,
      ['compact']: '1',
    });
    setSubmissions(newSubmissions);
    setLoading(false);
    return;
  };

  const loadAllSubmissions = async (currentAssignment: AssignmentType) => {
    const newSubmissions = await Assignment.readSubmissionsAnonymous(currentAssignment.id, { ['compact']: '1' });
    setSubmissions(newSubmissions);
    setLoading(false);
    return;
  };

  const refreshSubmissions = () => {
    setLoading(true);
    viewAll ? loadAllSubmissions(props.assignment) : loadMySubmissions(props.assignment, props.user.email);
  };

  const updateSubmission = (toUpdate: AnonymousSubmissionInfoType) => {
    /* Make sure we are acting on a submission linked to this course */
    const oldSubmission = submissions.find((el) => {
      return el.id === toUpdate.id;
    });

    if (oldSubmission === undefined) {
      return Promise.reject('Submission does not exist');
    }

    return Submission.updateAnonymousInfo(toUpdate).then((updated) => {
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

  // Update submission if assignment changes or viewAll is triggered
  useEffect(() => {
    refreshSubmissions();
    // Really, refreshSubmissions() should implement React.useCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.assignment, viewAll]);

  // Filtering for relevant submissions to only show the 'reveal students` button if there are non-zero regrades
  const regradeSubmissions = submissions.filter((submission) => {
    return (
      submission.questionIsOpen ||
      submission.questionText ||
      submission.questionResponder ||
      submission.questionResponse
    );
  });

  const revealStudents =
    props.isAnonymous && regradeSubmissions.length > 0 && typeof regradeSubmissions[0].students !== 'undefined' ? (
      <div>
        <div style={{ display: 'inline-block' }}>
          Reveal students: &nbsp;
          <Switch
            defaultChecked={showStudentEmails}
            onChange={setShowStudentEmails.bind({}, !showStudentEmails)}
            key="toggleShowStudents"
            style={{ display: 'inline-block' }}
            disabled={isLoading}
          />
        </div>
      </div>
    ) : (
      <div />
    );

  const showAllRegrades =
    props.isAdmin || props.isSuperGrader ? (
      <div>
        <div style={{ display: 'inline-block', marginLeft: 15 }}>
          View all regrades: &nbsp;
          <Switch
            aria-label={!viewAll ? 'View all regrade requests' : 'View my regrade requests only'}
            defaultChecked={viewAll}
            onChange={setViewAll.bind(!viewAll)}
            key="toggleViewAll"
            style={{ display: 'inline-block' }}
            disabled={isLoading}
          />
        </div>
      </div>
    ) : (
      <div />
    );

  const actions = [revealStudents, showAllRegrades];

  const content = (
    <div>
      <RegradesTable
        assignment={props.assignment}
        submissions={submissions}
        refreshCourseData={refreshSubmissions}
        user={props.user}
        updateSubmission={updateSubmission}
        isLoading={isLoading}
        isAnonymous={!showStudentEmails}
        isAdmin={props.isAdmin}
      />
    </div>
  );

  return (
    <CPAdminDetail
      breadcrumbs={<Breadcrumb items={[...props.breadcrumbs, { title: props.assignment.name }]} />}
      goBack={null}
      title={<div>{`Regrade Requests: ${props.assignment.name}`}</div>}
      titleInfo={'Quesitons or regrade requests from submissions that you have graded.'}
      actions={actions}
      content={content}
      gutterSize={0}
    />
  );
};

export default RegradesDetailPanel;
