// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { AuditOutlined, TeamOutlined } from '@ant-design/icons';

/* other library imports */
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PiStudentFill, PiChalkboardTeacherFill } from 'react-icons/pi';
import { GrUserAdmin } from 'react-icons/gr';

/* codePost imports */
import PeripheralPageLayout from './layouts/PeripheralPageLayout';
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';
import styles from './Home.module.scss';

import type { UserType } from '../../types/models';

/**********************************************************************************************************************/

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
  icon: React.ReactNode;
  linkTo: string;
  cardClass: string;
  iconClass: string;
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

  const consoles: ConsoleItem[] = [
    props.isStudent
      ? {
          key: 'student',
          title: 'Student Console',
          description: 'View assignments, submissions, and feedback',
          icon: <PiStudentFill />,
          linkTo: '/student',
          cardClass: styles.consoleCardBrand,
          iconClass: styles.consoleCardIconBrand,
        }
      : null,
    props.isGrader
      ? {
          key: 'grader',
          title: 'Grader Console',
          description: 'Review submissions and provide feedback',
          icon: <AuditOutlined />,
          linkTo: '/grader',
          cardClass: styles.consoleCardAccent,
          iconClass: styles.consoleCardIconAccent,
        }
      : null,
    props.isAdmin
      ? {
          key: 'admin',
          title: 'Admin Console',
          description: 'Manage courses, assignments, and rosters',
          icon: <PiChalkboardTeacherFill />,
          linkTo: '/admin',
          cardClass: styles.consoleCardFocus,
          iconClass: styles.consoleCardIconFocus,
        }
      : null,
    platformCaps.access_admin_dashboard
      ? {
          key: 'dashboard',
          title: 'Staff Console',
          description: 'Platform analytics and administration',
          icon: <GrUserAdmin />,
          linkTo: '/dashboard',
          cardClass: styles.consoleCardWarning,
          iconClass: styles.consoleCardIconWarning,
        }
      : null,
    platformCaps.manage_organization
      ? {
          key: 'org',
          title: 'Organization Console',
          description: 'Organization settings and member management',
          icon: <TeamOutlined />,
          linkTo: '/organization',
          cardClass: styles.consoleCardNeutral,
          iconClass: styles.consoleCardIconNeutral,
        }
      : null,
  ].filter((item): item is ConsoleItem => item !== null);

  return (
    <PeripheralPageLayout user={props.user} handleLogout={props.handleLogout} background="var(--sc-warm-bg)">
      <div className={styles.home}>
        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div className={styles.greeting} role="heading" aria-level={1}>
          <p className={styles.roleLabel}>codePost</p>
          <h1 className={styles.greetingTitle}>
            {getGreeting()}, {getDisplayName(props.user)}
          </h1>
          <p className={styles.greetingSubtitle}>Select a console to continue</p>
        </div>

        {/* ── Section header ────────────────────────────────────────────── */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Consoles</h2>
          <span className={styles.sectionCount}>{consoles.length}</span>
        </div>

        {/* ── Console cards ─────────────────────────────────────────────── */}
        <div className={styles.consoleGrid}>
          {consoles.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link to={item.linkTo} className={item.cardClass} aria-label={`Open ${item.title}`}>
                <div className={item.iconClass}>{item.icon}</div>
                <h3 className={styles.consoleCardName}>{item.title}</h3>
                <p className={styles.consoleCardDescription}>{item.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </PeripheralPageLayout>
  );
};

export default Home;
