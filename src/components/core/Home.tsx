// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

import * as React from 'react';
import { AuditOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PiStudentFill, PiChalkboardTeacherFill } from 'react-icons/pi';
import { GrUserAdmin } from 'react-icons/gr';

import PeripheralPageLayout from './layouts/PeripheralPageLayout';
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';
import styles from './Home.module.scss';

import type { UserType } from '../../types/models';

const { Title, Text } = Typography;

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface IProps {
  isStudent: boolean;
  isGrader: boolean;
  isAdmin: boolean;
  user: UserType;
  handleLogout: () => void;
}

interface ConsoleItem {
  key: string;
  title: string;
  description: string;
  icon: React.JSX.Element;
  linkTo: string;
  color: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDisplayName(user: UserType): string {
  const local = (user.email ?? '').split('@')[0].split('.')[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/* ── Component ──────────────────────────────────────────────────────────── */

const Home = (props: IProps) => {
  const platformCaps = usePlatformCapabilities();

  const consoles = (
    [
      props.isStudent
        ? {
            key: 'student',
            title: 'Student',
            description: 'View assignments, submissions, and feedback',
            icon: <PiStudentFill style={{ fontSize: 28 }} />,
            linkTo: '/student',
            color: '#198665',
          }
        : null,
      props.isGrader
        ? {
            key: 'grader',
            title: 'Grader',
            description: 'Review submissions and provide feedback',
            icon: <AuditOutlined style={{ fontSize: 28 }} />,
            linkTo: '/grader',
            color: '#1677ff',
          }
        : null,
      props.isAdmin
        ? {
            key: 'admin',
            title: 'Admin',
            description: 'Manage courses, assignments, and rosters',
            icon: <PiChalkboardTeacherFill style={{ fontSize: 28 }} />,
            linkTo: '/admin',
            color: '#722ed1',
          }
        : null,
      platformCaps.access_admin_dashboard
        ? {
            key: 'dashboard',
            title: 'Staff',
            description: 'Platform analytics and administration',
            icon: <GrUserAdmin style={{ fontSize: 28 }} />,
            linkTo: '/dashboard',
            color: '#fa8c16',
          }
        : null,
      platformCaps.manage_organization
        ? {
            key: 'org',
            title: 'Organization',
            description: 'Organization settings and member management',
            icon: <TeamOutlined style={{ fontSize: 28 }} />,
            linkTo: '/organization',
            color: '#595959',
          }
        : null,
    ] satisfies (ConsoleItem | null)[]
  ).filter((item): item is ConsoleItem => item !== null);

  return (
    <PeripheralPageLayout user={props.user} handleLogout={props.handleLogout} background="var(--sc-warm-bg)">
      <div className={styles.home}>
        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0 }}>
            {getGreeting()}, {getDisplayName(props.user)}
          </Title>
          <Text type="secondary">Select a role to continue</Text>
        </div>

        {/* ── Console cards ─────────────────────────────────────────────── */}
        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            Your Roles
          </Title>
        </Flex>

        <div className={styles.consoleGrid}>
          {consoles.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link to={item.linkTo} style={{ textDecoration: 'none' }} aria-label={`Open ${item.title}`}>
                <Card hoverable style={{ height: '100%' }}>
                  <Flex vertical gap={12}>
                    <Flex align="center" gap={12}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${item.color}10`,
                          color: item.color,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          {item.title}
                        </Text>
                        <br />
                      </div>
                    </Flex>
                    <Text type="secondary">{item.description}</Text>
                  </Flex>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </PeripheralPageLayout>
  );
};

export default Home;
