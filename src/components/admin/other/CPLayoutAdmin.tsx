// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import CPLogo from '../../core/CPLogo';

import { USER_TYPE } from '../../../types/common';

import layoutVars from '../../../styles/layout/_layoutVars';

import useFixedWindow from '../../core/useFixedWindow';
import useWindowSize from '../../core/useWindowSize';

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
  const [collapsed, setCollapsed] = React.useState(false);
  const windowSize = useWindowSize();
  useFixedWindow();

  const onCollapse = (c: boolean) => {
    setCollapsed(c);
  };

  const siderWidth =
    windowSize.width < layoutVars.breakpoints.smallScreen.adminCompact
      ? layoutVars.maxWidths.siderCompact
      : windowSize.width < layoutVars.breakpoints.smallScreen.admin
        ? layoutVars.maxWidths.siderSmallScreen
        : layoutVars.maxWidths.siderNormal;

  const openHome = () => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open('https://codepost.cs.rutgers.edu', '_blank');
    }
  };

  // Calculate margin for main content based on sider state
  const hasSider = props.hasSider === undefined || props.hasSider;

  // FIXME: Hardcoded height variables
  return (
    <Layout id="Admin" className="layout--admin" style={{ overflowX: 'auto' }}>
      {hasSider && (
        <Sider
          collapsible={props.collapsible ? props.collapsible : false}
          width={siderWidth}
          collapsed={collapsed}
          onCollapse={onCollapse}
          style={{
            height: '100%',
            overflow: 'hidden auto',
            zIndex: 10,
            position: 'relative',
            borderRight: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <Header className="layout--admin__sider__header" style={{ height: 'fit-content' }}>
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
                    color: 'rgba(255, 255, 255, 0.35)',
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
        style={{
          minWidth: layoutVars.minWidths.admin,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'auto',
          background: '#f4f5f7',
        }}
      >
        <Header className="layout--admin__header">{props.header}</Header>
        {props.banner && windowSize.width > layoutVars.breakpoints.smallScreen.admin && (
          <Header className="layout--admin__banner">{props.banner}</Header>
        )}
        {props.detail}
      </Layout>
    </Layout>
  );
};

export default CPLayoutAdmin;
