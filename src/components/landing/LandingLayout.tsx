import { Divider } from 'antd';

import * as React from 'react';
import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

interface IProps {
  topBar: React.ReactNode;
  hero: React.ReactNode;
  testimonial: React.ReactNode;
  whyPanel: React.ReactNode;
  panelOne: React.ReactNode;
  panelTwo: React.ReactNode;
  panelThree: React.ReactNode;
  getStarted: React.ReactNode;
  footer: React.ReactNode;
}

const LandingLayout = (props: IProps) => {
  const windowSize = useWindowSize();

  const maxWidth = landingVars.maxWidths.panel;

  const flexDirection: any = 'row';
  const sectionStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection,
  };

  const verticalPaddingPanel =
    windowSize.width < landingVars.breakpoints.verticalPanels
      ? landingVars.Vpadding.panelSmallScreen
      : landingVars.Vpadding.panelNormal;

  const verticalPaddingHero =
    windowSize.width < landingVars.breakpoints.verticalPanels
      ? landingVars.Vpadding.heroImgSmallScreen
      : landingVars.Vpadding.heroNormal;

  const verticalPadddingHeader =
    windowSize.width < landingVars.breakpoints.header
      ? landingVars.Vpadding.headerSmallScreen
      : landingVars.Vpadding.headerNormal;

  const panelStyle = {
    maxWidth: landingVars.maxWidths.panel,
    paddingTop: verticalPaddingPanel,
    paddingBottom: verticalPaddingPanel,
    paddingLeft:
      windowSize.width < landingVars.breakpoints.mobile
        ? landingVars.Hpadding.panelMobile
        : landingVars.Hpadding.panelNormal,
    paddingRight:
      windowSize.width < landingVars.breakpoints.mobile
        ? landingVars.Hpadding.panelMobile
        : landingVars.Hpadding.panelNormal,
    width: '100%',
  };

  const absolutePosition: any = 'absolute';
  const backgroundImageStyle = {
    zIndex: -1,
    position: absolutePosition,
    width:
      windowSize.width < landingVars.breakpoints.mobile
        ? landingVars.maxWidths.backgroundImageMobile
        : landingVars.maxWidths.backgroundImageNormal,
  };

  const testimonialBackground = require('../../img/landing/compressed/backgrounds/testimonial.jpg');
  const testimonialBackgroundMobile = require('../../img/landing/compressed/backgrounds/testimonial-MOBILE.jpg');
  const whyPanelBackground = require('../../img/landing/compressed/backgrounds/whyPanel.jpg');
  const whyPanelBackgroundMobile = require('../../img/landing/compressed/backgrounds/whyPanel-MOBILE.jpg');
  const panelOneBackground = require('../../img/landing/compressed/backgrounds/panelOne.jpg');
  const panelOneBackgroundMobile = require('../../img/landing/compressed/backgrounds/panelOne-MOBILE.jpg');
  const panelTwoBackground = require('../../img/landing/compressed/backgrounds/panelTwo.jpg');
  const panelTwoBackgroundMobile = require('../../img/landing/compressed/backgrounds/panelTwo-MOBILE.jpg');

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflowX: 'hidden',
        position: 'relative',
        WebkitOverflowScrolling: 'touch',
      }}
      id="LandingLayout"
    >
      <div style={{ ...sectionStyle, background: landingVars.backgrounds.hero }}>
        <div
          style={{
            width: '100%',
            paddingTop: verticalPadddingHeader,
            paddingBottom: verticalPadddingHeader,
          }}
        >
          {props.topBar}
        </div>
      </div>
      <div>
        <div style={{ ...sectionStyle, background: landingVars.backgrounds.hero, paddingLeft: 75, paddingRight: 75 }}>
          <div
            style={{
              maxWidth: landingVars.maxWidths.panel,
              paddingTop: verticalPaddingHero,
              paddingBottom: verticalPaddingHero,
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {props.hero}
          </div>
        </div>
        <div style={{ ...sectionStyle, background: landingVars.backgrounds.hero }}>
          <img
            src={
              windowSize.width < landingVars.breakpoints.mobile ? testimonialBackgroundMobile : testimonialBackground
            }
            style={{
              ...backgroundImageStyle,
              paddingTop:
                windowSize.width < landingVars.breakpoints.mobile
                  ? landingVars.backgroundOffsets.testimonialMobile
                  : landingVars.backgroundOffsets.testimonial,
            }}
          />
          <div
            style={{
              paddingTop: verticalPaddingHero,
              paddingBottom: verticalPaddingHero,
              paddingLeft: landingVars.Hpadding.testimonial,
              paddingRight: landingVars.Hpadding.testimonial,
              width: '100%',
              maxWidth: landingVars.maxWidths.panel,
            }}
          >
            {props.testimonial}
          </div>
        </div>
      </div>
      <div style={{ ...sectionStyle, paddingTop: 0, background: landingVars.backgrounds.panelOne }}>
        <img
          src={windowSize.width < landingVars.breakpoints.mobile ? panelOneBackgroundMobile : panelOneBackground}
          style={{
            ...backgroundImageStyle,
            paddingTop:
              windowSize.width < landingVars.breakpoints.mobile
                ? landingVars.backgroundOffsets.panelOneMobile
                : landingVars.backgroundOffsets.panelOne,
          }}
        />
        <div style={{ ...panelStyle, paddingBottom: 25, paddingTop: 100 }}>{props.panelOne}</div>
      </div>
      <div style={{ ...sectionStyle, background: landingVars.backgrounds.whyPanel }}>
        <img
          src={windowSize.width < landingVars.breakpoints.mobile ? whyPanelBackgroundMobile : whyPanelBackground}
          style={{
            ...backgroundImageStyle,
            paddingTop:
              windowSize.width < landingVars.breakpoints.mobile
                ? landingVars.backgroundOffsets.whyPanelMobile
                : landingVars.backgroundOffsets.whyPanel,
          }}
        />
        <div
          style={{
            ...panelStyle,
            paddingTop: 35,
            maxWidth: landingVars.maxWidths.whyPanel,
          }}
        >
          {props.whyPanel}
        </div>
      </div>
      <div style={{ ...sectionStyle, background: landingVars.backgrounds.panelTwo }}>
        <img
          src={windowSize.width < landingVars.breakpoints.mobile ? panelTwoBackgroundMobile : panelTwoBackground}
          style={{
            ...backgroundImageStyle,
            paddingTop:
              windowSize.width < landingVars.breakpoints.mobile
                ? landingVars.backgroundOffsets.panelTwoMobile
                : landingVars.backgroundOffsets.panelTwo,
          }}
        />
        <div style={panelStyle}>{props.panelTwo}</div>
      </div>
      <div style={{ ...sectionStyle, background: landingVars.backgrounds.panelThree }}>
        <div style={{ ...panelStyle }}>{props.panelThree}</div>
      </div>
      <div>
        <Divider style={{ margin: 0 }} />
        <div style={{ ...sectionStyle, background: landingVars.backgrounds.getStarted }}>
          <div
            style={{
              maxWidth,
              width: '100%',
              paddingTop: landingVars.Vpadding.getStartedNormal,
              paddingBottom: landingVars.Vpadding.getStartedNormal,
            }}
          >
            {props.getStarted}
          </div>
        </div>
        <div style={{ ...sectionStyle, background: landingVars.backgrounds.footer }}>
          <div style={{ maxWidth: landingVars.maxWidths.footer, width: '100%' }}>{props.footer}</div>
        </div>
      </div>
    </div>
  );
};

export default LandingLayout;
