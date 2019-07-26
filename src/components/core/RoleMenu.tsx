import * as React from 'react';
import { Link } from 'react-router-dom';

import { Dropdown, Icon, Menu } from 'antd';

import { UserType } from '../../infrastructure/user';
import { USER_TYPE } from '../../types/common';

import CPTooltip from './CPTooltip';

type ThemeType = 'light' | 'dark';

interface IProps {
  user: UserType;
  thisApp?: USER_TYPE | undefined;
  theme: ThemeType;
}

const RoleMenu = (props: IProps) => {
  const showStudent = props.thisApp !== USER_TYPE.STUDENT && props.user.studentCourses.length > 0;
  const showGrader = props.thisApp !== USER_TYPE.GRADER && props.user.graderCourses.length > 0;
  const showAdmin = props.thisApp !== USER_TYPE.ADMIN && props.user.courseadminCourses.length > 0;

  if (!(showStudent || showGrader || showAdmin)) {
    return <div />;
  }
  const roleMenu = (
    <Menu>
      {showStudent ? (
        <Menu.Item>
          <Link to="/student">
            <Icon type="idcard" />
            &nbsp; Student
          </Link>
        </Menu.Item>
      ) : null}
      {showGrader ? (
        <Menu.Item>
          <Link to="/grader">
            <Icon type="audit" />
            &nbsp; Grader
          </Link>
        </Menu.Item>
      ) : null}
      {showAdmin ? (
        <Menu.Item>
          <Link to="/admin">
            <Icon type="sliders" />
            &nbsp; Admin
          </Link>
        </Menu.Item>
      ) : null}
    </Menu>
  );
  return (
    <Dropdown overlay={roleMenu} trigger={['click']}>
      <CPTooltip title="Switch Roles" placement="left">
        <Icon type="team" style={{ color: props.theme === 'light' ? 'black' : 'white' }} />
      </CPTooltip>
    </Dropdown>
  );
};

export default RoleMenu;
