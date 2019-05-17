import * as React from 'react';
import { Layout } from 'antd';

const { Header, Content, Sider } = Layout;

class CPLayoutGrade extends React.Component<any, {}> {
  render() {
    return (
      <Layout className="layout--grade">
        <Header />
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
