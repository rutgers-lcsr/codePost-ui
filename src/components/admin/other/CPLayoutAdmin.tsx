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

import themeVars from '../../../styles/abstracts/_theme.js';
import layoutVars from '../../../styles/layout/_layoutVars';

import useFixedWindow from '../../core/useFixedWindow';
import useWindowSize from '../../core/useWindowSize';

const { Header, Sider } = Layout;

/**********************************************************************************************************************/

interface ICPLayoutAdminProps {
  header: React.ReactNode;
  banner?: React.ReactNode;
  detail: React.ReactNode;
  showBillingBanner?: string | null;
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
    windowSize.width < layoutVars.breakpoints.smallScreen.admin
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
            height: '100vh',
            overflow: 'hidden',
            zIndex: 10,
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
                    color: themeVars.theme.green4,
                    lineHeight: 1,
                    paddingTop: 10,
                  }}
                >{`${props.role} Console`}</div>
              </div>
            )}
          </Header>
          {props.navigation(collapsed)}
        </Sider>
      )}
      <Layout style={{ minWidth: layoutVars.minWidths.admin }}>
        <Header className="layout--admin__header">{props.header}</Header>
        {props.showBillingBanner && (
          <Link to={props.showBillingBanner}>
            <div
              style={{
                width: '100%',
                background: '#24be85',
                padding: '8px 20px',
                color: 'white',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              Please support codePost by paying for your course.{' '}
              <span style={{ fontWeight: 600 }}>Click here to learn more.</span>
            </div>
          </Link>
        )}
        {props.banner && windowSize.width > layoutVars.breakpoints.smallScreen.admin && (
          <Header className="layout--admin__banner">{props.banner}</Header>
        )}
        {props.detail}
      </Layout>
    </Layout>
  );
};

export default CPLayoutAdmin;
