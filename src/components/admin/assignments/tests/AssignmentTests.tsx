// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* antd imports */

/* other library imports */
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

/* codePost object imports */
import { assignmentsApi } from '../../../../api-client/clients';
import { AssignmentType, SubmissionInfoType, UserType } from '../../../../types/models';
import { assignmentKeys } from '../../../../lib/queryKeys';

/* codePost component imports */
import { TestingSetup } from './edit/TestingSetup';
import { TestingSummary } from './results/TestingSummary';

/**********************************************************************************************************************/

interface IProps {
  activeAssignment: AssignmentType;
  submissions: SubmissionInfoType[];
  user: UserType;
  updateAssignment: (assignmentID: number, field: string, value: number) => void;
  breadcrumbs?: { title: React.ReactNode }[];
  fullSubmissionsLoadComplete: boolean;
}

export const AssignmentTests = (props: IProps) => {
  const location = useLocation();

  // Fetch the latest assignment data to ensure test language/categories are current
  const { data: fetchedAssignment } = useQuery({
    queryKey: assignmentKeys.detail(props.activeAssignment.id),
    queryFn: async () => {
      const result = await assignmentsApi.retrieve({ id: props.activeAssignment.id });
      return result as unknown as AssignmentType;
    },
    initialData: props.activeAssignment,
  });

  const assignment = fetchedAssignment;

  // ***************** API / State change functions ***********************

  // Get base URL for Environment Setup link (remove assignment name from path)
  const baseUrl = location.pathname.split('/').slice(0, -1).join('/');

  const breadcrumbs = [
    ...(props.breadcrumbs ? props.breadcrumbs : []),
    {
      title: <Link to={baseUrl}>Environment & Tests</Link>,
    },
  ];

  // ************************ Return ************************************
  return (
    <Routes>
      <Route
        path="edit/:tabKey"
        element={
          <TestingSetup
            breadcrumbs={breadcrumbs}
            currentAssignment={assignment}
            submissions={props.submissions}
            updateAssignment={props.updateAssignment}
            user={props.user}
          />
        }
      />
      <Route
        path="edit"
        element={
          <TestingSetup
            breadcrumbs={breadcrumbs}
            currentAssignment={assignment}
            submissions={props.submissions}
            updateAssignment={props.updateAssignment}
            user={props.user}
          />
        }
      />

      <Route
        path="results"
        element={
          <TestingSummary
            breadcrumbs={breadcrumbs}
            currentAssignment={assignment}
            submissions={props.submissions}
            tableOnly={false}
            fullSubmissionsLoadComplete={props.fullSubmissionsLoadComplete}
          />
        }
      />
      <Route index element={<Navigate to="edit" replace />} />
    </Routes>
  );
};
