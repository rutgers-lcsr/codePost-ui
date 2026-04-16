// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* antd imports */
import { Breadcrumb, Switch } from 'antd';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import CPAdminDetail from '../admin/other/CPAdminDetail';

/* codePost imports */
import { assignmentsApi } from '../../api-client/clients';
import { submissionsApi } from '../../api-client/clients';
import { Assignment } from '../../types/common';
import { AnonymousSubmissionInfoType, AssignmentType, UserType } from '../../types/models';

import RegradesTable from '../admin/assignments/assignments/AssignmentRegrades/RegradesTable';
import { useCourseCapabilities } from '../../stores/usePermissionsStore';
import { assignmentKeys } from '../../lib/queryKeys';

/**********************************************************************************************************************/

interface IProps {
  assignment: AssignmentType;
  user: UserType;
  isAnonymous: boolean;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

const RegradesDetailPanel = (props: IProps) => {
  const [showStudentEmails, setShowStudentEmails] = useState(!props.isAnonymous);
  const [viewAll, setViewAll] = useState(false);
  const courseCaps = useCourseCapabilities(props.assignment.course);
  const canManageRegrades = !!courseCaps.manage_regrades;
  const queryClient = useQueryClient();

  const queryKey = assignmentKeys.regradeSubmissions(props.assignment.id, viewAll ? undefined : props.user.email!);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: { id: number; compact: string; grader?: string } = {
        id: props.assignment.id,
        compact: '1',
      };
      if (!viewAll) {
        params.grader = props.user.email!;
      }
      const response = await assignmentsApi.submissionsListRaw(params);
      const data = await response.raw.json();
      return (Array.isArray(data) ? data : (data?.results ?? [])) as AnonymousSubmissionInfoType[];
    },
  });

  const refreshSubmissions = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const updateSubmission = (toUpdate: AnonymousSubmissionInfoType) => {
    /* Make sure we are acting on a submission linked to this course */
    const oldSubmission = submissions.find((el) => {
      return el.id === toUpdate.id;
    });

    if (oldSubmission === undefined) {
      return Promise.reject('Submission does not exist');
    }

    return submissionsApi.partialUpdate({ id: toUpdate.id, patchedSubmission: toUpdate }).then((updated) => {
      /* use return value to replace existing submission */
      queryClient.setQueryData(queryKey, (old: AnonymousSubmissionInfoType[] | undefined) =>
        (old ?? []).map((s) => (s.id === updated.id ? updated : s)),
      );
    });
  };

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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span>Reveal students:</span>
          <Switch
            defaultChecked={showStudentEmails}
            onChange={setShowStudentEmails.bind({}, !showStudentEmails)}
            key="toggleShowStudents"
            disabled={isLoading}
          />
        </div>
      </div>
    ) : (
      <div />
    );

  const showAllRegrades = canManageRegrades ? (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>View all regrades:</span>
        <Switch
          aria-label={!viewAll ? 'View all regrade requests' : 'View my regrade requests only'}
          defaultChecked={viewAll}
          onChange={setViewAll.bind(!viewAll)}
          key="toggleViewAll"
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
        assignment={props.assignment as unknown as Assignment}
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
      breadcrumbs={<Breadcrumb items={[...props.breadcrumbs, { title: props.assignment.name }]} />}
      goBack={null}
      title={<div style={{ letterSpacing: '-0.3px' }}>{`Regrade Requests: ${props.assignment.name}`}</div>}
      titleInfo={'Questions or regrade requests from submissions that you have graded.'}
      actions={actions}
      content={content}
      gutterSize={0}
    />
  );
};

export default RegradesDetailPanel;
