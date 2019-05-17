import * as React from 'react';

import * as colors from '../../styles/abstracts/_colors.scss';
import * as fonts from '../../styles/abstracts/_fonts.scss';
import * as typography from '../../styles/abstracts/_typography.scss';

const Fonts = () => {
  const captionStyle: React.CSSProperties = {
    color: 'rgba(0, 0, 0, .3)',
    fontSize: '12px',
    lineHeight: 1,
    marginBottom: '1em',
    textTransform: 'uppercase',
    fontFamily: fonts.fontMain,
  };

  return (
    <div>
      <div style={captionStyle}>
        {fonts.fontMain.replace(/^"(.*)"$/, '$1')} <span style={{ textTransform: 'none' }}>($fontMain)</span>
      </div>
      <div style={{ display: 'inline-block' }}>
        <div
          style={{
            fontFamily: fonts.fontMain,
            fontSize: `${typography.fontSizeSuper}px`,
            fontWeight: +typography.fontWeightLight,
            lineHeight: typography.lineHeightSuper,
            color: colors.neutralTitle,
          }}
        >
          Aa
        </div>
        <div style={captionStyle}>Light</div>
      </div>
      <div style={{ display: 'inline-block', marginLeft: '30px' }}>
        <div
          style={{
            fontFamily: fonts.fontMain,
            fontSize: `${typography.fontSizeSuper}px`,
            fontWeight: +typography.fontWeightRegular,
            lineHeight: typography.lineHeightSuper,
            color: colors.neutralTitle,
          }}
        >
          Aa
        </div>
        <div style={captionStyle}>Regular</div>
      </div>
      <div style={{ display: 'inline-block', marginLeft: '30px' }}>
        <div
          style={{
            fontFamily: fonts.fontMain,
            fontSize: `${typography.fontSizeSuper}px`,
            fontWeight: +typography.fontWeightMedium,
            lineHeight: typography.lineHeightSuper,
            color: colors.neutralTitle,
          }}
        >
          Aa
        </div>
        <div style={captionStyle}>Medium</div>
      </div>

      <br />
      <br />
      <div style={captionStyle}>
        {fonts.fontCode.replace(/^"(.*)"$/, '$1')} <span style={{ textTransform: 'none' }}>($fontCode)</span>
      </div>
      <div style={{ display: 'inline-block' }}>
        <div
          style={{
            fontFamily: fonts.fontCode,
            fontSize: `${typography.fontSizeSuper}px`,
            fontWeight: +typography.fontWeightLight,
            lineHeight: typography.lineHeightSuper,
            color: colors.neutralTitle,
          }}
        >
          Aa
        </div>
        <div style={captionStyle}>Light</div>
      </div>
      <div style={{ display: 'inline-block', marginLeft: '30px' }}>
        <div
          style={{
            fontFamily: fonts.fontCode,
            fontSize: `${typography.fontSizeSuper}px`,
            fontWeight: +typography.fontWeightRegular,
            lineHeight: typography.lineHeightSuper,
            color: colors.neutralTitle,
          }}
        >
          Aa
        </div>
        <div style={captionStyle}>Regular</div>
      </div>
      <div style={{ display: 'inline-block', marginLeft: '30px' }}>
        <div
          style={{
            fontFamily: fonts.fontCode,
            fontSize: `${typography.fontSizeSuper}px`,
            fontWeight: +typography.fontWeightMedium,
            lineHeight: typography.lineHeightSuper,
            color: colors.neutralTitle,
          }}
        >
          Aa
        </div>
        <div style={captionStyle}>Medium</div>
      </div>
      <br />
      <br />
    </div>
  );
};

export default Fonts;
