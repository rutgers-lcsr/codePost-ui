/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
const { Header, Content } = Layout;

import CPFlex from './../../core/CPFlex';

/**********************************************************************************************************************/

interface ICPAdminDetailProps {
  goBack: any;
  title: string | React.ReactNode;
  actions: React.ReactNode[];
  content: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

class CPAdminDetail extends React.Component<ICPAdminDetailProps, {}> {
  public render() {
    const subheaderLeft = [
      <span key="title" className="cp-label cp-label--large cp-label--bold">
        {this.props.title}
      </span>,
    ];

    let goBack = null;
    if (this.props.goBack !== null) {
      goBack = <div className="layout--admin__subheader__go-back cp-label--subtitle">—Back</div>;
    }

    return (
      <Content className={`layout--admin__detail${this.props.className ? `--${this.props.className}` : ''}`}>
        <Layout>
          <Header className="layout--admin__subheader">
            {goBack}
            <CPFlex left={[<div key="breadcrumbs">{this.props.breadcrumbs}</div>]} right={[]} gutterSize={10} />
            <CPFlex left={subheaderLeft} right={this.props.actions} gutterSize={10} />
          </Header>
          <Content className="layout--admin__content">{this.props.content}</Content>
        </Layout>
      </Content>
    );
  }
}

export default CPAdminDetail;
