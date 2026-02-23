// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  BookOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined,
  RiseOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { Alert, Card, Col, Progress, Row, Spin, Statistic, Table, Tag, Typography, Layout, Menu, theme } from 'antd';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

import { colors } from '../../theme/colors';
import useFixedWindow from '../core/useFixedWindow';
import CPLogo from '../core/CPLogo';
import _ from 'lodash';

import AdminTable from './AdminTable';
import SystemHealth from './SystemHealth';
import CoursesTable from './CoursesTable';
import OrganizationTable from './OrganizationTable';
import UsersTable from './UsersTable';
import APIIframe from './APIIframe';
import ActivityFeed from './ActivityFeed';

import type { RosterType, UserType } from '../../types/models';
import { Organization, Course } from '../../api-client';
import { organizationsApi, coursesApi } from '../../api-client/clients';
import { UserIO } from '../../services/user';

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

type TabType = 'Overview' | 'Organizations' | 'Courses' | 'Admins' | 'Users' | 'Activity' | 'API';

export interface AdminData {
  id: number;
  key: number;
  organization: Organization | undefined;
  course_name: string;
  course_period: string;
  email: string;
}

const isNonEmptyEmail = (email: string | null | undefined): email is string => Boolean(email);

interface DashboardStats {
  totalOrganizations: number;
  totalCourses: number;
  activeCourses: number;
  archivedCourses: number;
  totalCourseAdmins: number; // Users with course admin role (may have other roles too)
  totalCodePostAdmins: number; // Platform-wide codePost administrators
  totalGraders: number; // Users with grader role (may have other roles too)
  totalStudents: number; // Users with student role (may have other roles too)
  totalUniqueUsers: number; // Total unique people (regardless of roles)
  totalSections: number;
  totalAssignments: number;
  avgCoursesPerOrg: number;
  avgStudentsPerCourse: number;
  totalInactiveUsers: number;
}

type TopOrganization = Organization & { courseCount: number };

