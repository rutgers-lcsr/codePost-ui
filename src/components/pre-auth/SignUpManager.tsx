/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Divider, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PreAuthSignupLayout from './PreAuthSignupLayout';

import useWindowSize from '../core/useWindowSize';

// import landingVars from '../landing/_landingVars';

/**********************************************************************************************************************/

const buttonStyle = { border: 'solid 1px #062a22', fontSize: 18, color: '#062a22' };

const SignUpManager = () => {
  const windowSize = useWindowSize();
  const breakpoint = 750;
  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';
  const dividerType = windowSize.width < breakpoint ? 'horizontal' : 'vertical';
  const titleFontLevel = windowSize.width < breakpoint ? 2 : 1;
  return (
    <PreAuthSignupLayout step={0}>
      <div>
        <br />
        <br />
        <div style={{ display: 'flex', flexDirection, justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 400,
              alignItems: 'center',
              paddingBottom: 30,
            }}
          >
            <Typography.Title level={titleFontLevel}>Create a Course</Typography.Title>
            <span style={{ fontSize: 14, textAlign: 'center' }}>
              For course leaders (e.g. TAs, teaching faculty) interested in setting up codePost for their course.
            </span>
            <Link to="/signup/create" style={{ marginTop: 25 }}>
              <Button icon="user-add" style={buttonStyle}>
                Sign Up
              </Button>
            </Link>
          </div>
          <Divider type={dividerType} style={{ fontSize: 250, marginLeft: 15, marginRight: 15 }} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 400,
              alignItems: 'center',
              paddingBottom: 30,
            }}
          >
            <Typography.Title level={titleFontLevel}>Join a Course</Typography.Title>
            <span style={{ fontSize: 14, textAlign: 'center' }}>
              For staff and students who have been added to a course on codePost.
            </span>
            <Link to="/signup/join" style={{ marginTop: 25 }}>
              <Button icon="team" style={buttonStyle}>
                Join
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PreAuthSignupLayout>
  );
};

export { SignUpManager };
