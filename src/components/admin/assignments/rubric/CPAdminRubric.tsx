/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
const { Header, Content } = Layout;

import CPFlex from '../../../core/CPFlex';
import CPTooltip from '../../../core/CPTooltip';
/**********************************************************************************************************************/

interface ICPAdminRubricProps {
  goBack: any;
  title: string;
  actions: React.ReactNode[];
  content: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  isEmpty: boolean;
  emptyNode?: React.ReactNode;
  titleInfo?: string | React.ReactNode;
}

const CPAdminRubric = (props: ICPAdminRubricProps) => {
  const titleTooltip = props.titleInfo ? (
    <CPTooltip
      title={props.titleInfo}
      placement="right"
      type="info"
      hideThisOnHideTips={true}
      iconStyle={{ paddingLeft: 10 }}
    />
  ) : (
    <div />
  );

  const subheaderLeft = [
    <span key="title" className="cp-label cp-label--large cp-label--bold">
      {props.title}
    </span>,
    titleTooltip,
  ];

  return (
    <Content className="layout--admin__detail--rubric">
      <Layout>
        <Header className="layout--admin__rubric__subheader">
          <CPFlex left={[<div key="breadcrumbs">{props.breadcrumbs}</div>]} right={[]} gutterSize={10} />
          <CPFlex left={subheaderLeft} right={props.actions} gutterSize={10} />
        </Header>
        <Content className="layout--admin__rubric__content">{props.isEmpty ? props.emptyNode : props.content}</Content>
      </Layout>
    </Content>
  );
};

export default CPAdminRubric;
