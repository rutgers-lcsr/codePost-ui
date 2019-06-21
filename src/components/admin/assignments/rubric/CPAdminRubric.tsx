/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
const { Header, Content } = Layout;

import CPFlex from './../../../core/CPFlex';

/**********************************************************************************************************************/

interface ICPAdminRubricProps {
  goBack: any;
  title: string;
  actions: React.ReactNode[];
  content: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  isEmpty: boolean;
  emptyNode?: React.ReactNode;
}

class CPAdminRubric extends React.Component<ICPAdminRubricProps, {}> {
  public render() {
    const subheaderLeft = [
      <span key="title" className="cp-label cp-label--large cp-label--bold">
        {this.props.title}
      </span>,
    ];

    return (
      <Content className="layout--admin__detail--rubric">
        <Layout>
          <Header className="layout--admin__rubric__subheader">
            <CPFlex left={[<div key="breadcrumbs">{this.props.breadcrumbs}</div>]} right={[]} gutterSize={10} />
            <CPFlex left={subheaderLeft} right={this.props.actions} gutterSize={10} />
          </Header>
          <Content className="layout--admin__rubric__content">
            {this.props.isEmpty ? this.props.emptyNode : this.props.content}
          </Content>
        </Layout>
      </Content>
    );
  }
}

export default CPAdminRubric;
