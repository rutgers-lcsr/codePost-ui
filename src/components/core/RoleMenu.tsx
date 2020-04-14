import * as React from 'react';
import { Link } from 'react-router-dom';

import { AuditOutlined, IdcardOutlined, InfoCircleOutlined, SlidersOutlined, TeamOutlined } from '@ant-design/icons';

import { Divider, Dropdown, Menu } from 'antd';

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
            <IdcardOutlined />
            &nbsp; Student
          </Link>
        </Menu.Item>
      ) : null}
      {showGrader ? (
        <Menu.Item>
          <Link to="/grader">
            <AuditOutlined />
            &nbsp; Grader
          </Link>
        </Menu.Item>
      ) : null}
      {showAdmin ? (
        <Menu.Item>
          <Link to="/admin">
            <SlidersOutlined />
            &nbsp; Admin
          </Link>
        </Menu.Item>
      ) : null}
      <div>
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
          <div>
            <Divider style={{ margin: '4px 0px' }} />
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
              <div style={{ color: 'grey', fontStyle: 'italic', fontSize: 10, maxWidth: 55 }}>
                Learn more about roles
              </div>
            </div>
          </div>
        </CPTooltip>
      </div>
    </Menu>
  );
  return (
    <Dropdown overlay={roleMenu} trigger={['click']}>
      <CPTooltip title="Switch Roles" placement="left" hideThisOnHideTips={true}>
        <TeamOutlined style={{ color: props.theme === 'light' ? 'black' : 'white', cursor: 'pointer' }} />
      </CPTooltip>
    </Dropdown>
  );
};

export default RoleMenu;
