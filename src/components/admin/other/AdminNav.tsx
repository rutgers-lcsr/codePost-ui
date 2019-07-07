import * as React from 'react';

import { Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

const SubMenu = Menu.SubMenu;

interface IAdminNavProps {
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
      openKeys: [],
      openKeysCollapsed: [],
    };
  }

  public componentDidMount() {
    const selectedPanelKey = this.calculateOpenKey(this.props.selectedPanel);
    this.setState({ openKeys: [selectedPanelKey] });

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

  public render() {
    return (
      <div>
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
            <Menu.Item key="0">Students</Menu.Item>
            <Menu.Item key="1">Graders</Menu.Item>
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
        <div style={{ height: '100%' }}>
          <Menu theme="dark" mode="inline" style={{ position: 'absolute', bottom: 95 }} selectedKeys={[]}>
            <Menu.Item key="docs">
              <Icon type="pushpin" />
              <span>
                <a href="https://help.codepost.io" target="_blank" className="internal-link--menu">
                  Docs
                </a>
              </span>
            </Menu.Item>
            <Menu.Item key="api-reference">
              <Icon type="api" />
              <span>
                <a href="https://help.codepost.io/reference" target="_blank" className="internal-link--menu">
                  API Reference
                </a>
              </span>
            </Menu.Item>
          </Menu>
        </div>
        <div className="version" style={{ position: 'absolute', bottom: 68, color: '#848484', paddingLeft: 24 }}>
          {this.props.collapsed ? null : `v${process.env.REACT_APP_VERSION}`}
        </div>
      </div>
    );
  }
}

export default AdminNav;
