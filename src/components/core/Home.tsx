/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PreAuthLayout from '../pre-auth/PreAuthLayout';

import CPButton from '../core/CPButton';

/**********************************************************************************************************************/

interface IProps {
  isStudent: boolean;
  isGrader: boolean;
  isAdmin: boolean;
}

const buttonStyle = {
  margin: '10px 0',
  fontSize: '17px',
};

class Home extends React.Component<IProps, {}> {
  public render() {
    const studentBtn = this.props.isStudent ? (
      <Link to="/student">
        <CPButton icon="idcard" block cpType="secondary" style={buttonStyle}>
          Student Console
        </CPButton>
      </Link>
    ) : null;
    const graderBtn = this.props.isGrader ? (
      <Link to="/grader">
        <CPButton icon="audit" block cpType="secondary" style={buttonStyle}>
          Grader Console
        </CPButton>
      </Link>
    ) : null;
    const adminBtn = this.props.isAdmin ? (
      <Link to="/course-admin">
        <CPButton icon="sliders" block cpType="secondary" style={buttonStyle}>
          Admin Console
        </CPButton>
      </Link>
    ) : null;

    return (
      <PreAuthLayout isLoggedIn={true}>
        <div style={{ width: 600, margin: '0 auto' }}>
          <Typography.Title level={3}>Select your role:</Typography.Title>
          {studentBtn}
          {graderBtn}
          {adminBtn}
        </div>
      </PreAuthLayout>
    );
  }
}

export default Home;
