/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
const { Header, Content } = Layout;

import layoutVars from '../../../styles/layout/_layoutVars';

import CPFlex from '../../core/CPFlex';
import CPTooltip from '../../core/CPTooltip';

import useWindowSize from '../../core/useWindowSize';

/**********************************************************************************************************************/

interface ICPAdminDetailProps {
  goBack: any;
  title: string | React.ReactNode;
  actions: React.ReactNode[];
  content: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
  gutterSize?: number;
  titleInfo?: string | React.ReactNode;
}

const CPAdminDetail = (props: ICPAdminDetailProps) => {
  const windowSize = useWindowSize();
  const smallScreen = windowSize.width < layoutVars.breakpoints.smallScreen.admin;

  const contentMargin = smallScreen ? '20px 15px' : '20px 60px';
  const contentPadding = smallScreen ? '20px 15px' : '20px 35px';

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
    <span key="title" className="cp-label cp-label--large cp-label--bold">
      {props.title}
    </span>,
    titleTooltip,
  ];

  let goBack = null;
  if (props.goBack !== null) {
    goBack = <div className="layout--admin__subheader__go-back cp-label--subtitle">—Back</div>;
  }

  return (
    <Content
      className={`layout--admin__detail${props.className ? `--${props.className}` : ''}`}
      style={{ padding: contentPadding, margin: contentMargin, transition: '0.3s' }}
    >
      <Layout>
        <Header className="layout--admin__subheader">
          {goBack}
          <CPFlex left={[<div key="breadcrumbs">{props.breadcrumbs}</div>]} right={[]} gutterSize={10} />
          <CPFlex
            left={subheaderLeft}
            right={props.actions}
            gutterSize={props.gutterSize !== undefined ? props.gutterSize : 10}
          />
        </Header>
        <Content className="layout--admin__content">{props.content}</Content>
      </Layout>
    </Content>
  );
};

export default CPAdminDetail;
