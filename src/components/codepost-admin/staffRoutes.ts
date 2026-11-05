// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * The staff console's addresses: `/dashboard/<page>/<tab>`. Five pages, three of them with tabs.
 * Every address the console ever had still resolves to a page and a tab on its first frame, and is
 * then rewritten to the current form, so no bookmark breaks and nothing flashes before a redirect.
 */

export const DASHBOARD_PATH = '/dashboard';

export type StaffPage = 'Inbox' | 'People' | 'Courses' | 'Platform' | 'Tools';

export const STAFF_PAGES: StaffPage[] = ['Inbox', 'People', 'Courses', 'Platform', 'Tools'];

const PAGE_SLUG: Record<StaffPage, string> = {
  Inbox: 'inbox',
  People: 'people',
  Courses: 'courses',
  Platform: 'platform',
  Tools: 'tools',
};

/** The tabs of each page, first one default (and left out of the address). */
export const PAGE_TABS: Record<StaffPage, readonly { key: string; label: string }[]> = {
  Inbox: [],
  Courses: [
    { key: 'all', label: 'By course' },
    { key: 'organizations', label: 'By organization' },
  ],
  People: [
    { key: 'people', label: 'People' },
    { key: 'admins', label: 'Course admins' },
    { key: 'requests', label: 'Requests' },
  ],
  Platform: [
    { key: 'health', label: 'Health' },
    { key: 'activity', label: 'Activity' },
    { key: 'autograding', label: 'Autograding' },
    { key: 'deploy-calendar', label: 'Deploy calendar' },
  ],
  Tools: [
    { key: 'banner', label: 'Banner' },
    { key: 'ai-usage', label: 'AI usage' },
    { key: 'api', label: 'API' },
    { key: 'prompt-lab', label: 'Prompt lab' },
  ],
};

/** The addresses the console used to have, one segment each, and the page and tab they mean now. */
const LEGACY_SLUGS: Record<string, { page: StaffPage; tab: string }> = {
  overview: { page: 'Inbox', tab: '' },
  organizations: { page: 'Courses', tab: 'organizations' },
  admins: { page: 'People', tab: 'admins' },
  'pending-admins': { page: 'People', tab: 'requests' },
  activity: { page: 'Platform', tab: 'activity' },
  'deploy-calendar': { page: 'Platform', tab: 'deploy-calendar' },
  autograding: { page: 'Platform', tab: 'autograding' },
  'system-health': { page: 'Platform', tab: 'health' },
  banner: { page: 'Tools', tab: 'banner' },
  api: { page: 'Tools', tab: 'api' },
  'ai-usage': { page: 'Tools', tab: 'ai-usage' },
  'prompt-lab': { page: 'Tools', tab: 'prompt-lab' },
};

export interface StaffLocation {
  page: StaffPage;
  /** Set on pages that have tabs; always one of the page's tab keys. */
  tab?: string;
  /** `/dashboard/people/<id>`: one person, over the People list. */
  person?: number;
  /** The address this location should have. Set only when the current one is an old form. */
  canonical?: string;
}

export const tabLabel = (page: StaffPage, tab?: string): string | undefined =>
  PAGE_TABS[page].find((t) => t.key === tab)?.label;

/** `/dashboard/users/requests`; a page's first tab is left out (`/dashboard/users`). */
export function staffPath(page: StaffPage, tab?: string, search = ''): string {
  const first = PAGE_TABS[page][0]?.key;
  const segment = tab && tab !== first ? `/${tab}` : '';
  return `${DASHBOARD_PATH}/${PAGE_SLUG[page]}${segment}${search}`;
}

export const countLabel = (label: string, count?: number) => (count === undefined ? label : `${label} (${count})`);

