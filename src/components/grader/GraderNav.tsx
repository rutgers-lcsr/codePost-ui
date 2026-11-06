// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import {
  ClusterOutlined,
  ContainerOutlined,
  FormOutlined,
  InboxOutlined,
  MessageOutlined,
  ProfileOutlined,
  PushpinOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import { Menu } from 'antd';

import { Link, useLocation } from 'react-router';

import { CLIENT_URL } from '../../config';

import { useCourseCapabilities } from '../../stores/usePermissionsStore';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';

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
  const showRubrics = !!courseCaps.edit_rubric || !!courseCaps.edit_unapplied_rubric_comments;
  const showQuizGrading = !!courseCaps.grade_quiz;
  const panel = location.pathname.replace(props.baseURL, '').split('/')[1] || '';

  const assignment = location.pathname.replace(props.baseURL, '').split('/')[2] || '';

  const getPath = (target: string) => {
    // Switching panels keeps the open assignment (same assignment, other view); the link
    // for the panel you are already on goes to its index table.
    const onThisPanel = location.pathname.includes(`/${target}/`);
    if (assignment && !onThisPanel && ['my_submissions', 'all_submissions', 'rubrics'].includes(target)) {
      return `${props.baseURL}/${target}/${assignment}`;
    }
    return `${props.baseURL}/${target}`;
  };

  // Every index redirects to the remembered assignment; a sidebar click means "show me
  // the panel", so it forgets it first (a link that carries the assignment re-stores it).
  const forgetAssignment = () => LOCAL_SETTINGS.defaultAssignment.setter(0);

  const openLink = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
    }
  };

  const getDefaultSelectedKeys = () => {
    const routes = ['my_submissions', 'my_sections', 'all_submissions', 'regrades', 'rubrics', 'quizzes'];

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
            label: (
              <Link to={getPath('my_submissions')} onClick={forgetAssignment}>
                Claimed by Me
              </Link>
            ),
          },
        ]
      : []),
    ...(props.isSectionLeader
      ? [
          {
            key: '1',
            icon: <ClusterOutlined />,
            label: (
              <Link to={`${props.baseURL}/my_sections`} onClick={forgetAssignment}>
                My Sections
              </Link>
            ),
          },
        ]
      : []),
    ...(showAllSubmissions
      ? [
          {
            key: '2',
            icon: <InboxOutlined />,
            label: (
              <Link to={getPath('all_submissions')} onClick={forgetAssignment}>
                All Submissions
              </Link>
            ),
          },
        ]
      : []),
    ...(props.regradesAllowed
      ? [
          {
            key: '3',
            icon: <MessageOutlined />,
            label: (
              <Link to={`${props.baseURL}/regrades`} onClick={forgetAssignment}>
                Regrade Requests
              </Link>
            ),
          },
        ]
      : []),
    ...(showRubrics
      ? [
          {
            key: '4',
            icon: <ProfileOutlined />,
            label: (
              <Link to={getPath('rubrics')} onClick={forgetAssignment}>
                Rubrics
              </Link>
            ),
          },
        ]
      : []),
    ...(showQuizGrading
      ? [
          {
            key: '5',
            icon: <FormOutlined />,
            label: (
              <Link to={`${props.baseURL}/quizzes`} onClick={forgetAssignment}>
                Quiz Grading
              </Link>
            ),
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
      onClick: () => openLink(`${CLIENT_URL}/scholarships/computer-science-education`),
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
