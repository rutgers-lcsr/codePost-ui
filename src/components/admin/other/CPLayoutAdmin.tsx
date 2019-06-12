/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
const { Header, Sider } = Layout;

/* codePost imports */
import CPLogo from '../../core/CPLogo';

import useFixedWindow from '../../core/useFixedWindow';
import useWindowSize from '../../core/useWindowSize';

/**********************************************************************************************************************/

interface ICPLayoutAdminProps {
  header: React.ReactNode;
  detail: React.ReactNode;
  navigation: React.ReactNode;
  collabsible?: boolean;
}

const CPLayoutAdmin = (props: ICPLayoutAdminProps) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const windowSize = useWindowSize();
  useFixedWindow();

  const onCollapse = (c: boolean) => {
    setCollapsed(c);
  };

  // FIXME: Hardcoded height variables
  return (
    <Layout id="Admin" className="layout--admin">
      <Sider collapsible={props.collabsible ? props.collabsible : false} collapsed={collapsed} onCollapse={onCollapse}>
        <Header className="layout--admin__sider__header">
          {collapsed ? <CPLogo cpType="icon" /> : <CPLogo cpType="main" />}
        </Header>
        <div style={{ maxHeight: windowSize.height - 64 - 85 - 48, overflow: 'scroll' }}>{props.navigation}</div>
      </Sider>
      <Layout>
        <Header className="layout--admin__header">{props.header}</Header>
        {props.detail}
      </Layout>
    </Layout>
  );
};

export default CPLayoutAdmin;
