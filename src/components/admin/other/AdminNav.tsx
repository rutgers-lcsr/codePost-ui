// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import {
  AuditOutlined,
  ApiOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FormOutlined,
  HistoryOutlined,
  InboxOutlined,
  PushpinOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TableOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import { Menu } from 'antd';

import { Link, useLocation } from 'react-router';

import { CLIENT_URL } from '../../../config';
import { useCourseCapabilities } from '../../../stores/usePermissionsStore';

interface IAdminNavProps {
  collapsed: boolean;
  baseURL: string;
  courseId?: number;
}

const DEFAULT_OPEN_KEYS = ['assignments'];

const AdminNav: React.FC<IAdminNavProps> = (props) => {
  const location = useLocation();
  const courseCaps = useCourseCapabilities(props.courseId);
  const canManageSections = courseCaps.manage_sections !== false;
  const canViewAuditLog = courseCaps.view_audit_log !== false;
  const canEditSettings = courseCaps.edit_course_settings !== false;
  const canViewGradebook = courseCaps.view_analytics !== false;

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

    if (/\/settings(?:\/|$)/.test(pathname) && !/\/assignments\//.test(pathname)) return 'course-settings';

    if (/\/course-files(?:\/|$)/.test(pathname)) return 'course-files';

    if (/\/quizzes\/grading-progress(?:\/|$)/.test(pathname)) return 'quizzes/grading-progress';
    if (/\/quizzes(?:\/|$)/.test(pathname)) return 'quizzes/overview';

    if (/\/gradebook(?:\/|$)/.test(pathname)) return 'gradebook';

    if (/\/activity-log(?:\/|$)/.test(pathname)) return 'activity-log';

    if (/\/assignments\/rubrics(?:\/|$)/.test(pathname)) return 'assignments/rubrics';
    if (/\/assignments\/environment(?:\/|$)/.test(pathname)) return 'assignments/environment';

    return 'assignments/overview';
  };

  // The group that holds the current page always opens, so the sider shows where you are
  // (Roster, Quizzes and Submissions used to stay shut on their own pages). User toggles are kept.
  const selectedKey = getDefaultSelectedKey();
  const activeGroup = selectedKey.includes('/') ? selectedKey.split('/')[0] : null;
  React.useEffect(() => {
    if (props.collapsed || !activeGroup) return;
    setOpenKeys((keys) => (keys.includes(activeGroup) ? keys : [...keys, activeGroup]));
  }, [activeGroup, props.collapsed]);

  // The selected item is announced, not only tinted: the current page's link carries aria-current.
  const navLink = (key: string, to: string, label: string) => (
    <Link to={to} aria-current={selectedKey === key ? 'page' : undefined}>
      {label}
    </Link>
  );

  // A group opened near the bottom (Roster, Help) can land under the collapse trigger on short screens:
  // after antd's ~200ms open motion, bring its last page into view.
  const revealGroup = (keys: string[]) => {
    const opened = keys.find((k) => !openKeys.includes(k));
    if (!opened) return;
    window.setTimeout(() => {
      document
        .querySelector(`.layout--admin__sider [data-menu-id$="-${opened}"]`)
        ?.closest('.ant-menu-submenu')
        ?.querySelector('.ant-menu-sub > li:last-child')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 350);
  };

  const openLink = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
    }
  };

  const main = (
    <nav aria-label="Course pages">
      <Menu
        theme="dark"
        openKeys={openKeys}
        onOpenChange={(keys) => {
          setOpenKeys(keys as string[]);
          revealGroup(keys as string[]);
        }}
        selectedKeys={[selectedKey]}
        mode="inline"
        items={[
          {
            key: 'assignments',
            icon: <FileTextOutlined />,
            label: 'Assignments',
            children: [
              {
                key: 'assignments/overview',
                label: navLink('assignments/overview', `${courseBaseURL}/assignments/overview`, 'All assignments'),
              },
              {
                key: 'assignments/rubrics',
                label: navLink('assignments/rubrics', `${courseBaseURL}/assignments/rubrics`, 'Rubrics'),
              },
              {
                key: 'assignments/environment',
                label: navLink(
                  'assignments/environment',
                  `${courseBaseURL}/assignments/environment`,
                  'Environment & Tests',
                ),
              },
              // TODO: Re-enable plagiarism at some point
              // {
              //   key: 'assignments/plagiarism',
              //   label: <Link to={`${courseBaseURL}/assignments/plagiarism`}>Plagiarism</Link>,
              // },
            ],
          },
          {
            key: 'quizzes',
            icon: <FormOutlined />,
            label: 'Quizzes',
            children: [
              {
                key: 'quizzes/overview',
                label: navLink('quizzes/overview', `${courseBaseURL}/quizzes`, 'All quizzes'),
              },
              {
                key: 'quizzes/grading-progress',
                label: navLink(
                  'quizzes/grading-progress',
                  `${courseBaseURL}/quizzes/grading-progress`,
                  'Grading Progress',
                ),
              },
            ],
          },
          ...(canEditSettings
            ? [
                {
                  key: 'course-files',
                  icon: <FolderOpenOutlined />,
                  label: navLink('course-files', `${courseBaseURL}/course-files`, 'Course Files'),
                },
              ]
            : []),
          ...(canViewGradebook
            ? [
                {
                  key: 'gradebook',
                  icon: <TableOutlined />,
                  label: navLink('gradebook', `${courseBaseURL}/gradebook`, 'Gradebook'),
                },
              ]
            : []),
          {
            key: 'submissions',
            icon: <InboxOutlined />,
            label: 'Submissions',
            children: [
              {
                key: 'submissions/by_student',
                label: navLink('submissions/by_student', `${courseBaseURL}/submissions/by_student`, 'By Student'),
              },
              {
                key: 'submissions/by_grader',
                label: navLink('submissions/by_grader', `${courseBaseURL}/submissions/by_grader`, 'By Grader'),
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
                label: navLink('roster/students', `${courseBaseURL}/roster/students`, 'Students'),
              },
              {
                key: 'roster/graders',
                label: navLink('roster/graders', `${courseBaseURL}/roster/graders`, 'Graders'),
              },
              {
                key: 'roster/admins',
                label: navLink('roster/admins', `${courseBaseURL}/roster/admins`, 'Admins'),
              },
              ...(canManageSections
                ? [
                    {
                      key: 'roster/sections',
                      label: navLink('roster/sections', `${courseBaseURL}/roster/sections`, 'Sections'),
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
                  label: navLink('activity-log', `${courseBaseURL}/activity-log`, 'Activity Log'),
                },
              ]
            : []),
          ...(canEditSettings
            ? [
                // One destination: the settings page carries its own section rail (Webhooks included).
                {
                  key: 'course-settings',
                  icon: <SettingOutlined />,
                  label: navLink('course-settings', `${courseBaseURL}/settings`, 'Course Settings'),
                },
              ]
            : []),
        ]}
      />
    </nav>
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
      {/* Four reference links behind one Help entry, so the course navigation stays the sider's subject. */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[]}
        onOpenChange={(keys) => revealGroup(keys as string[])}
        items={[
          {
            key: 'help',
            icon: <QuestionCircleOutlined />,
            label: 'Help',
            children: [
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
                onClick: () => openLink(`${CLIENT_URL}/scholarships/computer-science-education`),
              },
            ],
          },
        ]}
      />
      <div
        style={{
          color: 'rgba(255, 255, 255, 0.55)',
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

  // Fills the sider below its header (flex column, see _layout.scss) and scrolls on its own,
  // so the footer links are always reachable above the collapse trigger.
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minHeight: 0,
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

export default AdminNav;
