import * as React from 'react';

import { Layout } from 'antd';

import CPButton from './../CPButton';
import CPFlex from './../CPFlex';
import CPLogo from './../CPLogo';

const { Header, Content, Sider } = Layout;

interface IProps {
  sider: React.ReactNode;
  content: React.ReactNode;
  email: string;
  handleLogout: () => void;
}

class StudentAndGraderLayout extends React.Component<IProps, {}> {
  public render() {
    const headerLeft = [<CPLogo key="header-0" cpType="main" />];
    const headerRight = [
      <span key="header-user" className="cp-label cp-label--white cp-label--bold">
        {this.props.email}
      </span>,
      <CPButton key="header-logout" cpType="dark" fallback="logout" onClick={this.props.handleLogout}>
        Log Out
      </CPButton>,
    ];

    return (
      <Layout id="Generic" className="layout--generic">
        <Header className="layout--generic__header">
          <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />
        </Header>
        <Content className="layout--generic__content">
          <Layout>
            <Sider className="layout--generic__sider">{this.props.sider}</Sider>
            <Content className="layout--generic__subcontent">{this.props.content}</Content>
          </Layout>
        </Content>
      </Layout>
    );
  }
}

export default StudentAndGraderLayout;
