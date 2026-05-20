// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

/* codePost imports */
import { USER_TYPE } from '../../types/common';
import { Course, Section, User } from '../../api-client';
import { Assignment } from '../../types/common';

import ComponentManager from '../core/ComponentManager';
import CPFlex from '../core/CPFlex';
import CPLayoutAdmin from './other/CPLayoutAdmin';
import CourseMenu from '../core/CourseMenu';
import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';

import Admin from './Admin';
import AdminDashboard from './AdminDashboard';
import MobileAdminConsole from './MobileAdminConsole';
import useShowMobileConsole from '../core/useShowMobileConsole';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import { encodeForLink } from '../core/URLutils';

/**********************************************************************************************************************/

interface IAdminManagerProps {
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

/** HOC-wrapped course view (uses ComponentManager for course-specific sub-routes) */
const AdminCourseRouter = ComponentManager(Admin, 'assignments/overview');

/** Renders dashboard or redirects to stored course */
const AdminDashboardOrRedirect: React.FC<IAdminManagerProps> = (props) => {
  const { initialCourses, user, handleLogout } = props;
  const showMobile = useShowMobileConsole();

  // If a stored course exists and is in the list, redirect to it
  const storedID = LOCAL_SETTINGS.defaultCourse.getter();
  if (storedID !== 0) {
    const found = initialCourses.find((course) => course.id === storedID);
    if (found) {
      return (
        <Navigate
          to={`/admin/${encodeForLink(found.name)}/${encodeForLink(found.period)}/assignments/overview`}
          replace
        />
      );
    }
  }

  // If courses exist but no stored course, pick the most recently created
  if (initialCourses.length > 0 && storedID === 0) {
    // Show dashboard — storedID is 0 (cleared or first visit)
  } else if (initialCourses.length === 0) {
    // No courses — let ComponentManager handle onboarding via Admin
    return <AdminCourseRouter {...props} />;
  }

  // Render the dashboard
  if (showMobile) {
    return <MobileAdminConsole courses={initialCourses} userEmail={user.email!} user={user} />;
  }

  const header = (
    <CPFlex
      left={[<CourseMenu key="course" courses={initialCourses} currentCourse={undefined} base="admin" />]}
      right={[
        <span key="header-user" className="cp-label cp-label--bold">
          {user.email}
        </span>,
        <Referral key="referral" user={user} theme="light" />,
        <RoleMenu key="header-roles" user={user} thisApp={USER_TYPE.ADMIN} theme="light" />,
        <Link className="internal-link" key="settings" to="/settings">
          <SettingOutlined />
        </Link>,
        <Button key="header-logout" onClick={handleLogout}>
          Logout
        </Button>,
      ]}
      gutterSize={10}
    />
  );

  return (
    <div id="Admin">
      <CPLayoutAdmin
        header={header}
        detail={<AdminDashboard courses={initialCourses} userEmail={user.email!} />}
        navigation={() => null}
        hasSider={false}
        role={USER_TYPE.ADMIN}
      />
    </div>
  );
};

/** Top-level admin router — dashboard at index, course views at /:name/:period */
const AdminManager: React.FC<IAdminManagerProps> = (props) => {
  const { initialCourses, user } = props;
  const showMobile = useShowMobileConsole();

  // On mobile, always show the mobile console regardless of route
  if (showMobile) {
    return <MobileAdminConsole courses={initialCourses} userEmail={user.email!} user={user} />;
  }

  return (
    <Routes>
      {/* Dashboard index */}
      <Route index element={<AdminDashboardOrRedirect {...props} />} />

      {/* Course-specific views handled by ComponentManager (existing behavior) */}
      <Route path="*" element={<AdminCourseRouter {...props} />} />
    </Routes>
  );
};

export default AdminManager;
