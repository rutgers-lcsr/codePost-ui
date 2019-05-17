import * as React from 'react';

import { Menu } from 'antd';

const SubMenu = Menu.SubMenu;

class CPMainNav extends React.Component<any, {}> {
  public render() {
    return (
      <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
        <SubMenu key="submissions" title={<span>Submissions</span>}>
          <Menu.Item key="1">Students</Menu.Item>
          <Menu.Item key="2">Graders</Menu.Item>
          <Menu.Item key="3">Inactive Students</Menu.Item>
          <Menu.Item key="4">Inactive Graders</Menu.Item>
        </SubMenu>
        <Menu.Item key="5">
          <span>Assignments</span>
        </Menu.Item>
        <SubMenu key="roster" title={<span>Roster</span>}>
          <Menu.Item key="6">Students</Menu.Item>
          <Menu.Item key="7">Graders</Menu.Item>
          <Menu.Item key="8">Admin</Menu.Item>
          <Menu.Item key="9">Sections</Menu.Item>
          <Menu.Item key="10">Inactive Students</Menu.Item>
          <Menu.Item key="11">Inactive Graders</Menu.Item>
        </SubMenu>
        <Menu.Item key="12">
          <span>Settings</span>
        </Menu.Item>
      </Menu>
    );
  }
}

export default CPMainNav;
