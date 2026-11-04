// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';

/* other library imports */
import { Link } from 'react-router';

/* codePost imports */
import CPLogo from '../../core/CPLogo';
import { CLIENT_URL } from '../../../config';

import { USER_TYPE } from '../../../types/common';

import layoutVars from '../../../styles/layout/_layoutVars';

import useFixedWindow from '../../core/useFixedWindow';
import useWindowSize from '../../core/useWindowSize';

import { LOCAL_SETTINGS } from '../../utils/LocalSettings';

const { Header, Sider } = Layout;

/**********************************************************************************************************************/

interface ICPLayoutAdminProps {
  header: React.ReactNode;
  banner?: React.ReactNode;
  detail: React.ReactNode;
  navigation: (collapsed: boolean) => React.ReactNode;
  collapsible?: boolean;
  hasSider?: boolean;
  role: USER_TYPE;
}

const CPLayoutAdmin = (props: ICPLayoutAdminProps) => {
  const [collapsed, setCollapsed] = React.useState(LOCAL_SETTINGS.sidebarCollapsed.getter());
  const windowSize = useWindowSize();
  useFixedWindow();

  const onCollapse = (c: boolean) => {
    setCollapsed(c);
    LOCAL_SETTINGS.sidebarCollapsed.setter(c);
  };

  const siderWidth =
    windowSize.width < layoutVars.breakpoints.smallScreen.adminCompact
      ? layoutVars.maxWidths.siderCompact
      : windowSize.width < layoutVars.breakpoints.smallScreen.admin
        ? layoutVars.maxWidths.siderSmallScreen
        : layoutVars.maxWidths.siderNormal;

  const openHome = () => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open(CLIENT_URL, '_blank');
    }
  };

  // Calculate margin for main content based on sider state
  const hasSider = props.hasSider === undefined || props.hasSider;

  // FIXME: Hardcoded height variables
  return (
    <Layout id="Admin" className="layout--admin" style={{ overflowX: 'auto' }}>
      {/* Lands on the page title, past the sider and the header row, when the page has one. */}
      <a
        className="cp-skip-link"
        href="#admin-main"
        onClick={(e) => {
          const title = document.querySelector<HTMLElement>('#admin-main h1');
          if (!title) return;
          e.preventDefault();
          title.tabIndex = -1;
          title.focus();
        }}
      >
        Skip to content
      </a>
      {hasSider && (
        <Sider
          className="layout--admin__sider"
          aria-label="Course navigation"
          collapsible={props.collapsible ? props.collapsible : false}
          width={siderWidth}
          collapsed={collapsed}
          onCollapse={onCollapse}
          style={{
            height: '100%',
            // The nav itself scrolls (see _layout.scss) so the footer links stay reachable
            // above the collapse trigger instead of being clipped on short screens.
            overflow: 'hidden',
            zIndex: 10,
            position: 'relative',
            borderRight: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <Header className="layout--admin__sider__header" style={{ height: 'fit-content', flex: 'none' }}>
            {collapsed ? (
              <Link to="/">
                <CPLogo cpType="icon" onClick={openHome} />
              </Link>
            ) : (
              <div>
                <Link to="/">
                  <CPLogo cpType="main" onClick={openHome} />
                </Link>
                <div
                  style={{
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1,
                    paddingTop: 12,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                  }}
                >{`${props.role} Console`}</div>
              </div>
            )}
          </Header>
          {props.navigation(collapsed)}
        </Sider>
      )}
      <Layout
        id="admin-main"
        tabIndex={-1}
        style={{
          minWidth: layoutVars.minWidths.admin,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'auto',
          background: '#f4f5f7',
        }}
      >
        <Header className="layout--admin__header" aria-label="Course and account">
          {props.header}
        </Header>
        {props.banner && windowSize.width > layoutVars.breakpoints.smallScreen.admin && (
          <Header className="layout--admin__banner">{props.banner}</Header>
        )}
        {props.detail}
      </Layout>
    </Layout>
  );
};

export default CPLayoutAdmin;
