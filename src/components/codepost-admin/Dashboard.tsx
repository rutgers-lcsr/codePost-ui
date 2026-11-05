// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  BookOutlined,
  CalendarOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  TeamOutlined,
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
  Layout,
  Modal,
  Result,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { useLocation, useNavigate } from 'react-router';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '../core/ErrorBoundary';

import useFixedWindow from '../core/useFixedWindow';
import useWindowSize from '../core/useWindowSize';
import uniqBy from 'lodash/uniqBy';
import { apiErrorMessageAsync } from '../../lib/apiError';

import AdminPageHeader from './AdminPageHeader';
import AdminTable from './AdminTable';
import SystemHealth from './SystemHealth';
import CoursesTable from './CoursesTable';
import OrganizationTable from './OrganizationTable';
import UsersTable from './UsersTable';
import ActivityFeed from './ActivityFeed';
import MaintenanceBannerPanel from './MaintenanceBannerPanel';
import { AIUsageService } from '../../services/aiUsage';
import PendingAdminsTable from './PendingAdminsTable';
import StaffSidebar, { SIDER_COLLAPSED_WIDTH, SIDER_WIDTH } from './StaffSidebar';
import {
  DASHBOARD_PATH,
  STAFF_DESTINATIONS,
  countLabel,
  isBannerAddress,
  resolveStaffLocation,
  staffPath,
  tabLabel,
  type StaffPage,
} from './staffRoutes';

// The heavy, rarely opened tabs load when first opened, not with the console.
const APIIframe = lazy(() => import('./APIIframe'));
const DeployCalendar = lazy(() => import('./DeployCalendar'));
const AIUsageDashboard = lazy(() => import('../core/AIUsageDashboard'));
const PromptLab = lazy(() => import('./PromptLab'));
const AutogradingStats = lazy(() => import('./AutogradingStats'));

import type { RosterType } from '../../types/models';
import type { AssignmentDeadline, Course, DashboardStats, Organization } from '../../api-client';
import { organizationsApi, coursesApi, dashboardApi } from '../../api-client/clients';
import { UserIO } from '../../services/user';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import { DEFINITIONS, definedTitle } from './definitions';
import { formatWindow, nextSafeWindow } from './deployWindows';
import JumpPalette from './JumpPalette';

