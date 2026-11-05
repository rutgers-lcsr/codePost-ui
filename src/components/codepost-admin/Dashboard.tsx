// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  ApiOutlined,
  BookOutlined,
  CalendarOutlined,
  CodeOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  NotificationOutlined,
  RiseOutlined,
  RobotOutlined,
  SearchOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Divider,
  Layout,
  Menu,
  Modal,
  Result,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { Link, useLocation, useNavigate } from 'react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useFixedWindow from '../core/useFixedWindow';
import useWindowSize from '../core/useWindowSize';
import CPLogo from '../core/CPLogo';
import uniqBy from 'lodash/uniqBy';
import { apiErrorMessageAsync } from '../../lib/apiError';

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
import AutogradingStats from './AutogradingStats';

import type { RosterType } from '../../types/models';
import type { AssignmentDeadline, Course, DashboardStats, Organization } from '../../api-client';
import { organizationsApi, coursesApi, dashboardApi } from '../../api-client/clients';
import { UserIO } from '../../services/user';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import { DEFINITIONS, definedTitle } from './definitions';
import { formatWindow, nextSafeWindow } from './deployWindows';
import JumpPalette from './JumpPalette';

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
  | 'Autograding'
  | 'System Health'
  | 'Banner'
  | 'API'
  | 'AI Usage'
  | 'Prompt Lab';

export const DASHBOARD_PATH = '/dashboard';

/** URL segment for each tab (`/dashboard/<slug>`), so views can be linked, refreshed and navigated back to. */
const TAB_SLUGS: Record<TabType, string> = {
  Overview: 'overview',
  Organizations: 'organizations',
  Courses: 'courses',
  Users: 'users',
  Admins: 'admins',
  'Pending Admins': 'pending-admins',
  Activity: 'activity',
  'Deploy Calendar': 'deploy-calendar',
  Autograding: 'autograding',
  'System Health': 'system-health',
  Banner: 'banner',
  API: 'api',
  'AI Usage': 'ai-usage',
  'Prompt Lab': 'prompt-lab',
};

const DEVELOPER_TABS: TabType[] = ['API', 'AI Usage', 'Prompt Lab'];

const SLUG_TO_TAB: Record<string, TabType> = Object.fromEntries(
  (Object.entries(TAB_SLUGS) as [TabType, string][]).map(([tab, slug]) => [slug, tab]),
);

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

const EMPTY_STATS: DashboardStats = {
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
  activeUsers30d: 0,
};

type TopOrganization = Organization & { courseCount: number };

