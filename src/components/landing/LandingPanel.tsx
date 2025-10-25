import * as React from 'react';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';
import { colors } from '../../theme/colors';

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
  bevel?: boolean;
  gutterSize: number;
}

const LandingPanel = (props: IProps) => {
  const brandColor = colors.brandPrimary;
  const textColor = '#7F7F7F';
  const titleSize = props.textSize === 'big' ? 28 : 20;
  const subTitleSize = props.textSize === 'big' ? 26 : 22;
  const textSize = props.textSize === 'big' ? 17 : 17;

  const windowSize = useWindowSize();

  const moduleClass = props.bevel
    ? windowSize.width < landingVars.breakpoints.verticalPanels
      ? 'bevel'
      : props.type === 'right'
        ? 'bevel bevel--left'
        : 'bevel bevel--right'
    : '';

  const moduleDiv = (
    <div
      style={{
        maxWidth: props.moduleMaxWidth,
        maxHeight: props.moduleMaxHeight,
      }}
      className={`display-flex justify-content-center align-items-center ${moduleClass}`}
    >
      {props.module}
    </div>
  );
  const textDiv = (
    <div
      style={{
        height: '100%',
        textAlign: windowSize.width < landingVars.breakpoints.verticalPanels ? 'center' : 'start',
      }}
      className="display-flex flex-direction-column justify-content-center"
    >
      <div style={{ color: brandColor, fontSize: titleSize, paddingBottom: 20, fontWeight: 600 }}>{props.title}</div>
      <div style={{ color: textColor, fontSize: subTitleSize, paddingBottom: props.subTitle ? 20 : 0 }}>
        {props.subTitle}
      </div>
      <div style={{ color: textColor, fontSize: textSize, lineHeight: 1.7 }}>{props.text}</div>
    </div>
  );

  if (windowSize.width < landingVars.breakpoints.verticalPanels) {
    // We add an amount to the maxWidth for the scaling in order to make sure the animations have padding
    const transform = windowSize.width > props.moduleMaxWidth + 20 ? 1 : windowSize.width / (props.moduleMaxWidth + 20);
    return (
      <div className="display-flex flex-direction-column align-items-center">
        <div style={{ marginBottom: 25 }}>{textDiv}</div>
        {props.removeModelSmallScreen && windowSize.width < landingVars.breakpoints.removeModule ? (
          <div />
        ) : (
          <div
            style={{
              transform: `scale(${transform})`,
              marginTop: transform < 1 ? (-(1 - transform) * props.moduleMaxHeight) / 2 : 0,
              marginBottom: transform < 1 ? (-(1 - transform) * props.moduleMaxHeight) / 2 : 0,
            }}
          >
            {moduleDiv}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="display-flex flex-direction-row align-items-center">
        <div>{props.type === 'right' ? moduleDiv : textDiv}</div>
        <div style={{ minWidth: props.gutterSize }} />
        <div>{props.type === 'left' ? moduleDiv : textDiv}</div>
      </div>
    );
  }
};

export default LandingPanel;
