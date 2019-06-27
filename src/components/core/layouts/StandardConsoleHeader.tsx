import * as React from 'react';

import { Dropdown, Icon, Menu } from 'antd';

import { Link } from 'react-router-dom';

import CPButton from '../CPButton';
import CPFlex from '../CPFlex';
import CPLogo from '../CPLogo';

import { UserType } from '../../../infrastructure/user';

import { USER_TYPE } from '../../../types/common';

import ThemeToggle from '../ThemeToggle';

interface IStandardConsoleHeaderProps {
  user: UserType;
  handleLogout: any;
  thisApp?: USER_TYPE;
}

const StandardConsoleHeader = (props: IStandardConsoleHeaderProps) => {
  const headerLeft = [
    <Link key="header-0" to="/">
      <CPLogo cpType="main" />
    </Link>,
    <div key="space" style={{ width: '100px' }} />,
    <ThemeToggle key="theme-toggle" />,
  ];

  let roleSwitch;
  if (props.thisApp !== undefined) {
    // const isStudent = props.user.studentCourses.length > 0;
    const isGrader = props.user.graderCourses.length > 0;
    const isAdmin = props.user.courseadminCourses.length > 0;
    switch (props.thisApp) {
      case USER_TYPE.STUDENT:
        if (isGrader || isAdmin) {
          const roleMenu = (
            <Menu>
              {isGrader ? (
                <Menu.Item>
                  <Link to="/grader">
                    <Icon type="audit" />
                    &nbsp; Grader
                  </Link>
                </Menu.Item>
              ) : null}
              {isAdmin ? (
                <Menu.Item>
                  <Link to="/admin">
                    <Icon type="sliders" />
                    &nbsp; Admin
                  </Link>
                </Menu.Item>
              ) : null}
            </Menu>
          );
          roleSwitch = (
            <Dropdown overlay={roleMenu}>
              <Icon type="switcher" style={{ color: 'white' }} />
            </Dropdown>
          );
        }
        break;
    }
  }

  const headerRight = [
    <span key="header-user" className="cp-label cp-label--white cp-label--bold">
      {props.user.email}
    </span>,
    roleSwitch,
    <CPButton key="header-logout" cpType="dark" fallback="logout" onClick={props.handleLogout}>
      Log Out
    </CPButton>,
  ];

  return <CPFlex left={headerLeft} right={headerRight} gutterSize={20} />;
};

export default StandardConsoleHeader;
