// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Link } from 'react-router-dom';

import { AuditOutlined, InfoCircleOutlined, UserSwitchOutlined, TeamOutlined } from '@ant-design/icons';
import { PiStudentFill, PiChalkboardTeacherFill } from 'react-icons/pi';

import { Dropdown, theme } from 'antd';

import type { UserType } from '../../types/models';
import { USER_TYPE } from '../../types/common';

import CPTooltip from './CPTooltip';

type ThemeType = 'light' | 'dark';

interface IProps {
  user: UserType;
  thisApp?: USER_TYPE | undefined;
  theme: ThemeType;
}

const RoleMenu = (props: IProps) => {
  const { token } = theme.useToken();
  const showStudent = props.thisApp !== USER_TYPE.STUDENT && props.user.studentCourses.length > 0;
  const showGrader = props.thisApp !== USER_TYPE.GRADER && props.user.graderCourses.length > 0;
  const showAdmin = props.thisApp !== USER_TYPE.ADMIN && props.user.canCreateCourses;
  const showOrgStaff = props.user.isOrgStaff;

  if (!(showStudent || showGrader || showAdmin || showOrgStaff)) {
    return <div />;
  }

  const menuItems: any[] = [];

  if (showStudent) {
    menuItems.push({
      key: 'student',
      label: (
        <Link to="/student">
          <PiStudentFill />
          &nbsp; Student
        </Link>
      ),
    });
  }

  if (showGrader) {
    menuItems.push({
      key: 'grader',
      label: (
        <Link to="/grader">
          <AuditOutlined />
          &nbsp; Grader
        </Link>
      ),
    });
  }

  if (showAdmin) {
    menuItems.push({
      key: 'admin',
      label: (
        <Link to="/admin">
          <PiChalkboardTeacherFill />
          &nbsp; Admin
        </Link>
      ),
    });
  }

  if (showOrgStaff) {
    menuItems.push({
      key: 'org',
      label: (
        <Link to="/organization">
          <TeamOutlined />
          &nbsp; Organization
        </Link>
      ),
    });
  }

  menuItems.push({
    key: 'divider',
    type: 'divider',
  });

  menuItems.push({
    key: 'info',
    label: (
      <CPTooltip
        title={
          <div>
            Each role in codePost has its own console. To learn more about roles, click{' '}
            <a href="/docs/faq#roles" target="_blank" rel="noopener noreferrer">
              here
            </a>
            .
          </div>
        }
        placement="bottom"
        hideThisOnHideTips={true}
        hideChildrenOnHideTips={true}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 2,
          }}
        >
          <InfoCircleOutlined style={{ paddingRight: 7, color: token.colorTextSecondary }} />
          <div style={{ color: token.colorTextSecondary, fontStyle: 'italic', fontSize: 10, maxWidth: 55 }}>
            Learn more about roles
          </div>
        </div>
      </CPTooltip>
    ),
  });

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <CPTooltip title="Switch Roles" placement="left" hideThisOnHideTips={true}>
        <UserSwitchOutlined
          style={{ color: props.theme === 'light' ? token.colorText : token.colorTextLightSolid, cursor: 'pointer' }}
        />
      </CPTooltip>
    </Dropdown>
  );
};

export default RoleMenu;
