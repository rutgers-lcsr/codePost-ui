/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */

import { AuditOutlined, TeamOutlined } from '@ant-design/icons';
import { Typography, theme, Card, Row, Col } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';
import { PiStudentFill, PiChalkboardTeacherFill } from 'react-icons/pi';
import { GrUserAdmin } from 'react-icons/gr';
/* codePost imports */
import PeripheralPageLayout from './layouts/PeripheralPageLayout';

import { UserType } from '../../infrastructure/user';

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
  const { token } = theme.useToken();
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link to={props.linkTo} style={{ textDecoration: 'none' }}>
      <Card
        hoverable
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: '100%',
          textAlign: 'center',
          borderColor: hovered ? token.colorPrimary : token.colorBorderSecondary,
          transition: 'all 0.3s ease',
          transform: hovered ? 'translateY(-5px)' : 'none',
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          gap: '24px',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            color: hovered ? token.colorPrimary : token.colorTextSecondary,
            transition: 'color 0.3s ease',
            lineHeight: 1,
          }}
        >
          {props.icon}
        </div>
        <Typography.Text
          strong
          style={{
            fontSize: '18px',
            color: hovered ? token.colorPrimary : token.colorText,
          }}
        >
          {props.title}
        </Typography.Text>
      </Card>
    </Link>
  );
};

const Home = (props: IProps) => {
  const items = [
    props.isStudent ? (
      <Col xs={24} sm={12} md={8} lg={6} key="student">
        <RoleItem title="Student Console" icon={<PiStudentFill />} linkTo="/student" />
      </Col>
    ) : null,
    props.isGrader ? (
      <Col xs={24} sm={12} md={8} lg={6} key="grader">
        <RoleItem title="Grader Console" icon={<AuditOutlined />} linkTo="/grader" />
      </Col>
    ) : null,
    props.isAdmin ? (
      <Col xs={24} sm={12} md={8} lg={6} key="admin">
        <RoleItem title="Admin Console" icon={<PiChalkboardTeacherFill />} linkTo="/admin" />
      </Col>
    ) : null,
    props.user.codePostAdmin ? (
      <Col xs={24} sm={12} md={8} lg={6} key="dashboard">
        <RoleItem title="Staff Console" icon={<GrUserAdmin />} linkTo="/dashboard" />
      </Col>
    ) : null,
    props.user.isOrgStaff ? (
      <Col xs={24} sm={12} md={8} lg={6} key="org">
        <RoleItem title="Organization Console" icon={<TeamOutlined />} linkTo="/organization" />
      </Col>
    ) : null,
  ];

  return (
    <PeripheralPageLayout user={props.user} handleLogout={props.handleLogout}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Welcome Back!
          </Typography.Title>
          <Typography.Text style={{ fontSize: '16px' }}>Select a console to continue</Typography.Text>
        </div>

        <Row gutter={[24, 24]} justify="center">
          {items}
        </Row>
      </div>
    </PeripheralPageLayout>
  );
};

export default Home;
