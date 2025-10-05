import { Divider } from 'antd';

import React, { Suspense } from 'react';
import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

import { EmailSubscribe } from './EmailSubscribe';

const Video = React.lazy(() => import('./Video'));

interface IProps {
  location: any;
  topBar: React.ReactNode;
  hero: React.ReactNode;
  testimonial: React.ReactNode;
  panelOne: React.ReactNode;
  panelTwo: React.ReactNode;
  panelThree: React.ReactNode;
  panelFour: React.ReactNode;
  getStarted: React.ReactNode;
  footer: React.ReactNode;
}

const LandingLayout = (props: IProps) => {
  const windowSize = useWindowSize();

  const maxWidth = landingVars.maxWidths.panel;

  const sectionStyle = {
    width: '100%',
  };

  const sectionClass = 'display-flex flex-direction-row justify-content-center';

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

  const testimonialBackground = new URL('../../img/landing/compressed/backgrounds/testimonial.png', import.meta.url)
    .href;
  const testimonialBackgroundMobile = new URL(
    '../../img/landing/compressed/backgrounds/testimonial-MOBILE.jpg',
    import.meta.url,
  ).href;

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
      <div style={{ ...sectionStyle, background: landingVars.backgrounds.hero }} className={sectionClass}>
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
        <div
          style={{ ...sectionStyle, background: landingVars.backgrounds.hero, paddingLeft: 75, paddingRight: 75 }}
          className={sectionClass}
        >
          <div
            style={{
              maxWidth: landingVars.maxWidths.panel,
              paddingTop: verticalPaddingHero,
              paddingBottom: verticalPaddingHero,
              width: '100%',
            }}
            className="display-flex justify-content-space-between"
          >
            {props.hero}
          </div>
        </div>
        <div style={{ ...sectionStyle, background: landingVars.backgrounds.hero }} className={sectionClass}>
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
            alt=""
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
      <div style={{ ...sectionStyle }} className={sectionClass}>
        <div style={{ ...panelStyle }}>{props.panelOne}</div>
      </div>
      <div style={{ ...sectionStyle }} className={sectionClass}>
        <div style={panelStyle}>{props.panelTwo}</div>
      </div>
      <div style={{ ...sectionStyle, background: landingVars.backgrounds.panelThree }} className={sectionClass}>
        <div style={{ ...panelStyle }}>{props.panelThree}</div>
      </div>
      <div style={{ ...sectionStyle, background: landingVars.backgrounds.panelThree }} className={sectionClass}>
        <div style={{ ...panelStyle }}>{props.panelFour}</div>
      </div>
      <Divider style={{ margin: 0 }} />
      <div style={{ ...sectionStyle }} className={sectionClass}>
        <div style={{ ...panelStyle, maxWidth: '1920px', textAlign: 'center' }}>
          <Suspense fallback={<div style={{ width: '100%', height: 400 }} />}>
            <Video location={props.location} />
          </Suspense>
        </div>
      </div>
      <div>
        <Divider style={{ margin: 0 }} />
        <div style={{ ...sectionStyle, background: landingVars.backgrounds.getStarted }} className={sectionClass}>
          <div
            style={{
              maxWidth,
              width: '100%',
              paddingTop: landingVars.Vpadding.getStartedNormal,
              paddingBottom: landingVars.Vpadding.getStartedNormal,
            }}
          >
            {props.getStarted}
            <div
              style={{
                width: '100%',
                marginTop: 25,
                padding: '0 25px',
              }}
            >
              <EmailSubscribe />
            </div>
          </div>
        </div>

        <div style={{ ...sectionStyle, background: landingVars.backgrounds.footer }} className={sectionClass}>
          <div style={{ maxWidth: landingVars.maxWidths.footer, width: '100%' }}>{props.footer}</div>
        </div>
      </div>
    </div>
  );
};

export default LandingLayout;
