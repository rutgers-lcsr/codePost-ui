// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  BookOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  EditOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Row, Skeleton, Space, Statistic, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import { colors } from '../../theme/colors';
import useWindowSize from '../core/useWindowSize';
import type { DashboardStats, Organization, User } from '../../api-client';
import { UserIO } from '../../services/user';
import { apiErrorMessageAsync } from '../../lib/apiError';

import AdminPageHeader from './AdminPageHeader';
import AdminTableToolbar from './AdminTableToolbar';
import NewUserDialog from './NewUserDialog';
import EditUserDialog from './EditUserDialog';
import LoginAsButton from './LoginAsButton';
import { DEFINITIONS, definedTitle } from './definitions';
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';

type Role = 'courseAdmin' | 'superGrader' | 'grader' | 'student';

const ROLE_CONFIG: Record<Role, { color: string; icon: React.ReactNode; label: string }> = {
  courseAdmin: { color: 'cyan', icon: <TeamOutlined />, label: 'Course Admin' },
  superGrader: { color: 'purple', icon: <StarOutlined />, label: 'Super Grader' },
  grader: { color: 'blue', icon: <TeamOutlined />, label: 'Grader' },
  student: { color: 'green', icon: <UserOutlined />, label: 'Student' },
};

/** Roles are derived from the course lists the API returns with each user. */
function rolesOf(user: User): Role[] {
  const roles: Role[] = [];
  if (user.courseadminCourses?.length) roles.push('courseAdmin');
  if (user.superGraderCourses?.length) roles.push('superGrader');
  if (user.graderCourses?.length) roles.push('grader');
  if (user.studentCourses?.length) roles.push('student');
  return roles;
}

function coursesOf(user: User): string[] {
  const names = new Set<string>();
  [
    ...(user.studentCourses ?? []),
    ...(user.graderCourses ?? []),
    ...(user.superGraderCourses ?? []),
    ...(user.courseadminCourses ?? []),
  ].forEach((course) => names.add(`${course.name} (${course.period})`));
  return Array.from(names);
}

const SEARCH_DEBOUNCE_MS = 300;
// Below this, pinning Email as well as Actions would cover the whole width and hide Roles.
const PIN_COLUMNS_MIN_WIDTH = 768;

interface UsersTableProps {
  organizations: Organization[];
  /** Platform totals from the stats endpoint; the table itself only holds one page. */
  stats: DashboardStats;
  onRefresh: () => void;
}

/**
 * Platform users, one server-side page at a time. Search and ordering run on the server, so
 * the total always reflects the whole platform rather than whatever page happened to load.
 */
