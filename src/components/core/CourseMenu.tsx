// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable react-refresh/only-export-components */
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useCallback, useMemo, useState } from 'react';

/* other library imports */
import { Link } from 'react-router-dom';
import { theme, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

/* codePost imports */
/* codePost imports */
import { Course } from '../../api-client';

import { encodeForLink } from '../core/URLutils';

import CPDropdown from './CPDropdown';

/**********************************************************************************************************************/

interface IProps {
  courses: Course[];
  currentCourse?: Course;
  base: string;
  panel?: string;
}

export const encodedCourseLink = (base: string, course: Course, panel?: string) => {
  return `/${base}/${encodeForLink(course.name)}/${encodeForLink(course.period)}/${panel !== undefined ? panel : ''}`;
};

const CourseMenu = (props: IProps) => {
  const { token } = theme.useToken();
  const [searchText, setSearchText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    setDropdownOpen(open);
    if (!open) setSearchText('');
  }, []);

  let selectorText = 'No courses yet...';
  if (props.courses.length > 0) {
    selectorText = 'Select a course';
  }

  if (props.currentCourse) {
    selectorText = `${props.currentCourse.name} | ${props.currentCourse.period}`;
  }

  // Organize and filter courses
  const { activeCourses, archivedCourses } = useMemo(() => {
    const filtered = props.courses.filter((course) => {
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return course.name.toLowerCase().includes(search) || course.period.toLowerCase().includes(search);
    });

    const active = filtered.filter((c) => !c.archived);
    const archived = filtered.filter((c) => c.archived);

    // Sort by name, then period
    const sortCourses = (a: Course, b: Course) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.period.localeCompare(b.period);
    };

    return {
      activeCourses: active.sort(sortCourses),
      archivedCourses: archived.sort(sortCourses),
    };
  }, [props.courses, searchText]);

  // Build menu items
  const menuItems = [];

  // Add search input as a non-selectable item
  if (props.courses.length > 5) {
    menuItems.push({
      key: 'search',
      label: (
        <div onClick={(e) => e.stopPropagation()} style={{ padding: '4px 0' }}>
          <Input
            placeholder="Search courses..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            autoFocus
          />
        </div>
      ),
      disabled: true,
      style: { cursor: 'default' },
    });

    menuItems.push({
      type: 'divider' as const,
      key: 'search-divider',
    });
  }

  // Add active courses
  if (activeCourses.length > 0) {
    activeCourses.forEach((course) => {
      const isCurrentCourse = props.currentCourse?.id === course.id;
      menuItems.push({
        key: course.id,
        label: (
          <Link to={encodedCourseLink(props.base, course, props.panel)}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: isCurrentCourse ? 600 : 400,
              }}
            >
              <span>{course.name}</span>
              <span style={{ color: token.colorTextTertiary, fontSize: '0.9em', marginLeft: '16px' }}>
                {course.period}
              </span>
            </div>
          </Link>
        ),
      });
    });
  }

  // Add divider and archived courses if they exist
  if (archivedCourses.length > 0) {
    if (activeCourses.length > 0) {
      menuItems.push({
        type: 'divider' as const,
        key: 'archived-divider',
      });
      menuItems.push({
        key: 'archived-label',
        label: <span style={{ color: token.colorTextTertiary, fontSize: '0.85em' }}>Archived Courses</span>,
        disabled: true,
        style: { cursor: 'default' },
      });
    }

    archivedCourses.forEach((course) => {
      const isCurrentCourse = props.currentCourse?.id === course.id;
      menuItems.push({
        key: course.id,
        label: (
          <Link to={encodedCourseLink(props.base, course, props.panel)}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: isCurrentCourse ? 600 : 400,
              }}
            >
              <span style={{ color: token.colorTextQuaternary }}>{course.name}</span>
              <span style={{ color: token.colorTextQuaternary, fontSize: '0.9em', marginLeft: '16px' }}>
                {course.period}
              </span>
            </div>
          </Link>
        ),
      });
    });
  }

  // Show "No results" if search returns nothing
  if (searchText && activeCourses.length === 0 && archivedCourses.length === 0) {
    menuItems.push({
      key: 'no-results',
      label: <span style={{ color: token.colorTextTertiary }}>No courses found</span>,
      disabled: true,
    });
  }

  return (
    <CPDropdown
      value={selectorText}
      minWidth={350}
      open={dropdownOpen}
      onOpenChange={handleOpenChange}
      menu={{
        items: menuItems,
        style: { maxHeight: '400px', overflowY: 'auto' },
      }}
    />
  );
};

export default CourseMenu;
