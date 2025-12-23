/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* other library imports */
import { useNavigate, useLocation, useParams, Route, Routes } from 'react-router-dom';

/* codePost imports */
import ManageAdmins, { IManageAdminsProps } from './ManageAdmins';
import ManageGraders, { IManageGradersProps } from './ManageGraders';
import ManageSections, { IManageSectionsProps } from './ManageSections';
import ManageStudents, { IManageStudentsProps } from './ManageStudents';

/**********************************************************************************************************************/

type IProps = IManageStudentsProps & IManageGradersProps & IManageAdminsProps & IManageSectionsProps;

const RoutePropsWrapper = ({ render }: { render: (props: any) => React.ReactElement }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Mock match and history
  const match = { params, url: location.pathname, path: location.pathname, isExact: true };
  const history = {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    go: (n: number) => navigate(n),
    goBack: () => navigate(-1),
    goForward: () => navigate(1),
    location,
  } as any;

  return render({ match, location, history });
};

const RosterManager = (props: IProps) => {
  return (
    <Routes>
      <Route
        path="students"
        element={
          <RoutePropsWrapper
            render={(subprops: any) => <ManageStudents {...props} {...subprops} key="students" />}
          />
        }
      />
      <Route
        path="graders"
        element={
          <RoutePropsWrapper
            render={(subprops: any) => <ManageGraders {...props} {...subprops} key="graders" />}
          />
        }
      />
      <Route
        path="admins"
        element={
          <RoutePropsWrapper
            render={(subprops: any) => <ManageAdmins {...props} {...subprops} key="admins" />}
          />
        }
      />
      <Route
        path="sections"
        element={
          <RoutePropsWrapper
            render={(subprops: any) => <ManageSections {...props} {...subprops} key="sections" />}
          />
        }
      />
    </Routes>
  );
};

export default RosterManager;
