/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
const { Header, Content } = Layout;

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
    const actions = this.props.actions.map((node: React.ReactNode, index: number) => {
      return (
        <div key={`action-${index}`} className="right">
          {node}
        </div>
      );
    });

    return (
      <Content className="layout--admin__detail--rubric">
        <Layout>
          <Header className="layout--admin__rubric__subheader">
            <div className="cp-flex--normal">
              <div className="left">
                <span>{this.props.breadcrumbs}</span>
                <span className="cp-label cp-label--large cp-label--bold">{this.props.title}</span>
              </div>
              <div className="gap" />
              {actions}
            </div>
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