const SIDER_WIDTH = 220;
const SIDER_COLLAPSED_WIDTH = 64;
// Below this the sider hides completely and a corner trigger brings it back.
const PHONE_BREAKPOINT = 768;
// antd's orange tag puts #d46b08 on #fff7e6 (3.3:1); orange-8 text on the same tint reads 5.4:1.
const WARNING_TAG = { color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' } as const;
// antd's green tag is 3.1:1 at 12px; green-8 on the brand's light tint reads 5.3:1.
const GOOD_TAG = { color: '#0d7354', background: '#f0fff6', borderColor: '#9ce6c3' } as const;
// red-7 under the white badge count: antd's #ff4d4f is 3.5:1.
const BADGE_RED = '#cf1322';

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

const Dashboard = () => {
  useFixedWindow();
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  const isPhone = windowSize.width < PHONE_BREAKPOINT;
  const [collapsed, setCollapsed] = useState(() => LOCAL_SETTINGS.staffSidebarCollapsed.getter());
  const [jumpOpen, setJumpOpen] = useState(false);
  // Remember a deliberate collapse; the lg breakpoint's automatic one is not a preference.
  const onCollapse = useCallback((next: boolean, type: 'clickTrigger' | 'responsive') => {
    if (type === 'clickTrigger') {
      setCollapsed(next);
      LOCAL_SETTINGS.staffSidebarCollapsed.setter(next);
      return;
    }
    // The lg breakpoint fires on mount and on every resize: a narrow window always collapses,
    // a wide one returns to the remembered preference instead of forcing the sider open.
    setCollapsed(next || LOCAL_SETTINGS.staffSidebarCollapsed.getter());
  }, []);

  const slug = location.pathname.replace(/^\/dashboard\/?/, '').split('/')[0];
  const currentTab: TabType = SLUG_TO_TAB[slug] ?? 'Overview';

  // The banner editor reports unsaved edits here; in-app navigation away from it asks first (reload and
  // close get the browser's own prompt from the panel). Back/forward are not guarded.
  const bannerDirty = useRef(false);
  const onBannerDirtyChange = useCallback((dirty: boolean) => {
    bannerDirty.current = dirty;
  }, []);
  const guardedNavigate = useCallback(
    (to: string) => {
      if (!bannerDirty.current || to.startsWith(`${DASHBOARD_PATH}/${TAB_SLUGS.Banner}`)) {
        navigate(to);
        return;
      }
      Modal.confirm({
        title: 'Leave the banner without saving?',
        content: 'Your unsaved banner edits will be lost.',
        okText: 'Leave',
        okButtonProps: { danger: true },
        cancelText: 'Stay',
        onOk: () => navigate(to),
      });
    },
    [navigate],
  );
  const goTo = useCallback((tab: TabType) => guardedNavigate(`${DASHBOARD_PATH}/${TAB_SLUGS[tab]}`), [guardedNavigate]);

  // Ctrl+K (⌘K) anywhere in the console opens the jump palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setJumpOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const jumpTabs = useMemo(
    () => (Object.keys(TAB_SLUGS) as TabType[]).map((tab) => ({ label: tab, go: () => goTo(tab) })),
    [goTo],
  );

  // The tab title is how a screen reader (and the browser's tab strip) tells the views apart.
  useEffect(() => {
    document.title = `codePost - Staff Console - ${currentTab}`;
  }, [currentTab]);

  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [rostersLoading, setRostersLoading] = useState(false);
  const [rostersError, setRostersError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  // null until the deadlines arrive (or fail): the Overview's deploy-window cell says "Checking…".
  const [deadlines, setDeadlines] = useState<AssignmentDeadline[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  // Rosters are one request per course, so they load after the first paint and only
  // the cells that need them (Admins tab, Courses admins/staff) wait.
  const loadRosters = useCallback(async (courseList: Course[], orgs: Organization[]) => {
    setRostersLoading(true);
    setRostersError(null);
    try {
      const rosterData = await Promise.all(
        courseList.map(async (course) => {
          const roster = (await coursesApi.rosterRetrieve({ id: course.id })) as Partial<RosterType>;
          return normalizeRoster(roster);
        }),
      );
      setRosters(rosterData);
      setAdmins(buildAdminList(rosterData, orgs));
    } catch (error) {
      setRostersError((await apiErrorMessageAsync(error)) ?? 'Course rosters could not be loaded.');
    } finally {
      setRostersLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [statsData, organizationData, courseData, pendingData, deadlineData] = await Promise.all([
        UserIO.getDashboardStats(),
        organizationsApi.list(),
        coursesApi.list(),
        // The badge and the deploy window are conveniences; a failure must not take the console down.
        dashboardApi.pendingAdminsList().catch(() => []),
        dashboardApi.deadlinesList().catch(() => [] as AssignmentDeadline[]),
      ]);

      setStats(statsData);
      setDeadlines(deadlineData);
      const uniqueOrgs = uniqBy(organizationData, 'id');
      const uniqueCourses = uniqBy(courseData, 'id');
      setOrganizations(uniqueOrgs);
      setCourses(uniqueCourses);
      setPendingCount(pendingData.length);
      setIsLoading(false);

      await loadRosters(uniqueCourses, uniqueOrgs);
    } catch (error) {
      setLoadError((await apiErrorMessageAsync(error)) ?? 'The server did not respond.');
      setIsLoading(false);
    }
  }, [loadRosters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshPending = useCallback(() => {
    dashboardApi
      .pendingAdminsList()
      .then((pending) => setPendingCount(pending.length))
      .catch(() => {});
  }, []);

  const adminCount = useMemo(() => new Set(admins.map((a) => a.email)).size, [admins]);

  const collapsedWidth = isPhone ? 0 : SIDER_COLLAPSED_WIDTH;
  const contentOffset = collapsed ? collapsedWidth : SIDER_WIDTH;
  const pagePadding = isPhone ? 16 : 24;

  const renderOverview = () => {
    const topOrganizations: TopOrganization[] = organizations
      .map((org) => ({
        ...org,
        courseCount: courses.filter((c) => c.organization === org.id).length,
      }))
      .sort((a, b) => b.courseCount - a.courseCount)
      .slice(0, 5);

    const safeWindow = deadlines ? nextSafeWindow(deadlines, new Date()) : null;
    const statusCell = (icon: React.ReactNode, label: string, state: React.ReactNode, action: React.ReactNode) => (
      <Card size="small" style={{ height: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }} align="start">
          <Space wrap size={[8, 4]}>
            {icon}
            <Text strong style={{ fontSize: 15 }}>
              {label}
            </Text>
            {state}
          </Space>
          {action}
        </Space>
      </Card>
    );

    return (
      <div style={{ padding: pagePadding }}>
        <AdminPageHeader title="Overview" subtitle="What needs attention right now, then the platform at a glance." />

        {/* ── Status first: the four things a staff member acts on ────────── */}
        <section aria-label="Status" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}>
              <SystemHealth compact onOpenDetails={() => goTo('System Health')} />
            </Col>
            <Col xs={24} md={12} xl={6}>
              {statusCell(
                <UserAddOutlined />,
                // Same words as the sidebar entry and the page it opens.
                'Pending admins',
                pendingCount > 0 ? (
                  // Darker than antd's orange tag text: 12px on the tint needs 4.5:1, not 3.3:1.
                  <Tag style={WARNING_TAG}>{pendingCount} waiting</Tag>
                ) : (
                  <Tag style={GOOD_TAG}>None waiting</Tag>
                ),
                <Button type="link" size="small" onClick={() => goTo('Pending Admins')}>
                  Review
                </Button>,
              )}
            </Col>
            <Col xs={24} md={12} xl={6}>
              <MaintenanceBannerPanel compact onOpenDetails={() => goTo('Banner')} />
            </Col>
            <Col xs={24} md={12} xl={6}>
              {statusCell(
                <CalendarOutlined />,
                'Deploy window',
                deadlines === null ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Checking…
                  </Text>
                ) : safeWindow ? (
                  <Tag style={GOOD_TAG}>
                    {formatWindow(safeWindow)} · {safeWindow.days} days
                  </Tag>
                ) : (
                  <Tag color="orange">No 3-day gap in 60 days</Tag>
                ),
                <Button type="link" size="small" onClick={() => goTo('Deploy Calendar')}>
                  Calendar
                </Button>,
              )}
            </Col>
          </Row>
        </section>

        {/* ── Then the platform at a glance: four totals, each with its one qualifying line ── */}
        <ConfigProvider theme={{ components: { Statistic: { contentFontSize: 20, titleFontSize: 12 } } }}>
          <Card size="small" style={{ marginBottom: 24 }}>
            <Row gutter={[24, 16]}>
              <Col xs={12} lg={6}>
                <Statistic title="Unique Users" value={stats.totalUniqueUsers} prefix={<UserOutlined />} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.totalStudents.toLocaleString()} students · {stats.totalGraders.toLocaleString()} graders ·{' '}
                  {stats.totalInactiveUsers.toLocaleString()} inactive{' '}
                  <Tooltip title={DEFINITIONS.inactiveUsers} trigger={['hover', 'focus']}>
                    <InfoCircleOutlined aria-label={DEFINITIONS.inactiveUsers} tabIndex={0} />
                  </Tooltip>
                </Text>
              </Col>
              <Col xs={12} lg={6}>
                <Statistic
                  title="Active Courses"
                  value={stats.activeCourses}
                  prefix={<BookOutlined />}
                  suffix={
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      / {stats.totalCourses}
                    </Text>
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.archivedCourses} archived · {stats.totalAssignments.toLocaleString()} assignments ·{' '}
                  {stats.totalSections} sections
                </Text>
              </Col>
              <Col xs={12} lg={6}>
                <Statistic title="Organizations" value={stats.totalOrganizations} prefix={<GlobalOutlined />} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.avgCoursesPerOrg} courses per organization on average
                </Text>
              </Col>
              <Col xs={12} lg={6}>
                <Statistic
                  title={definedTitle('Course Admins', DEFINITIONS.courseAdmins)}
                  value={stats.totalCourseAdmins}
                  prefix={<TeamOutlined />}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.totalCodePostAdmins} platform admins{' '}
                  <Tooltip title={DEFINITIONS.platformAdmins} trigger={['hover', 'focus']}>
                    <InfoCircleOutlined aria-label={DEFINITIONS.platformAdmins} tabIndex={0} />
                  </Tooltip>
                </Text>
              </Col>
            </Row>
          </Card>
        </ConfigProvider>

        <Card title="Top Organizations by Courses" variant="borderless">
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
                width: 100,
                align: 'right',
              },
            ]}
          />
        </Card>
      </div>
    );
  };

  const renderAdmins = () => (
    <div style={{ padding: pagePadding }}>
      <AdminPageHeader
        title="Course Administrators"
        subtitle="All users with course admin roles across the platform."
      />
      {rostersError ? (
        <Alert
          type="error"
          showIcon
          title="Course rosters could not be loaded"
          description={rostersError}
          action={
            <Button size="small" onClick={() => loadRosters(courses, organizations)}>
              Retry
            </Button>
          }
        />
      ) : rostersLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : (
        <AdminTable admins={admins} />
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'Overview':
        return renderOverview();
      case 'Admins':
        return renderAdmins();
      case 'Pending Admins':
        return (
          <div style={{ padding: pagePadding }}>
            <PendingAdminsTable organizations={organizations} onChanged={refreshPending} />
          </div>
        );
      case 'Organizations':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Organizations"
              subtitle={`${organizations.length} organizations on the platform.`}
            />
            <OrganizationTable organizations={organizations} rosters={rosters} onRefresh={fetchData} />
          </div>
        );
      case 'Courses':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader title="Courses" subtitle={`${courses.length} courses across all organizations.`} />
            {rostersError && (
              <Alert
                type="warning"
                showIcon
                title="Admin and staff columns are unavailable"
                description={rostersError}
                action={
                  <Button size="small" onClick={() => loadRosters(courses, organizations)}>
                    Retry
                  </Button>
                }
                style={{ marginBottom: 16 }}
              />
            )}
            <CoursesTable
              courses={courses}
              rosters={rosters}
              rostersLoading={rostersLoading}
              organizations={organizations}
              onRefresh={fetchData}
            />
          </div>
        );
      case 'Users':
        return (
          <div style={{ padding: pagePadding }}>
            <UsersTable organizations={organizations} stats={stats} onRefresh={fetchData} />
          </div>
        );
      case 'Activity':
        return (
          <div style={{ padding: pagePadding }}>
            <ActivityFeed />
          </div>
        );
      case 'Deploy Calendar':
        return (
          <div style={{ padding: pagePadding }}>
            <DeployCalendar />
          </div>
        );
      case 'Autograding':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Autograding"
              subtitle="Cache efficiency, language usage, and failure diagnostics for the autograder."
            />
            <AutogradingStats />
          </div>
        );
      case 'System Health':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader title="System Health" subtitle="Real-time infrastructure status and diagnostics." />
            <SystemHealth />
          </div>
        );
      case 'Banner':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Maintenance Banner"
              subtitle="Broadcast a maintenance message to all platform users."
            />
            <MaintenanceBannerPanel audienceCount={stats.totalUniqueUsers} onDirtyChange={onBannerDirtyChange} />
          </div>
        );
      case 'API':
        return <APIIframe />;
      case 'AI Usage':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="AI Usage"
              subtitle="Platform-wide AI token consumption and breakdown by organization."
            />
            <AIUsageDashboard
              fetchUsage={AIUsageService.getPlatformUsage}
              breakdownLabel="Organization"
              showHeader={false}
            />
          </div>
        );
      case 'Prompt Lab':
        return (
          <div style={{ padding: pagePadding }}>
            <PromptLab />
          </div>
        );
      default:
        return null;
    }
  };

  const skeleton = (
    <div style={{ padding: pagePadding }}>
      <Skeleton active paragraph={false} title={{ width: 280 }} style={{ marginBottom: 24 }} />
      {/* Same shape as the loaded Overview (four status cells), so nothing jumps when data lands. */}
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} md={12} xl={6} key={i}>
            <Card size="small">
              <Skeleton
                active
                title={{ width: '45%' }}
                paragraph={{ rows: 1, width: '70%' }}
                style={{ minHeight: 44 }}
              />
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
    </div>
  );

  const errorResult = (
    <div style={{ padding: pagePadding }}>
      <Result
        status="error"
        title="The staff console could not load"
        subTitle={loadError}
        extra={
          <Button type="primary" onClick={fetchData}>
            Try again
          </Button>
        }
      />
    </div>
  );

  const countLabel = (label: string, count?: number) => (count === undefined ? label : `${label} (${count})`);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <JumpPalette
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        tabs={jumpTabs}
        courses={courses}
        organizations={organizations}
        onCourse={(course) => guardedNavigate(`${DASHBOARD_PATH}/courses?q=${encodeURIComponent(course.name)}`)}
        onUser={(email) => guardedNavigate(`${DASHBOARD_PATH}/users?q=${encodeURIComponent(email)}`)}
      />
      <a className="cp-skip-link" href="#staff-main">
        Skip to content
      </a>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        breakpoint="lg"
        width={SIDER_WIDTH}
        collapsedWidth={collapsedWidth}
        zeroWidthTriggerStyle={{ top: 'auto', bottom: 16 }}
        style={{
          // Visible: the zero-width trigger hangs outside the sider box on phones.
          overflow: 'visible',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 20,
        }}
      >
        {/* Brand and footer stay put; only the navigation scrolls, so an opened group is never hidden under the footer. */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', textAlign: 'center' }}>
            <Link to="/" aria-label="codePost home">
              <CPLogo cpType={collapsed ? 'icon' : 'main'} />
            </Link>
            {!collapsed && (
              <Text
                style={{
                  display: 'block',
                  marginTop: 10,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                Staff console
              </Text>
            )}
          </div>

          <Divider
            style={{ margin: '0 16px', borderColor: 'rgba(255,255,255,0.08)', minWidth: 'auto', width: 'auto' }}
          />

          <nav
            aria-label="Staff console navigation"
            className="cp-staff-nav"
            style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
          >
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[currentTab]}
              defaultOpenKeys={DEVELOPER_TABS.includes(currentTab) ? ['developer'] : []}
              onOpenChange={(keys) => {
                // The group opens below the fold on short windows: bring its pages into view.
                if (keys.includes('developer')) {
                  // After antd's ~200ms open motion, or the group still has no height to scroll to.
                  window.setTimeout(() => {
                    document
                      .querySelector('.ant-menu-submenu-open > .ant-menu-sub > li:last-child')
                      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                  }, 350);
                }
              }}
              onClick={({ key }) => goTo(key as TabType)}
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
                      label: countLabel('Organizations', isLoading ? undefined : stats.totalOrganizations),
                    },
                    {
                      key: 'Courses',
                      icon: <BookOutlined />,
                      label: countLabel('Courses', isLoading ? undefined : stats.totalCourses),
                    },
                    {
                      key: 'Users',
                      icon: <UserOutlined />,
                      label: countLabel('Users', isLoading ? undefined : stats.totalUniqueUsers),
                    },
                    {
                      key: 'Admins',
                      icon: <TeamOutlined />,
                      label: countLabel('Admins', rostersLoading || isLoading ? undefined : adminCount),
                    },
                    {
                      key: 'Pending Admins',
                      // Collapsed, the icon carries the number itself; a dot would lose the count.
                      icon: (
                        <Badge count={collapsed ? pendingCount : 0} size="small" offset={[4, 8]} color={BADGE_RED}>
                          <UserAddOutlined />
                        </Badge>
                      ),
                      label: (
                        <span>
                          Pending Admins
                          {pendingCount > 0 && (
                            <Badge count={pendingCount} size="small" style={{ marginLeft: 8 }} color={BADGE_RED} />
                          )}
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
                      key: 'Autograding',
                      icon: <ThunderboltOutlined />,
                      label: 'Autograding',
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

                // ── Developer: used rarely, so it folds; it opens when one of its pages is current ──
                {
                  key: 'developer',
                  icon: <CodeOutlined />,
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

          {/* The one keyboard path across users, courses and pages; Ctrl+K opens it too. */}
          <div style={{ padding: collapsed ? '8px 8px 0' : '8px 16px 0' }}>
            <Tooltip title="Jump to a page, course or user (Ctrl+K)" placement="right">
              <Button
                size="small"
                icon={<SearchOutlined />}
                onClick={() => setJumpOpen(true)}
                aria-label="Jump to a page, course or user (Ctrl+K)"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.85)',
                }}
              >
                {collapsed ? null : 'Jump to…  Ctrl+K'}
              </Button>
            </Tooltip>
          </div>

          {/* Version badge */}
          {!collapsed && (
            <div style={{ padding: '8px 16px 12px', textAlign: 'center' }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {process.env.REACT_APP_VERSION || 'dev'}
              </Text>
            </div>
          )}
        </div>
      </Sider>
      <Layout
        style={{
          height: '100vh',
          overflowY: 'auto',
          background: token.colorBgLayout,
          marginLeft: contentOffset,
          transition: 'margin-left 0.2s ease',
        }}
      >
        {/* Extra room on phones for the sider's corner trigger, which sits over the content's bottom-left. */}
        <Content
          id="staff-main"
          tabIndex={-1}
          role="main"
          style={{ margin: '0', overflow: 'initial', paddingBottom: isPhone ? 96 : 64 }}
        >
          {isLoading ? skeleton : loadError ? errorResult : renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
