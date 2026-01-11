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
