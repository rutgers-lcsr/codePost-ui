// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Navigate } from 'react-router-dom';

/**********************************************************************************************************************/

interface IProps {
  handleLogout: () => void;
}

class Logout extends React.Component<IProps> {
  public render() {
    this.props.handleLogout();

    return <Navigate to="/" replace />;
  }
}

export default Logout;
