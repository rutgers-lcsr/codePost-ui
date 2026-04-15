// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { BookOutlined, GlobalOutlined, LoginOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Statistic, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import groupBy from 'lodash/groupBy';

import { colors } from '../../theme/colors';
import { Organization } from '../../api-client';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import AdminTableToolbar from './AdminTableToolbar';
import { AdminData } from './Dashboard';
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';

interface AdminTableProps {
  admins: AdminData[];
}

interface GroupedAdminData {
  email: string;
  organizations: Organization[];
  courses: { name: string; period: string }[];
}

const AdminTable: React.FC<AdminTableProps> = ({ admins }) => {
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useDefaultPageSize();
  const platformCaps = usePlatformCapabilities();
  const canImpersonate = platformCaps.impersonate_user !== false;

  const columns: ColumnsType<GroupedAdminData> = useMemo(
    () => [
      {
        title: 'Admin Email',
        dataIndex: 'email',
        key: 'email',
        render: (email: string) => (
          <Space>
            <UserOutlined style={{ color: colors.brandAccent }} />
            <strong>{email}</strong>
          </Space>
        ),
        sorter: (a: GroupedAdminData, b: GroupedAdminData) => a.email.localeCompare(b.email),
      },
      {
        title: 'Organization',
        dataIndex: 'organizations',
        key: 'organization',
        render: (orgs: Organization[]) => (
          <Space direction="vertical" size="small">
            {orgs.map((org) => (
              <Space key={org.id}>
                <Space>
                  <GlobalOutlined style={{ color: colors.actionBlue }} />
                  {org.name}
                </Space>
                <Tag color="blue">{org.shortname}</Tag>
              </Space>
            ))}
          </Space>
        ),
        filters: [], // Generated dynamically
        onFilter: (value, record) => record.organizations.some((org) => org.shortname === value),
      },
      {
        title: 'Courses',
        dataIndex: 'courses',
        key: 'courses',
        render: (courses: { name: string; period: string }[]) => (
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            <Space direction="vertical" size={1}>
              {courses.map((c, i) => (
                <Space key={i} style={{ fontSize: '12px' }}>
                  <BookOutlined style={{ color: colors.actionGreen, fontSize: '10px' }} />
                  <span>{c.name}</span>
                  <Tag color="green" style={{ margin: 0, fontSize: '10px', lineHeight: '18px' }}>
                    {c.period}
                  </Tag>
                </Space>
              ))}
            </Space>
          </div>
        ),
      },
      ...(canImpersonate
        ? [
            {
              title: 'Actions',
              key: 'actions',
              width: 120,
              render: (_: unknown, record: GroupedAdminData) => (
                <Tooltip title="Login as this user">
                  <Button
                    type="primary"
                    size="small"
                    icon={<LoginOutlined />}
                    onClick={() => {
                      window.location.href = `/loginAs?email=${encodeURIComponent(record.email)}`;
                    }}
                  >
                    Login As
                  </Button>
                </Tooltip>
              ),
            },
          ]
        : []),
    ],
    [canImpersonate],
  );

  // Group admins by email
  const groupedAdmins: GroupedAdminData[] = useMemo(() => {
    const grouped = groupBy(admins, 'email');
    return Object.keys(grouped).map((email) => {
      const records = grouped[email];

      // Get unique organizations
      const seenOrgs = new Set<number>();
      const uniqueOrgs: Organization[] = [];
      records.forEach((r) => {
        if (r.organization && !seenOrgs.has(r.organization.id)) {
          seenOrgs.add(r.organization.id);
          uniqueOrgs.push(r.organization);
        }
      });

      // Get courses
      const courses = records.map((r) => ({ name: r.course_name, period: r.course_period }));
      // Sort courses by name then period
      courses.sort((a, b) => {
        const nameCmp = a.name.localeCompare(b.name);
        if (nameCmp !== 0) return nameCmp;
        return a.period.localeCompare(b.period);
      });

      return {
        email,
        organizations: uniqueOrgs,
        courses,
      };
    });
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    const search = searchValue.toLowerCase();
    if (!search) return groupedAdmins;

    return groupedAdmins.filter(
      (admin) =>
        admin.email.toLowerCase().includes(search) ||
        admin.courses.some((c) => c.name.toLowerCase().includes(search) || c.period.toLowerCase().includes(search)) ||
        admin.organizations.some((o) => o.name.toLowerCase().includes(search)),
    );
  }, [groupedAdmins, searchValue]);

  // Get unique organizations for filter
  const uniqueOrgs = useMemo(() => {
    const orgMap = new Map<number, Organization>();
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
    // We can calculate total assignments from the grouped data
    const totalAssignments = groupedAdmins.reduce((acc, curr) => acc + curr.courses.length, 0);
    const uniqueCourses = new Set(admins.map((a) => a.course_name)); // Use original simple list for total unique courses
    const uniqueOrganizations = new Set(admins.map((a) => a.organization?.id).filter(Boolean));

    return {
      totalAdmins: groupedAdmins.length,
      totalUniqueCourses: uniqueCourses.size,
      totalOrganizations: uniqueOrganizations.size,
      totalAdminCourseLinks: totalAssignments,
    };
  };

  const stats = getStats();

  return (
    <>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Course Admins"
              value={stats.totalAdmins}
              prefix={<UserOutlined style={{ color: colors.brandPrimary }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Organizations"
              value={stats.totalOrganizations}
              prefix={<GlobalOutlined style={{ color: colors.actionBlue }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Unique Courses"
              value={stats.totalUniqueCourses}
              prefix={<BookOutlined style={{ color: colors.actionGreen }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Admin-Course Links"
              value={stats.totalAdminCourseLinks}
              prefix={<TeamOutlined style={{ color: colors.brandVibrant }} />}
            />
          </Col>
        </Row>
      </Card>

      <AdminTableToolbar
        searchPlaceholder="Search by email, course, or organization…"
        searchValue={searchValue}
        onSearch={setSearchValue}
      />

      <Table
        columns={columnsWithFilters}
        dataSource={filteredAdmins}
        size="middle"
        rowKey={(record) => record.email}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (total) => `Total ${total} admins`,
          onShowSizeChange: (_current, size) => setPageSize(size),
          onChange: (_page, size) => setPageSize(size),
        }}
        scroll={{ x: 'max-content' }}
      />
    </>
  );
};

export default AdminTable;
