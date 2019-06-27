import * as React from 'react';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

type TextOrientation = 'right' | 'left';
type TextSize = 'big' | 'normal';

interface IProps {
  text: React.ReactNode;
  title: string;
  subTitle: React.ReactNode;
  module: React.ReactNode;
  type: TextOrientation;
  textSize: TextSize;
  moduleMaxWidth: number;
  moduleMaxHeight: number;
  removeModelSmallScreen: boolean;
  bevel: boolean;
}

const leftBevelStyle = {
  transform: 'scale(0.9) translateX(-40px) perspective(2000px) rotateY(20deg) rotateX(-1deg) rotate(-2deg)',
  boxShadow:
    '8px 8px 22px 0 hsla(0, 0%, 84.7%, 0.25), 0 0 2px 0 rgba(0, 0, 0, 0.15), 10px 25px 20px 0 rgba(0, 0, 0, 0.05)',
  borderRadius: 5,
  overflow: 'hidden',
};

const rightBevelStyle = {
  transform: 'scale(0.9) translateX(40px) perspective(2000px) rotateY(-20deg) rotateX(1deg) rotate(2deg)',
  boxShadow:
    '8px 8px 22px 0 hsla(0, 0%, 84.7%, 0.25), 0 0 2px 0 rgba(0, 0, 0, 0.15), 10px 25px 20px 0 rgba(0, 0, 0, 0.05)',
  borderRadius: 5,
  overflow: 'hidden',
};

const flatBevelStyle = {
  borderRadius: 5,
  overflow: 'hidden',
  boxShadow:
    '8px 8px 22px 0 hsla(0, 0%, 84.7%, 0.25), 0 0 2px 0 rgba(0, 0, 0, 0.15), 10px 25px 20px 0 rgba(0, 0, 0, 0.05)',
};

const LandingPanel = (props: IProps) => {
  const brandColor = '#24be85';
  const textColor = '#7F7F7F';
  const titleSize = props.textSize === 'big' ? 24 : 18;
  const subTitleSize = props.textSize === 'big' ? 22 : 20;
  const textSize = props.textSize === 'big' ? 16 : 15;

  const windowSize = useWindowSize();

  const moduleStyle = props.bevel
    ? windowSize.width < landingVars.breakpoints.verticalPanels
      ? flatBevelStyle
      : props.type === 'right'
      ? leftBevelStyle
      : rightBevelStyle
    : {};
  const moduleDiv = (
    <div
      style={{
        maxWidth: props.moduleMaxWidth,
        maxHeight: props.moduleMaxHeight,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...moduleStyle,
      }}
    >
      {props.module}
    </div>
  );
  const textDiv = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        textAlign: windowSize.width < landingVars.breakpoints.verticalPanels ? 'center' : 'start',
      }}
    >
      <div style={{ color: brandColor, fontSize: titleSize, paddingBottom: 20, fontWeight: 600 }}>{props.title}</div>
      <div style={{ color: textColor, fontSize: subTitleSize, paddingBottom: 20 }}>{props.subTitle}</div>
      <div style={{ color: textColor, fontSize: textSize, lineHeight: 1.7 }}>{props.text}</div>
    </div>
  );

  if (windowSize.width < landingVars.breakpoints.verticalPanels) {
    // We add an amount to the maxWidth for the scaling in order to make sure the animations have padding
    const transform = windowSize.width > props.moduleMaxWidth + 20 ? 1 : windowSize.width / (props.moduleMaxWidth + 20);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 25 }}>{textDiv}</div>
        {props.removeModelSmallScreen && windowSize.width < landingVars.breakpoints.removeModule ? (
          <div />
        ) : (
          <div style={{ transform: `scale(${transform})` }}>{moduleDiv}</div>
        )}
      </div>
    );
  } else {
    return (
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>{props.type === 'right' ? moduleDiv : textDiv}</div>
        <div style={{ width: 50 }} />
        <div>{props.type === 'left' ? moduleDiv : textDiv}</div>
      </div>
    );
  }
};

export default LandingPanel;
