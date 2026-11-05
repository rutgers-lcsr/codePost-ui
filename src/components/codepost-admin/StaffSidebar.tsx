// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * The staff console's sider: five destinations, one per job, and a quiet Tools entry below a divider.
 * Brand and the jump button stay put; only the navigation scrolls.
 */
import {
  BookOutlined,
  ClusterOutlined,
  InboxOutlined,
  SearchOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Badge, Button, Divider, Layout, Menu, Tooltip, Typography } from 'antd';
import { Link } from 'react-router';

import CPLogo from '../core/CPLogo';
import { countLabel, type StaffPage } from './staffRoutes';

const { Text } = Typography;
const { Sider } = Layout;

export const SIDER_WIDTH = 220;
export const SIDER_COLLAPSED_WIDTH = 64;
/** The phone top bar's height; the sider starts under it. */
export const PHONE_BAR_HEIGHT = 48;
// red-7 under the white badge count: antd's #ff4d4f is 3.5:1.
const BADGE_RED = '#cf1322';

interface StaffSidebarProps {
  collapsed: boolean;
  collapsedWidth: number;
  onCollapse: (next: boolean, type: 'clickTrigger' | 'responsive') => void;
  currentPage: StaffPage;
  /** Counts are left off the labels until the first load answers. */
  isLoading: boolean;
  counts: { courses: number; people: number; pendingRequests: number };
  /** Items waiting on the Inbox: the badge on its entry. */
  openItems: number;
  /** The banner editor has unsaved edits: the Tools entry says so, so the leave guard is never a surprise. */
  bannerDirty: boolean;
  onNavigate: (page: StaffPage) => void;
  /** The logo: leaves the console, so it goes through the same guard as the pages. */
  onHome: () => void;
  onJump: () => void;
}

const StaffSidebar = ({
  collapsed,
  collapsedWidth,
  onCollapse,
  currentPage,
  isLoading,
  counts,
  openItems,
  bannerDirty,
  onNavigate,
  onHome,
  onJump,
}: StaffSidebarProps) => (
  <Sider
    collapsible
    collapsed={collapsed}
    onCollapse={onCollapse}
    breakpoint="lg"
    width={SIDER_WIDTH}
    collapsedWidth={collapsedWidth}
    // On a phone the top bar's menu button opens the sider; antd's corner trigger sat over content.
    trigger={collapsedWidth === 0 ? null : undefined}
    style={{
      // Visible: the zero-width trigger hangs outside the sider box on phones.
      overflow: 'visible',
      height: collapsedWidth === 0 ? `calc(100vh - ${PHONE_BAR_HEIGHT}px)` : '100vh',
      position: 'fixed',
      left: 0,
      top: collapsedWidth === 0 ? PHONE_BAR_HEIGHT : 0,
      bottom: 0,
      zIndex: 20,
    }}
  >
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', textAlign: 'center' }}>
        <Link
          to="/"
          aria-label="codePost home"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
        >
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

      <Divider style={{ margin: '0 16px', borderColor: 'rgba(255,255,255,0.08)', minWidth: 'auto', width: 'auto' }} />

      <nav
        aria-label="Staff console navigation"
        className="cp-staff-nav"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          onClick={({ key }) => onNavigate(key as StaffPage)}
          style={{ borderRight: 0 }}
          items={[
            {
              key: 'Inbox',
              // What is waiting, counted on the entry. Collapsed, the icon carries the number itself.
              icon: (
                <Badge count={collapsed ? openItems : 0} size="small" offset={[4, 8]} color={BADGE_RED}>
                  <InboxOutlined />
                </Badge>
              ),
              label: (
                <span>
                  Inbox
                  {openItems > 0 && (
                    <>
                      <Badge count={openItems} size="small" style={{ marginLeft: 8 }} color={BADGE_RED} />
                      <span className="sr-only">, {openItems} waiting</span>
                    </>
                  )}
                </span>
              ),
            },
            {
              key: 'People',
              icon: <UserOutlined />,
              label: (
                <span>
                  {countLabel('People', isLoading ? undefined : counts.people)}
                  {counts.pendingRequests > 0 && (
                    <span className="sr-only">, {counts.pendingRequests} admin requests waiting</span>
                  )}
                </span>
              ),
            },
            {
              key: 'Courses',
              icon: <BookOutlined />,
              label: countLabel('Courses', isLoading ? undefined : counts.courses),
            },
            // Health, activity, autograding and the deploy calendar: what the platform is doing.
            { key: 'Platform', icon: <ClusterOutlined />, label: 'Platform' },
            { type: 'divider', style: { borderColor: 'rgba(255,255,255,0.1)', margin: '8px 16px' } },
            // Banner, AI usage, the API reference and the prompt lab: changed or consulted rarely.
            {
              key: 'Tools',
              icon:
                collapsed && bannerDirty ? (
                  <Badge dot color="#ffc53d" offset={[2, 2]}>
                    <ToolOutlined />
                  </Badge>
                ) : (
                  <ToolOutlined />
                ),
              label: (
                <span>
                  Tools
                  {bannerDirty && (
                    <>
                      <Badge dot color="#ffc53d" style={{ marginLeft: 8 }} />
                      <Text style={{ marginLeft: 6, fontSize: 11, color: '#ffd666' }}>unsaved banner</Text>
                      <span className="sr-only">, the banner has unsaved edits</span>
                    </>
                  )}
                </span>
              ),
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
            onClick={onJump}
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

      {!collapsed && (
        <div style={{ padding: '8px 16px 12px', textAlign: 'center' }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
            {process.env.REACT_APP_VERSION || 'dev'}
          </Text>
        </div>
      )}
    </div>
  </Sider>
);

export default StaffSidebar;
