// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import {
  AuditOutlined,
  ApiOutlined,
  FileTextOutlined,
  HistoryOutlined,
  InboxOutlined,
  PushpinOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import { Menu } from 'antd';

import { Link, useLocation } from 'react-router-dom';

import { CLIENT_URL } from '../../../config';
import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';
import { useCourseCapabilities } from '../../../stores/usePermissionsStore';

interface IAdminNavProps extends IWithWindowWatcherProps {
  collapsed: boolean;
  baseURL: string;
  courseId?: number;
}

const DEFAULT_OPEN_KEYS = ['assignments', 'course-settings'];

const AdminNav: React.FC<IAdminNavProps> = (props) => {
  const location = useLocation();
  const courseCaps = useCourseCapabilities(props.courseId);
  const canManageSections = courseCaps.manage_sections !== false;
  const canViewAuditLog = courseCaps.view_audit_log !== false;
  const canEditSettings = courseCaps.edit_course_settings !== false;

  // Track openKeys so we can clear them while collapsed. AntD renders any
  // keys in the open set as popover overlays on mount when the Sider is
  // collapsed, which made the submenus flash open on refresh.
  const [openKeys, setOpenKeys] = React.useState<string[]>(props.collapsed ? [] : DEFAULT_OPEN_KEYS);
  React.useEffect(() => {
    if (props.collapsed) {
      setOpenKeys([]);
    } else {
      setOpenKeys(DEFAULT_OPEN_KEYS);
    }
  }, [props.collapsed]);
  // Extract the base URL (up to /admin/courseName/period) by removing any nested paths
  const getCourseBaseURL = () => {
    // baseURL might be something like /admin/CourseName/Period/assignments/overview
    // We need to extract just /admin/CourseName/Period
    const parts = props.baseURL.split('/').filter((p) => p);

    // Find the admin index
    const adminIndex = parts.indexOf('admin');
    if (adminIndex !== -1 && parts.length >= adminIndex + 3) {
      // Return /admin/courseName/period
      return '/' + parts.slice(0, adminIndex + 3).join('/');
    }

    // Fallback to baseURL if pattern doesn't match
    return props.baseURL;
  };

  const courseBaseURL = getCourseBaseURL();

  const getDefaultSelectedKey = () => {
    const pathname = location.pathname;

    if (/\/submissions\/by_grader(?:\/|$)/.test(pathname)) return 'submissions/by_grader';
    if (/\/submissions(?:\/|$)/.test(pathname)) return 'submissions/by_student';

    if (/\/roster\/graders(?:\/|$)/.test(pathname)) return 'roster/graders';
    if (/\/roster\/admins(?:\/|$)/.test(pathname)) return 'roster/admins';
    if (/\/roster\/sections(?:\/|$)/.test(pathname)) return 'roster/sections';
    if (/\/roster(?:\/|$)/.test(pathname)) return 'roster/students';

    if (/\/settings\/webhooks(?:\/|$)/.test(pathname) && !/\/assignments\//.test(pathname))
      return 'course-settings/webhooks';
    if (/\/settings(?:\/|$)/.test(pathname) && !/\/assignments\//.test(pathname)) return 'course-settings/general';

    if (/\/activity-log(?:\/|$)/.test(pathname)) return 'activity-log';

    if (/\/assignments\/rubrics(?:\/|$)/.test(pathname)) return 'assignments/rubrics';
    if (/\/assignments\/environment(?:\/|$)/.test(pathname)) return 'assignments/environment';

    return 'assignments/overview';
  };

  const openLink = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
    }
  };

  const main = (
    <Menu
      theme="dark"
      openKeys={openKeys}
      onOpenChange={(keys) => setOpenKeys(keys as string[])}
      selectedKeys={[getDefaultSelectedKey()]}
      mode="inline"
      items={[
        {
          key: 'assignments',
          icon: <FileTextOutlined />,
          label: 'Assignments',
          children: [
            {
              key: 'assignments/overview',
              label: <Link to={`${courseBaseURL}/assignments/overview`}>Overview</Link>,
            },
            {
              key: 'assignments/rubrics',
              label: <Link to={`${courseBaseURL}/assignments/rubrics`}>Rubrics</Link>,
            },
            {
              key: 'assignments/environment',
              label: <Link to={`${courseBaseURL}/assignments/environment`}>Environment & Tests</Link>,
            },
            // TODO: Re-enable plagiarism at some point
            // {
            //   key: 'assignments/plagiarism',
            //   label: <Link to={`${courseBaseURL}/assignments/plagiarism`}>Plagiarism</Link>,
            // },
          ],
        },
        {
          key: 'submissions',
          icon: <InboxOutlined />,
          label: 'Submissions',
          children: [
            {
              key: 'submissions/by_student',
              label: <Link to={`${courseBaseURL}/submissions/by_student`}>By Student</Link>,
            },
            {
              key: 'submissions/by_grader',
              label: <Link to={`${courseBaseURL}/submissions/by_grader`}>By Grader</Link>,
            },
          ],
        },
        {
          key: 'roster',
          icon: <TeamOutlined />,
          label: 'Roster',
          children: [
            {
              key: 'roster/students',
              label: <Link to={`${courseBaseURL}/roster/students`}>Students</Link>,
            },
            {
              key: 'roster/graders',
              label: <Link to={`${courseBaseURL}/roster/graders`}>Graders</Link>,
            },
            {
              key: 'roster/admins',
              label: <Link to={`${courseBaseURL}/roster/admins`}>Admins</Link>,
            },
            ...(canManageSections
              ? [
                  {
                    key: 'roster/sections',
                    label: <Link to={`${courseBaseURL}/roster/sections`}>Sections</Link>,
                  },
                ]
              : []),
          ],
        },
        ...(canViewAuditLog
          ? [
              {
                key: 'activity-log',
                icon: <AuditOutlined />,
                label: <Link to={`${courseBaseURL}/activity-log`}>Activity Log</Link>,
              },
            ]
          : []),
        ...(canEditSettings
          ? [
              {
                key: 'course-settings',
                icon: <SettingOutlined />,
                label: 'Course Settings',
                children: [
                  {
                    key: 'course-settings/general',
                    label: <Link to={`${courseBaseURL}/settings`}>General</Link>,
                  },
                  {
                    key: 'course-settings/webhooks',
                    label: <Link to={`${courseBaseURL}/settings/webhooks`}>Webhooks</Link>,
                  },
                ],
              },
            ]
          : []),
      ]}
    />
  );

  const footer = (
    <div>
      <div
        style={{
          height: 1,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)',
          margin: '8px 16px',
        }}
      />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[]}
        items={[
          {
            key: 'docs',
            icon: <PushpinOutlined />,
            label: <Link to="/docs">Docs</Link>,
          },
          {
            key: 'api-reference',
            icon: <ApiOutlined />,
            label: 'API Reference',
            onClick: () => openLink('https://codepost-api.cs.rutgers.edu/api/schema/elements/'),
          },
          {
            key: 'changelog',
            icon: <HistoryOutlined />,
            label: <Link to="/docs/changelog">Changelog</Link>,
          },
          {
            key: 'scholarship',
            icon: <TrophyOutlined />,
            label: 'Scholarship',
            style: {
              whiteSpace: 'normal',
              height: 'auto',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
            },
            onClick: () => openLink(`${CLIENT_URL}/scholarships/computer-science-education`),
          },
        ]}
      />
      <div
        style={{
          color: 'rgba(255, 255, 255, 0.25)',
          paddingLeft: 24,
          paddingBottom: 16,
          fontSize: 11,
          letterSpacing: '0.3px',
        }}
      >
        {props.collapsed ? null : `v${process.env.REACT_APP_VERSION}`}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: props.windowheight - 90 - 48,
        paddingTop: 8,
        overflow: 'auto',
      }}
    >
      <div>{main}</div>
      <div style={{ margin: 'auto auto', flexGrow: 1 }} />
      <div>{footer}</div>
    </div>
  );
};

export default withWindowWatcher(AdminNav);
