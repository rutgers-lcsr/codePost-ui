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
              label: <Link to={`${courseBaseURL}/assignments/overview`}>Overview</Link>,
            },
            {
              key: 'assignments/rubrics',
              label: <Link to={`${courseBaseURL}/assignments/rubrics`}>Rubrics</Link>,
            },
            {
              key: 'assignments/tests',
              label: <Link to={`${courseBaseURL}/assignments/environment`}>Environment Setup</Link>,
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
            {
              key: 'roster/sections',
              label: <Link to={`${courseBaseURL}/roster/sections`}>Sections</Link>,
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
              label: <Link to={`${courseBaseURL}/settings`}>General</Link>,
            },
            {
              key: 'course-settings/webhooks',
              label: <Link to={`${courseBaseURL}/settings/webhooks`}>Webhooks</Link>,
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
            label: <Link to={`${courseBaseURL}/video`}>Video</Link>,
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
