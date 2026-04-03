// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  BookOutlined,
  CalendarOutlined,
  CrownOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  HeartOutlined,
  TeamOutlined,
  UserOutlined,
  UserAddOutlined,
  DashboardOutlined,
  NotificationOutlined,
  RiseOutlined,
  ApiOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Layout,
  Menu,
  theme,
} from 'antd';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

import { colors } from '../../theme/colors';
import useFixedWindow from '../core/useFixedWindow';
import CPLogo from '../core/CPLogo';
import uniqBy from 'lodash/uniqBy';

import AdminPageHeader from './AdminPageHeader';
import AdminTable from './AdminTable';
import SystemHealth from './SystemHealth';
import CoursesTable from './CoursesTable';
import OrganizationTable from './OrganizationTable';
import UsersTable from './UsersTable';
import APIIframe from './APIIframe';
import ActivityFeed from './ActivityFeed';
import MaintenanceBannerPanel from './MaintenanceBannerPanel';
import DeployCalendar from './DeployCalendar';
import AIUsageDashboard from '../core/AIUsageDashboard';
import { AIUsageService } from '../../services/aiUsage';
import PendingAdminsTable from './PendingAdminsTable';
import PromptLab from './PromptLab';

import type { RosterType, UserType } from '../../types/models';
import { Organization, Course } from '../../api-client';
import { organizationsApi, coursesApi } from '../../api-client/clients';
import { UserIO } from '../../services/user';

const { Text } = Typography;
const { Content, Sider } = Layout;

type TabType =
  | 'Overview'
  | 'Organizations'
  | 'Courses'
  | 'Admins'
  | 'Pending Admins'
  | 'Users'
  | 'Activity'
  | 'Deploy Calendar'
  | 'System Health'
  | 'Banner'
  | 'API'
  | 'AI Usage'
  | 'Prompt Lab';

export interface AdminData {
  id: number;
  key: number;
  organization: Organization | undefined;
  course_name: string;
  course_period: string;
  email: string;
}

const isNonEmptyEmail = (email: string | null | undefined): email is string => Boolean(email);

const asNullableStringArray = (value: Array<string | null> | null | undefined): Array<string | null> =>
  Array.isArray(value) ? value : [];

const asStringArray = (value: string[] | null | undefined): string[] => (Array.isArray(value) ? value : []);

