// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  FileTextOutlined,
  FolderOutlined,
  GlobalOutlined,
  LoginOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import { colors } from '../../theme/colors';
import type { RosterType } from '../../types/models';
import { Organization, Course } from '../../api-client';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';

import AdminTableToolbar from './AdminTableToolbar';
import LoginAsButton from './LoginAsButton';
import { startImpersonation } from '../core/impersonation';
import useWindowSize from '../core/useWindowSize';
import NewCourseDialog from './NewCourseDialog';
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';

const { Text } = Typography;

// antd's green tag puts #389e0d on #f6ffed (3.1:1); green-8 on the brand's light tint reads 5.3:1.
const GREEN_TAG = { color: '#0d7354', background: '#f0fff6', borderColor: '#9ce6c3' } as const;
// A count on the yellow badge needs dark text: white on #ffbf00 is 1.6:1.
const YELLOW_BADGE = { backgroundColor: '#ffbf00', color: '#1b1b1b', boxShadow: 'none' } as const;

const addEmailToSet = (target: Set<string>, email: string | null | undefined) => {
  if (email) target.add(email);
};

const isNonEmptyEmail = (email: string | null | undefined): email is string => Boolean(email);

interface CourseWithRoster extends Omit<Course, 'organization'> {
  roster?: RosterType;
  organization?: Organization;
}

interface CoursesTableProps {
  courses: Course[];
  rosters: RosterType[];
  /** Rosters load after the course list; roster-derived cells show a spinner until then. */
  rostersLoading?: boolean;
  organizations: Organization[];
  onRefresh: () => void;
}

