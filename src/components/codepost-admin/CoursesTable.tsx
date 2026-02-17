import {
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FolderOutlined,
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Col, Input, Row, Space, Statistic, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';

import { colors } from '../../theme/colors';
import type { RosterType } from '../../types/models';
import { Organization, Course } from '../../api-client';
import { LOCAL_SETTINGS, PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';

import NewCourseDialog from './NewCourseDialog';

const { Search } = Input;

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
  const [pageSize, setPageSize] = useState(LOCAL_SETTINGS.defaultPageSize.getter());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  const getStats = () => {
    const activeCourses = filteredCourses.filter((c) => !c.archived).length;
    const archivedCourses = filteredCourses.filter((c) => c.archived).length;
    const totalAssignments = filteredCourses.reduce((sum, c) => sum + c.assignments.length, 0);
    const totalSections = filteredCourses.reduce((sum, c) => sum + c.sections.length, 0);

    // Use Set to count unique students (including both active and inactive)
    const allStudents = new Set<string>();
    filteredCourses.forEach((c) => {
      if (c.roster) {
        c.roster.students.forEach((email) => allStudents.add(email));
        c.roster.inactive_students.forEach((email) => allStudents.add(email));
      }
    });

    return {
      activeCourses,
      archivedCourses,
      totalAssignments,
      totalSections,
      totalStudents: allStudents.size,
    };
  };

  const stats = getStats();

  const columns: ColumnsType<CourseWithRoster> = [
    {
      title: 'Course Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CourseWithRoster) => (
        <Space direction="vertical" size="small">
          <Space>
            <BookOutlined style={{ color: record.archived ? '#8c8c8c' : '#52c41a' }} />
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
          record.roster.students.forEach((email) => uniqueStudents.add(email));
          record.roster.inactive_students.forEach((email) => uniqueStudents.add(email));
        }
        return (
          <Space>
            <UserOutlined style={{ color: '#722ed1' }} />
            {uniqueStudents.size}
          </Space>
        );
      },
      sorter: (a, b) => {
        const aSet = new Set<string>();
        const bSet = new Set<string>();
        if (a.roster) {
          a.roster.students.forEach((email) => aSet.add(email));
          a.roster.inactive_students.forEach((email) => aSet.add(email));
        }
        if (b.roster) {
          b.roster.students.forEach((email) => bSet.add(email));
          b.roster.inactive_students.forEach((email) => bSet.add(email));
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
          record.roster.courseAdmins.forEach((email) => allStaff.add(email));
          record.roster.graders.forEach((email) => allStaff.add(email));
          record.roster.superGraders.forEach((email) => allStaff.add(email));
          record.roster.inactive_courseAdmins.forEach((email) => allStaff.add(email));
          record.roster.inactive_graders.forEach((email) => allStaff.add(email));
        }
        return (
          <Space>
            <TeamOutlined style={{ color: '#13c2c2' }} />
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
        <Badge count={assignments.length} showZero style={{ backgroundColor: '#fa8c16' }}>
          <FileTextOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
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
        <Badge count={sections.length} showZero style={{ backgroundColor: '#faad14' }}>
          <FolderOutlined style={{ fontSize: '20px', color: '#faad14' }} />
        </Badge>
      ),
      sorter: (a, b) => a.sections.length - b.sections.length,
    },
  ];

  return (
    <Card
      title="Courses"
      style={{ width: '100%' }}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateDialog(true)}>
          Create Course
        </Button>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small">
            <Statistic
              title="Active Courses"
              value={stats.activeCourses}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={<span style={{ fontSize: '14px', color: '#8c8c8c' }}>/ {courses.length}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small">
            <Statistic
              title="Archived"
              value={stats.archivedCourses}
              prefix={<CloseCircleOutlined style={{ color: '#8c8c8c' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small">
            <Statistic
              title="Total Students"
              value={stats.totalStudents}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small">
            <Statistic
              title="Assignments"
              value={stats.totalAssignments}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Search
        placeholder="Search by course name, period, or organization..."
        onSearch={setSearchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        enterButton
        allowClear
        style={{ width: '100%', maxWidth: 600, marginBottom: 16 }}
      />

      <Table
        columns={columns}
        dataSource={filteredCourses}
        size="middle"
        rowKey="id"
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} courses`,
          onShowSizeChange: (_current, size) => {
            setPageSize(size);
            LOCAL_SETTINGS.defaultPageSize.setter(size);
          },
        }}
        scroll={{ x: 'max-content' }}
      />
      <NewCourseDialog
        visible={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          onRefresh();
        }}
        organizations={organizations}
      />
    </Card>
  );
};

export default CoursesTable;