const normalizeRoster = (roster: Partial<RosterType>): RosterType => {
  return {
    ...roster,
    students: asNullableStringArray(roster.students),
    graders: asNullableStringArray(roster.graders),
    superGraders: asNullableStringArray(roster.superGraders),
    rubricEditors: asNullableStringArray(roster.rubricEditors),
    courseAdmins: asNullableStringArray(roster.courseAdmins),
    inactiveStudents: asNullableStringArray(roster.inactiveStudents),
    inactiveGraders: asNullableStringArray(roster.inactiveGraders),
    inactiveCourseAdmins: asNullableStringArray(roster.inactiveCourseAdmins),
    notActivated: asStringArray(roster.notActivated),
  } as RosterType;
};

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
      const uniqueOrgs = uniqBy(organizationData, 'id');
      const uniqueCourses = uniqBy(courseData, 'id');
      setOrganizations(uniqueOrgs);
      setCourses(uniqueCourses);

      // Fetch rosters for admin list (needed for Admins tab)
      // TODO: This could also be optimized with a bulk endpoint
      const rosterData = await Promise.all(
        uniqueCourses.map(async (course) => {
          const roster = (await coursesApi.rosterRetrieve({ id: course.id })) as Partial<RosterType>;
          return normalizeRoster(roster);
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
          const uniqueUsers = uniqBy(userData, 'email');
          setUsers(uniqueUsers);
          setUsersLoaded(true);
        })
        .catch(console.error)
        .finally(() => setUsersLoading(false));
    }
  }, [currentTab, usersLoaded, usersLoading]);

  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={220}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div style={{ padding: '16px 16px 8px', textAlign: 'center' }}>
            <Skeleton.Avatar active size={48} shape="square" />
            <Skeleton active paragraph={false} title={{ width: 120, style: { margin: '12px auto 0' } }} />
          </div>
          <div style={{ padding: '8px 16px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton.Button key={i} active block style={{ height: 32, marginBottom: 8 }} />
            ))}
          </div>
        </Sider>
        <Layout style={{ marginLeft: 220, background: token.colorBgLayout }}>
          <Content style={{ padding: 24 }}>
            <Skeleton active paragraph={false} title={{ width: 280 }} style={{ marginBottom: 24 }} />
            <Row gutter={[16, 16]}>
              {[1, 2, 3].map((i) => (
                <Col xs={24} sm={8} key={i}>
                  <Card>
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </Card>
                </Col>
              ))}
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <Col xs={24} sm={12} lg={6} key={i}>
                  <Card>
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          </Content>
        </Layout>
      </Layout>
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
      <div style={{ padding: 24 }}>
        <AdminPageHeader title="Overview" subtitle="Platform-wide metrics and system status at a glance." />

        {/* ── Hero Stats ─────────────────────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card style={{ borderLeft: `3px solid ${colors.brandPrimary}` }}>
              <Statistic
                title="Unique Users"
                value={stats.totalUniqueUsers}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: 36, fontWeight: 600, color: colors.brandPrimary }}
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {stats.avgStudentsPerCourse} avg students / course
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderLeft: `3px solid ${colors.actionGreen}` }}>
              <Statistic
                title="Active Courses"
                value={stats.activeCourses}
                suffix={
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    / {stats.totalCourses}
                  </Text>
                }
                prefix={<BookOutlined />}
                valueStyle={{ fontSize: 36, fontWeight: 600, color: colors.actionGreen }}
              />
              <Tag color="default" style={{ marginTop: 4 }}>
                {stats.archivedCourses} archived
              </Tag>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderLeft: `3px solid ${colors.actionBlue}` }}>
              <Statistic
                title="Organizations"
                value={stats.totalOrganizations}
                prefix={<GlobalOutlined />}
                valueStyle={{ fontSize: 36, fontWeight: 600, color: colors.actionBlue }}
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {stats.avgCoursesPerOrg} avg courses / org
              </Text>
            </Card>
          </Col>
        </Row>

        {/* ── Secondary Stats — single card with inline items ─────── */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Platform Admins"
                value={stats.totalCodePostAdmins}
                prefix={<CrownOutlined style={{ color: colors.actionRed }} />}
                valueStyle={{ color: colors.actionRed }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Course Admins"
                value={stats.totalCourseAdmins}
                prefix={<TeamOutlined style={{ color: colors.brandVibrant }} />}
                valueStyle={{ color: colors.brandVibrant }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Graders"
                value={stats.totalGraders}
                prefix={<TeamOutlined style={{ color: colors.actionBlue }} />}
                valueStyle={{ color: colors.actionBlue }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Students"
                value={stats.totalStudents}
                prefix={<UserOutlined style={{ color: colors.brandPrimary }} />}
                valueStyle={{ color: colors.brandPrimary }}
              />
            </Col>
          </Row>
        </Card>

        {/* ── Tertiary Summary Bar ────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
            padding: '8px 12px',
            background: token.colorBgLayout,
            borderRadius: token.borderRadius,
          }}
        >
          <Text type="secondary">
            <BookOutlined style={{ marginRight: 4 }} />
            {stats.totalAssignments.toLocaleString()} assignments
          </Text>
          <Text type="secondary">
            <TeamOutlined style={{ marginRight: 4 }} />
            {stats.totalSections} sections
          </Text>
          <Text type="secondary">
            <UserOutlined style={{ marginRight: 4 }} />
            {stats.totalInactiveUsers} inactive users
          </Text>
        </div>

        {/* ── Charts and Tables Row ──────────────────────────────── */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top Organizations by Courses" bordered={false}>
              <Table
                dataSource={topOrganizations}
                pagination={false}
                size="small"
                rowKey="id"
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
                    width: 80,
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
                          strokeColor={colors.brandPrimary}
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
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <SystemHealth compact />
              <MaintenanceBannerPanel compact />
            </Space>
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
          <div style={{ padding: 24 }}>
            <AdminPageHeader
              title="Course Administrators"
              subtitle="All users with course admin roles across the platform."
            />
            <AdminTable admins={admins} />
          </div>
        );
      case 'Pending Admins':
        return <PendingAdminsTable />;
      case 'Organizations':
        return (
          <div style={{ padding: 24 }}>
            <AdminPageHeader
              title="Organizations"
              subtitle={`${organizations.length} organizations on the platform.`}
            />
            <OrganizationTable organizations={organizations} rosters={rosters} onRefresh={fetchData} />
          </div>
        );
      case 'Courses':
        return (
          <div style={{ padding: 24 }}>
            <AdminPageHeader title="Courses" subtitle={`${courses.length} courses across all organizations.`} />
            <CoursesTable courses={courses} rosters={rosters} organizations={organizations} onRefresh={fetchData} />
          </div>
        );
      case 'Users':
        if (usersLoading) {
          return (
            <div style={{ padding: 24 }}>
              <AdminPageHeader title="Users" />
              <Card>
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </div>
          );
        }
        return <UsersTable rosters={rosters} organizations={organizations} users={users} onRefresh={fetchData} />;
      case 'Activity':
        return <ActivityFeed />;
      case 'Deploy Calendar':
        return <DeployCalendar />;
      case 'System Health':
        return (
          <div style={{ padding: 24 }}>
            <AdminPageHeader title="System Health" subtitle="Real-time infrastructure status and diagnostics." />
            <SystemHealth />
          </div>
        );
      case 'Banner':
        return (
          <div style={{ padding: 24 }}>
            <AdminPageHeader
              title="Maintenance Banner"
              subtitle="Broadcast a maintenance message to all platform users."
            />
            <MaintenanceBannerPanel />
          </div>
        );
      case 'API':
        return <APIIframe />;
      case 'AI Usage':
        return (
          <div style={{ padding: 24 }}>
            <AdminPageHeader
              title="AI Usage"
              subtitle="Platform-wide AI token consumption and breakdown by organization."
            />
            <AIUsageDashboard
              fetchUsage={AIUsageService.getPlatformUsage}
              title="Platform AI Usage"
              breakdownLabel="Organization"
            />
          </div>
        );
      case 'Prompt Lab':
        return <PromptLab />;
      default:
        return null;
    }
  };

  const pendingCount = 0; // TODO: wire up from API if available

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 16px 8px', textAlign: 'center' }}>
          <Link to="/">
            <CPLogo cpType="main" />
          </Link>
          <Typography.Title
            level={1}
            style={{
              color: token.colorPrimary,
              marginTop: 8,
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            SuperAdmin
          </Typography.Title>
        </div>

        <Divider style={{ margin: '0 16px', borderColor: 'rgba(255,255,255,0.08)', minWidth: 'auto', width: 'auto' }} />

        <nav aria-label="SuperAdmin navigation" style={{ flex: 1 }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentTab]}
            onClick={({ key }) => setCurrentTab(key as TabType)}
            style={{ borderRight: 0 }}
            items={[
              // ── Platform ──
              {
                type: 'group',
                label: 'Platform',
                children: [
                  {
                    key: 'Overview',
                    icon: <DashboardOutlined />,
                    label: 'Overview',
                  },
                ],
              },

              // ── Management ──
              {
                type: 'group',
                label: 'Management',
                children: [
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
                    key: 'Users',
                    icon: <UserOutlined />,
                    label: users.length ? `Users (${users.length})` : 'Users',
                  },
                  {
                    key: 'Admins',
                    icon: <TeamOutlined />,
                    label: `Admins (${admins.length})`,
                  },
                  {
                    key: 'Pending Admins',
                    icon: <UserAddOutlined />,
                    label: (
                      <span>
                        Pending Admins
                        {pendingCount > 0 && <Badge count={pendingCount} size="small" style={{ marginLeft: 8 }} />}
                      </span>
                    ),
                  },
                ],
              },

              // ── Operations ──
              {
                type: 'group',
                label: 'Operations',
                children: [
                  {
                    key: 'Activity',
                    icon: <RiseOutlined />,
                    label: 'Activity',
                  },
                  {
                    key: 'Deploy Calendar',
                    icon: <CalendarOutlined />,
                    label: 'Deploy Calendar',
                  },
                  {
                    key: 'System Health',
                    icon: <HeartOutlined />,
                    label: 'System Health',
                  },
                  {
                    key: 'Banner',
                    icon: <NotificationOutlined />,
                    label: 'Banner',
                  },
                ],
              },

              // ── Developer ──
              {
                type: 'group',
                label: 'Developer',
                children: [
                  {
                    key: 'API',
                    icon: <ApiOutlined />,
                    label: 'API',
                  },
                  {
                    key: 'AI Usage',
                    icon: <RobotOutlined />,
                    label: 'AI Usage',
                  },
                  {
                    key: 'Prompt Lab',
                    icon: <ExperimentOutlined />,
                    label: 'Prompt Lab',
                  },
                ],
              },
            ]}
          />
        </nav>

        {/* Version badge */}
        <div style={{ padding: '8px 16px 12px', textAlign: 'center' }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {process.env.REACT_APP_VERSION || 'dev'}
          </Text>
        </div>
      </Sider>
      <Layout style={{ height: '100vh', overflowY: 'auto', background: token.colorBgLayout, marginLeft: 220 }}>
        <Content role="main" style={{ margin: '0', overflow: 'initial', paddingBottom: 64 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
