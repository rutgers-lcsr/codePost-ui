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

import { Menu, Tag } from 'antd';

import { Link } from 'react-router-dom';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

const SubMenu = Menu.SubMenu;

interface IAdminNavProps extends IWithWindowWatcherProps {
  collapsed: boolean;
  match: any;
  baseURL: string;
}

class AdminNav extends React.Component<IAdminNavProps, {}> {
  public constructor(props: IAdminNavProps) {
    super(props);
    this.state = {
      openKeys: ['submissions', 'roster'],
      openKeysCollapsed: [],
    };
  }

  public componentDidMount() {
    /* set up Headway widget */
    try {
      (window as any).Headway.init({
        selector: '.version', // CSS selector where to inject the badge
        account: '7v3mQJ',
      });
    } catch {
      console.error('Headway failed to load.');
    }
  }

  public componentDidUpdate(oldProps: IAdminNavProps) {
    if (this.props.collapsed !== oldProps.collapsed) {
      /* re-mount Headway widget */
      (window as any).Headway.init({
        selector: '.version', // CSS selector where to inject the badge
        account: '7v3mQJ',
      });
    }
  }

  public getDefaultSelectedKey = () => {
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

    const routeString = `${this.props.match.params.panel1}/${
      this.props.match.params.panel2 !== undefined ? this.props.match.params.panel2 : ''
    }`;

    const match = routes.indexOf(routeString).toString();

    // default to /assignments
    if (match === '-1') {
      return '/assignments/overview';
    } else {
      return routeString;
    }
  };

  public openLink = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
    }
  };

  public render() {
    const main = (
      <Menu
        theme="dark"
        defaultOpenKeys={['assignments', 'course-settings']}
        selectedKeys={[this.getDefaultSelectedKey()]}
        mode="inline"
      >
        <SubMenu
          key="assignments"
          title={
            <span>
              <FileTextOutlined />
              <span>Assignments</span>
            </span>
          }
        >
          <Menu.Item key="assignments/overview">
            <Link to={`${this.props.baseURL}/assignments/overview`}>Overview</Link>
          </Menu.Item>
          <Menu.Item key="assignments/rubrics">
            <Link to={`${this.props.baseURL}/assignments/rubrics`}>Rubrics</Link>
          </Menu.Item>
          <Menu.Item key="assignments/tests">
            <Link to={`${this.props.baseURL}/assignments/tests`}>Tests</Link>
          </Menu.Item>
          <Menu.Item key="assignments/plagiarism">
            <Link to={`${this.props.baseURL}/assignments/plagiarism`}>Plagiarism</Link>
          </Menu.Item>
        </SubMenu>
        <SubMenu
          key="submissions"
          title={
            <span>
              <InboxOutlined />
              <span>Submissions</span>
            </span>
          }
        >
          <Menu.Item key="submissions/by_student">
            <Link to={`${this.props.baseURL}/submissions/by_student`}>By Student</Link>
          </Menu.Item>
          <Menu.Item key="submissions/by_grader">
            <Link to={`${this.props.baseURL}/submissions/by_grader`}>By Grader</Link>
          </Menu.Item>
        </SubMenu>
        <SubMenu
          key="roster"
          title={
            <span>
              <TeamOutlined />
              <span>Roster</span>
            </span>
          }
        >
          <Menu.Item key="roster/students">
            <Link to={`${this.props.baseURL}/roster/students`}>Students</Link>
          </Menu.Item>
          <Menu.Item key="roster/graders">
            <Link to={`${this.props.baseURL}/roster/graders`}>Graders</Link>
          </Menu.Item>
          <Menu.Item key="roster/admins">
            <Link to={`${this.props.baseURL}/roster/admins`}>Admins</Link>
          </Menu.Item>
          <Menu.Item key="roster/sections">
            <Link to={`${this.props.baseURL}/roster/sections`}>Sections</Link>
          </Menu.Item>
        </SubMenu>
        <SubMenu
          key="course-settings"
          title={
            <span>
              <SettingOutlined />
              <span>Course Settings</span>
            </span>
          }
        >
          <Menu.Item key="course-settings/general">
            <Link to={`${this.props.baseURL}/settings`}>General</Link>
          </Menu.Item>
          <Menu.Item key="course-settings/webhooks">
            <Link to={`${this.props.baseURL}/settings/webhooks`}>Webhooks</Link>
          </Menu.Item>
        </SubMenu>
      </Menu>
    );

    const footer = (
      <div>
        <Menu theme="dark" mode="inline" selectedKeys={[]}>
          <Menu.Item key="video">
            <Link to={`${this.props.baseURL}/video`}>
              <VideoCameraOutlined />
              <span>Video</span>
            </Link>
          </Menu.Item>
          <Menu.Item key="docs" onClick={this.openLink.bind(this, 'https://help.codepost.io')}>
            <PushpinOutlined />
            <span>Docs</span>
          </Menu.Item>
          <Menu.Item key="api-reference" onClick={this.openLink.bind(this, 'https://docs.codepost.io/reference')}>
            <ApiOutlined />
            <span>API Reference</span>
          </Menu.Item>
          <Menu.Item
            key="scholarship"
            style={{
              whiteSpace: 'normal',
              height: 'auto',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={this.openLink.bind(this, 'https://codepost.io/scholarships/computer-science-education')}
          >
            <TrophyOutlined />
            <span>Scholarship</span>
          </Menu.Item>
        </Menu>
        <div className="version" style={{ color: '#848484', paddingLeft: 24, paddingBottom: 14 }}>
          {this.props.collapsed ? null : `v${process.env.REACT_APP_VERSION}`}
        </div>
      </div>
    );

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: this.props.windowheight - 90 - 48,
          overflow: 'auto',
        }}
      >
        <div>{main}</div>
        <div style={{ margin: 'auto auto', flexGrow: 1 }} />
        <div>{footer}</div>
      </div>
    );
  }
}

export default withWindowWatcher(AdminNav);
