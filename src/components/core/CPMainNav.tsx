import * as React from 'react';

import { Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

const SubMenu = Menu.SubMenu;

interface ICPMainNavProps {
  onClick: (e: ClickParam) => void;
  selectedPanel: number;
}

interface ICPMainNavState {
  openKeys: string[];
}

class CPMainNav extends React.Component<ICPMainNavProps, ICPMainNavState> {
  public constructor(props: ICPMainNavProps) {
    super(props);
    this.state = {
      openKeys: [],
    };
  }

  public componentDidMount() {
    const selectedPanelKey = this.calculateOpenKey(this.props.selectedPanel);
    this.setState({ openKeys: [selectedPanelKey] });
  }

  public componentDidUpdate(oldProps: ICPMainNavProps) {
    // key of the selected panel
    const selectedPanelKey = this.calculateOpenKey(this.props.selectedPanel);

    // open it if we're navigating to that panel
    if (oldProps.selectedPanel !== this.props.selectedPanel) {
      if (this.state.openKeys.indexOf(selectedPanelKey) < 0 && selectedPanelKey !== '') {
        this.setState({ openKeys: [...this.state.openKeys, selectedPanelKey] });
      }
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
    this.setState({ openKeys });
  };

  public render() {
    return (
      <Menu
        onOpenChange={this.onOpenChange}
        onClick={this.props.onClick}
        theme="dark"
        openKeys={this.state.openKeys}
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
    );
  }
}

export default CPMainNav;
