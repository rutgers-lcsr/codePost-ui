/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Route, Switch } from 'react-router-dom';

/* codePost imports */
import ManageStudents, { IManageStudentsProps } from './ManageStudents';
import ManageGraders, { IManageGradersProps } from './ManageGraders';
import ManageAdmins, { IManageAdminsProps } from './ManageAdmins';
import ManageSections, { IManageSectionsProps } from './ManageSections';

/**********************************************************************************************************************/

type IProps = IManageStudentsProps & IManageGradersProps & IManageAdminsProps & IManageSectionsProps;

const RosterManager = (props: IProps & RouteComponentProps<{}>) => {
  return (
    <Switch>
      <Route
        path={`${props.match.url}/students`}
        render={(subprops: any) => <ManageStudents {...props} {...subprops} key="students" />}
      />
      <Route
        path={`${props.match.url}/graders`}
        render={(subprops: any) => <ManageGraders {...props} {...subprops} key="graders" />}
      />
      <Route
        path={`${props.match.url}/admins`}
        render={(subprops: any) => <ManageAdmins {...props} {...subprops} key="admins" />}
      />
      <Route
        path={`${props.match.url}/sections`}
        render={(subprops: any) => <ManageSections {...props} {...subprops} key="sections" />}
      />
    </Switch>
  );
};

export default RosterManager;
