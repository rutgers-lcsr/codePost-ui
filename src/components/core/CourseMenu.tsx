// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import { useCallback, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';
import { Button, Dropdown, Input, theme } from 'antd';
import { AppstoreOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons';

import { Course } from '../../api-client';

import { encodeForLink } from '../core/URLutils';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import { usePrefetchCourse } from '../../hooks/usePrefetchCourse';

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

/* ── Period sort helper (shared across active + archived grouping) ─────── */

const SEASON_RANK: Record<string, number> = { fall: 3, summer: 2, spring: 1, winter: 0 };

function periodSortKey(p: string): number {
  const year = parseInt(p.match(/\b(20\d{2}|19\d{2})\b/)?.[1] ?? '0');
  const lower = p.toLowerCase();
  const season = Object.entries(SEASON_RANK).find(([k]) => lower.includes(k))?.[1] ?? -1;
  return year * 10 + season;
}

/* ── Compact course row ───────────────────────────────────────────────── */

interface CourseRowProps {
  course: Course;
  isCurrent: boolean;
  base: string;
  panel?: string;
  dimmed?: boolean;
  onNavigate: () => void;
  onMouseEnter: () => void;
  colorText: string;
  colorPrimary: string;
  colorPrimaryBg: string;
  colorBgTextHover: string;
}

function CourseRow({
  course,
  isCurrent,
  base,
  panel,
  dimmed,
  onNavigate,
  onMouseEnter,
  colorText,
  colorPrimary,
  colorPrimaryBg,
  colorBgTextHover,
}: CourseRowProps) {
  const [hovered, setHovered] = useState(false);

  const bg = isCurrent ? colorPrimaryBg : hovered ? colorBgTextHover : undefined;

  return (
    <Link
      to={encodedCourseLink(base, course, panel)}
      onMouseEnter={() => { setHovered(true); onMouseEnter(); }}
      onMouseLeave={() => setHovered(false)}
      onClick={onNavigate}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          background: bg,
          borderLeft: `3px solid ${isCurrent ? colorPrimary : 'transparent'}`,
          color: dimmed ? 'rgba(0,0,0,0.35)' : colorText,
          fontWeight: isCurrent ? 600 : 400,
          fontSize: 13,
          lineHeight: '18px',
          transition: 'background 0.12s',
        }}
      >
        {course.name}
      </div>
    </Link>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

const CourseMenu = (props: IProps) => {
  const { token } = theme.useToken();
  const [searchText, setSearchText] = useState('');
  const [open, setOpen] = useState(false);
  const prefetchCourse = usePrefetchCourse();

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSearchText('');
  }, []);

  const close = useCallback(() => setOpen(false), []);

  /* ── Filter + group active courses by period ────────────────────────── */

  const { groupedActive, archivedCourses } = useMemo(() => {
    const search = searchText.toLowerCase();
    const matches = (c: Course) =>
      !search || c.name.toLowerCase().includes(search) || c.period.toLowerCase().includes(search);

    const active = props.courses.filter((c) => !c.archived && matches(c));
    const archived = props.courses.filter((c) => c.archived && matches(c));

    const sortByName = (a: Course, b: Course) => a.name.localeCompare(b.name);
    archived.sort(sortByName);

    // Group active by period, newest period first
    const groups = new Map<string, Course[]>();
    for (const c of active) {
      const list = groups.get(c.period) ?? [];
      list.push(c);
      groups.set(c.period, list);
    }
    for (const list of groups.values()) list.sort(sortByName);

    const groupedActive = [...groups.entries()].sort((a, b) => periodSortKey(b[0]) - periodSortKey(a[0]));

    return { groupedActive, archivedCourses: archived };
  }, [props.courses, searchText]);

  const noResults = searchText && groupedActive.length === 0 && archivedCourses.length === 0;

  /* ── Trigger label ──────────────────────────────────────────────────── */

  let label = props.courses.length === 0 ? 'No courses yet…' : 'Select a course';
  if (props.currentCourse) {
    label = `${props.currentCourse.name} | ${props.currentCourse.period}`;
  }

  /* ── Custom dropdown content ────────────────────────────────────────── */

  const dropdownContent = (
    <div
      style={{
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        width: 300,
        overflow: 'hidden',
      }}
    >
      {/* Search */}
      <div
        style={{
          padding: '7px 10px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <SearchOutlined style={{ color: token.colorTextTertiary, fontSize: 13 }} />
        <Input
          placeholder="Search courses…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          autoFocus
          variant="borderless"
          style={{ padding: 0, fontSize: 13 }}
        />
      </div>

      {/* Course groups */}
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {groupedActive.map(([period, courses]) => (
          <div key={period}>
            <div
              style={{
                padding: '8px 12px 3px',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: token.colorTextTertiary,
                userSelect: 'none',
              }}
            >
              {period}
            </div>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                isCurrent={props.currentCourse?.id === course.id}
                base={props.base}
                panel={props.panel}
                onNavigate={close}
                onMouseEnter={() => prefetchCourse(course)}
                colorText={token.colorText}
                colorPrimary={token.colorPrimary}
                colorPrimaryBg={token.colorPrimaryBg}
                colorBgTextHover={token.colorBgTextHover}
              />
            ))}
          </div>
        ))}

        {/* Archived */}
        {archivedCourses.length > 0 && (
          <>
            <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, margin: '4px 0' }} />
            <div
              style={{
                padding: '4px 12px 3px',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: token.colorTextTertiary,
                userSelect: 'none',
              }}
            >
              Archived
            </div>
            {archivedCourses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                isCurrent={props.currentCourse?.id === course.id}
                base={props.base}
                panel={props.panel}
                dimmed
                onNavigate={close}
                onMouseEnter={() => prefetchCourse(course)}
                colorText={token.colorText}
                colorPrimary={token.colorPrimary}
                colorPrimaryBg={token.colorPrimaryBg}
                colorBgTextHover={token.colorBgTextHover}
              />
            ))}
          </>
        )}

        {/* No results */}
        {noResults && (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              fontSize: 13,
              color: token.colorTextTertiary,
            }}
          >
            No courses found
          </div>
        )}
      </div>

      {/* Footer */}
      {props.courses.length > 1 && (
        <div
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: '4px 8px',
          }}
        >
          <Link
            to={`/${props.base}/`}
            onClick={() => {
              LOCAL_SETTINGS.defaultCourse.setter(0);
              close();
            }}
            style={{ textDecoration: 'none' }}
          >
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              size="small"
              style={{ color: token.colorTextSecondary, width: '100%', textAlign: 'left' }}
            >
              View all courses
            </Button>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={handleOpenChange}
      trigger={['click']}
      dropdownRender={() => dropdownContent}
    >
      <Button
        style={{
          minWidth: 160,
          maxWidth: 320,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
            {label}
          </span>
          <DownOutlined style={{ fontSize: 10, flexShrink: 0 }} />
        </div>
      </Button>
    </Dropdown>
  );
};

export default CourseMenu;
