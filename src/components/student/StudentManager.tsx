// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

import { USER_TYPE } from '../../types/common';
import { Course, Section, User } from '../../api-client';
import { Assignment } from '../../types/common';

import ComponentManager from '../core/ComponentManager';
import { CLIENT_URL } from '../../config';
import CPFlex from '../core/CPFlex';
import CPLogo from '../core/CPLogo';
import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';
import CourseMenu from '../core/CourseMenu';
import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';

import Student from './Student';
import StudentDashboard from './StudentDashboard';
import MobileStudentConsole from './MobileStudentConsole';
import useShowMobileConsole from '../core/useShowMobileConsole';

/**********************************************************************************************************************/

interface IStudentManagerProps {
  initialCourses: Course[];
  user: User;
  addAssignment: (assignment: Assignment) => void;
  deleteAssignment: (assignment: Assignment) => void;
  addCourse: (newCourse: Course) => void;
  superGraderCourses: Course[];
  sectionsLed: Section[];
  handleLogout: () => void;
  baseURL: string;
}

/** HOC-wrapped course view (uses ComponentManager for sub-routes) */
const CourseViewManager = ComponentManager(Student);

/** Top-level student router — dashboard at index, course views at /:name/:period */
const StudentManager: React.FC<IStudentManagerProps> = (props) => {
  const { initialCourses, user, handleLogout } = props;
  const showMobile = useShowMobileConsole();

  // On mobile, always show the mobile console regardless of route
  if (showMobile) {
    return (
      <MobileStudentConsole
        courses={initialCourses}
        userEmail={user.email!}
        studentSections={user.studentSections}
        user={user}
      />
    );
  }

  const openHome = () => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open(CLIENT_URL, '_blank');
    }
  };

  /* Dashboard index view (no course selected) */
  const dashboardElement = (
    <div id="Student">
      <CPLayoutAdmin
        header={
          <CPFlex
            left={[
              <CPLogo cpType="dark" key="logo" onClick={openHome} />,
              <span key="empty" />,
              <CourseMenu key="course" courses={initialCourses} currentCourse={undefined} base="student" />,
            ]}
            right={[
              <span key="user" className="cp-label cp-label--bold">
                {user.email}
              </span>,
              <Referral key="referral" user={user} theme="light" />,
              <RoleMenu key="roles" user={user} thisApp={USER_TYPE.STUDENT} theme="light" />,
              <Link className="internal-link" key="settings" to="/settings">
                <SettingOutlined />
              </Link>,
              <Button key="logout" onClick={handleLogout}>
                Log Out
              </Button>,
            ]}
            gutterSize={10}
          />
        }
        detail={
          <StudentDashboard courses={initialCourses} userEmail={user.email!} studentSections={user.studentSections} />
        }
        navigation={() => null}
        collapsible={true}
        hasSider={false}
        role={USER_TYPE.STUDENT}
      />
    </div>
  );

  return (
    <Routes>
      {/* Dashboard index */}
      <Route index element={dashboardElement} />

      {/* Course-specific views handled by ComponentManager (existing behavior) */}
      <Route path="*" element={<CourseViewManager {...props} />} />
    </Routes>
  );
};

export default StudentManager;
