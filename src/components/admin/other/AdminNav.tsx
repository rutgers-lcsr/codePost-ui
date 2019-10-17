import * as React from 'react';

import { Icon, Menu } from 'antd';

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

  public getDefaultOpenKey = () => {
    const routes = [
      'submissions/by_student',
      'submissions/by_grader',
      'assignments/',
      'roster/students',
      'roster/graders',
      'roster/admins',
      'roster/sections',
      'settings/',
    ];

    const match = routes
      .indexOf(
        `${this.props.match.params.panel1}/${
          this.props.match.params.panel2 !== undefined ? this.props.match.params.panel2 : ''
        }`,
      )
      .toString();

    // default to /assignments
    if (match === '-1') {
      return '2';
    } else {
      return match;
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
        defaultOpenKeys={['submissions', 'roster']}
        defaultSelectedKeys={[this.getDefaultOpenKey()]}
        mode="inline"
      >
        <SubMenu
          key="submissions"
          title={
            <span>
              <Icon type="inbox" />
              <span>Submissions</span>
            </span>
          }
        >
          <Menu.Item key="0">
            <Link to={`${this.props.baseURL}/submissions/by_student`}>By Student</Link>
          </Menu.Item>
          <Menu.Item key="1">
            <Link to={`${this.props.baseURL}/submissions/by_grader`}>By Grader</Link>
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="2">
          <Link to={`${this.props.baseURL}/assignments`}>
            <span>
              <Icon type="file-text" />
              <span>Assignments</span>
            </span>
          </Link>
        </Menu.Item>
        <SubMenu
          key="roster"
          title={
            <span>
              <Icon type="team" />
              <span>Roster</span>
            </span>
          }
        >
          <Menu.Item key="3">
            <Link to={`${this.props.baseURL}/roster/students`}>Students</Link>
          </Menu.Item>
          <Menu.Item key="4">
            <Link to={`${this.props.baseURL}/roster/graders`}>Graders</Link>
          </Menu.Item>
          <Menu.Item key="5">
            <Link to={`${this.props.baseURL}/roster/admins`}>Admins</Link>
          </Menu.Item>
          <Menu.Item key="6">
            <Link to={`${this.props.baseURL}/roster/sections`}>Sections</Link>
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="7">
          <Link to={`${this.props.baseURL}/settings`}>
            <span>
              <Icon type="setting" />
              <span>Course Settings</span>
            </span>
          </Link>
        </Menu.Item>
      </Menu>
    );

    const footer = (
      <div>
        <Menu theme="dark" mode="inline" selectedKeys={[]}>
          <Menu.Item key="features" onClick={this.openLink.bind(this, 'https://codepost.io/why-use-codePost')}>
            <Icon type="star" />
            <span>Features</span>
          </Menu.Item>
          <Menu.Item key="docs" onClick={this.openLink.bind(this, 'https://help.codepost.io')}>
            <Icon type="pushpin" />
            <span>Docs</span>
          </Menu.Item>
          <Menu.Item key="api-reference" onClick={this.openLink.bind(this, 'https://docs.codepost.io/reference')}>
            <Icon type="api" />
            <span>API Reference</span>
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
