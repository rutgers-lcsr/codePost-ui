import * as React from 'react';

import { Layout } from 'antd';

const { Header, Content, Sider } = Layout;
// const SubMenu = Menu.SubMenu;

// interface ICPLayoutAdminProps {

// }

interface ICPLayoutAdminState {
  collapsed: boolean;
}

class CPLayoutAdmin extends React.Component<any, {}> {
  public state: Readonly<ICPLayoutAdminState> = {
    collapsed: false,
  };

  public onCollapse = (collapsed: boolean) => {
    console.log(collapsed);
    this.setState({ collapsed });
  };

  public render() {
    return (
      <Layout className="layout--admin">
        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse} />
        <Layout>
          <Header className="layout--admin__header" />
          <Content className="layout--admin__content">
            <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>.</div>
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default CPLayoutAdmin;
