/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

const buttonStyle = { border: 'solid 1px #062a22', fontSize: 18, color: '#062a22' };

class SignUpManager extends React.Component<{}, {}> {
  public render() {
    return (
      <PreAuthLayout>
        <div>
          <br />
          <br />
          <Typography.Title level={1}>Join codePost</Typography.Title>
          <br />
          <Link to="/signup/staff/join">
            <Button icon="team" style={buttonStyle}>
              Join an existing course
            </Button>
          </Link>
          &nbsp; &nbsp;
          <Link to="/signup/staff/create">
            <Button icon="usergroup-add" style={buttonStyle}>
              Create a new course
            </Button>
          </Link>
        </div>
      </PreAuthLayout>
    );
  }
}

export default SignUpManager;
