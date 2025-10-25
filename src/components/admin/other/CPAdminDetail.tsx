/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import { Layout } from 'antd';
import React, { useMemo } from 'react';

import layoutVars from '../../../styles/layout/_layoutVars';
import useWindowSize from '../../core/useWindowSize';

import CPFlex from '../../core/CPFlex';
import CPTooltip from '../../core/CPTooltip';

const { Header, Content } = Layout;

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

interface ICPAdminDetailProps {
  goBack: React.ReactNode | null;
  title: string | React.ReactNode;
  actions: React.ReactNode[];
  content: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
  gutterSize?: number;
  titleInfo?: string | React.ReactNode;
}

// Constants
const SMALL_SCREEN_MARGIN = '20px 15px';
const LARGE_SCREEN_MARGIN = '20px 60px';
const SMALL_SCREEN_PADDING = '20px 15px';
const LARGE_SCREEN_PADDING = '20px 35px';
const DEFAULT_GUTTER_SIZE = 10;
const BREADCRUMB_GUTTER_SIZE = 10;
const TITLE_INFO_PADDING_LEFT = 10;

/**********************************************************************************************************************/
/* Component
/**********************************************************************************************************************/

const CPAdminDetail: React.FC<ICPAdminDetailProps> = ({
  goBack,
  title,
  actions,
  content,
  breadcrumbs,
  className,
  gutterSize = DEFAULT_GUTTER_SIZE,
  titleInfo,
}) => {
  const windowSize = useWindowSize();
  const smallScreen = windowSize.width < layoutVars.breakpoints.smallScreen.admin;

  const contentMargin = useMemo(() => (smallScreen ? SMALL_SCREEN_MARGIN : LARGE_SCREEN_MARGIN), [smallScreen]);

  const contentPadding = useMemo(() => (smallScreen ? SMALL_SCREEN_PADDING : LARGE_SCREEN_PADDING), [smallScreen]);

  const titleTooltip = useMemo(() => {
    if (!titleInfo) {
      return null;
    }

    return (
      <CPTooltip
        title={titleInfo}
        placement="right"
        infoIcon={true}
        hideThisOnHideTips={true}
        iconStyle={{ paddingLeft: TITLE_INFO_PADDING_LEFT }}
      />
    );
  }, [titleInfo]);

  const subheaderLeft = useMemo(
    () => [
      <div key="title" style={{ display: 'flex', alignItems: 'center' }}>
        <div role="heading" aria-level={1} className="cp-label cp-label--large cp-label--bold">
          {title}
        </div>
        {titleTooltip}
      </div>,
    ],
    [title, titleTooltip],
  );

  const goBackElement = useMemo(() => {
    if (goBack === null) {
      return null;
    }
    return <div className="layout--admin__subheader__go-back cp-label--subtitle">—Back</div>;
  }, [goBack]);

  const contentClassName = useMemo(() => `layout--admin__detail${className ? `--${className}` : ''}`, [className]);

  const contentStyle = useMemo(
    () => ({
      padding: contentPadding,
      margin: contentMargin,
      transition: '0.3s',
    }),
    [contentPadding, contentMargin],
  );

  return (
    <Content className={contentClassName} style={contentStyle}>
      <Layout>
        <Header className="layout--admin__subheader">
          {goBackElement}
          <CPFlex left={[<div key="breadcrumbs">{breadcrumbs}</div>]} right={[]} gutterSize={BREADCRUMB_GUTTER_SIZE} />
          <CPFlex left={subheaderLeft} right={actions} gutterSize={gutterSize} />
        </Header>
        <div className="layout--admin__content">{content}</div>
      </Layout>
    </Content>
  );
};

export default CPAdminDetail;
