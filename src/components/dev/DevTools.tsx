import React, { useState } from 'react';
import { FloatButton, message } from 'antd';
import {
  BugOutlined,
  UserOutlined,
  TeamOutlined,
  EditOutlined,
  RocketOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { UserType } from '../../types/models';

interface IProps {
  replaceUser: (user: UserType, redirect: boolean, isSuperUser: boolean) => void;
}

const DevTools: React.FC<IProps> = (props) => {
  const [loading, setLoading] = useState(false);

  const handleLoginAs = async (role: string) => {
    if (loading) return;
    setLoading(true);
    const key = 'dev_login';
    message.loading({ content: `Switching to ${role}...`, key });

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dev-auth/login-as/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        const data = await res.json();
        props.replaceUser(data, true, role === 'staff');
        message.success({ content: `Logged in as ${role}`, key });
      } else {
        const err = await res.json();
        message.error({ content: `Error: ${err.error}`, key });
      }
    } catch (e) {
      message.error({ content: `Network Error: ${e}`, key });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FloatButton.Group trigger="click" type="primary" style={{ right: 24, bottom: 24 }} icon={<BugOutlined />}>
      <FloatButton icon={<UserOutlined />} tooltip="Student" onClick={() => handleLoginAs('student')} />
      <FloatButton icon={<TeamOutlined />} tooltip="Grader (Basic)" onClick={() => handleLoginAs('grader_basic')} />
      <FloatButton icon={<EditOutlined />} tooltip="Grader (Rubric)" onClick={() => handleLoginAs('grader_rubric')} />
      <FloatButton icon={<RocketOutlined />} tooltip="Super Grader" onClick={() => handleLoginAs('grader_super')} />
      <FloatButton icon={<CrownOutlined />} tooltip="Course Admin" onClick={() => handleLoginAs('course_admin')} />
      <FloatButton icon={<SafetyCertificateOutlined />} tooltip="Staff" onClick={() => handleLoginAs('staff')} />
    </FloatButton.Group>
  );
};

export default DevTools;
