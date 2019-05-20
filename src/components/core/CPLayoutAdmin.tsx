import * as React from 'react';

import { Layout } from 'antd';

import CPLogo from './CPLogo';

const { Header, Content, Sider } = Layout;

// import withWindowWatcher from './withWindowWatcher';

import CPMainNav from './CPMainNav';

interface ICPLayoutAdminProps {
  header: React.ReactNode;
  detail: React.ReactNode;
}

interface ICPLayoutAdminState {
  collapsed: boolean;
}

class CPLayoutAdmin extends React.Component<ICPLayoutAdminProps, {}> {
  public state: Readonly<ICPLayoutAdminState> = {
    collapsed: false,
  };

  public onCollapse = (collapsed: boolean) => {
    console.log(collapsed);
    this.setState({ collapsed });
  };

  public render() {
    // console.log('width', this.props.windowWidth);
    return (
      <Layout className="layout--admin">
        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
          <Header className="layout--admin__sider__header">
            {this.state.collapsed ? <CPLogo cpType="icon" /> : <CPLogo cpType="main" />}
          </Header>
          <CPMainNav />
        </Sider>
        <Layout>
          <Header className="layout--admin__header">{this.props.header}</Header>
          <Content className="layout--admin__detail">{this.props.detail}</Content>
        </Layout>
      </Layout>
    );
  }
}

export default CPLayoutAdmin;
