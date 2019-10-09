import * as React from 'react';
import { Link } from 'react-router-dom';

import { Popover } from 'antd';

import useWindowSize from '../core/useWindowSize';

const PreAuthFooter = () => {
  const breakpoint = 625; // The width in pixels of the screen until we switch to mobile view
  const windowSize = useWindowSize();

  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';
  const logoTextAlign = windowSize.width < breakpoint ? 'center' : 'left';
  const mobileFlexStyle = windowSize.width < breakpoint ? { display: 'flex', fontSize: 10 } : {};
  const horizontalPadding = windowSize.width < breakpoint ? 0 : 65; // For mobile view we want less horizontal padding

  // We need some horitzontal padding on mobile to make sure the intercom button doesn't block the terms
  const bottomPadding = windowSize.width < breakpoint ? 0 : 0;

  const linkStyle = { fontSize: 17, paddingLeft: 8, paddingRight: 8 };

  const content = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '4d4d4d', fontSize: '14px' }}>Share on Snapchat!</div>
      <img
        alt="snapcode"
        src="https://codepost-videos.s3.us-east-2.amazonaws.com/snapcode.png"
        height="144"
        width="144"
        style={{ cursor: 'pointer' }}
      />
    </div>
  );

  return (
    <div
      style={{
        fontSize: 17,
        background: 'rgb(234,234,234)',
        width: '100%',
        padding: '25px 0',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: 1100,
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          paddingBottom: bottomPadding,
        }}
        className={`footer display-flex \
          align-items-center justify-content-space-between flex-direction-${flexDirection}`}
      >
        <span style={{ fontSize: 24, fontWeight: 600, textAlign: logoTextAlign }}>
          <Popover content={content}>
            <img
              alt="snapcode"
              src="https://codepost-videos.s3.us-east-2.amazonaws.com/snapcode.png"
              height="24"
              width="24"
              style={{ marginRight: '20px', cursor: 'pointer' }}
            />
          </Popover>{' '}
          codePost
        </span>
        <span style={{ marginTop: 6, ...mobileFlexStyle }}>
          <a style={linkStyle} href="https://help.codepost.io">
            Docs
          </a>{' '}
          <a style={linkStyle} href="https://updates.codepost.io">
            Updates
          </a>{' '}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a style={linkStyle} id="calendly-button-footer">
            Demo
          </a>{' '}
          <Link style={linkStyle} to="/terms">
            Terms
          </Link>{' '}
          <Link style={linkStyle} to="/privacy">
            Privacy
          </Link>
        </span>
      </div>
    </div>
  );
};

export default PreAuthFooter;
