import * as React from 'react';

import CPMainNav from './CPMainNav';

import { ClickParam } from 'antd/lib/menu';

import { Layout } from 'antd';

import CPLogo from './CPLogo';

const { Header, Content, Sider } = Layout;

interface ICPLayoutAdminProps {
  header: React.ReactNode;
  detail: React.ReactNode;
  isRubric: boolean;
  onClick: (e: ClickParam) => void;
  selectedPanel: number;
}

interface ICPLayoutAdminState {
  collapsed: boolean;
}

class CPLayoutAdmin extends React.Component<ICPLayoutAdminProps, {}> {
  public state: Readonly<ICPLayoutAdminState> = {
    collapsed: false,
  };

  public onCollapse = (collapsed: boolean) => {
    this.setState({ collapsed });
  };

  public render() {
    // console.log('width', this.props.windowWidth);

    return (
      <Layout id="Admin" className="layout--admin">
        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
          <Header className="layout--admin__sider__header">
            {this.state.collapsed ? <CPLogo cpType="icon" /> : <CPLogo cpType="main" />}
          </Header>
          <CPMainNav selectedPanel={this.props.selectedPanel} onClick={this.props.onClick} />
        </Sider>
        <Layout>
          <Header className="layout--admin__header">{this.props.header}</Header>
          <Content className={this.props.isRubric ? 'layout--admin__detail--rubric' : 'layout--admin__detail'}>
            {this.props.detail}
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default CPLayoutAdmin;