export function resolveStaffLocation(pathname: string, search = ''): StaffLocation {
  const trimmed = pathname.replace(/\/+$/, '');
  const [slug = '', sub = ''] = trimmed.replace(new RegExp(`^${DASHBOARD_PATH}/?`), '').split('/');
  // `?tab=` was how the Users page addressed its tabs for a while; it comes out of the address,
  // the rest of the query (a `?q=`) stays as written.
  const params = new URLSearchParams(search);
  const queryTab = params.get('tab');
  params.delete('tab');
  const rest = params.toString();
  const keptSearch = queryTab === null ? search : rest ? `?${rest}` : '';

  const legacy = LEGACY_SLUGS[slug];
  if (legacy) {
    const tab = legacy.tab || PAGE_TABS[legacy.page][0]?.key;
    return { page: legacy.page, tab, canonical: staffPath(legacy.page, tab, keptSearch) };
  }
  // The Users page became People; its tabs and its `?q=` keep working at the old address.
  if (slug === 'users') {
    const moved = resolveStaffLocation(`${DASHBOARD_PATH}/people${sub ? `/${sub}` : ''}`, search);
    const target = moved.person === undefined ? staffPath(moved.page, moved.tab) : personPath(moved.person);
    return { ...moved, canonical: moved.canonical ?? `${target}${keptSearch}` };
  }

  const page = STAFF_PAGES.find((p) => PAGE_SLUG[p] === slug) ?? 'Inbox';
  // A person's id under People: the list's first tab, with the person over it.
  if (page === 'People' && /^\d+$/.test(sub)) {
    const rest = params.toString();
    const location: StaffLocation = { page, tab: PAGE_TABS.People[0].key, person: Number(sub) };
    return queryTab === null
      ? location
      : { ...location, canonical: `${personPath(Number(sub))}${rest ? `?${rest}` : ''}` };
  }
  const tabs = PAGE_TABS[page];
  const isTab = (key: string | null): key is string => !!key && tabs.some((t) => t.key === key);
  const tab = tabs.length === 0 ? undefined : isTab(sub) ? sub : isTab(queryTab) ? queryTab : tabs[0].key;

  // One address per view: a bad or redundant form (`/users/bogus`, `/platform/health`, an unknown
  // page, a `?tab=`) is rewritten. The console's root, `/dashboard`, is left alone.
  const want = staffPath(page, tab);
  const isRoot = slug === '';
  const canonical = !isRoot && (trimmed !== want || queryTab !== null) ? `${want}${keptSearch}` : undefined;
  return canonical ? { page, tab, canonical } : { page, tab };
}

/** `/dashboard/people/564`: the person page, by id (no email in any address). */
export const personPath = (id: number): string => `${staffPath('People')}/${id}`;

/** Whether an address is the banner editor, the one place the unsaved-edits guard never asks about. */
export const isBannerAddress = (to: string): boolean => {
  const url = new URL(to, 'http://codepost.local');
  if (!url.pathname.startsWith(DASHBOARD_PATH)) return false;
  const target = resolveStaffLocation(url.pathname, url.search);
  return target.page === 'Tools' && target.tab === 'banner';
};

/** Everything the jump palette can open, pages and tabs alike. */
/** Everything the jump palette can open, pages and tabs alike. `keywords` are the words people
 *  still type for them: the old page names, and plain synonyms. */
export const STAFF_DESTINATIONS: { label: string; page: StaffPage; tab?: string; keywords?: string[] }[] = [
  { label: 'Inbox', page: 'Inbox', keywords: ['home', 'overview', 'attention'] },
  { label: 'People', page: 'People', keywords: ['users', 'students', 'graders'] },
  { label: 'Course admins', page: 'People', tab: 'admins', keywords: ['admins', 'users'] },
  { label: 'Admin requests', page: 'People', tab: 'requests', keywords: ['pending admins', 'requests', 'approve'] },
  { label: 'Courses', page: 'Courses' },
  { label: 'Organizations', page: 'Courses', tab: 'organizations', keywords: ['orgs', 'by organization'] },
  { label: 'Platform: Health', page: 'Platform', tab: 'health', keywords: ['system health', 'status', 'degraded'] },
  { label: 'Platform: Activity', page: 'Platform', tab: 'activity', keywords: ['logs', 'audit', 'errors'] },
  { label: 'Platform: Autograding', page: 'Platform', tab: 'autograding', keywords: ['autograder', 'cache'] },
  { label: 'Platform: Deploy calendar', page: 'Platform', tab: 'deploy-calendar', keywords: ['deploy', 'due dates'] },
  { label: 'Tools: Banner', page: 'Tools', tab: 'banner', keywords: ['maintenance', 'broadcast'] },
  { label: 'Tools: AI usage', page: 'Tools', tab: 'ai-usage', keywords: ['tokens', 'ai'] },
  { label: 'Tools: API', page: 'Tools', tab: 'api', keywords: ['docs', 'reference', 'developer'] },
  { label: 'Tools: Prompt lab', page: 'Tools', tab: 'prompt-lab', keywords: ['prompts', 'experiments', 'developer'] },
];
