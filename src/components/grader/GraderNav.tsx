// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import {
  ClusterOutlined,
  ContainerOutlined,
  InboxOutlined,
  MessageOutlined,
  PushpinOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import { Menu } from 'antd';

import { Link, useLocation } from 'react-router-dom';

import { useCourseCapabilities } from '../../stores/usePermissionsStore';

interface IProps {
  collapsed: boolean;
  isSectionLeader: boolean;
  regradesAllowed: boolean;
  activateQueue: boolean;
  baseURL: string;
  courseId?: number;
}

const GraderNav: React.FC<IProps> = (props) => {
  const location = useLocation();
  const courseCaps = useCourseCapabilities(props.courseId);
  const showAllSubmissions = !!courseCaps.manage_regrades;
  const showRubrics = !!courseCaps.edit_rubric;
  const panel = location.pathname.replace(props.baseURL, '').split('/')[1] || '';

  const assignment = location.pathname.replace(props.baseURL, '').split('/')[2] || '';

  const getPath = (target: string) => {
    // Only persist assignment for panels that support it clearly
    if (assignment && ['my_submissions', 'all_submissions', 'rubrics'].includes(target)) {
      return `${props.baseURL}/${target}/${assignment}`;
    }
    return `${props.baseURL}/${target}`;
  };

  const openLink = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
    }
  };

  const getDefaultSelectedKeys = () => {
    const routes = ['my_submissions', 'my_sections', 'all_submissions', 'regrades', 'rubrics'];

    const match = routes.indexOf(panel).toString();

    // default to /assignments
    if (match === '-1') {
      return '0';
    } else {
      return match;
    }
  };

  const mainMenuItems = [
    ...(props.activateQueue
      ? [
          {
            key: '0',
            icon: <ContainerOutlined />,
            label: <Link to={getPath('my_submissions')}>Claimed by Me</Link>,
          },
        ]
      : []),
    ...(props.isSectionLeader
      ? [
          {
            key: '1',
            icon: <ClusterOutlined />,
            label: <Link to={`${props.baseURL}/my_sections`}>My Sections</Link>,
          },
        ]
      : []),
    ...(showAllSubmissions
      ? [
          {
            key: '2',
            icon: <InboxOutlined />,
            label: <Link to={getPath('all_submissions')}>All Submissions</Link>,
          },
        ]
      : []),
    ...(props.regradesAllowed
      ? [
          {
            key: '3',
            icon: <MessageOutlined />,
            label: <Link to={`${props.baseURL}/regrades`}>Regrade Requests</Link>,
          },
        ]
      : []),
    ...(showRubrics
      ? [
          {
            key: '4',
            icon: <ContainerOutlined />, // Using Container (or similar) or Edit
            label: <Link to={getPath('rubrics')}>Rubrics</Link>,
          },
        ]
      : []),
  ];

  const bottomMenuItems = [
    {
      key: 'docs',
      icon: <PushpinOutlined />,
      label: <Link to="/docs">Docs</Link>,
    },
    {
      key: 'scholarship',
      icon: <TrophyOutlined />,
      label: 'CS Education Scholarship',
      style: {
        whiteSpace: 'normal',
        height: 'auto',
        lineHeight: 1.4,
        display: 'flex',
        alignItems: 'center',
        fontSize: 13,
      } as React.CSSProperties,
      onClick: () => openLink('https://codepost.cs.rutgers.edu/scholarships/computer-science-education'),
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 'calc(100% - 138px)',
        paddingTop: 8,
      }}
    >
      <div>
        <Menu theme="dark" mode="inline" selectedKeys={[getDefaultSelectedKeys()]} items={mainMenuItems} />
      </div>
      <div style={{ flexGrow: 1 }} />
      <div>
        <div
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)',
            margin: '8px 16px',
          }}
        />
        <Menu theme="dark" mode="inline" selectedKeys={[]} items={bottomMenuItems} />
      </div>
    </div>
  );
};

export default GraderNav;
