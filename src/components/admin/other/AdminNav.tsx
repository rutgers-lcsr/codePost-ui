import * as React from 'react';

import {
  ApiOutlined,
  FileTextOutlined,
  InboxOutlined,
  PushpinOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

import { Menu } from 'antd';

import { Link } from 'react-router-dom';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

interface IAdminNavProps extends IWithWindowWatcherProps {
  collapsed: boolean;
  match: any;
  baseURL: string;
}

const AdminNav: React.FC<IAdminNavProps> = (props) => {
  const getDefaultSelectedKey = () => {
    const routes = [
      'submissions/by_student',
      'submissions/by_grader',
      'assignments/overview',
      'assignments/rubrics',
      'assignments/tests',
      'assignments/plagiarism',
      'roster/students',
      'roster/graders',
      'roster/admins',
      'roster/sections',
      'settings/',
    ];

    const routeString = `${props.match.params.panel1}/${
      props.match.params.panel2 !== undefined ? props.match.params.panel2 : ''
    }`;

    const match = routes.indexOf(routeString).toString();

    // default to /assignments
    if (match === '-1') {
      return '/assignments/overview';
    } else {
      return routeString;
    }
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
      defaultOpenKeys={['assignments', 'course-settings']}
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
              label: (
                <Link to="assignments/overview" relative="path">
                  Overview
                </Link>
              ),
            },
            {
              key: 'assignments/rubrics',
              label: (
                <Link to="assignments/rubrics" relative="path">
                  Rubrics
                </Link>
              ),
            },
            {
              key: 'assignments/tests',
              label: (
                <Link to="assignments/tests" relative="path">
                  Tests
                </Link>
              ),
            },
            {
              key: 'assignments/plagiarism',
              label: (
                <Link to="assignments/plagiarism" relative="path">
                  Plagiarism
                </Link>
              ),
            },
          ],
        },
        {
          key: 'submissions',
          icon: <InboxOutlined />,
          label: 'Submissions',
          children: [
            {
              key: 'submissions/by_student',
              label: (
                <Link to="submissions/by_student" relative="path">
                  By Student
                </Link>
              ),
            },
            {
              key: 'submissions/by_grader',
              label: (
                <Link to="submissions/by_grader" relative="path">
                  By Grader
                </Link>
              ),
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
              label: (
                <Link to="roster/students" relative="path">
                  Students
                </Link>
              ),
            },
            {
              key: 'roster/graders',
              label: (
                <Link to="roster/graders" relative="path">
                  Graders
                </Link>
              ),
            },
            {
              key: 'roster/admins',
              label: (
                <Link to="roster/admins" relative="path">
                  Admins
                </Link>
              ),
            },
            {
              key: 'roster/sections',
              label: (
                <Link to="roster/sections" relative="path">
                  Sections
                </Link>
              ),
            },
          ],
        },
        {
          key: 'course-settings',
          icon: <SettingOutlined />,
          label: 'Course Settings',
          children: [
            {
              key: 'course-settings/general',
              label: (
                <Link to="settings" relative="path">
                  General
                </Link>
              ),
            },
            {
              key: 'course-settings/webhooks',
              label: (
                <Link to="settings/webhooks" relative="path">
                  Webhooks
                </Link>
              ),
            },
          ],
        },
      ]}
    />
  );

  const footer = (
    <div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[]}
        items={[
          {
            key: 'video',
            icon: <VideoCameraOutlined />,
            label: (
              <Link to="video" relative="path">
                Video
              </Link>
            ),
          },
          {
            key: 'docs',
            icon: <PushpinOutlined />,
            label: 'Docs',
            onClick: () => openLink('https://help.codepost.io'),
          },
          {
            key: 'api-reference',
            icon: <ApiOutlined />,
            label: 'API Reference',
            onClick: () => openLink('https://docs.codepost.io/reference'),
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
            onClick: () => openLink('https://codepost.cs.rutgers.edu/scholarships/computer-science-education'),
          },
        ]}
      />
      <div className="version" style={{ color: '#848484', paddingLeft: 24, paddingBottom: 14 }}>
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
