import * as React from 'react';

import { Layout } from 'antd';

const { Content, Header, Sider } = Layout;

import CPLogo from './CPLogo';

class CPLayoutGrade extends React.Component<any, {}> {
  public render() {
    return (
      <Layout className="layout--grade">
        <Header className="layout--grade__header">
          <CPLogo />
        </Header>
        <Layout>
          <Sider width={300} className="layout--grade__sider" />
          <Layout>
            <Header className="layout--grade__subheader" />
            <Content className="layout--grade__content">
              <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>.</div>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default CPLayoutGrade;
