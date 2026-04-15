// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FolderOutlined,
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Badge, Card, Col, Row, Space, Statistic, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';

import { colors } from '../../theme/colors';
import type { RosterType } from '../../types/models';
import { Organization, Course } from '../../api-client';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';

import AdminTableToolbar from './AdminTableToolbar';
import NewCourseDialog from './NewCourseDialog';
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';

const addEmailToSet = (target: Set<string>, email: string | null | undefined) => {
  if (email) target.add(email);
};

interface CourseWithRoster extends Omit<Course, 'organization'> {
  roster?: RosterType;
  organization?: Organization;
}

interface CoursesTableProps {
  courses: Course[];
  rosters: RosterType[];
  organizations: Organization[];
  onRefresh: () => void;
}

const CoursesTable: React.FC<CoursesTableProps> = ({ courses, rosters, organizations, onRefresh }) => {
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useDefaultPageSize();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const platformCaps = usePlatformCapabilities();
  const canCreateCourse = platformCaps.create_course !== false;

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

  const stats = useMemo(() => {
    const activeCourses = filteredCourses.filter((c) => !c.archived).length;
    const archivedCourses = filteredCourses.filter((c) => c.archived).length;
    const totalAssignments = filteredCourses.reduce((sum, c) => sum + c.assignments.length, 0);
    const totalSections = filteredCourses.reduce((sum, c) => sum + c.sections.length, 0);

    const allStudents = new Set<string>();
    filteredCourses.forEach((c) => {
      if (c.roster) {
        c.roster.students.forEach((email) => addEmailToSet(allStudents, email));
        c.roster.inactiveStudents.forEach((email) => addEmailToSet(allStudents, email));
      }
    });

    return { activeCourses, archivedCourses, totalAssignments, totalSections, totalStudents: allStudents.size };
  }, [filteredCourses]);

  const columns: ColumnsType<CourseWithRoster> = [
    {
      title: 'Course Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CourseWithRoster) => (
        <Space direction="vertical" size="small">
          <Space>
            <BookOutlined style={{ color: record.archived ? colors.neutralDisable : colors.actionGreen }} />
            <strong>{name}</strong>
          </Space>
          <Tag color={record.archived ? 'default' : 'green'}>{record.period}</Tag>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Organization',
      dataIndex: 'organization',
      key: 'organization',
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
      title: 'Status',
      dataIndex: 'archived',
      key: 'archived',
      width: 120,
      render: (archived: boolean) =>
        archived ? (
          <Tag icon={<CloseCircleOutlined />} color="default">
            Archived
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">
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
      render: (_: unknown, record: CourseWithRoster) => {
        // Use Set to count unique students (in case someone is listed in both active and inactive)
        const uniqueStudents = new Set<string>();
        if (record.roster) {
          record.roster.students.forEach((email) => addEmailToSet(uniqueStudents, email));
          record.roster.inactiveStudents.forEach((email) => addEmailToSet(uniqueStudents, email));
        }
        return (
          <Space>
            <UserOutlined style={{ color: colors.brandAccent }} />
            {uniqueStudents.size}
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
      render: (_: unknown, record: CourseWithRoster) => {
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
      render: (assignments: number[]) => (
        <Badge count={assignments.length} showZero style={{ backgroundColor: colors.actionYellow }}>
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
      render: (sections: number[]) => (
        <Badge count={sections.length} showZero style={{ backgroundColor: colors.actionYellowFade }}>
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
        scroll={{ x: 'max-content' }}
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
