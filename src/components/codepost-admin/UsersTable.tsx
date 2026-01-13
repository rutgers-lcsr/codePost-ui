import {
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  GlobalOutlined,
  LoginOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Col, Input, Row, Space, Statistic, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';

import { LOCAL_SETTINGS, PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import { colors } from '../../theme/colors';
import { RosterType } from '../../infrastructure/course';
import { OrganizationType } from '../../infrastructure/organization';
import { UserType } from '../../infrastructure/user';

import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import NewUserDialog from './NewUserDialog';
import EditUserDialog from './EditUserDialog';

const { Search } = Input;

export interface UserData {
  email: string;
  organizations: Set<string>; // org shortnames
  courses: Set<string>; // course names with periods
  roles: Set<'student' | 'grader' | 'superGrader' | 'courseAdmin'>;
  isCodePostAdmin: boolean; // Platform-wide admin (different from courseAdmin!)
  isActive: boolean;
  totalCourses: number;
  organizationDetails: OrganizationType[];
  fullUserData?: UserType; // Optional: full user data from API
}

interface UsersTableProps {
  rosters: RosterType[];
  organizations: OrganizationType[];
  users: UserType[];
  onRefresh: () => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ rosters, organizations, users, onRefresh }) => {
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(LOCAL_SETTINGS.defaultPageSize.getter());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Build comprehensive user list from rosters AND User.list()
  const usersMap = useMemo(() => {
    const map = new Map<string, UserData>();

    // First, process rosters to get role information
    rosters.forEach((roster) => {
      const org = organizations.find((o) => o.id === roster.organization);
      const courseKey = `${roster.name} (${roster.period})`;

      // Helper to add or update user
      const addUser = (
        emailRaw: string,
        role: 'student' | 'grader' | 'superGrader' | 'courseAdmin',
        isActive: boolean,
      ) => {
        const email = emailRaw.toLowerCase();
        if (!map.has(email)) {
          map.set(email, {
            email: emailRaw,
            organizations: new Set(),
            courses: new Set(),
            roles: new Set(),
            isCodePostAdmin: false, // Will be set from User.list() data
            isActive: false, // Default to false, OR logic will enable it
            totalCourses: 0,
            organizationDetails: [],
          });
        }

        const user = map.get(email)!;
        if (org) {
          user.organizations.add(org.shortname);
          if (!user.organizationDetails.find((o) => o.id === org.id)) {
            user.organizationDetails.push(org);
          }
        }
        user.courses.add(courseKey);
        user.roles.add(role);
        user.totalCourses = user.courses.size;

        // If user is active in *any* course context, they are active overall.
        // OR logic: (current) OR (new entry)
        if (isActive) {
          user.isActive = true;
        }
      };

      // Add active users
      roster.students.forEach((email) => addUser(email, 'student', true));
      roster.graders.forEach((email) => addUser(email, 'grader', true));
      roster.superGraders.forEach((email) => addUser(email, 'superGrader', true));
      roster.courseAdmins.forEach((email) => addUser(email, 'courseAdmin', true));

      // Add inactive users
      roster.inactive_students.forEach((email) => addUser(email, 'student', false));
      roster.inactive_graders.forEach((email) => addUser(email, 'grader', false));
      roster.inactive_courseAdmins.forEach((email) => addUser(email, 'courseAdmin', false));
    });

    // Then, merge in full user data from User.list()
    users.forEach((fullUser) => {
      const email = fullUser.email.toLowerCase();
      if (map.has(email)) {
        // User exists from rosters, add full user data and codePostAdmin status
        const user = map.get(email)!;
        user.fullUserData = fullUser;
        user.isCodePostAdmin = fullUser.codePostAdmin;
        // Also ensure isActive is true if they exist in User.list (which means they are a platform user)
        // Unless we only want "Active in a Course" to count.
        // Usually User.list users are active unless 'is_active' flag on user model is false.
        // But here we're tracking course activity.
        // Let's assume User.list() returns active accounts.
        // Actually, let's trust the course logic for course activity, and just set platform admin flag.
      } else {
        // User not in rosters, add them with data from User object
        const userOrg = organizations.find((o) => o.id === fullUser.organization);

        // Determine roles from the user's course arrays
        const roles = new Set<'student' | 'grader' | 'superGrader' | 'courseAdmin'>();
        if (fullUser.studentCourses.length > 0) roles.add('student');
        if (fullUser.graderCourses.length > 0) roles.add('grader');
        if (fullUser.superGraderCourses.length > 0) roles.add('superGrader');
        if (fullUser.courseadminCourses.length > 0) roles.add('courseAdmin');

        // Get all unique courses
        const allCourses = new Set<string>();
        [
          ...fullUser.studentCourses,
          ...fullUser.graderCourses,
          ...fullUser.superGraderCourses,
          ...fullUser.courseadminCourses,
        ].forEach((course) => allCourses.add(`${course.name} (${course.period})`));

        map.set(email, {
          email: fullUser.email,
          organizations: userOrg ? new Set([userOrg.shortname]) : new Set(),
          courses: allCourses,
          roles,
          isCodePostAdmin: fullUser.codePostAdmin, // Platform-wide admin flag
          isActive: true, // Users from User.list() are generally active
          totalCourses: allCourses.size,
          organizationDetails: userOrg ? [userOrg] : [],
          fullUserData: fullUser,
        });
      }
    });

    return map;
  }, [rosters, organizations, users]);

  // Convert to array for table
  const usersData = useMemo(() => Array.from(usersMap.values()), [usersMap]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchText) return usersData;

    const search = searchText.toLowerCase();
    return usersData.filter(
      (user) =>
        user.email.toLowerCase().includes(search) ||
        Array.from(user.organizations).some((org) => org.toLowerCase().includes(search)) ||
        Array.from(user.courses).some((course) => course.toLowerCase().includes(search)) ||
        Array.from(user.roles).some((role) => role.toLowerCase().includes(search)),
    );
  }, [usersData, searchText]);

  // Get statistics
  const getStats = () => {
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter((u) => u.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    const students = usersData.filter((u) => u.roles.has('student')).length;
    const graders = usersData.filter((u) => u.roles.has('grader') || u.roles.has('superGrader')).length;
    const courseAdmins = usersData.filter((u) => u.roles.has('courseAdmin')).length;
    const codePostAdmins = usersData.filter((u) => u.isCodePostAdmin).length;

    return { totalUsers, activeUsers, inactiveUsers, students, graders, courseAdmins, codePostAdmins };
  };

  const stats = getStats();

  // Role badge renderer
  const renderRoles = (roles: Set<string>, isCodePostAdmin: boolean) => {
    const roleArray = Array.from(roles);
    const roleConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      courseAdmin: { color: 'cyan', icon: <TeamOutlined />, label: 'Course Admin' },
      superGrader: { color: 'purple', icon: <StarOutlined />, label: 'Super Grader' },
      grader: { color: 'blue', icon: <TeamOutlined />, label: 'Grader' },
      student: { color: 'green', icon: <UserOutlined />, label: 'Student' },
    };

    return (
      <Space size={4} wrap>
        {/* Show Platform Admin badge first if applicable */}
        {isCodePostAdmin && (
          <Tag key="codePostAdmin" color="red" icon={<CrownOutlined />}>
            Platform Admin
          </Tag>
        )}
        {roleArray.map((role) => {
          const config = roleConfig[role];
          return (
            <Tag key={role} color={config.color} icon={config.icon}>
              {config.label}
            </Tag>
          );
        })}
      </Space>
    );
  };

  const columns: ColumnsType<UserData> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250,
      fixed: 'left',
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (email: string, record: UserData) => (
        <Space>
          <UserOutlined style={{ color: record.isActive ? '#52c41a' : '#faad14' }} />
          <span style={{ fontWeight: 500 }}>{email}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record: UserData) => record.isActive === value,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Active
          </Tag>
        ) : (
          <Tag color="warning" icon={<CloseCircleOutlined />}>
            Inactive
          </Tag>
        ),
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      width: 350,
      filters: [
        { text: 'Platform Admin', value: 'codePostAdmin' },
        { text: 'Course Admin', value: 'courseAdmin' },
        { text: 'Super Grader', value: 'superGrader' },
        { text: 'Grader', value: 'grader' },
        { text: 'Student', value: 'student' },
      ],
      onFilter: (value, record: UserData) => {
        if (value === 'codePostAdmin') return record.isCodePostAdmin;
        return record.roles.has(value as 'student' | 'grader' | 'superGrader' | 'courseAdmin');
      },
      render: (_: unknown, record: UserData) => renderRoles(record.roles, record.isCodePostAdmin),
    },
    {
      title: 'Organizations',
      dataIndex: 'organizations',
      key: 'organizations',
      width: 200,
      render: (orgs: Set<string>) => (
        <Space size={4} wrap>
          <GlobalOutlined style={{ color: colors.actionBlue }} />
          <Badge count={orgs.size} showZero style={{ backgroundColor: colors.actionBlue }} />
          <Tooltip title={Array.from(orgs).join(', ')}>
            <span style={{ color: '#666' }}>{Array.from(orgs).slice(0, 2).join(', ')}</span>
            {orgs.size > 2 && <span style={{ color: '#999' }}> +{orgs.size - 2}</span>}
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Courses',
      dataIndex: 'totalCourses',
      key: 'totalCourses',
      width: 120,
      sorter: (a, b) => a.totalCourses - b.totalCourses,
      render: (count: number, record: UserData) => (
        <Space>
          <BookOutlined style={{ color: '#52c41a' }} />
          <Tooltip title={Array.from(record.courses).join(', ')}>
            <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: UserData) => (
        <Space>
          {record.fullUserData && (
            <Tooltip title="Edit Permissions">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingUser(record.fullUserData!);
                  setShowEditDialog(true);
                }}
              />
            </Tooltip>
          )}
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
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              valueStyle={{ color: colors.actionBlue }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.activeUsers}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={stats.inactiveUsers}
              valueStyle={{ color: '#faad14' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Students"
              value={stats.students}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Graders"
              value={stats.graders}
              valueStyle={{ color: colors.actionBlue }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Course Admins"
              value={stats.courseAdmins}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Platform Admins"
              value={stats.codePostAdmins}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Create */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search by email, organization, course, or role..."
          allowClear
          enterButton
          size="large"
          style={{ maxWidth: 600 }}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={setSearchText}
        />
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setShowCreateDialog(true)}>
          Create User
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="email"
        pagination={{
          pageSize,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onShowSizeChange: (_current, size) => {
            setPageSize(size);
            LOCAL_SETTINGS.defaultPageSize.setter(size);
          },
        }}
        scroll={{ x: 'max-content' }}
      />

      <NewUserDialog
        visible={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          onRefresh();
        }}
        organizations={organizations}
      />

      <EditUserDialog
        visible={showEditDialog}
        user={editingUser}
        onClose={() => {
          setShowEditDialog(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          setShowEditDialog(false);
          setEditingUser(null);
          onRefresh();
        }}
        organizations={organizations}
      />
    </div>
  );
};

export default UsersTable;
