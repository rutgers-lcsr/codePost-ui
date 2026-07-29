// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { FileTextOutlined, FolderOutlined, FormOutlined } from '@ant-design/icons';

import { Menu } from 'antd';

import { Link, useLocation } from 'react-router-dom';

import { Course } from '../../api-client';
import { encodedCourseLink } from '../core/CourseMenu';

interface IProps {
  course: Course;
  assignmentsCount: number;
  quizzesCount: number;
}

/** Muted count pill; inverts to a translucent white chip on the selected (green) item. */
const countPill = (count: number, selected: boolean) =>
  count > 0 ? (
    <span
      style={{
        fontSize: 12,
        lineHeight: '18px',
        padding: '0 7px',
        borderRadius: 9,
        // Darker chip + text so both states clear WCAG AA: white-on-25%-white over green
        // was near-invisible; the muted 0.6 text was borderline on the light pill.
        background: selected ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.06)',
        color: selected ? '#fff' : 'rgba(0, 0, 0, 0.75)',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

const navLabel = (text: string, count: number, to: string, selected: boolean) => (
  <Link to={to} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span>{text}</span>
    {countPill(count, selected)}
  </Link>
);

/** In-page page list for the student course view (docs-sidebar style):
 *  Assignments and Quizzes (each with a count of items still needing action), and the
 *  course file directory. */
const StudentNav: React.FC<IProps> = ({ course, assignmentsCount, quizzesCount }) => {
  const location = useLocation();
  // The quiz-take route renders outside this shell, so /quizzes always means the Quizzes page.
  const selectedKey = /\/quizzes(?:\/|$)/.test(location.pathname)
    ? 'quizzes'
    : /\/files(?:\/|$)/.test(location.pathname)
      ? 'files'
      : 'assignments';

  return (
    <nav aria-label="Course pages" style={{ width: 200, flexShrink: 0, position: 'sticky', top: 24 }}>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ background: 'transparent', borderRight: 0 }}
        items={[
          {
            key: 'assignments',
            icon: <FileTextOutlined />,
            label: navLabel(
              'Assignments',
              assignmentsCount,
              encodedCourseLink('student', course),
              selectedKey === 'assignments',
            ),
          },
          {
            key: 'quizzes',
            icon: <FormOutlined />,
            label: navLabel(
              'Quizzes',
              quizzesCount,
              encodedCourseLink('student', course, 'quizzes'),
              selectedKey === 'quizzes',
            ),
          },
          {
            key: 'files',
            icon: <FolderOutlined />,
            label: navLabel('Files', 0, encodedCourseLink('student', course, 'files'), selectedKey === 'files'),
          },
        ]}
      />
    </nav>
  );
};

export default StudentNav;
