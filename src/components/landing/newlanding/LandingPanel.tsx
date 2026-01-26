import useWindowSize from '../../core/useWindowSize';

import { ReactNode } from 'react';
import landingVars from '../../../styles/pages/_landingVars';
import { colors } from '../../../theme/colors';

type TextOrientation = 'right' | 'left';

interface IProps {
  text: ReactNode;
  title: string;
  subTitle: ReactNode;
  module: ReactNode;
  type: TextOrientation;
  moduleMaxWidth: number;
  moduleMaxHeight: number;
  removeModelSmallScreen: boolean;
  bevel?: boolean;
  gutterSize: number;
}

const LandingPanel = (props: IProps) => {
  // Modern color palette
  const brandColor = colors.green9; // Using consistent brand color
  const titleColor = '#1a1a1a';
  const bodyTextColor = '#606060';

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
        borderRadius: '12px', // added radius
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
        padding: windowSize.width < landingVars.breakpoints.verticalPanels ? '0 16px' : '0',
      }}
      className="display-flex flex-direction-column justify-content-center"
    >
      <div style={{ color: brandColor, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        {props.title}
      </div>
      <div style={{ color: titleColor, fontSize: 36, paddingBottom: 24, fontWeight: 800, lineHeight: 1.25 }}>
        {props.subTitle}
      </div>
      <div style={{ color: bodyTextColor, fontSize: 20, lineHeight: 1.6 }}>{props.text}</div>
    </div>
  );

  if (windowSize.width < landingVars.breakpoints.verticalPanels) {
    // We add an amount to the maxWidth for the scaling in order to make sure the animations have padding
    const transform = windowSize.width > props.moduleMaxWidth + 20 ? 1 : windowSize.width / (props.moduleMaxWidth + 20);
    return (
      <div className="display-flex flex-direction-column align-items-center" style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: 40 }}>{textDiv}</div>
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
      <div className="display-flex flex-direction-row align-items-center justify-content-center" style={{ padding: '60px 0' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: props.type === 'right' ? 'flex-end' : 'flex-start' }}>
          {props.type === 'right' ? moduleDiv : <div style={{ maxWidth: 600 }}>{textDiv}</div>}
        </div>
        <div style={{ minWidth: props.gutterSize + 20 }} /> {/* Increased gutter */}
        <div style={{ flex: 1, display: 'flex', justifyContent: props.type === 'left' ? 'flex-end' : 'flex-start' }}>
          {props.type === 'left' ? moduleDiv : <div style={{ maxWidth: 600 }}>{textDiv}</div>}
        </div>
      </div>
    );
  }
};

export default LandingPanel;
