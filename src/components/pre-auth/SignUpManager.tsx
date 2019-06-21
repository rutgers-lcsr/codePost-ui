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
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

const buttonStyle = { border: 'solid 1px #062a22', fontSize: 18, color: '#062a22' };

const SignUpManager = () => {
  return (
    <PreAuthLayout isLoggedIn={false}>
      <div>
        <br />
        <br />
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 400, alignItems: 'center' }}>
            <Typography.Title level={1}>Create a Course</Typography.Title>
            <span style={{ fontSize: 14, textAlign: 'center' }}>
              For course leaders (e.g. TAs, teaching faculty) interested in setting up codePost for their course.
            </span>
            <Link to="/signup/create" style={{ marginTop: 25 }}>
              <Button icon="user-add" style={buttonStyle}>
                Sign Up
              </Button>
            </Link>
          </div>
          <Divider type="vertical" style={{ fontSize: 250, marginLeft: 15, marginRight: 15 }} />
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 400, alignItems: 'center' }}>
            <Typography.Title level={1}>Join a Course</Typography.Title>
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
    </PreAuthLayout>
  );
};

export { SignUpManager };
