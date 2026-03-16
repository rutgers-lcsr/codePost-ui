// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';

import CPFlex from '../../../core/CPFlex';
import CPTooltip from '../../../core/CPTooltip';

const { Header, Content } = Layout;
/**********************************************************************************************************************/

interface ICPAdminRubricProps {
  goBack: () => void;
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
      infoIcon={true}
      hideThisOnHideTips={true}
      iconStyle={{ paddingLeft: 10 }}
    />
  ) : (
    <div />
  );

  const subheaderLeft = [
    <div key="title" style={{ display: 'flex', alignItems: 'center' }}>
      <span className="cp-label cp-label--large cp-label--bold">{props.title}</span>
      {titleTooltip}
    </div>,
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
