// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { MenuOutlined, SearchOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Layout, Modal, Result, Skeleton, Tabs, Tag, Typography, theme } from 'antd';
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
import StaffSidebar, { PHONE_BAR_HEIGHT, SIDER_COLLAPSED_WIDTH, SIDER_WIDTH } from './StaffSidebar';
import StaffInbox from './StaffInbox';
import PersonPage from './PersonPage';
import { SystemHealthContext, useSystemHealth } from './systemHealthModel';
import { useSavedBanner } from './MaintenanceBannerPanel';
import {
  DASHBOARD_PATH,
  PAGE_TABS,
  STAFF_DESTINATIONS,
  personPath,
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
import { nextSafeWindow } from './deployWindows';
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

// Below this the sider hides completely and a corner trigger brings it back.
const PHONE_BREAKPOINT = 768;
// antd's orange tag puts #d46b08 on #fff7e6 (3.3:1); orange-8 text on the same tint reads 5.4:1.
const WARNING_TAG = { color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' } as const;
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
  const { page: currentPage, tab: currentTab, person: currentPerson } = staffLocation;
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
    const tab = currentPerson ? 'person' : tabLabel(currentPage, currentTab);
    document.title = `codePost - Staff Console - ${currentPage}${tab ? ` · ${tab}` : ''}`;
  }, [currentPage, currentTab, currentPerson]);

  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [rostersLoading, setRostersLoading] = useState(false);
  const [rostersError, setRostersError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  // The requests could not be fetched: the Inbox says so instead of showing "none waiting".
  const [pendingUnknown, setPendingUnknown] = useState(false);
  // null until the deadlines arrive (or fail): the Overview's deploy-window cell says "Checking…".
  const [deadlines, setDeadlines] = useState<AssignmentDeadline[] | null>(null);
  const [deadlinesUnknown, setDeadlinesUnknown] = useState(false);
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
        dashboardApi.pendingAdminsList().catch(() => null),
        // null: the due dates did not load, which is not the same as there being none.
        dashboardApi.deadlinesList().catch(() => null),
      ]);

      setStats(statsData);
      setDeadlines(deadlineData);
      setDeadlinesUnknown(deadlineData === null);
      const uniqueOrgs = uniqBy(organizationData, 'id');
      const uniqueCourses = uniqBy(courseData, 'id');
      setOrganizations(uniqueOrgs);
      setCourses(uniqueCourses);
      setPendingCount(pendingData?.length ?? 0);
      setPendingUnknown(pendingData === null);
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
      .then((pending) => {
        setPendingCount(pending.length);
        setPendingUnknown(false);
      })
      .catch(() => setPendingUnknown(true));
  }, []);

  const adminCount = useMemo(() => new Set(admins.map((a) => a.email)).size, [admins]);

  const collapsedWidth = isPhone ? 0 : SIDER_COLLAPSED_WIDTH;
  const queryClient = useQueryClient();
  // On a phone the open sider behaves like a drawer: Escape closes it, focus moves in and comes back.
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const phoneMenuOpen = isPhone && !collapsed;
  useEffect(() => {
    if (!phoneMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCollapse(true, 'clickTrigger');
    };
    window.addEventListener('keydown', onKey);
    document.querySelector<HTMLElement>('aside .ant-menu-item')?.focus();
    const toggle = menuToggleRef.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      toggle?.focus();
    };
  }, [phoneMenuOpen, onCollapse]);
  // Closing the person drawer unmounts it at once, so antd cannot hand focus back; return it to the
  // link that opened it, or to the page.
  const lastPerson = useRef<number | undefined>(undefined);
  useEffect(() => {
    const prev = lastPerson.current;
    lastPerson.current = currentPerson;
    if (prev === undefined || currentPerson !== undefined) return;
    const link = document.querySelector<HTMLElement>(`a[href="${personPath(prev)}"], a[href^="${personPath(prev)}?"]`);
    (link ?? document.getElementById('staff-main'))?.focus();
  }, [currentPerson]);
  const contentOffset = collapsed ? collapsedWidth : SIDER_WIDTH;
  const pagePadding = isPhone ? 16 : 24;

  // One health model for the Inbox, the sidebar badge and the Health tab (SystemHealthContext below).
  const healthModel = useSystemHealth();
  const savedBanner = useSavedBanner();
  const safeWindow = deadlines ? nextSafeWindow(deadlines, new Date()) : null;
  // The Inbox's queue, counted for the sidebar: failing checks nobody has acknowledged, requests
  // waiting, a banner showing, no safe deploy window.
  const openItems =
    (healthModel.unavailable
      ? 1
      : !healthModel.ackLoaded || healthModel.acknowledged
        ? 0
        : healthModel.failing.length) +
    (pendingCount > 0 || pendingUnknown ? 1 : 0) +
    (savedBanner.state.key === 'live' || savedBanner.state.key === 'scheduled' ? 1 : 0) +
    (deadlines && !safeWindow ? 1 : 0);

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
      case 'Inbox':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Inbox"
              subtitle="What is waiting for you, then what is fine, then the platform in one line."
            />
            <StaffInbox
              stats={stats}
              deadlines={deadlines}
              deadlinesUnknown={deadlinesUnknown}
              banner={savedBanner}
              pendingCount={pendingCount}
              pendingUnknown={pendingUnknown}
              organizations={organizations}
              onPendingChanged={refreshPending}
              goTo={goTo}
              onJump={() => setJumpOpen(true)}
              isPhone={isPhone}
            />
          </div>
        );
      case 'Courses':
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="Courses"
              subtitle={`${courses.length} courses in ${organizations.length} organizations.`}
            />
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
            <Tabs
              activeKey={currentTab}
              destroyOnHidden
              onChange={(key) => goTo('Courses', key)}
              items={[
                {
                  key: 'all',
                  label: 'By course',
                  children: (
                    <CoursesTable
                      courses={courses}
                      rosters={rosters}
                      rostersLoading={rostersLoading}
                      organizations={organizations}
                      onRefresh={fetchData}
                    />
                  ),
                },
                {
                  key: 'organizations',
                  label: countLabel('By organization', isLoading ? undefined : organizations.length),
                  children: (
                    <OrganizationTable
                      organizations={organizations}
                      rosters={rosters}
                      onRefresh={fetchData}
                      hideStats
                    />
                  ),
                },
              ]}
            />
          </div>
        );
      case 'People':
        // One page for people: everyone by role, the course admins roster, and the requests to join it.
        return (
          <div style={{ padding: pagePadding }}>
            <AdminPageHeader
              title="People"
              subtitle="Everyone with an account; course admins and the requests to become one are tabs."
            />
            <Tabs
              activeKey={currentTab}
              // Hidden panes unmount, so each tab shows fresh data when it is opened again.
              destroyOnHidden
              onChange={(key) => goTo('People', key)}
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
            {currentPerson !== undefined && (
              <PersonPage
                id={currentPerson}
                organizations={organizations}
                isPhone={isPhone}
                onClose={() => navigate(staffPath('People', 'people', location.search))}
                onChanged={() => {
                  refreshPending();
                  loadRosters(courses, organizations);
                  queryClient.invalidateQueries({ queryKey: ['staff', 'users'] });
                }}
              />
            )}
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
                        onSaved={savedBanner.refresh}
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
      {/* Same shape as the loaded Inbox (a search box, then rows), so nothing jumps when data lands. */}
      <Skeleton.Input active style={{ width: 560, maxWidth: '100%', marginBottom: 16 }} />
      <Card size="small">
        <Skeleton active title={false} paragraph={{ rows: 4 }} />
      </Card>
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
    <SystemHealthContext.Provider value={healthModel}>
      <Layout style={{ minHeight: '100vh' }}>
        {modalHolder}
        <JumpPalette
          open={jumpOpen}
          onClose={() => setJumpOpen(false)}
          tabs={jumpTabs}
          courses={courses}
          organizations={organizations}
          onCourse={(course) => guardedNavigate(`${DASHBOARD_PATH}/courses?q=${encodeURIComponent(course.name)}`)}
          onUser={(u) => guardedNavigate(personPath(u.id))}
        />
        <a className="cp-skip-link" href="#staff-main">
          Skip to content
        </a>

        {isPhone && (
          <>
            {/* The one bar a phone needs: the menu, where you are, and the search the keyboard shortcut cannot offer. */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: PHONE_BAR_HEIGHT,
                zIndex: 21,
                background: '#1b1b1b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 8px 0 4px',
              }}
            >
              <Button
                ref={menuToggleRef}
                type="text"
                icon={<MenuOutlined />}
                onClick={() => onCollapse(!collapsed, 'clickTrigger')}
                aria-label={collapsed ? 'Open the navigation' : 'Close the navigation'}
                aria-expanded={!collapsed}
                style={{ color: '#fff' }}
              />
              <Text
                strong
                style={{ color: '#fff', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {currentPage}
                {tabLabel(currentPage, currentTab) && currentTab !== PAGE_TABS[currentPage][0]?.key
                  ? ` · ${tabLabel(currentPage, currentTab)}`
                  : ''}
              </Text>
              <Button
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setJumpOpen(true)}
                aria-label="Find a person, a course or a page"
                style={{ color: '#fff' }}
              />
            </div>
            {!collapsed && (
              // Tapping beside the open sider closes it, as a drawer would.
              <div
                role="presentation"
                onClick={() => onCollapse(true, 'clickTrigger')}
                style={{ position: 'fixed', inset: 0, zIndex: 19, background: 'rgba(0,0,0,0.35)' }}
              />
            )}
          </>
        )}
        <StaffSidebar
          collapsed={collapsed}
          collapsedWidth={collapsedWidth}
          onCollapse={onCollapse}
          currentPage={currentPage}
          pendingRequests={pendingCount}
          openItems={isLoading ? 0 : openItems}
          bannerDirty={bannerDirtyState}
          onNavigate={(page) => {
            goTo(page);
            // A phone's sider is an overlay: it goes away once a destination is picked.
            if (isPhone) onCollapse(true, 'clickTrigger');
          }}
          onHome={() => guardedNavigate('/')}
          onJump={() => setJumpOpen(true)}
        />
        <Layout
          inert={phoneMenuOpen}
          style={{
            height: '100vh',
            overflowY: 'auto',
            background: token.colorBgLayout,
            marginLeft: contentOffset,
            transition: 'margin-left 0.2s ease',
          }}
        >
          {/* Room under the phone top bar. */}
          <Content
            id="staff-main"
            tabIndex={-1}
            role="main"
            style={{
              margin: '0',
              overflow: 'initial',
              paddingTop: isPhone ? PHONE_BAR_HEIGHT : 0,
              paddingBottom: isPhone ? 32 : 64,
            }}
          >
            {isLoading ? skeleton : loadError ? errorResult : renderContent()}
          </Content>
        </Layout>
      </Layout>
    </SystemHealthContext.Provider>
  );
};

export default Dashboard;
