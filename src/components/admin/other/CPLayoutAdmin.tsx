/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
const { Header, Sider } = Layout;

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import CPLogo from '../../core/CPLogo';

import layoutVars from '../../../styles/layout/_layoutVars';
import useFixedWindow from '../../core/useFixedWindow';
import useWindowSize from '../../core/useWindowSize';

/**********************************************************************************************************************/

interface ICPLayoutAdminProps {
  header: React.ReactNode;
  detail: React.ReactNode;
  navigation: (collapsed: boolean) => React.ReactNode;
  collapsible?: boolean;
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

  // FIXME: Hardcoded height variables
  return (
    <Layout id="Admin" className="layout--admin" style={{ overflowX: 'scroll' }}>
      <Sider
        collapsible={props.collapsible ? props.collapsible : false}
        width={siderWidth}
        collapsed={collapsed}
        onCollapse={onCollapse}
      >
        <Header className="layout--admin__sider__header">
          {collapsed ? (
            <Link to="/">
              <CPLogo cpType="icon" />
            </Link>
          ) : (
            <Link to="/">
              <CPLogo cpType="main" />
            </Link>
          )}
        </Header>
        <div style={{ maxHeight: windowSize.height - 64 - 85 - 48, overflow: 'scroll' }}>
          {props.navigation(collapsed)}
        </div>
      </Sider>
      <Layout style={{ minWidth: layoutVars.minWidths.admin }}>
        <Header className="layout--admin__header">{props.header}</Header>
        {props.detail}
      </Layout>
    </Layout>
  );
};

export default CPLayoutAdmin;
