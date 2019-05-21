import * as React from 'react';

import { Layout } from 'antd';

const { Header, Content } = Layout;

interface ICPAdminDetailProps {
  goBack: any;
  title: string;
  actions: React.ReactNode[];
  content: React.ReactNode;
}

class CPAdminDetail extends React.Component<ICPAdminDetailProps, {}> {
  public render() {
    const actions = this.props.actions.map((node: React.ReactNode, index: number) => {
      return (
        <div key={`action-${index}`} className="right">
          {node}
        </div>
      );
    });

    let goBack = null;
    if (this.props.goBack !== null) {
      goBack = <div className="layout--admin__subheader__go-back cp-label--subtitle">—Back</div>;
    }

    return (
      <Layout>
        <Header className="layout--admin__subheader">
          {goBack}
          <div className="cp-flex--normal">
            <div className="left">
              <span className="cp-label cp-label--large cp-label--bold">{this.props.title}</span>
            </div>
            <div className="gap" />
            {actions}
          </div>
        </Header>
        <Content className="layout--admin__content">{this.props.content}</Content>
      </Layout>
    );
  }
}

export default CPAdminDetail;