const UsersTable: React.FC<UsersTableProps> = ({ organizations, stats, onRefresh }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useDefaultPageSize();
  // The jump palette lands here with ?q=<email>; the first request searches for it straight away.
  const initialSearch = new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [ordering, setOrdering] = useState<string | undefined>(undefined);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const platformCaps = usePlatformCapabilities();
  const canImpersonate = platformCaps.impersonate_user !== false;
  const pinColumns = useWindowSize().width >= PIN_COLUMNS_MIN_WIDTH;

  // Debounce typing so each keystroke does not become a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ['staff', 'users', { page, pageSize, search, ordering }],
    queryFn: () => UserIO.listPage({ page, pageSize, search: search || undefined, ordering }),
    placeholderData: keepPreviousData,
  });

  // The error body has to be read asynchronously; the message is only shown while the query is in error.
  useEffect(() => {
    if (!usersQuery.error) return;
    let cancelled = false;
    apiErrorMessageAsync(usersQuery.error).then((msg) => {
      if (!cancelled) setErrorMessage(msg ?? 'Users could not be loaded.');
    });
    return () => {
      cancelled = true;
    };
  }, [usersQuery.error]);
  const visibleError = usersQuery.isError ? errorMessage : null;

  const orgById = useMemo(() => new Map(organizations.map((o) => [o.id, o])), [organizations]);
  const total = usersQuery.data?.count ?? 0;
  const users = usersQuery.data?.results ?? [];

  const columns: ColumnsType<User> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      fixed: pinColumns ? 'left' : undefined,
      sorter: true,
      sortOrder: ordering === 'email' ? 'ascend' : ordering === '-email' ? 'descend' : null,
      render: (email: string, record) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{email}</span>
          {record.codePostAdmin && (
            <Tag color="red" icon={<CrownOutlined />}>
              Platform Admin
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_: unknown, record) => {
        const roles = rolesOf(record);
        if (roles.length === 0) return <span style={{ color: colors.neutralSecondaryText }}>No course roles</span>;
        return (
          <Space size={4} wrap>
            {roles.map((role) => (
              <Tag key={role} color={ROLE_CONFIG[role].color} icon={ROLE_CONFIG[role].icon}>
                {ROLE_CONFIG[role].label}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Organization',
      key: 'organization',
      width: 160,
      responsive: ['md'],
      render: (_: unknown, record) => {
        const org = record.organization != null ? orgById.get(record.organization) : undefined;
        return org ? (
          <Tooltip title={org.name}>
            <Tag color="blue">{org.shortname}</Tag>
          </Tooltip>
        ) : (
          <span style={{ color: colors.neutralSecondaryText }}>—</span>
        );
      },
    },
    {
      title: 'Courses',
      key: 'courses',
      width: 110,
      responsive: ['lg'],
      render: (_: unknown, record) => {
        const courses = coursesOf(record);
        return (
          <Tooltip title={courses.length ? courses.join(', ') : 'No courses'}>
            <Space size={6}>
              <BookOutlined style={{ color: colors.actionGreen }} />
              <span>{courses.length}</span>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      // Always pinned, so Edit and Log in as stay in reach on a phone instead of past the fold.
      fixed: 'right',
      render: (_: unknown, record) => (
        <Space>
          <Tooltip title="Edit permissions">
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label={`Edit permissions for ${record.email}`}
              onClick={() => {
                setEditingUser(record);
                setShowEditDialog(true);
              }}
            />
          </Tooltip>
          {canImpersonate && record.email && <LoginAsButton email={record.email} variant="text" />}
        </Space>
      ),
    },
  ];

  const handleTableChange: TableProps<User>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.field === 'email') {
      setOrdering(single.order === 'ascend' ? 'email' : single.order === 'descend' ? '-email' : undefined);
      setPage(1);
    }
  };

  const subtitle = search
    ? `${total} user${total === 1 ? '' : 's'} matching “${search}”.`
    : `${stats.totalUniqueUsers} users across the platform.`;

  return (
    <div>
      <AdminPageHeader title="Users" subtitle={subtitle} />

      {/* Platform totals (from the stats endpoint, not from the page that happens to be loaded).
          One neutral colour: a hue per role was decoration, not meaning. */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Statistic title="Total" value={stats.totalUniqueUsers} prefix={<UserOutlined />} />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic title="Students" value={stats.totalStudents} prefix={<UserOutlined />} />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic title="Graders" value={stats.totalGraders} prefix={<TeamOutlined />} />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title={definedTitle('Course Admins', DEFINITIONS.courseAdmins)}
              value={stats.totalCourseAdmins}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title={definedTitle('Platform Admins', DEFINITIONS.platformAdmins)}
              value={stats.totalCodePostAdmins}
              prefix={<CrownOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title={definedTitle('Idle 90+ days', DEFINITIONS.inactiveUsers)}
              value={stats.totalInactiveUsers}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <AdminTableToolbar
        searchPlaceholder="Search by email or name…"
        searchValue={searchInput}
        onSearch={setSearchInput}
        createLabel="Create User"
        onCreate={() => setShowCreateDialog(true)}
        onRefresh={() => usersQuery.refetch()}
        refreshLoading={usersQuery.isFetching}
      />

      {visibleError && (
        <Alert
          type="error"
          showIcon
          title="Users could not be loaded"
          description={visibleError}
          action={
            <Button size="small" onClick={() => usersQuery.refetch()}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        size="middle"
        columns={columns}
        dataSource={users}
        rowKey="email"
        loading={usersQuery.isPending || usersQuery.isFetching}
        // Rows that are still on their way look like rows, not like an empty table.
        locale={
          usersQuery.isPending ? { emptyText: <Skeleton active title={false} paragraph={{ rows: 6 }} /> } : undefined
        }
        onChange={handleTableChange}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count, range) => `${range[0]}-${range[1]} of ${count} users`,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onChange: (nextPage, nextSize) => {
            if (nextSize !== pageSize) {
              setPageSize(nextSize);
              setPage(1);
            } else {
              setPage(nextPage);
            }
          },
        }}
        scroll={{ x: 'max-content' }}
      />

      <NewUserDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          usersQuery.refetch();
          onRefresh();
        }}
        organizations={organizations}
      />

      <EditUserDialog
        open={showEditDialog}
        user={editingUser}
        onClose={() => {
          setShowEditDialog(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          setShowEditDialog(false);
          setEditingUser(null);
          usersQuery.refetch();
          onRefresh();
        }}
        organizations={organizations}
      />
    </div>
  );
};

export default UsersTable;
