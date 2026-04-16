// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect, useMemo } from 'react';

import { SettingOutlined } from '@ant-design/icons';

/* antd imports */
import { Button } from 'antd';

/* other library imports */
import { Link, Route, Routes } from 'react-router-dom';

import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';

import CPFlex from '../core/CPFlex';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

/* codePost imports */

import { useAssignmentsQuery } from '../admin/hooks';

import { USER_TYPE } from '../../types/common';

import GraderNav from './GraderNav';

import GraderRoutes from './GraderRoutes';

import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';

import AssignmentMenu from '../core/AssignmentMenu';
import CourseMenu from '../core/CourseMenu';

import { IComponentProps } from '../core/ComponentManager';

import { CIPGraderModal } from '../cip/components';

/**********************************************************************************************************************/

const Grader: React.FC<IComponentProps> = (props) => {
  const { currentCourse, sectionsLed } = props;

  // State
  const { data: assignments = [] } = useAssignmentsQuery(currentCourse);

  const localSectionsLed = useMemo(() => {
    if (!currentCourse) return [];
    return sectionsLed.filter((section) => currentCourse.sections.indexOf(section.id) !== -1);
  }, [currentCourse, sectionsLed]);

  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'codePost - Grader Console';
  }, []);

  /* Helper functions */
  const handleLogout = () => {
    props.handleLogout();
  };

  /* Render Logic */
  const someRegrades = assignments.some((assn) => assn.allowRegradeRequests);

  // Compute a stable base URL for navigation: /grader/courseName/period
  // This prevents URL nesting when clicking sidebar links
  const graderBaseURL = useMemo(() => {
    if (!currentCourse) return props.baseURL;
    // Build the base path from course info rather than parsing pathname
    const encodedName = encodeURIComponent(currentCourse.name);
    const encodedPeriod = encodeURIComponent(currentCourse.period);
    return `/grader/${encodedName}/${encodedPeriod}`;
  }, [currentCourse, props.baseURL]);

  let graderPanelContent;
  if (!currentCourse) {
    graderPanelContent = (
      <div
        style={{
          padding: '60px 40px',
          fontSize: 20,
          color: 'rgba(0, 0, 0, 0.35)',
          fontWeight: 500,
        }}
      >
        <div>Select a course to get started</div>
      </div>
    );
  } else {
    graderPanelContent = (
      <GraderRoutes
        currentCourse={currentCourse}
        assignments={assignments}
        user={props.user}
        localSectionsLed={localSectionsLed}
        someRegrades={someRegrades}
      />
    );
  }

  /* Build header */
  const courseDropdown = (
    <CourseMenu
      courses={props.initialCourses}
      currentCourse={props.currentCourse}
      panel="my_submissions"
      base="grader"
    />
  );

  let assignmentDropdown;
  if (currentCourse) {
    assignmentDropdown = (
      <Routes>
        <Route
          path=":panel/:assignment"
          element={<AssignmentMenu currentCourse={currentCourse} assignments={assignments} baseURL={graderBaseURL} />}
        />
        <Route
          path=":panel"
          element={<AssignmentMenu currentCourse={currentCourse} assignments={assignments} baseURL={graderBaseURL} />}
        />
      </Routes>
    );
  }

  const headerLeft = [courseDropdown, assignmentDropdown];
  const showNewCourseBtn = !props.user.hasCredentials;

  const logout = (
    <Button key="header-logout" onClick={handleLogout}>
      Log Out
    </Button>
  );

  const headerRight = [
    showNewCourseBtn && (
      <Button key="create-course" onClick={() => setShowConversionModal(true)}>
        Create your own course
      </Button>
    ),
    <span key="header-user" className="cp-label cp-label--bold">
      {props.user.email}
    </span>,
    <Referral key="referral" user={props.user} theme="light" />,
    <RoleMenu key="header-roles" user={props.user} thisApp={USER_TYPE.GRADER} theme="light" />,
    <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
      <Link className="internal-link" to="/settings">
        <SettingOutlined />
      </Link>
    </CPTooltip>,
    logout,
  ];

  const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

  const navigation = (collapsed: boolean) => {
    return (
      <GraderNav
        {...props}
        baseURL={graderBaseURL}
        collapsed={collapsed}
        isSectionLeader={localSectionsLed.length > 0}
        regradesAllowed={someRegrades}
        activateQueue={!!(currentCourse && currentCourse.activateQueue)}
        courseId={currentCourse?.id}
      />
    );
  };

  return (
    <CPLayoutAdmin
      header={header}
      detail={
        <span>
          {null}

          {graderPanelContent}
          <CIPGraderModal
            open={showConversionModal}
            onClose={() => setShowConversionModal(false)}
            email={props.user.email!}
          />
        </span>
      }
      navigation={navigation}
      collapsible={true}
      role={USER_TYPE.GRADER}
    />
  );
};

export default Grader;
