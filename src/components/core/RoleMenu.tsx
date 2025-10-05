import { Link } from 'react-router-dom';

import {
  AuditOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  SlidersOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';

import { Dropdown } from 'antd';

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
  const showAdmin = props.thisApp !== USER_TYPE.ADMIN && props.user.canCreateCourses;

  if (!(showStudent || showGrader || showAdmin)) {
    return <div />;
  }

  const menuItems: any[] = [];

  if (showStudent) {
    menuItems.push({
      key: 'student',
      label: (
        <Link to="/student">
          <IdcardOutlined />
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
          <SlidersOutlined />
          &nbsp; Admin
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
            <a
              href="https://help.codepost.io/en/articles/3182075-roles-in-codepost"
              target="_blank"
              rel="noopener noreferrer"
            >
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
          <InfoCircleOutlined style={{ paddingRight: 7, color: 'grey' }} />
          <div style={{ color: 'grey', fontStyle: 'italic', fontSize: 10, maxWidth: 55 }}>Learn more about roles</div>
        </div>
      </CPTooltip>
    ),
  });

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <CPTooltip title="Switch Roles" placement="left" hideThisOnHideTips={true}>
        <UserSwitchOutlined style={{ color: props.theme === 'light' ? 'black' : 'white', cursor: 'pointer' }} />
      </CPTooltip>
    </Dropdown>
  );
};

export default RoleMenu;
