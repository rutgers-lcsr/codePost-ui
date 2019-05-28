import * as React from 'react';

import { Layout } from 'antd';

const { Header, Content } = Layout;

import CPFlex from './CPFlex';

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

    const left = [
      <span key={0} className="cp-label cp-label--large cp-label--bold">
        {this.props.title}
      </span>,
    ];

    const right = actions;

    return (
      <Layout>
        <Header className="layout--admin__subheader">
          {goBack}
          <CPFlex left={left} right={right} gutterSize={10} />
        </Header>
        <Content className="layout--admin__content">{this.props.content}</Content>
      </Layout>
    );
  }
}

export default CPAdminDetail;
