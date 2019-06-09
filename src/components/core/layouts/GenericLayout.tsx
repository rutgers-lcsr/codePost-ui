// This is a generic layout of a header, with a sider and content nested below it
import * as React from 'react';

import { Layout } from 'antd';

import CPButton from './../CPButton';

const { Header, Content, Sider } = Layout;

interface IProps {
  sider: React.ReactNode;
  content: React.ReactNode;
  email: string;
  handleLogout: () => void;
}

class LayoutGrader extends React.Component<IProps, {}> {
  public render() {
    const header = (
      <div className="cp-flex--normal">
        <div className="gap" />
        <div className="right">
          <span className="cp-label cp-label--bold">{this.props.email}</span>
        </div>
        <div className="right">
          <CPButton cpType="secondary" icon="logout" size="small" onClick={this.props.handleLogout} />
        </div>
      </div>
    );
    return (
      <Layout id="Generic" className="layout--generic">
        <Header className="layout--generic__header">{header}</Header>
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

export default LayoutGrader;
