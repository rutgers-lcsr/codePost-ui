// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* other library imports */
import { Route, Routes } from 'react-router-dom';

/* codePost imports */
import GraderData, { IByGraderProps } from './GraderSubmissions';
import StudentData, { IByStudentProps } from './StudentSubmissions';

/**********************************************************************************************************************/

type IProps = IByGraderProps & IByStudentProps;

const SubmissionsManager: React.FC<IProps> = (props) => {
  return (
    <Routes>
      <Route path="by_student/*" element={<StudentData {...props} key="by_student" />} />
      <Route path="by_grader/*" element={<GraderData {...props} key="by_grader" />} />
    </Routes>
  );
};

export default SubmissionsManager;
