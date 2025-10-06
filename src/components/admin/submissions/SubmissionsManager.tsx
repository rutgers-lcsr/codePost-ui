/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Route, Switch } from 'react-router-dom';

/* codePost imports */
import GraderData, { IByGraderProps } from './GraderSubmissions';
import StudentData, { IByStudentProps } from './StudentSubmissions';

/**********************************************************************************************************************/

type IProps = IByGraderProps & IByStudentProps;

const SubmissionsManager = (props: IProps & RouteComponentProps<{}>) => {
  return (
    <Switch>
      <Route
        path={`${props.match.url}/by_student`}
        render={(subprops: any) => <StudentData {...props} {...subprops} key="by_student" />}
      />
      <Route
        path={`${props.match.url}/by_grader`}
        render={(subprops: any) => <GraderData {...props} {...subprops} key="by_grader" />}
      />
    </Switch>
  );
};

export default SubmissionsManager;
