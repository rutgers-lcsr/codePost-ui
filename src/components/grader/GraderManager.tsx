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
import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';
import CourseMenu from '../core/CourseMenu';
import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';

import Grader from './Grader';
import GraderDashboard from './GraderDashboard';
import MobileGraderConsole from './MobileGraderConsole';
import useShowMobileConsole from '../core/useShowMobileConsole';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import { encodeForLink } from '../core/URLutils';

/**********************************************************************************************************************/

interface IGraderManagerProps {
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

const getDefaultPanel = (c: Course) => (c.activateQueue ? 'my_submissions' : 'my_sections');

/** HOC-wrapped course view (uses ComponentManager for course-specific sub-routes) */
const GraderCourseRouter = ComponentManager(Grader, getDefaultPanel);

/** Renders dashboard or redirects to stored course */
const GraderDashboardOrRedirect: React.FC<IGraderManagerProps> = (props) => {
  const { initialCourses, user, handleLogout } = props;
  const showMobile = useShowMobileConsole();

  // If a stored course exists and is in the list, redirect to it
  const storedID = LOCAL_SETTINGS.defaultCourse.getter();
  if (storedID !== 0) {
    const found = initialCourses.find((course) => course.id === storedID);
    if (found) {
      const panel = getDefaultPanel(found);
      return <Navigate to={`/grader/${encodeForLink(found.name)}/${encodeForLink(found.period)}/${panel}`} replace />;
    }
  }

  // No courses — let ComponentManager handle empty state via Grader
  if (initialCourses.length === 0) {
    return <GraderCourseRouter {...props} />;
  }

  // Render the dashboard
  if (showMobile) {
    return <MobileGraderConsole courses={initialCourses} userEmail={user.email!} user={user} onLogout={handleLogout} />;
  }

  const header = (
    <CPFlex
      left={[<CourseMenu key="course" courses={initialCourses} currentCourse={undefined} base="grader" />]}
      right={[
        <span key="header-user" className="cp-label cp-label--bold">
          {user.email}
        </span>,
        <Referral key="referral" user={user} theme="light" />,
        <RoleMenu key="header-roles" user={user} thisApp={USER_TYPE.GRADER} theme="light" />,
        <Link className="internal-link" key="settings" to="/settings">
          <SettingOutlined />
        </Link>,
        <Button key="header-logout" onClick={handleLogout}>
          Log Out
        </Button>,
      ]}
      gutterSize={10}
    />
  );

  return (
    <div id="Grader">
      <CPLayoutAdmin
        header={header}
        detail={<GraderDashboard courses={initialCourses} userEmail={user.email!} defaultPanel={getDefaultPanel} />}
        navigation={() => null}
        hasSider={false}
        role={USER_TYPE.GRADER}
      />
    </div>
  );
};

/** Top-level grader router — dashboard at index, course views at /:name/:period */
const GraderManager: React.FC<IGraderManagerProps> = (props) => {
  const { initialCourses, user, handleLogout } = props;
  const showMobile = useShowMobileConsole();

  // On mobile, always show the mobile console regardless of route
  if (showMobile) {
    return <MobileGraderConsole courses={initialCourses} userEmail={user.email!} user={user} onLogout={handleLogout} />;
  }

  return (
    <Routes>
      {/* Dashboard index */}
      <Route index element={<GraderDashboardOrRedirect {...props} />} />

      {/* Course-specific views handled by ComponentManager (existing behavior) */}
      <Route path="*" element={<GraderCourseRouter {...props} />} />
    </Routes>
  );
};

export default GraderManager;
