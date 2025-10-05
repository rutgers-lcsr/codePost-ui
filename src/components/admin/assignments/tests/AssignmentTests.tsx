/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */

/* other library imports */
import { Link } from 'react-router-dom';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Route, Switch } from 'react-router-dom';

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
  breadcrumbs?: React.ReactElement[];
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
    <Switch>
      <Route
        path={`${props.match.url}/edit/:tabKey`}
        render={(subprops: any) => (
          <TestingSetup
            {...subprops}
            breadcrumbs={breadcrumbs}
            currentAssignment={assignment}
            submissions={props.submissions}
            updateAssignment={props.updateAssignment}
          />
        )}
      />
      <Route
        path={`${props.match.url}/edit`}
        render={(subprops: any) => (
          <TestingSetup
            {...subprops}
            breadcrumbs={breadcrumbs}
            currentAssignment={assignment}
            submissions={props.submissions}
            updateAssignment={props.updateAssignment}
          />
        )}
      />

      <Route
        path={`${props.match.url}/results`}
        render={(subprops: any) => (
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
    </Switch>
  );
};
