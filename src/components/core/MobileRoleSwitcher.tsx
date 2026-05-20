// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React from 'react';
import { Link } from 'react-router-dom';
import { AuditOutlined, TeamOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { PiChalkboardTeacherFill, PiStudentFill } from 'react-icons/pi';
import { Card, Flex, Typography } from 'antd';

import { User } from '../../api-client';
import { USER_TYPE } from '../../types/common';

const { Text } = Typography;

type Role = 'student' | 'grader' | 'admin';

interface IProps {
  user: User;
  currentRole: Role;
}

const ROLE_TO_USER_TYPE: Record<Role, USER_TYPE> = {
  student: USER_TYPE.STUDENT,
  grader: USER_TYPE.GRADER,
  admin: USER_TYPE.ADMIN,
};

interface RoleEntry {
  key: string;
  to: string;
  label: string;
  icon: React.ReactNode;
}

export const renderRoleSwitcher = (user: User, currentRole: Role): React.ReactNode => {
  return <MobileRoleSwitcher user={user} currentRole={currentRole} />;
};

const MobileRoleSwitcher: React.FC<IProps> = ({ user, currentRole }) => {
  const thisApp = ROLE_TO_USER_TYPE[currentRole];
  const showStudent = thisApp !== USER_TYPE.STUDENT && (user.studentCourses?.length ?? 0) > 0;
  const showGrader = thisApp !== USER_TYPE.GRADER && (user.graderCourses?.length ?? 0) > 0;
  const showAdmin = thisApp !== USER_TYPE.ADMIN && !!user.canCreateCourses;
  const showOrg = !!user.isOrgStaff;

  if (!(showStudent || showGrader || showAdmin || showOrg)) {
    return null;
  }

  const entries: RoleEntry[] = [];
  if (showStudent) {
    entries.push({ key: 'student', to: '/student', label: 'Student', icon: <PiStudentFill /> });
  }
  if (showGrader) {
    entries.push({ key: 'grader', to: '/grader', label: 'Grader', icon: <AuditOutlined /> });
  }
  if (showAdmin) {
    entries.push({ key: 'admin', to: '/admin', label: 'Admin', icon: <PiChalkboardTeacherFill /> });
  }
  if (showOrg) {
    entries.push({ key: 'org', to: '/organization', label: 'Organization', icon: <TeamOutlined /> });
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
        <UserSwitchOutlined />
        <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Switch Role
        </Text>
      </Flex>
      <Flex vertical gap={4}>
        {entries.map((e) => (
          <Link
            key={e.key}
            to={e.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 8px',
              borderRadius: 6,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 18, display: 'inline-flex' }}>{e.icon}</span>
            <Text>{e.label}</Text>
          </Link>
        ))}
      </Flex>
    </Card>
  );
};

export default MobileRoleSwitcher;