const { Text } = Typography;
const { Content } = Layout;

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

  const staffLocation = resolveStaffLocation(location.pathname, location.search);
  const { page: currentPage, tab: currentTab } = staffLocation;
  // An old address renders its page on the first frame (above) and is then rewritten, so no bookmark breaks.
  useEffect(() => {
    if (staffLocation.canonical) navigate(`${staffLocation.canonical}${location.hash}`, { replace: true });
  }, [staffLocation.canonical, location.hash, navigate]);

  // The banner editor reports unsaved edits here; in-app navigation away from it asks first (reload and
  // close get the browser's own prompt from the panel). Back/forward are not guarded.
  const bannerDirty = useRef(false);
  const [bannerDirtyState, setBannerDirtyState] = useState(false);
  const onBannerDirtyChange = useCallback((dirty: boolean) => {
    bannerDirty.current = dirty;
    setBannerDirtyState(dirty);
  }, []);
  // Confirms come from the hook so they take the console's theme (static Modal.confirm renders outside it).
  const [modal, modalHolder] = Modal.useModal();
  const leaveBannerDialog = useCallback(
    (onLeave: () => void, onStay?: () => void) =>
      modal.confirm({
        title: 'Leave the banner without saving?',
        content: 'Your unsaved banner edits will be lost.',
        // Staying is the safe default: it holds focus (so Enter and Esc both keep the edits)
        // and the primary colour; leaving is the quiet red one.
        okText: 'Leave',
        okButtonProps: { danger: true, type: 'default' },
        cancelText: 'Stay',
        cancelButtonProps: { type: 'primary' },
        autoFocusButton: 'cancel',
        keyboard: true,
        onOk: onLeave,
        onCancel: onStay,
      }),
    [modal],
  );
  // Browser Back while the banner has unsaved edits: BrowserRouter has no blocker, so a sentinel
  // history entry turns the first Back into the same question. Stay re-arms it; Leave goes back for real.
  useEffect(() => {
    if (!bannerDirtyState) return;
    const SENTINEL = { cpBannerGuard: true };
    window.history.pushState(SENTINEL, '', window.location.href);
    const onPop = () => {
      if (!bannerDirty.current) return;
      leaveBannerDialog(
        () => {
          bannerDirty.current = false;
          window.history.back();
        },
        () => window.history.pushState(SENTINEL, '', window.location.href),
      );
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Clean again (saved or discarded): drop the sentinel so Back is one press.
      if ((window.history.state as { cpBannerGuard?: boolean } | null)?.cpBannerGuard) window.history.back();
    };
  }, [bannerDirtyState, leaveBannerDialog]);
  const guardedNavigate = useCallback(
    (to: string) => {
      // Already there (the sidebar entry of the current page): no duplicate history entry.
      if (to === `${window.location.pathname}${window.location.search}`) return;
      if (!bannerDirty.current || isBannerAddress(to)) {
        navigate(to);
        return;
      }
      // Leaving replaces the guard's sentinel entry, so Back from the new page lands where it should.
      leaveBannerDialog(() =>
        navigate(to, { replace: !!(window.history.state as { cpBannerGuard?: boolean } | null)?.cpBannerGuard }),
      );
    },
    [navigate, leaveBannerDialog],
  );
  const goTo = useCallback((page: StaffPage, tab?: string) => guardedNavigate(staffPath(page, tab)), [guardedNavigate]);

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
    () => STAFF_DESTINATIONS.map((d) => ({ label: d.label, keywords: d.keywords, go: () => goTo(d.page, d.tab) })),
    [goTo],
  );

  // The tab title is how a screen reader (and the browser's tab strip) tells the views apart.
  useEffect(() => {
    const tab = tabLabel(currentPage, currentTab);
    document.title = `codePost - Staff Console - ${currentPage}${tab ? ` · ${tab}` : ''}`;
  }, [currentPage, currentTab]);

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
              <SystemHealth compact onOpenDetails={() => goTo('Platform', 'health')} />
            </Col>
            <Col xs={24} md={12} xl={6}>
              {statusCell(
                <UserAddOutlined />,
                // Same words as the Users page tab it opens.
                'Admin requests',
                pendingCount > 0 ? (
                  // Darker than antd's orange tag text: 12px on the tint needs 4.5:1, not 3.3:1.
                  <Tag style={WARNING_TAG}>{pendingCount} waiting</Tag>
                ) : (
                  <Tag style={GOOD_TAG}>None waiting</Tag>
                ),
                <Button type="link" size="small" onClick={() => goTo('Users', 'requests')}>
                  Review
                </Button>,
              )}
            </Col>
            <Col xs={24} md={12} xl={6}>
              <MaintenanceBannerPanel compact onOpenDetails={() => goTo('Tools', 'banner')} />
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
                <Button type="link" size="small" onClick={() => goTo('Platform', 'deploy-calendar')}>
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
                  {stats.totalInactiveUsers.toLocaleString()} idle 90+ days{' '}
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
                  // "30 / 30" reads as a contradiction; the denominator only means something once a course is archived.
                  suffix={
                    stats.archivedCourses > 0 ? (
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        / {stats.totalCourses}
                      </Text>
                    ) : undefined
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.archivedCourses > 0 ? `${stats.archivedCourses} archived` : 'none archived'} ·{' '}
                  {stats.totalAssignments.toLocaleString()} assignments · {stats.totalSections} sections
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
    <div>
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

  // A one-line description under a tab bar, where the old page subtitle carried something.
  const tabIntro = (text: string) => (
    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
      {text}
    </Text>
  );
  // The boundary turns a chunk that vanished in a deploy into a reload prompt instead of a blank console.
  const lazyTab = (node: React.ReactNode) => (
    <ErrorBoundary type="codepanel">
      <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>{node}</Suspense>
    </ErrorBoundary>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'Overview':
        return renderOverview();
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
        // One page for people: everyone by role, the course admins roster, and the requests to join it.
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Users"
              subtitle="Everyone with an account, by role. Course admins and the requests to become one are tabs here."
            />
            <Tabs
              activeKey={currentTab}
              // Hidden panes unmount, so each tab shows fresh data when it is opened again.
              destroyOnHidden
              onChange={(key) => goTo('Users', key)}
              items={[
                {
                  key: 'people',
                  label: 'People',
                  children: <UsersTable organizations={organizations} stats={stats} onRefresh={fetchData} hideHeader />,
                },
                {
                  key: 'admins',
                  label: countLabel('Course admins', rostersLoading || isLoading ? undefined : adminCount),
                  children: renderAdmins(),
                },
                {
                  key: 'requests',
                  label: (
                    <span>
                      Requests
                      {pendingCount > 0 && (
                        <>
                          <Badge count={pendingCount} size="small" style={{ marginLeft: 8 }} color={BADGE_RED} />
                          <span className="sr-only">, {pendingCount} waiting</span>
                        </>
                      )}
                    </span>
                  ),
                  children: <PendingAdminsTable organizations={organizations} onChanged={refreshPending} hideHeader />,
                },
              ]}
            />
          </div>
        );
      case 'Platform':
        // What the platform is doing: one page, one header, the existing views as tabs.
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Platform"
              subtitle="What the platform is doing: health, activity, autograding and the deploy calendar."
            />
            <Tabs
              activeKey={currentTab}
              destroyOnHidden
              onChange={(key) => goTo('Platform', key)}
              items={[
                { key: 'health', label: 'Health', children: <SystemHealth /> },
                { key: 'activity', label: 'Activity', children: <ActivityFeed hideHeader /> },
                {
                  key: 'autograding',
                  label: 'Autograding',
                  children: (
                    <>
                      {tabIntro('Cache efficiency, language usage, and failure diagnostics for the autograder.')}
                      {lazyTab(<AutogradingStats />)}
                    </>
                  ),
                },
                { key: 'deploy-calendar', label: 'Deploy calendar', children: lazyTab(<DeployCalendar hideHeader />) },
              ]}
            />
          </div>
        );
      case 'Tools':
        // Changed or consulted rarely: the banner, AI usage, the API reference and the prompt lab.
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Tools"
              subtitle="The maintenance banner, AI usage, the API reference and the prompt lab."
            />
            <Tabs
              activeKey={currentTab}
              destroyOnHidden
              // Leaving the banner with unsaved edits asks first, from a tab as from the sidebar.
              onChange={(key) => goTo('Tools', key)}
              items={[
                {
                  key: 'banner',
                  label: (
                    <span>
                      Banner
                      {bannerDirtyState && <Tag style={{ marginLeft: 8, ...WARNING_TAG }}>unsaved</Tag>}
                    </span>
                  ),
                  children: (
                    <>
                      {tabIntro('Broadcast a maintenance message to every signed-in user.')}
                      <MaintenanceBannerPanel
                        audienceCount={stats.totalUniqueUsers}
                        onDirtyChange={onBannerDirtyChange}
                      />
                    </>
                  ),
                },
                {
                  key: 'ai-usage',
                  label: 'AI usage',
                  children: (
                    <>
                      {tabIntro('Platform-wide AI token consumption and breakdown by organization.')}
                      {lazyTab(
                        <AIUsageDashboard
                          fetchUsage={AIUsageService.getPlatformUsage}
                          breakdownLabel="Organization"
                          showHeader={false}
                        />,
                      )}
                    </>
                  ),
                },
                { key: 'api', label: 'API', children: lazyTab(<APIIframe hideHeader />) },
                { key: 'prompt-lab', label: 'Prompt lab', children: lazyTab(<PromptLab hideHeader />) },
              ]}
            />
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {modalHolder}
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
      <StaffSidebar
        collapsed={collapsed}
        collapsedWidth={collapsedWidth}
        onCollapse={onCollapse}
        currentPage={currentPage}
        isLoading={isLoading}
        counts={{
          organizations: stats.totalOrganizations,
          courses: stats.totalCourses,
          users: stats.totalUniqueUsers,
          pendingRequests: pendingCount,
        }}
        bannerDirty={bannerDirtyState}
        onNavigate={(page) => goTo(page)}
        onHome={() => guardedNavigate('/')}
        onJump={() => setJumpOpen(true)}
      />
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
