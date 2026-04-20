// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

import { TeamOutlined, UserAddOutlined } from '@ant-design/icons';

/* ant imports */
import { Button, Divider, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PreAuthSignupLayout from './PreAuthSignupLayout';

import useWindowSize from '../core/useWindowSize';

/**********************************************************************************************************************/

const buttonStyle = { fontSize: 18 };

import studentImg from '../../img/landing/compressed/student_cartoon.jpg';
import teacherImg from '../../img/landing/compressed/teacher_cartoon.jpg';

const SignUpManager = () => {
  const windowSize = useWindowSize();
  const breakpoint = 750;
  const flexDirection = 'column';
  const flexDirectionButtons = windowSize.width < 950 ? 'column' : 'row';
  const dividerOrientation = 'horizontal';
  const titleFontLevel = windowSize.width < breakpoint ? 2 : 1;
  return (
    <PreAuthSignupLayout step={0}>
      <div>
        <br />
        <br />
        <div style={{ display: 'flex', flexDirection, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 400,
                alignItems: 'center',
                paddingBottom: 30,
              }}
            >
              <Typography.Title style={{ marginBottom: 0, textAlign: 'center' }} level={titleFontLevel}>
                Instructors and Staff
              </Typography.Title>
              <div style={{ display: 'flex', flexDirection: flexDirectionButtons, alignItems: 'center' }}>
                <Link to="/signup/create" style={{ marginTop: 25 }}>
                  <Button icon={<UserAddOutlined />} type="primary" style={buttonStyle}>
                    Create Course
                  </Button>
                </Link>
                <Link to="/signup/join" style={{ marginTop: 25, marginLeft: windowSize.width < 950 ? 0 : 20 }}>
                  <Button icon={<TeamOutlined />} style={buttonStyle}>
                    Join Existing Course
                  </Button>
                </Link>
              </div>
            </div>
            <div
              style={{
                minWidth: windowSize.width < breakpoint ? 0 : 500,
                minHeight: windowSize.width < breakpoint ? 0 : 260,
              }}
            >
              <img
                src={teacherImg}
                style={{ maxWidth: 500, paddingLeft: 70, display: windowSize.width < breakpoint ? 'none' : '' }}
                alt=""
              />
            </div>
          </div>
          <Divider orientation={dividerOrientation} style={{ fontSize: 250, marginTop: 35, marginBottom: 35 }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                minWidth: windowSize.width < breakpoint ? 0 : 500,
                minHeight: windowSize.width < breakpoint ? 0 : 260,
              }}
            >
              <img
                src={studentImg}
                style={{ maxWidth: 500, paddingRight: 70, display: windowSize.width < breakpoint ? 'none' : '' }}
                alt=""
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 400,
                alignItems: 'center',
                paddingBottom: 30,
              }}
            >
              <Typography.Title style={{ marginBottom: 0 }} level={titleFontLevel}>
                Students
              </Typography.Title>
              <Link to="/signup/join" style={{ marginTop: 25 }}>
                <Button icon={<TeamOutlined />} style={buttonStyle}>
                  Join Existing Course
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PreAuthSignupLayout>
  );
};

export { SignUpManager };
