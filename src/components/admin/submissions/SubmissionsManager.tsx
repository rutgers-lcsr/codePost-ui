/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* other library imports */
import { Route, Routes } from 'react-router-dom';

import { LegacyRouteRenderer, RouteComponentProps } from '../../../router/legacy';

/* codePost imports */
import GraderData, { IByGraderProps } from './GraderSubmissions';
import StudentData, { IByStudentProps } from './StudentSubmissions';

/**********************************************************************************************************************/

type IProps = IByGraderProps & IByStudentProps;

const SubmissionsManager: React.FC<IProps & RouteComponentProps> = (props) => {
  const { match } = props;

  return (
    <Routes>
      <Route
        path="by_student/*"
        element={
          <LegacyRouteRenderer
            path={`${match.url}/by_student/*`}
            render={(subprops: RouteComponentProps) => <StudentData {...props} {...subprops} key="by_student" />}
          />
        }
      />
      <Route
        path="by_grader/*"
        element={
          <LegacyRouteRenderer
            path={`${match.url}/by_grader/*`}
            render={(subprops: RouteComponentProps) => <GraderData {...props} {...subprops} key="by_grader" />}
          />
        }
      />
    </Routes>
  );
};

export default SubmissionsManager;
