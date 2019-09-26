import * as React from 'react';

import { Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import CPFlex from '../../core/CPFlex';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

const SubMenu = Menu.SubMenu;

interface IAdminNavProps extends IWithWindowWatcherProps {
  onClick: (e: ClickParam) => void;
  selectedPanel: number;
  collapsed: boolean;
}

interface IAdminNavState {
  openKeys: string[];
  openKeysCollapsed: string[];
}

class AdminNav extends React.Component<IAdminNavProps, IAdminNavState> {
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
    // key of the selected panel
    const selectedPanelKey = this.calculateOpenKey(this.props.selectedPanel);

    // open it if we're navigating to that panel
    if (oldProps.selectedPanel !== this.props.selectedPanel) {
      if (this.state.openKeys.indexOf(selectedPanelKey) < 0 && selectedPanelKey !== '') {
        this.setState({ openKeys: [...this.state.openKeys, selectedPanelKey] });
      }
    }

    if (this.props.collapsed !== oldProps.collapsed) {
      /* re-mount Headway widget */
      (window as any).Headway.init({
        selector: '.version', // CSS selector where to inject the badge
        account: '7v3mQJ',
      });
    }
  }

  public calculateOpenKey = (defaultPanel: number) => {
    switch (defaultPanel) {
      case 0:
      case 1:
        return 'submissions';
        break;
      case 3:
      case 4:
      case 5:
      case 6:
        return 'roster';
        break;
    }

    return '';
  };

  public onOpenChange = (openKeys: string[]) => {
    if (this.props.collapsed) {
      this.setState({ openKeysCollapsed: openKeys });
    } else {
      this.setState({ openKeys });
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
        onOpenChange={this.onOpenChange}
        onClick={this.props.onClick}
        theme="dark"
        openKeys={this.props.collapsed ? this.state.openKeysCollapsed : this.state.openKeys}
        selectedKeys={[this.props.selectedPanel.toString()]}
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
          <Menu.Item key="0">By Student</Menu.Item>
          <Menu.Item key="1">By Grader</Menu.Item>
        </SubMenu>
        <Menu.Item key="2">
          <Icon type="file-text" />
          <span>Assignments</span>
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
          <Menu.Item key="3">Students</Menu.Item>
          <Menu.Item key="4">Graders</Menu.Item>
          <Menu.Item key="5">Admin</Menu.Item>
          <Menu.Item key="6">Sections</Menu.Item>
        </SubMenu>
        <Menu.Item key="7">
          <Icon type="setting" />
          <span>Course Settings</span>
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
