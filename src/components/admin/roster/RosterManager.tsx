/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* other library imports */
import { RouteComponentProps, LegacyRouteRenderer } from '../../../router/legacy';
import { Route, Routes } from 'react-router-dom';

/* codePost imports */
import ManageAdmins, { IManageAdminsProps } from './ManageAdmins';
import ManageGraders, { IManageGradersProps } from './ManageGraders';
import ManageSections, { IManageSectionsProps } from './ManageSections';
import ManageStudents, { IManageStudentsProps } from './ManageStudents';

/**********************************************************************************************************************/

type IProps = IManageStudentsProps & IManageGradersProps & IManageAdminsProps & IManageSectionsProps;

const RosterManager = (props: IProps & RouteComponentProps<{}>) => {
  return (
    <Routes>
      <Route
        path="students"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/students`}
            render={(subprops: any) => <ManageStudents {...props} {...subprops} key="students" />}
          />
        }
      />
      <Route
        path="graders"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/graders`}
            render={(subprops: any) => <ManageGraders {...props} {...subprops} key="graders" />}
          />
        }
      />
      <Route
        path="admins"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/admins`}
            render={(subprops: any) => <ManageAdmins {...props} {...subprops} key="admins" />}
          />
        }
      />
      <Route
        path="sections"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/sections`}
            render={(subprops: any) => <ManageSections {...props} {...subprops} key="sections" />}
          />
        }
      />
    </Routes>
  );
};

export default RosterManager;
