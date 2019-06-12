import { Icon, Menu } from 'antd';
import React from 'react';

const SubMenu = Menu.SubMenu;

const SimpleMenu = (props: { number: string[]; openKey: string[] }) => {
  return (
    <Menu
      theme="dark"
      openKeys={props.openKey}
      style={{ width: 160, maxWidth: 160, minWidth: 160, height: 500, borderRadius: 5 }}
      selectedKeys={props.number}
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
        <Menu.Item key="5">Admins</Menu.Item>
        <Menu.Item key="6">Sections</Menu.Item>
      </SubMenu>
      <Menu.Item key="7">
        <Icon type="setting" />
        <span>Settings</span>
      </Menu.Item>
    </Menu>
  );
};

export { SimpleMenu };