const CoursesTable: React.FC<CoursesTableProps> = ({
  courses,
  rosters,
  rostersLoading = false,
  organizations,
  onRefresh,
}) => {
  // The jump palette lands here with ?q=<course name>, and may do so again while the table is mounted.
  const [searchValue, setSearchValue] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const location = useLocation();
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q !== null && q !== searchValue) setSearchValue(q);
    // Only the URL's q matters here; typing in the box sets searchValue itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  const [pageSize, setPageSize] = useDefaultPageSize();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const platformCaps = usePlatformCapabilities();
  const canCreateCourse = platformCaps.create_course !== false;
  const canImpersonate = platformCaps.impersonate_user !== false;

  const coursesWithData: CourseWithRoster[] = useMemo(() => {
    return courses.map((course) => {
      const roster = rosters.find((r) => r.id === course.id);
      const org = organizations.find((o) => o.id === roster?.organization);
      return { ...course, roster, organization: org };
    });
  }, [courses, rosters, organizations]);

  const filteredCourses = useMemo(() => {
    const search = searchValue.toLowerCase();
    if (!search) return coursesWithData;

    return coursesWithData.filter(
      (course) =>
        course.name.toLowerCase().includes(search) ||
        course.period.toLowerCase().includes(search) ||
        course.organization?.name.toLowerCase().includes(search) ||
        course.organization?.shortname.toLowerCase().includes(search),
    );
  }, [coursesWithData, searchValue]);

  // Platform-wide totals: these do not change while the user types in the search box.
  const stats = useMemo(() => {
    const activeCourses = coursesWithData.filter((c) => !c.archived).length;
    const archivedCourses = coursesWithData.filter((c) => c.archived).length;
    const totalAssignments = coursesWithData.reduce((sum, c) => sum + c.assignments.length, 0);
    const totalSections = coursesWithData.reduce((sum, c) => sum + c.sections.length, 0);

    const allStudents = new Set<string>();
    coursesWithData.forEach((c) => {
      if (c.roster) {
        c.roster.students.forEach((email) => addEmailToSet(allStudents, email));
        c.roster.inactiveStudents.forEach((email) => addEmailToSet(allStudents, email));
      }
    });

    return { activeCourses, archivedCourses, totalAssignments, totalSections, totalStudents: allStudents.size };
  }, [coursesWithData]);

  // On a phone the table shares the width and wraps; wider screens keep every column at its natural width.
  const isPhone = useWindowSize().width < 768;

  const columns: ColumnsType<CourseWithRoster> = [
    {
      title: 'Course Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CourseWithRoster) => (
        <Space orientation="vertical" size="small">
          <Space>
            <BookOutlined style={{ color: record.archived ? colors.neutralDisable : colors.actionGreen }} />
            <strong>{name}</strong>
          </Space>
          <Tag style={record.archived ? undefined : GREEN_TAG}>{record.period}</Tag>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Organization',
      dataIndex: 'organization',
      key: 'organization',
      responsive: ['md'],
      render: (org?: Organization) =>
        org ? (
          <Space>
            <GlobalOutlined style={{ color: colors.actionBlue }} />
            <Tooltip title={org.name}>
              <Tag color="blue">{org.shortname}</Tag>
            </Tooltip>
          </Space>
        ) : (
          <Tag color="default">N/A</Tag>
        ),
      filters: organizations.map((org) => ({ text: org.shortname, value: org.id })),
      onFilter: (value, record) => record.organization?.id === value,
    },
    {
      // The direct route from a course to the person who runs it.
      title: 'Admins',
      key: 'admins',
      render: (_: unknown, record: CourseWithRoster) => {
        if (!record.roster) {
          return rostersLoading ? <Spin size="small" aria-label="Loading admins" /> : <Text type="secondary">—</Text>;
        }
        const admins = record.roster.courseAdmins.filter(isNonEmptyEmail);
        if (admins.length === 0) return <Text type="secondary">No admins</Text>;
        // One "Log in as" per row: a menu picks the admin when there are several.
        const loginAs = !canImpersonate ? null : admins.length === 1 ? (
          <LoginAsButton email={admins[0]} variant="text" />
        ) : (
          <Dropdown
            menu={{
              items: admins.map((email) => ({ key: email, icon: <LoginOutlined />, label: email })),
              onClick: ({ key }) => {
                const email = String(key);
                Modal.confirm({
                  title: `Log in as ${email}?`,
                  content:
                    'You will see codePost as this user. A bar at the bottom of every page brings you back here.',
                  okText: 'Log in as user',
                  onOk: () => startImpersonation(email),
                });
              },
            }}
            trigger={['click']}
          >
            <Button
              type="link"
              size="small"
              icon={<LoginOutlined />}
              style={{ padding: 0, height: 'auto' }}
              aria-label={`Log in as one of ${record.name}'s admins`}
            >
              Log in as <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
        );
        return (
          <Space orientation="vertical" size={2}>
            {admins.map((email) => (
              <Text key={email} style={{ fontSize: 13, maxWidth: 220, wordBreak: 'break-word' }}>
                {email}
              </Text>
            ))}
            {loginAs}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'archived',
      key: 'archived',
      width: 120,
      responsive: ['sm'],
      render: (archived: boolean) =>
        archived ? (
          <Tag icon={<CloseCircleOutlined />} color="default">
            Archived
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} style={GREEN_TAG}>
            Active
          </Tag>
        ),
      filters: [
        { text: 'Active', value: false },
        { text: 'Archived', value: true },
      ],
      onFilter: (value, record) => record.archived === value,
    },
    {
      title: 'Students',
      key: 'students',
      width: 100,
      responsive: ['sm'],
      render: (_: unknown, record: CourseWithRoster) => {
        // Use Set to count unique students (in case someone is listed in both active and inactive)
        const uniqueStudents = new Set<string>();
        if (record.roster) {
          record.roster.students.forEach((email) => addEmailToSet(uniqueStudents, email));
          record.roster.inactiveStudents.forEach((email) => addEmailToSet(uniqueStudents, email));
        }
        // Before the roster arrives, the course list's own count is good enough.
        const count = record.roster ? uniqueStudents.size : (record.studentCount ?? 0);
        return (
          <Space>
            <UserOutlined style={{ color: colors.brandAccent }} />
            {count}
          </Space>
        );
      },
      sorter: (a, b) => {
        const aSet = new Set<string>();
        const bSet = new Set<string>();
        if (a.roster) {
          a.roster.students.forEach((email) => addEmailToSet(aSet, email));
          a.roster.inactiveStudents.forEach((email) => addEmailToSet(aSet, email));
        }
        if (b.roster) {
          b.roster.students.forEach((email) => addEmailToSet(bSet, email));
          b.roster.inactiveStudents.forEach((email) => addEmailToSet(bSet, email));
        }
        return aSet.size - bSet.size;
      },
    },
    {
      title: 'Staff',
      key: 'staff',
      width: 100,
      responsive: ['md'],
      render: (_: unknown, record: CourseWithRoster) => {
        if (!record.roster && rostersLoading) return <Spin size="small" aria-label="Loading staff" />;
        // Use Set to avoid double-counting users with multiple roles
        const allStaff = new Set<string>();
        if (record.roster) {
          record.roster.courseAdmins.forEach((email) => addEmailToSet(allStaff, email));
          record.roster.graders.forEach((email) => addEmailToSet(allStaff, email));
          record.roster.superGraders.forEach((email) => addEmailToSet(allStaff, email));
          record.roster.inactiveCourseAdmins.forEach((email) => addEmailToSet(allStaff, email));
          record.roster.inactiveGraders.forEach((email) => addEmailToSet(allStaff, email));
        }
        return (
          <Space>
            <TeamOutlined style={{ color: colors.brandVibrant }} />
            {allStaff.size}
          </Space>
        );
      },
    },
    {
      title: 'Assignments',
      dataIndex: 'assignments',
      key: 'assignments',
      width: 120,
      responsive: ['lg'],
      render: (assignments: number[]) => (
        <Badge count={assignments.length} showZero style={YELLOW_BADGE}>
          <FileTextOutlined style={{ fontSize: '20px', color: colors.actionYellow }} />
        </Badge>
      ),
      sorter: (a, b) => a.assignments.length - b.assignments.length,
    },
    {
      title: 'Sections',
      dataIndex: 'sections',
      key: 'sections',
      width: 110,
      responsive: ['lg'],
      render: (sections: number[]) => (
        <Badge count={sections.length} showZero style={YELLOW_BADGE}>
          <FolderOutlined style={{ fontSize: '20px', color: '#faad14' }} />
        </Badge>
      ),
      sorter: (a, b) => a.sections.length - b.sections.length,
    },
  ];

  return (
    <>
      {/* Stats */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Active"
              value={stats.activeCourses}
              prefix={<CheckCircleOutlined style={{ color: colors.actionGreen }} />}
              suffix={<span style={{ fontSize: 14, color: colors.neutralSecondaryText }}>/ {courses.length}</span>}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Archived"
              value={stats.archivedCourses}
              prefix={<CloseCircleOutlined style={{ color: colors.neutralDisable }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Students"
              value={stats.totalStudents}
              prefix={<UserOutlined style={{ color: colors.brandPrimary }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Assignments"
              value={stats.totalAssignments}
              prefix={<FileTextOutlined style={{ color: colors.actionYellow }} />}
            />
          </Col>
        </Row>
      </Card>

      <AdminTableToolbar
        searchPlaceholder="Search by course name, period, or organization…"
        searchValue={searchValue}
        onSearch={setSearchValue}
        createLabel={canCreateCourse ? 'Create Course' : undefined}
        onCreate={canCreateCourse ? () => setShowCreateDialog(true) : undefined}
      />

      <Table
        columns={columns}
        dataSource={filteredCourses}
        size="middle"
        rowKey="id"
        rowClassName={(record) => (record.archived ? 'ant-table-row-archived' : '')}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} courses`,
          onShowSizeChange: (_current, size) => setPageSize(size),
          onChange: (_page, size) => setPageSize(size),
        }}
        scroll={isPhone ? undefined : { x: 'max-content' }}
      />
      <NewCourseDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          onRefresh();
        }}
        organizations={organizations}
      />
    </>
  );
};

export default CoursesTable;
