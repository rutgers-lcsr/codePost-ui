/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* other library imports */
import { Route, Routes } from 'react-router-dom';

/* codePost imports */
import ManageAdmins, { IManageAdminsProps } from './ManageAdmins';
import ManageGraders, { IManageGradersProps } from './ManageGraders';
import ManageSections, { IManageSectionsProps } from './ManageSections';
import ManageStudents, { IManageStudentsProps } from './ManageStudents';

/**********************************************************************************************************************/

type IProps = IManageStudentsProps & IManageGradersProps & IManageAdminsProps & IManageSectionsProps;

const RosterManager = (props: IProps) => {
  return (
    <Routes>
      <Route path="students" element={<ManageStudents {...props} key="students" />} />
      <Route path="graders" element={<ManageGraders {...props} key="graders" />} />
      <Route path="admins" element={<ManageAdmins {...props} key="admins" />} />
      <Route path="sections" element={<ManageSections {...props} key="sections" />} />
    </Routes>
  );
};

export default RosterManager;
