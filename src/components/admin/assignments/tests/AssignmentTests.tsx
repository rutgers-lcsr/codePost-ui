/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */

/* other library imports */
import { Link, Navigate } from 'react-router-dom';

/* other library imports */
import { RouteComponentProps } from '../../../../router/legacy';
import { Route, Routes } from 'react-router-dom';

import { LegacyRouteRenderer } from '../../../../router/legacy';

/* codePost object imports */
import { Assignment, AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionInfoType } from '../../../../infrastructure/submission';
import { UserType } from '../../../../infrastructure/user';

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

export const AssignmentTests = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
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

  const breadcrumbs = [
    ...(props.breadcrumbs ? props.breadcrumbs : []),
    {
      title: (
        <Link
          to={props.match.url
            .split('/')
            .slice(0, props.match.url.split('/').length - 1)
            .join('/')}
        >
          Tests
        </Link>
      ),
    },
  ];

  // ************************ Return ************************************
  return (
    <Routes>
      <Route
        path="edit/:tabKey"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/edit/:tabKey`}
            end
            render={(subprops: RouteComponentProps) => (
              <TestingSetup
                {...subprops}
                breadcrumbs={breadcrumbs}
                currentAssignment={assignment}
                submissions={props.submissions}
                updateAssignment={props.updateAssignment}
              />
            )}
          />
        }
      />
      <Route
        path="edit"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/edit`}
            end
            render={(subprops: RouteComponentProps) => (
              <TestingSetup
                {...subprops}
                breadcrumbs={breadcrumbs}
                currentAssignment={assignment}
                submissions={props.submissions}
                updateAssignment={props.updateAssignment}
              />
            )}
          />
        }
      />

      <Route
        path="results"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/results`}
            end
            render={(subprops: RouteComponentProps) => (
              <TestingSummary
                {...props}
                {...subprops}
                breadcrumbs={breadcrumbs}
                currentAssignment={assignment}
                submissions={props.submissions}
                isAdmin={true}
                tableOnly={false}
              />
            )}
          />
        }
      />
      <Route index element={<Navigate to="edit" replace />} />
    </Routes>
  );
};
