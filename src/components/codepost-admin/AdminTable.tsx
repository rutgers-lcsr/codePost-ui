import { BookOutlined, GlobalOutlined, LoginOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Space, Statistic, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';

import { colors } from '../../theme/colors';
import { CourseType } from '../../infrastructure/course';
import { OrganizationType } from '../../infrastructure/organization';
import { AdminData } from './Dashboard';

const { Search } = Input;

export interface AdminRecord {
  email: string;
  organization: OrganizationType;
  course: CourseType;
  course_name: string;
  course_period: string;
}

interface AdminTableProps {
  admins: AdminData[];
}

const columns: ColumnsType<AdminData> = [
  {
    title: 'Admin Email',
    dataIndex: 'email',
    key: 'email',
    render: (email: string) => (
      <Space>
        <UserOutlined style={{ color: '#722ed1' }} />
        <strong>{email}</strong>
      </Space>
    ),
  },
  {
    title: 'Organization',
    dataIndex: 'organization',
    key: 'organization',
    render: (org: OrganizationType) => (
      <Space direction="vertical" size="small">
        <Space>
          <GlobalOutlined style={{ color: colors.actionBlue }} />
          {org.name}
        </Space>
        <Tag color="blue">{org.shortname}</Tag>
      </Space>
    ),
    filters: [],
    onFilter: (value, record: AdminData) => record.organization?.shortname === value,
  },
  {
    title: 'Course',
    dataIndex: 'course_name',
    key: 'course',
    render: (_: string, record: AdminData) => (
      <Space direction="vertical" size="small">
        <Space>
          <BookOutlined style={{ color: '#52c41a' }} />
          <strong>{record.course_name}</strong>
        </Space>
        <Tag color="green">{record.course_period}</Tag>
      </Space>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (_: unknown, record: AdminData) => (
      <Tooltip title="Login as this user">
        <Button
          type="primary"
          size="small"
          icon={<LoginOutlined />}
          onClick={() => window.open(`/loginAs?email=${record.email}`, '_blank')}
        >
          Login As
        </Button>
      </Tooltip>
    ),
  },
];

const AdminTable: React.FC<AdminTableProps> = ({ admins }) => {
  const [searchValue, setSearchValue] = useState('');

  const filteredAdmins = useMemo(() => {
    const search = searchValue.toLowerCase();
    if (!search) return admins;

    return admins.filter(
      (admin) =>
        admin.email.toLowerCase().includes(search) ||
        admin.course_name.toLowerCase().includes(search) ||
        admin.course_period.toLowerCase().includes(search) ||
        admin.organization?.name.toLowerCase().includes(search),
    );
  }, [admins, searchValue]);

  // Get unique organizations for filter
  const uniqueOrgs = useMemo(() => {
    const orgMap = new Map<number, OrganizationType>();
    admins.forEach((admin) => {
      if (admin.organization) {
        orgMap.set(admin.organization.id, admin.organization);
      }
    });
    return Array.from(orgMap.values());
  }, [admins]);

  // Update columns with filters
  const columnsWithFilters = useMemo(() => {
    return columns.map((col) => {
      if (col.key === 'organization') {
        return {
          ...col,
          filters: uniqueOrgs.map((org) => ({ text: org.shortname, value: org.shortname })),
        };
      }
      return col;
    });
  }, [uniqueOrgs]);

  const getStats = () => {
    const uniqueAdmins = new Set(filteredAdmins.map((a) => a.email));
    const uniqueCourses = new Set(filteredAdmins.map((a) => a.course_name));
    const uniqueOrganizations = new Set(filteredAdmins.map((a) => a.organization?.id).filter(Boolean));

    return {
      totalAdmins: uniqueAdmins.size,
      totalCourses: uniqueCourses.size,
      totalOrganizations: uniqueOrganizations.size,
      totalAssignments: filteredAdmins.length,
    };
  };

  const stats = getStats();

  return (
    <Card title="Course Administrators" style={{ width: '100%' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Unique Admins"
              value={stats.totalAdmins}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Organizations"
              value={stats.totalOrganizations}
              prefix={<GlobalOutlined style={{ color: colors.actionBlue }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Courses"
              value={stats.totalCourses}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Admin Assignments"
              value={stats.totalAssignments}
              prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Search
        placeholder="Search by email, course, or organization..."
        onSearch={setSearchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        enterButton
        allowClear
        style={{ width: '100%', maxWidth: 600, marginBottom: 16 }}
      />

      <Table
        columns={columnsWithFilters}
        dataSource={filteredAdmins}
        size="middle"
        rowKey={(record) => `${record.email}-${record.id}`}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} admin assignments`,
        }}
      />
    </Card>
  );
};

export default AdminTable;