const Dashboard = () => {
  useFixedWindow();
  const { token } = theme.useToken();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentTab, setCurrentTab] = useState<TabType>('Overview');
  const [isLoading, setIsLoading] = useState(true);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalCourses: 0,
    activeCourses: 0,
    archivedCourses: 0,
    totalCourseAdmins: 0,
    totalCodePostAdmins: 0,
    totalGraders: 0,
    totalStudents: 0,
    totalUniqueUsers: 0,
    totalSections: 0,
    totalAssignments: 0,
    avgCoursesPerOrg: 0,
    avgStudentsPerCourse: 0,
    totalInactiveUsers: 0,
  });

  const api = organizationsApi;

  const buildAdminList = (_rosters: RosterType[], _organizations: Organization[]): AdminData[] => {
    let idCounter = 0;
    return _rosters.flatMap((roster, index) =>
      roster.courseAdmins.filter(isNonEmptyEmail).map((email) => {
        return {
          id: idCounter++,
          key: index,
          organization: _organizations.find((_org) => _org.id === roster.organization),
          course_name: roster.name,
          course_period: roster.period,
          email,
        };
      }),
    );
  };

  const fetchData = useCallback(async () => {
    try {
      // Fetch stats from backend (efficient aggregated queries)
      // Also fetch orgs and courses for tables, but NOT all users
      const [statsData, organizationData, courseData] = await Promise.all([
        UserIO.getDashboardStats(),
        api.list(),
        coursesApi.list(),
      ]);

      setStats(statsData);
      const uniqueOrgs = _.uniqBy(organizationData, 'id');
      const uniqueCourses = _.uniqBy(courseData, 'id');
      setOrganizations(uniqueOrgs);
      setCourses(uniqueCourses);

      // Fetch rosters for admin list (needed for Admins tab)
      // TODO: This could also be optimized with a bulk endpoint
      const rosterData = await Promise.all(
        uniqueCourses.map(async (course) => {
          const roster = (await coursesApi.rosterRetrieve({ id: course.id })) as RosterType;
          return roster;
        }),
      );

      setRosters(rosterData);
      const adminList = buildAdminList(rosterData, uniqueOrgs);
      setAdmins(adminList);

      // Users are loaded on-demand when Users tab is selected (lazy loading)
      // setUsers is called from UsersTable component
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // Lazy load users when Users tab is selected
  useEffect(() => {
    if (currentTab === 'Users' && !usersLoaded && !usersLoading) {
      setUsersLoading(true);
      UserIO.list()
        .then((userData) => {
          const uniqueUsers = _.uniqBy(userData, 'email');
          setUsers(uniqueUsers);
          setUsersLoaded(true);
        })
        .catch(console.error)
        .finally(() => setUsersLoading(false));
    }
  }, [currentTab, usersLoaded, usersLoading]);

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0px', textAlign: 'center' }}>
        <Spin size="large" tip="Loading dashboard data..." aria-label="Loading dashboard data" />
      </div>
    );
  }

  const renderOverview = () => {
    const topOrganizations: TopOrganization[] = organizations
      .map((org) => ({
        ...org,
        courseCount: courses.filter((c) => rosters.find((r) => r.id === c.id && r.organization === org.id)).length,
      }))
      .sort((a, b) => b.courseCount - a.courseCount)
      .slice(0, 5);

    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '46px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Admin Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Welcome back! Here's what's happening with your platform.
          </Text>
        </div>

        {/* Stats Cards Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Organizations"
                value={stats.totalOrganizations}
                prefix={<GlobalOutlined style={{ color: colors.actionBlue }} />}
                valueStyle={{ color: colors.actionBlue }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">{stats.avgCoursesPerOrg} avg courses/org</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Courses"
                value={stats.activeCourses}
                suffix={<Text type="secondary">/ {stats.totalCourses}</Text>}
                prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="default">{stats.archivedCourses} archived</Tag>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Users with Student Role"
                value={stats.totalStudents}
                prefix={<UserOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">{stats.avgStudentsPerCourse} avg/course</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Assignments"
                value={stats.totalAssignments}
                prefix={<BookOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Across all courses</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Stats Cards Row 2 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Unique Users"
                value={stats.totalUniqueUsers}
                prefix={<UserOutlined style={{ color: colors.actionBlue }} />}
                valueStyle={{ color: colors.actionBlue }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Unique people (any role)</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Course Admins"
                value={stats.totalCourseAdmins}
                prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
                valueStyle={{ color: '#13c2c2' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Course-level administrators</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Platform Admins"
                value={stats.totalCodePostAdmins}
                prefix={<CrownOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">codePost administrators</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Users with Grader Role"
                value={stats.totalGraders}
                prefix={<TeamOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Grading staff</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Sections"
                value={stats.totalSections}
                prefix={<TeamOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Course sections</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Inactive Users"
                value={stats.totalInactiveUsers}
                prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                valueStyle={{ color: '#8c8c8c' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Inactive accounts</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts and Tables Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top Organizations by Courses" bordered={false}>
              <Table
                dataSource={topOrganizations}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Organization',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name: string) => <Text strong>{name}</Text>,
                  },
                  {
                    title: 'Courses',
                    dataIndex: 'courseCount',
                    key: 'courseCount',
                    width: 100,
                    align: 'center',
                    render: (count: number) => <Tag color="blue">{count}</Tag>,
                  },
                  {
                    title: 'Usage',
                    dataIndex: 'courseCount',
                    key: 'usage',
                    width: 150,
                    render: (count: number, record: TopOrganization) => {
                      const maxCourses = Math.max(...topOrganizations.map((o) => o.courseCount));
                      const percent = maxCourses > 0 ? (count / maxCourses) * 100 : 0;
                      return (
                        <Progress
                          percent={Math.round(percent)}
                          size="small"
                          aria-label={`Usage for ${record.name}: ${Math.round(percent)}%`}
                        />
                      );
                    },
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <SystemHealth />
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col span={24}>
            <Alert
              message="Platform Status"
              description={`System is running smoothly. ${stats.totalCourses} active courses across ${stats.totalOrganizations} organizations.`}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          </Col>
        </Row>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'Overview':
        return renderOverview();
      case 'Admins':
        return (
          <div style={{ padding: '24px' }}>
            <AdminTable admins={admins} />
          </div>
        );
      case 'Organizations':
        return (
          <div style={{ padding: '24px' }}>
            <OrganizationTable organizations={organizations} rosters={rosters} onRefresh={fetchData} />
          </div>
        );
      case 'Courses':
        return (
          <div style={{ padding: '24px' }}>
            <CoursesTable courses={courses} rosters={rosters} organizations={organizations} onRefresh={fetchData} />
          </div>
        );
      case 'Users':
        if (usersLoading) {
          return (
            <div style={{ padding: '40px 0px', textAlign: 'center' }}>
              <Spin size="large" tip="Loading users..." aria-label="Loading users" />
            </div>
          );
        }
        return <UsersTable rosters={rosters} organizations={organizations} users={users} onRefresh={fetchData} />;
      case 'Activity':
        return <ActivityFeed />;
      case 'API':
        return <APIIframe />;
      default:
        return null; // Should fall back to overview if needed, but currentTab limits logic
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Link to="/">
            <CPLogo cpType="main" />
          </Link>
          <Typography.Title
            level={1}
            style={{
              color: token.colorPrimary,
              marginTop: '8px',
              fontWeight: 500,
              fontSize: '18px',
            }}
          >
            SuperAdmin Console
          </Typography.Title>
        </div>

        <nav aria-label="SuperAdmin navigation">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentTab]}
            onClick={({ key }) => setCurrentTab(key as TabType)}
            items={[
              {
                key: 'Overview',
                icon: <DashboardOutlined />,
                label: 'Overview',
              },
              {
                key: 'Organizations',
                icon: <GlobalOutlined />,
                label: `Organizations (${organizations.length})`,
              },
              {
                key: 'Courses',
                icon: <BookOutlined />,
                label: `Courses (${courses.length})`,
              },
              {
                key: 'Admins',
                icon: <TeamOutlined />,
                label: `Admins (${admins.length})`,
              },
              {
                key: 'Users',
                icon: <UserOutlined />,
                label: `Users (${users.length})`,
              },
              {
                key: 'Activity',
                icon: <RiseOutlined />,
                label: 'Activity',
              },
              {
                key: 'API',
                icon: <ApiOutlined />,
                label: 'API',
              },
            ]}
          />
        </nav>
      </Sider>
      <Layout style={{ height: '100vh', overflowY: 'auto', background: '#f0f2f5', marginLeft: 200 }}>
        <Content role="main" style={{ margin: '24px 16px 0', overflow: 'initial', paddingBottom: '100px' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
