/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { AuditOutlined, DashboardOutlined, IdcardOutlined, SlidersOutlined } from '@ant-design/icons';

/* antd imports */
import { Divider, Typography, theme } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PeripheralPageLayout from './layouts/PeripheralPageLayout';

import { UserType } from '../../infrastructure/user';

import useWindowSize from './useWindowSize';

import layoutVars from '../../styles/layout/_layoutVars';

/**********************************************************************************************************************/

interface IProps {
  isStudent: boolean;
  isGrader: boolean;
  isAdmin: boolean;
  user: UserType;
  handleLogout: () => void;
}

interface IRoleProps {
  title: string;
  icon: React.ReactNode;
  linkTo: string;
}

const RoleItem = (props: IRoleProps) => {
  const [hovered, setHovered] = React.useState(false);
  const { token } = theme.useToken();

  const onMouseEnter = (_e: React.MouseEvent) => {
    setHovered(true);
  };

  const onMouseLeave = (_e: React.MouseEvent) => {
    setHovered(false);
  };

  return (
    <Link to={props.linkTo}>
      <div
        style={{ padding: '10px', textAlign: 'center', cursor: hovered ? 'pointer' : 'auto' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          style={{
            margin: '8px',
            width: '120px',
            height: '120px',
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: hovered ? token.boxShadow : undefined,
            display: 'table',
          }}
        >
          <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
            {React.cloneElement(props.icon as React.ReactElement<any>, {
              style: { fontSize: '70px', color: hovered ? token.colorPrimary : token.colorText },
            })}
          </div>
        </div>
        <div
          style={{
            fontWeight: hovered ? 600 : 500,
            fontSize: '16px',
            color: hovered ? token.colorText : token.colorText,
          }}
        >
          {props.title}
        </div>
      </div>
    </Link>
  );
};

const Home = (props: IProps) => {
  const windowSize = useWindowSize();

  const flexDirection = windowSize.width < 600 ? 'column' : 'row';

  const items = [
    props.isStudent ? (
      <RoleItem key="student" title="Student Console" icon={<IdcardOutlined />} linkTo="/student" />
    ) : null,
    props.isGrader ? <RoleItem key="grader" title="Grader Console" icon={<AuditOutlined />} linkTo="/grader" /> : null,
    props.isAdmin ? <RoleItem key="admin" title="Admin Console" icon={<SlidersOutlined />} linkTo="/admin" /> : null,
    props.user.codePostAdmin ? (
      <RoleItem key="dashboard" title="Staff Dashboard" icon={<DashboardOutlined />} linkTo="/dashboard" />
    ) : null,
  ];

  return (
    <PeripheralPageLayout user={props.user} handleLogout={props.handleLogout}>
      <div style={{ maxWidth: layoutVars.maxWidths.home, margin: '0 auto' }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Select your Role
        </Typography.Title>
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection }}>{items}</div>
      </div>
    </PeripheralPageLayout>
  );
};

export default Home;
