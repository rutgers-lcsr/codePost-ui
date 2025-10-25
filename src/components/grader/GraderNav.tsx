import * as React from 'react';

import {
  ClusterOutlined,
  ContainerOutlined,
  InboxOutlined,
  MessageOutlined,
  PushpinOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

import { Menu } from 'antd';

import { RouteComponentProps } from '../../router/legacy';

import { Link } from 'react-router-dom';

interface IProps extends RouteComponentProps<{ panel: string }> {
  collapsed: boolean;
  isSuperGrader: boolean;
  isSectionLeader: boolean;
  regradesAllowed: boolean;
  activateQueue: boolean;
  baseURL: string;
}

const GraderNav: React.FC<IProps> = (props) => {
  const openLink = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
    }
  };

  const getDefaultSelectedKeys = () => {
    const routes = ['my_submissions', 'my_sections', 'all_submissions', 'regrades'];

    const match = routes.indexOf(props.match.params.panel).toString();

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
            label: <Link to={`${props.baseURL}/my_submissions`}>Claimed by Me</Link>,
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
    ...(props.isSuperGrader
      ? [
          {
            key: '2',
            icon: <InboxOutlined />,
            label: <Link to={`${props.baseURL}/all_submissions`}>All Submissions</Link>,
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
  ];

  const bottomMenuItems = [
    {
      key: 'video',
      icon: <VideoCameraOutlined />,
      label: <Link to={`${props.baseURL}/video`}>Video</Link>,
    },
    {
      key: 'docs',
      icon: <PushpinOutlined />,
      label: 'Docs',
      onClick: () => openLink('https://help.codepost.io'),
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
      },
      onClick: () => openLink('https://codepost.cs.rutgers.edu/scholarships/computer-science-education'),
    },
  ];

  return (
    <div>
      <div>
        <Menu theme="dark" mode="inline" selectedKeys={[getDefaultSelectedKeys()]} items={mainMenuItems} />
      </div>
      <div style={{ height: '100%' }}>
        <Menu
          theme="dark"
          mode="inline"
          style={{ position: 'absolute', bottom: 75 }}
          selectedKeys={[]}
          items={bottomMenuItems}
        />
      </div>
    </div>
  );
};

export default GraderNav;
